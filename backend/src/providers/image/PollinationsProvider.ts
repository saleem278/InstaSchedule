import { ExternalServiceError } from '../../core/errors/AppError';
import { GenerateImageOptions, GeneratedImage, ImageProvider } from './ImageProvider.interface';

const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1080;

export class PollinationsProvider implements ImageProvider {
  readonly name = 'pollinations';

  async generate(prompt: string, options?: GenerateImageOptions): Promise<GeneratedImage> {
    const width = options?.width ?? DEFAULT_WIDTH;
    const height = options?.height ?? DEFAULT_HEIGHT;
    const seed = options?.seed;

    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      nologo: 'true',
    });
    if (seed !== undefined) {
      params.set('seed', String(seed));
    }

    const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(prompt)}?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Pollinations responded with status ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return {
        url,
        buffer: Buffer.from(arrayBuffer),
        provider: this.name,
      };
    } catch (cause) {
      throw new ExternalServiceError('Failed to generate image via Pollinations', { cause });
    }
  }
}
