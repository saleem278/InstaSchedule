import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  // Must be a concrete origin — it's the sole allowed CORS origin with
  // credentials:true, so a wildcard or malformed value would either break
  // credentialed requests or (if reflected) allow cross-origin credentialed
  // reads. Reject '*' explicitly.
  CLIENT_URL: z
    .string()
    .url('CLIENT_URL must be a valid URL')
    .refine((v) => v !== '*', 'CLIENT_URL cannot be "*" when credentials are enabled')
    .default('http://localhost:5173'),
  SERVER_URL: z.string().url().optional(),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),

  // Optional: encrypts secrets at rest (per-brand Instagram access tokens).
  // If unset, tokens are stored as plaintext (a warning is logged) so local/
  // demo setups keep working. Set a long random string in production.
  TOKEN_ENCRYPTION_KEY: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  REDIS_URL: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  TEXT_PROVIDER: z.string().default('groq'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  OPENAI_TEXT_MODEL: z.string().default('gpt-4o-mini'),

  // Groq is the prioritized text provider in this app.
  GROQ_API_KEY: z.string().optional(),
  GROQ_TEXT_MODEL: z.string().default('openai/gpt-oss-20b'),

  // Gemini has a genuinely free tier, unlike OpenAI — set TEXT_PROVIDER=gemini to use it.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_TEXT_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_IMAGE_MODEL: z.string().optional(),

  IMAGE_PROVIDER: z.string().default('pollinations'),
  POLLINATIONS_BASE_URL: z.string().default('https://gen.pollinations.ai/image'),
  POLLINATIONS_FALLBACK_URL: z.string().optional(),
  POLLINATIONS_API_KEY: z.string().optional(),

  CLOUDFLARE_WORKERS_AI_BASE_URL: z.string().url().optional(),
  CLOUDFLARE_WORKERS_AI_API_KEY: z.string().optional(),

  HF_API_KEY: z.string().optional(),
  HF_IMAGE_MODEL: z.string().default('black-forest-labs/FLUX.1-schnell'),

  // --- Instagram publishing (Meta Graph API) ---
  // Publisher selection: 'graph' calls the real Meta Graph API; 'mock'
  // simulates a successful publish without any external call (useful for
  // local/demo when Meta credentials aren't set up). Per-brand access token
  // + IG user id are stored on the Brand, not here.
  INSTAGRAM_PUBLISHER: z.enum(['graph', 'mock']).default('graph'),
  META_GRAPH_API_VERSION: z.string().default('v21.0'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  ...env,
  isProduction: env.NODE_ENV === 'production',
  features: {
    googleAuthEnabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    redisEnabled: Boolean(env.REDIS_URL),
    cloudinaryEnabled: Boolean(
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    ),
    openaiEnabled: Boolean(env.OPENAI_API_KEY),
    geminiEnabled: Boolean(env.GEMINI_API_KEY),
    cloudflareWorkersEnabled: Boolean(env.CLOUDFLARE_WORKERS_AI_BASE_URL && env.CLOUDFLARE_WORKERS_AI_API_KEY),
    huggingFaceEnabled: Boolean(env.HF_API_KEY),
  },
};

export type Config = typeof config;
