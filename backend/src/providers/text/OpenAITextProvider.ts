import OpenAI from 'openai';
import { config } from '../../config/env';
import { ExternalServiceError } from '../../core/errors/AppError';
import {
  CaptionGenerationInput,
  CaptionGenerationOutput,
  RegenerableField,
  TextProvider,
} from './TextProvider.interface';

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

function parseJsonContent(content: string | null | undefined, context: string): Record<string, unknown> {
  if (!content) {
    throw new ExternalServiceError(`${context}: received empty response from text provider`);
  }
  try {
    const parsed = JSON.parse(content);
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

export class OpenAITextProvider implements TextProvider {
  readonly name = 'openai';

  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY, baseURL: config.OPENAI_BASE_URL });
    }
    return this.client;
  }

  async generateFullContent(input: CaptionGenerationInput): Promise<CaptionGenerationOutput> {
    if (!config.OPENAI_API_KEY) {
      throw new ExternalServiceError('Text generation is not configured. Set OPENAI_API_KEY in your environment.');
    }

    try {
      const client = this.getClient();
      const completion = await client.chat.completions.create({
        model: config.OPENAI_TEXT_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(input) },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      const parsed = parseJsonContent(content, 'generateFullContent');
      return assertFullContentShape(parsed);
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError('Failed to generate content via OpenAI', { cause: error });
    }
  }

  async regenerateField(
    field: RegenerableField,
    input: CaptionGenerationInput & { previousOutput?: Partial<CaptionGenerationOutput> }
  ): Promise<Partial<CaptionGenerationOutput>> {
    if (!config.OPENAI_API_KEY) {
      throw new ExternalServiceError('Text generation is not configured. Set OPENAI_API_KEY in your environment.');
    }

    try {
      const client = this.getClient();
      const userMessageParts = [buildUserMessage(input)];
      if (input.previousOutput) {
        userMessageParts.push(`Previous content (for context, avoid repeating verbatim): ${JSON.stringify(input.previousOutput)}`);
      }

      const completion = await client.chat.completions.create({
        model: config.OPENAI_TEXT_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildRegenerateSystemPrompt(field) },
          { role: 'user', content: userMessageParts.join('\n\n') },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      const parsed = parseJsonContent(content, 'regenerateField');

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
      throw new ExternalServiceError('Failed to regenerate content via OpenAI', { cause: error });
    }
  }
}
