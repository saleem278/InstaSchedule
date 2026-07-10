import { GoogleGenAI } from '@google/genai';
import { ExternalServiceError } from '../../core/errors/AppError';
import { GenerateImageOptions, GeneratedImage, ImageProvider } from './ImageProvider.interface';
import { config } from '../../config/env';

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1080;
const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_MODEL = 'imagen-4.0-generate-001';

const ASPECT_RATIO_MAP: Array<{ ratio: number; aspect: string }> = [
  { ratio: 1, aspect: '1:1' },
  { ratio: 0.75, aspect: '3:4' },
  { ratio: 1.33, aspect: '4:3' },
  { ratio: 0.67, aspect: '2:3' },
  { ratio: 1.5, aspect: '3:2' },
  { ratio: 0.56, aspect: '9:16' },
  { ratio: 1.78, aspect: '16:9' },
  { ratio: 2.33, aspect: '21:9' },
];

function getAspectRatio(width: number, height: number): string | undefined {
  const ratio = width / height;
  let closest = ASPECT_RATIO_MAP[0]!;
  for (const current of ASPECT_RATIO_MAP) {
    if (Math.abs(current.ratio - ratio) < Math.abs(closest.ratio - ratio)) {
      closest = current;
    }
  }
  return closest && Math.abs(closest.ratio - ratio) <= 0.05 ? closest.aspect : undefined;
}

function getImageSize(width: number, height: number): string {
  const maxDimension = Math.max(width, height);
  if (maxDimension <= 1024) return '1K';
  if (maxDimension <= 2048) return '2K';
  return '4K';
}

export class GeminiImageProvider implements ImageProvider {
  readonly name = 'gemini';

  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY as string });
    }
    return this.client;
  }

  async generate(prompt: string, options?: GenerateImageOptions): Promise<GeneratedImage> {
    if (!config.GEMINI_API_KEY) {
      throw new Error('Gemini image generation is not configured. Set GEMINI_API_KEY in your environment.');
    }

    const width = options?.width ?? DEFAULT_WIDTH;
    const height = options?.height ?? DEFAULT_HEIGHT;
    const model = options?.model ?? config.GEMINI_IMAGE_MODEL ?? DEFAULT_MODEL;
    const imageSize = getImageSize(width, height);
    const aspectRatio = getAspectRatio(width, height);

    try {
      const response = await this.getClient().models.generateImages({
        model,
        prompt,
        config: {
          outputMimeType: 'image/png',
          numberOfImages: 1,
          imageSize,
          aspectRatio,
          seed: options?.seed,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      });

      const generatedImage = response.generatedImages?.[0];
      const image = generatedImage?.image;
      const base64 = image?.imageBytes;
      const mimeType = image?.mimeType ?? 'image/png';

      if (!base64) {
        throw new ExternalServiceError('Gemini returned an empty image result', {
          cause: { model, prompt, response },
        });
      }

      return {
        url: `data:${mimeType};base64,${base64}`,
        buffer: Buffer.from(base64, 'base64'),
        provider: this.name,
      };
    } catch (error) {
      const status = (error as any)?.statusCode ?? (error as any)?.status ?? undefined;
      const details = {
        status,
        model,
        prompt,
        width,
        height,
        error: (error as any)?.message ?? String(error),
      };

      if (status === 401) {
        throw new ExternalServiceError('Gemini unauthorized: API key missing or invalid', { cause: details });
      }
      if (status === 402) {
        throw new ExternalServiceError('Gemini billing error: insufficient credits or account issue', { cause: details });
      }
      if (status === 429) {
        throw new ExternalServiceError('Gemini rate-limited', { cause: details });
      }
      if (typeof status === 'number' && status >= 500) {
        throw new ExternalServiceError('Gemini returned a server error', { cause: details });
      }

      throw new ExternalServiceError('Failed to generate image via Gemini', { cause: details });
    }
  }
}
