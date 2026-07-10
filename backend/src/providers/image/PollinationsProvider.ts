import { ExternalServiceError } from '../../core/errors/AppError';
import { GenerateImageOptions, GeneratedImage, ImageProvider } from './ImageProvider.interface';
import { config } from '../../config/env';

const POLLINATIONS_BASE_URL = config.POLLINATIONS_BASE_URL;
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1080;
// Pollinations generates on demand and can hang for a long time or never
// respond. Bound it so a stalled request can't hang the worker — or, in the
// no-Redis sync-fallback path, the user's HTTP request — indefinitely.
const REQUEST_TIMEOUT_MS = 60_000;

// Retry config for transient failures (timeouts, 5xx)
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

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
    if (options?.model) {
      params.set('model', options.model);
    }

      const bases = [POLLINATIONS_BASE_URL];
      if (config.POLLINATIONS_FALLBACK_URL) bases.push(config.POLLINATIONS_FALLBACK_URL);

      let lastError: unknown = null;

      for (const base of bases) {
        // append API key when configured (required for gen.pollinations.ai)
        if (config.POLLINATIONS_API_KEY) params.set('key', config.POLLINATIONS_API_KEY);
        const url = `${base}/${encodeURIComponent(prompt)}?${params.toString()}`;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            const headers: Record<string, string> = {};
            if (config.POLLINATIONS_API_KEY) {
              headers.Authorization = `Bearer ${config.POLLINATIONS_API_KEY}`;
            }

            const response = await fetch(url, {
              signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
              headers,
            });

        if (!response.ok) {
          // try to read a small snippet of the body for debugging if possible
          let bodySnippet = '<unavailable>';
          let parsedBody: any = undefined;
          try {
            const text = await response.text();
            bodySnippet = text.slice(0, 1024);
            try {
              parsedBody = JSON.parse(text);
            } catch (_e) {
              /* not JSON */
            }
          } catch (_e) {
            /* ignore */
          }

          const status = response.status;
          const commonDetails = {
            status,
            body: bodySnippet.replace(/\s+/g, ' ').trim(),
            parsedBody,
            url,
            attempt,
          };

          // Auth error — API key missing/invalid
          if (status === 401) {
            throw new ExternalServiceError('Pollinations unauthorized: API key missing or invalid', { cause: commonDetails });
          }

          // Billing / payment required — insufficient credits or account issue
          if (status === 402) {
            throw new ExternalServiceError('Pollinations billing error: insufficient credits or account suspended', { cause: commonDetails });
          }

          // Rate limiting — respect Retry-After when present and retry when appropriate
          if (status === 429) {
            const retryAfter = response.headers.get('retry-after');
            if (attempt < MAX_ATTEMPTS) {
              const waitMs = retryAfter ? Number(retryAfter) * 1000 : BASE_BACKOFF_MS * 2 ** (attempt - 1);
              await sleep(waitMs);
              continue;
            }
            throw new ExternalServiceError('Pollinations rate-limited', { cause: { ...commonDetails, retryAfter } });
          }

          // Retry on server errors
          if (status >= 500 && attempt < MAX_ATTEMPTS) {
            lastError = new Error(`Pollinations responded with status ${status}: ${commonDetails.body}`);
            const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
            await sleep(backoff);
            continue;
          }

          throw new ExternalServiceError(`Pollinations responded with status ${status}`, { cause: commonDetails });
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.startsWith('image/')) {
          // read body to include useful error info when Pollinations returns JSON/HTML
          let body = '<unavailable>';
          try {
            body = (await response.text()).slice(0, 1024);
          } catch (_e) {
            /* ignore */
          }
          const err = new Error(
            `Pollinations returned a non-image response (content-type: ${contentType || 'unknown'}): ${body.replace(/\s+/g, ' ').trim()}`
          );
          throw err;
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          throw new ExternalServiceError('Pollinations returned an empty image body', {
            cause: { url, status: response.status },
          });
        }

        return {
          url: response.url,
          buffer: Buffer.from(arrayBuffer),
          provider: this.name,
        };
      } catch (cause) {
          lastError = cause;

          // AbortError / timeouts and network errors are transient; retry a few times
          const isAbort = (cause as any)?.name === 'AbortError' || /timeout/i.test(String((cause as any)?.message ?? ''));
          const isTransient = isAbort || (cause instanceof Error && /status\s5\d\d|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(cause.message));

          if (attempt < MAX_ATTEMPTS && isTransient) {
            const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
            await sleep(backoff);
            continue;
          }

          // If this base failed and there's another base to try, break to outer loop
          if (bases.indexOf(base) < bases.length - 1) {
            break;
          }

          // Serialize cause into a plain object so it survives logging/DB
          const serializedCause = typeof cause === 'object' ? { message: (cause as any)?.message ?? '<no message>', name: (cause as any)?.name, stack: (cause as any)?.stack } : { message: String(cause) };
          throw new ExternalServiceError('Failed to generate image via Pollinations', { cause: { error: serializedCause, url, attempt } });
        }
      }
    }

    // If we fall out of the loops, throw a generic error with the last cause
    const serializedLast = typeof lastError === 'object' ? { message: (lastError as any)?.message ?? '<no message>', name: (lastError as any)?.name, stack: (lastError as any)?.stack } : { message: String(lastError) };
    throw new ExternalServiceError('Failed to generate image via Pollinations', { cause: serializedLast });
  }
}
