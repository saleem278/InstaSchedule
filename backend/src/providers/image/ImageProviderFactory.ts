import { config } from '../../config/env';
import { ImageProvider } from './ImageProvider.interface';
import { PollinationsProvider } from './PollinationsProvider';
import { PlaceholderProvider } from './PlaceholderProvider';
import { CloudflareWorkersProvider } from './CloudflareWorkersProvider';
import { GeminiImageProvider } from './GeminiImageProvider';
import { HuggingFaceProvider } from './HuggingFaceProvider';

// Future providers to add here as they are implemented:
// OpenAI (DALL-E), Flux, Ideogram, Leonardo, Stability.
export function getImageProvider(): ImageProvider {
  switch (config.IMAGE_PROVIDER) {
    case 'pollinations':
      return new PollinationsProvider();
    case 'cloudflare-workers':
      return new CloudflareWorkersProvider();
    case 'gemini':
      return new GeminiImageProvider();
    case 'huggingface':
      return new HuggingFaceProvider();
    case 'placeholder':
      return new PlaceholderProvider();
    default:
      throw new Error(`Unsupported IMAGE_PROVIDER "${config.IMAGE_PROVIDER}"`);
  }
}

export function createImageProvider(name?: string): ImageProvider {
  const provider = name ?? config.IMAGE_PROVIDER;
  switch (provider) {
    case 'pollinations':
      return new PollinationsProvider();
    case 'cloudflare-workers':
      return new CloudflareWorkersProvider();
    case 'gemini':
      return new GeminiImageProvider();
    case 'huggingface':
      return new HuggingFaceProvider();
    case 'placeholder':
      return new PlaceholderProvider();
    default:
      throw new Error(`Unsupported IMAGE_PROVIDER "${provider}"`);
  }
}
