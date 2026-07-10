import { GenerateImageOptions, GeneratedImage, ImageProvider } from './ImageProvider.interface';

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export class PlaceholderProvider implements ImageProvider {
  readonly name = 'placeholder';

  async generate(prompt: string, options?: GenerateImageOptions): Promise<GeneratedImage> {
    const width = options?.width ?? 1080;
    const height = options?.height ?? 1080;

    const text = escapeHtml(prompt.slice(0, 200));
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><g fill="#9CA3AF" font-family="Arial, Helvetica, sans-serif" font-size="28"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Placeholder image</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="18">${text}</text></g></svg>`;

    const buffer = Buffer.from(svg, 'utf8');
    const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    return {
      url,
      buffer,
      provider: this.name,
    };
  }
}
