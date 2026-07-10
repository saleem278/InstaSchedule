import { Request, Response } from 'express';
import { sendSuccess } from '../../core/utils/apiResponse';
import { config } from '../../config/env';
import { BrandModel } from '../brands/brand.model';

export async function listProviders(_req: Request, res: Response) {
  const brandId = _req.query.brandId as string | undefined;
  let brandDefaultText: string | undefined = undefined;
  let brandDefaultImage: string | undefined = undefined;
  let brandDefaultTextModel: string | undefined = undefined;
  let brandDefaultImageModel: string | undefined = undefined;
  if (brandId) {
    try {
      // read brand-level defaults when brandId is supplied (no auth required
      // for listing providers; the frontend passes the project.brand)
      const b = await BrandModel.findById(brandId).lean().exec();
      if (b) {
        // @ts-ignore - model was extended with optional fields above
        brandDefaultText = b.defaultTextProvider;
        // @ts-ignore
        brandDefaultImage = b.defaultImageProvider;
        // @ts-ignore
        brandDefaultTextModel = b.defaultTextModel;
        // @ts-ignore
        brandDefaultImageModel = b.defaultImageModel;
      }
    } catch (_e) {
      // ignore DB errors and fall back to global defaults
    }
  }
  // Text providers implemented by the backend
  const textProviders = [
    { name: 'groq', displayName: 'Groq', available: Boolean(config.GROQ_API_KEY) || config.TEXT_PROVIDER === 'groq' },
    { name: 'openai', displayName: 'OpenAI', available: config.features.openaiEnabled },
    { name: 'gemini', displayName: 'Gemini', available: config.features.geminiEnabled },
  ];

  const imageProviders = [
    { name: 'pollinations', displayName: 'Pollinations', available: true },
    {
      name: 'cloudflare-workers',
      displayName: 'Cloudflare Workers AI',
      available: config.features.cloudflareWorkersEnabled,
    },
    { name: 'gemini', displayName: 'Gemini', available: config.features.geminiEnabled },
    { name: 'placeholder', displayName: 'Placeholder', available: true },
  ];

  sendSuccess(res, {
    defaultTextProvider: brandDefaultText ?? config.TEXT_PROVIDER,
    defaultImageProvider: brandDefaultImage ?? config.IMAGE_PROVIDER,
    defaultTextModel: brandDefaultTextModel ?? config.GEMINI_TEXT_MODEL ?? undefined,
    defaultImageModel: brandDefaultImageModel ?? config.GEMINI_IMAGE_MODEL ?? undefined,
    textProviders,
    imageProviders,
  });
}
