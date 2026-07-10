import { config } from '../../config/env';
import { TextProvider } from './TextProvider.interface';
import { OpenAITextProvider } from './OpenAITextProvider';
import { GeminiTextProvider } from './GeminiTextProvider';
import { GroqTextProvider } from './GroqTextProvider';

export function getTextProvider(): TextProvider {
  switch (config.TEXT_PROVIDER) {
    case 'openai':
      return new OpenAITextProvider();
    case 'gemini':
      return new GeminiTextProvider();
    case 'groq':
      return new GroqTextProvider();
    default:
      throw new Error(`Unsupported TEXT_PROVIDER "${config.TEXT_PROVIDER}"`);
  }
}

// Create a provider by name (used when callers want to override the configured
// provider on a per-request basis). `name` may be undefined to fall back to the
// configured `config.TEXT_PROVIDER`.
export function createTextProvider(name?: string): TextProvider {
  const provider = name ?? config.TEXT_PROVIDER;
  switch (provider) {
    case 'openai':
      return new OpenAITextProvider();
    case 'gemini':
      return new GeminiTextProvider();
    case 'groq':
      return new GroqTextProvider();
    default:
      throw new Error(`Unsupported TEXT_PROVIDER "${provider}"`);
  }
}
