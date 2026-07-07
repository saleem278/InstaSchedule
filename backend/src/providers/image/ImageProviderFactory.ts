import { config } from '../../config/env';
import { ImageProvider } from './ImageProvider.interface';
import { PollinationsProvider } from './PollinationsProvider';

// Future providers to add here as they are implemented:
// OpenAI (DALL-E), Flux, Gemini, Ideogram, Leonardo, Stability.
export function getImageProvider(): ImageProvider {
  switch (config.IMAGE_PROVIDER) {
    case 'pollinations':
      return new PollinationsProvider();
    default:
      throw new Error(`Unsupported IMAGE_PROVIDER "${config.IMAGE_PROVIDER}"`);
  }
}
