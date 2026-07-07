import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SERVER_URL: z.string().optional(),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),

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

  IMAGE_PROVIDER: z.string().default('pollinations'),

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
  },
};

export type Config = typeof config;
