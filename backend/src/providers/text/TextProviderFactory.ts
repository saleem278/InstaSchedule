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
