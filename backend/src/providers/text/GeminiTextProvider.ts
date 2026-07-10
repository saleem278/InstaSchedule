import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env';
import { ExternalServiceError } from '../../core/errors/AppError';
import {
  CaptionGenerationInput,
  CaptionGenerationOutput,
  RegenerableField,
  TextProvider,
} from './TextProvider.interface';
import { OpenAITextProvider } from './OpenAITextProvider';

const SYSTEM_PROMPT = `You are an expert Instagram content strategist. Given a topic and brand context, \
produce highly engaging, on-brand Instagram post content. Always respond with strict JSON only, no \
markdown fences, no commentary, matching exactly this shape:
{
  "caption": string,           // engaging Instagram caption, 1-3 short paragraphs
  "cta": string,                // a single short call-to-action line
  "hashtags": string[],         // 8 to 15 relevant hashtags, EACH including the leading # character
  "altText": string,            // accessible alt text describing the image for screen readers
  "imagePrompt": string         // a vivid, detailed text-to-image prompt describing the accompanying visual
}`;

function buildUserMessage(input: CaptionGenerationInput): string {
  const { topic, brand } = input;
  const lines = [
    `Topic: ${topic}`,
    `Brand name: ${brand.name}`,
    brand.tone ? `Brand tone: ${brand.tone}` : null,
    brand.audience ? `Target audience: ${brand.audience}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.join('\n');
}

function buildRegenerateSystemPrompt(field: RegenerableField): string {
  const fieldDescriptions: Record<RegenerableField, string> = {
    caption: 'an engaging Instagram caption, 1-3 short paragraphs',
    cta: 'a single short call-to-action line',
    hashtags: '8 to 15 relevant hashtags, EACH including the leading # character',
    altText: 'accessible alt text describing the image for screen readers',
    imagePrompt: 'a vivid, detailed text-to-image prompt describing the accompanying visual',
  };

  const jsonKey = field === 'hashtags' ? '"hashtags": string[]' : `"${field}": string`;

  return `You are an expert Instagram content strategist. Given a topic and brand context, regenerate ONLY \
the "${field}" field of an Instagram post: ${fieldDescriptions[field]}. Always respond with strict JSON only, \
no markdown fences, no commentary, matching exactly this shape:
{ ${jsonKey} }`;
}

function stripMarkdownFences(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const unfenced = fenced?.[1] ?? content;
  // Fallback for prose-wrapped JSON without a fence: slice from the first { to
  // the last } so JSON.parse sees just the object.
  const first = unfenced.indexOf('{');
  const last = unfenced.lastIndexOf('}');
  if (first !== -1 && last > first) {
    return unfenced.slice(first, last + 1);
  }
  return unfenced;
}

function parseJsonContent(content: string | null | undefined, context: string): Record<string, unknown> {
  if (!content) {
    throw new ExternalServiceError(`${context}: received empty response from text provider`);
  }
  try {
    // Gemini can wrap JSON in markdown fences even with responseMimeType set
    // to application/json — strip them defensively before parsing.
    const parsed = JSON.parse(stripMarkdownFences(content));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Parsed response is not a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch (cause) {
    throw new ExternalServiceError(`${context}: failed to parse JSON response`, { cause });
  }
}

function assertFullContentShape(data: Record<string, unknown>): CaptionGenerationOutput {
  const { caption, cta, hashtags, altText, imagePrompt } = data;
  if (
    typeof caption !== 'string' ||
    typeof cta !== 'string' ||
    !Array.isArray(hashtags) ||
    typeof altText !== 'string' ||
    typeof imagePrompt !== 'string'
  ) {
    throw new ExternalServiceError('Text provider returned an unexpected response shape');
  }
  return {
    caption,
    cta,
    hashtags: hashtags.map((tag) => String(tag)),
    altText,
    imagePrompt,
  };
}

const FULL_CONTENT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    caption: { type: 'STRING' },
    cta: { type: 'STRING' },
    hashtags: { type: 'ARRAY', items: { type: 'STRING' } },
    altText: { type: 'STRING' },
    imagePrompt: { type: 'STRING' },
  },
  required: ['caption', 'cta', 'hashtags', 'altText', 'imagePrompt'],
};

function regenerateFieldSchema(field: RegenerableField): Record<string, unknown> {
  const propertyType = field === 'hashtags' ? { type: 'ARRAY', items: { type: 'STRING' } } : { type: 'STRING' };
  return {
    type: 'OBJECT',
    properties: { [field]: propertyType },
    required: [field],
  };
}

/**
 * Uses Google's Gemini API (gemini-2.5-flash by default), which has a
 * genuinely free tier — unlike every OpenAI model. Matches the same
 * TextProvider contract/JSON shape as OpenAITextProvider so either can be
 * selected via TEXT_PROVIDER without touching calling code.
 */
export class GeminiTextProvider implements TextProvider {
  readonly name = 'gemini';

  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    }
    return this.client;
  }

  async generateFullContent(input: CaptionGenerationInput): Promise<CaptionGenerationOutput> {
    if (!config.GEMINI_API_KEY) {
      throw new ExternalServiceError('Text generation is not configured. Set GEMINI_API_KEY in your environment.');
    }

    try {
      const client = this.getClient();
      const model = input.model ?? config.GEMINI_TEXT_MODEL;
      const response = await client.models.generateContent({
        model,
        contents: `${SYSTEM_PROMPT}\n\n${buildUserMessage(input)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: FULL_CONTENT_SCHEMA,
        },
      });

      const parsed = parseJsonContent(response.text, 'generateFullContent');
      return assertFullContentShape(parsed);
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      if (config.OPENAI_API_KEY) {
        const fallback = new OpenAITextProvider();
        try {
          return await fallback.generateFullContent(input);
        } catch (openAiError) {
          throw new ExternalServiceError('Failed to generate content via Gemini and OpenAI fallback', {
            cause: openAiError,
          });
        }
      }

      throw new ExternalServiceError('Failed to generate content via Gemini', { cause: error });
    }
  }

  async regenerateField(
    field: RegenerableField,
    input: CaptionGenerationInput & { previousOutput?: Partial<CaptionGenerationOutput> }
  ): Promise<Partial<CaptionGenerationOutput>> {
    if (!config.GEMINI_API_KEY) {
      throw new ExternalServiceError('Text generation is not configured. Set GEMINI_API_KEY in your environment.');
    }

    try {
      const client = this.getClient();
      const userMessageParts = [buildUserMessage(input)];
      if (input.previousOutput) {
        userMessageParts.push(`Previous content (for context, avoid repeating verbatim): ${JSON.stringify(input.previousOutput)}`);
      }

      const model = input.model ?? config.GEMINI_TEXT_MODEL;
      const response = await client.models.generateContent({
        model,
        contents: `${buildRegenerateSystemPrompt(field)}\n\n${userMessageParts.join('\n\n')}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: regenerateFieldSchema(field),
        },
      });

      const parsed = parseJsonContent(response.text, 'regenerateField');

      if (field === 'hashtags') {
        if (!Array.isArray(parsed.hashtags)) {
          throw new ExternalServiceError('Text provider returned an unexpected response shape for hashtags');
        }
        return { hashtags: parsed.hashtags.map((tag) => String(tag)) };
      }

      const value = parsed[field];
      if (typeof value !== 'string') {
        throw new ExternalServiceError(`Text provider returned an unexpected response shape for ${field}`);
      }
      return { [field]: value } as Partial<CaptionGenerationOutput>;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      if (config.OPENAI_API_KEY) {
        const fallback = new OpenAITextProvider();
        try {
          return await fallback.regenerateField(field, input);
        } catch (openAiError) {
          throw new ExternalServiceError('Failed to regenerate content via Gemini and OpenAI fallback', {
            cause: openAiError,
          });
        }
      }

      throw new ExternalServiceError('Failed to regenerate content via Gemini', { cause: error });
    }
  }
}
