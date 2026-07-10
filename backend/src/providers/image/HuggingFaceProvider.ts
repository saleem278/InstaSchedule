import { ExternalServiceError } from '../../core/errors/AppError';
import { GenerateImageOptions, GeneratedImage, ImageProvider } from './ImageProvider.interface';
import { config } from '../../config/env';

export class HuggingFaceProvider implements ImageProvider {
  readonly name = 'huggingface';

  async generate(prompt: string, options?: GenerateImageOptions): Promise<GeneratedImage> {
    if (!config.HF_API_KEY) {
      throw new Error('Hugging Face API key is not configured. Set HF_API_KEY in your environment.');
    }

    const model = options?.model || config.HF_IMAGE_MODEL;
    const url = `https://api-inference.huggingface.co/models/${model}`;

    const executeRequest = async (): Promise<Response> => {
      return fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
        signal: AbortSignal.timeout(60000), // 60s timeout
      });
    };

    try {
      let response = await executeRequest();

      // If the model is currently loading, wait for the estimated time (or 10s default) and retry once
      if (response.status === 503) {
        try {
          const info = JSON.parse(await response.clone().text());
          const waitTime = Math.min((info.estimated_time || 10) * 1000, 20000);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          response = await executeRequest();
        } catch (_) {
          // Fall back to standard error handling if parsing/waiting fails
        }
      }

      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (_e) {}
        throw new Error(`Hugging Face API returned status ${response.status}: ${errorBody}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Hugging Face returned an empty image response');
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      return {
        url: `data:${contentType};base64,${base64}`,
        buffer: Buffer.from(arrayBuffer),
        provider: this.name,
      };
    } catch (error) {
      throw new ExternalServiceError('Failed to generate image via Hugging Face', { cause: error });
    }
  }
}
