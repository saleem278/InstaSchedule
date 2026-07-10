import { ExternalServiceError } from '../../core/errors/AppError';
import { GenerateImageOptions, GeneratedImage, ImageProvider } from './ImageProvider.interface';
import { config } from '../../config/env';

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1080;
const REQUEST_TIMEOUT_MS = 60_000;

function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error('Invalid data URL returned by Cloudflare Workers AI');
  }

  const contentType = match[1];
  const base64 = match[2];
  return { buffer: Buffer.from(base64, 'base64'), contentType };
}

async function fetchImageUrl(url: string): Promise<{ buffer: Buffer; url: string }> {
  const response = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    let body = '<unavailable>';
    try {
      body = (await response.text()).slice(0, 1024);
    } catch {
      /* ignore */
    }
    throw new ExternalServiceError('Failed to download image from Cloudflare Workers AI result URL', {
      cause: { status: response.status, body, url },
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new ExternalServiceError('Cloudflare Workers AI returned an empty image body', {
      cause: { url, status: response.status },
    });
  }

  return { buffer: Buffer.from(arrayBuffer), url: response.url };
}

export class CloudflareWorkersProvider implements ImageProvider {
  readonly name = 'cloudflare-workers';

  async generate(prompt: string, options?: GenerateImageOptions): Promise<GeneratedImage> {
    if (!config.CLOUDFLARE_WORKERS_AI_BASE_URL) {
      throw new Error('CLOUDFLARE_WORKERS_AI_BASE_URL is not configured');
    }
    if (!config.CLOUDFLARE_WORKERS_AI_API_KEY) {
      throw new Error('CLOUDFLARE_WORKERS_AI_API_KEY is not configured');
    }

    const width = options?.width ?? DEFAULT_WIDTH;
    const height = options?.height ?? DEFAULT_HEIGHT;
    const requestUrl = config.CLOUDFLARE_WORKERS_AI_BASE_URL;

    const requestBody = JSON.stringify({
      prompt,
      width,
      height,
      seed: options?.seed,
    });

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.CLOUDFLARE_WORKERS_AI_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json,image/*',
      },
      body: requestBody,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      let bodySnippet = '<unavailable>';
      let parsedBody: any;
      try {
        const text = await response.text();
        bodySnippet = text.slice(0, 1024);
        parsedBody = JSON.parse(text);
      } catch {
        /* ignore */
      }

      const status = response.status;
      const details = { status, body: bodySnippet.replace(/\s+/g, ' ').trim(), parsedBody, url: requestUrl };

      if (status === 401) {
        throw new ExternalServiceError('Cloudflare Workers AI unauthorized: API key missing or invalid', { cause: details });
      }
      if (status === 402) {
        throw new ExternalServiceError('Cloudflare Workers AI billing error: insufficient credits or account issue', { cause: details });
      }
      if (status === 429) {
        throw new ExternalServiceError('Cloudflare Workers AI rate-limited', { cause: details });
      }
      if (status >= 500) {
        throw new ExternalServiceError('Cloudflare Workers AI returned a server error', { cause: details });
      }

      throw new ExternalServiceError('Cloudflare Workers AI returned an unexpected response', { cause: details });
    }

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

    if (contentType.startsWith('image/')) {
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new ExternalServiceError('Cloudflare Workers AI returned an empty image body', {
          cause: { url: requestUrl, status: response.status },
        });
      }

      return {
        url: response.url,
        buffer: Buffer.from(arrayBuffer),
        provider: this.name,
      };
    }

    const text = await response.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new ExternalServiceError('Cloudflare Workers AI returned an unsupported response format', {
        cause: { contentType, body: text.slice(0, 1024), url: requestUrl },
      });
    }

    if (typeof json.image === 'string' && json.image.startsWith('data:image/')) {
      const decoded = decodeDataUrl(json.image);
      return {
        url: json.imageUrl ?? response.url,
        buffer: decoded.buffer,
        provider: this.name,
      };
    }

    if (Array.isArray(json.images) && json.images.length > 0) {
      const first = json.images[0];
      if (typeof first === 'string') {
        if (first.startsWith('data:image/')) {
          const decoded = decodeDataUrl(first);
          return {
            url: json.imageUrl ?? response.url,
            buffer: decoded.buffer,
            provider: this.name,
          };
        }
        const fetched = await fetchImageUrl(first);
        return {
          url: fetched.url,
          buffer: fetched.buffer,
          provider: this.name,
        };
      }
    }

    if (typeof json.imageUrl === 'string' && json.imageUrl) {
      const fetched = await fetchImageUrl(json.imageUrl);
      return {
        url: fetched.url,
        buffer: fetched.buffer,
        provider: this.name,
      };
    }

    throw new ExternalServiceError('Cloudflare Workers AI returned an unsupported JSON payload', {
      cause: { contentType, body: JSON.stringify(json).slice(0, 1024), url: requestUrl },
    });
  }
}
