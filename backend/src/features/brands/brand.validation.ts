import { z } from 'zod';

const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const createBrandSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  logoUrl: z.string().url('logoUrl must be a valid URL').optional(),
  colors: z.array(z.string().regex(hexColorRegex, 'Each color must be a valid hex value')).optional(),
  fonts: z.array(z.string().trim().min(1)).optional(),
  tone: z.string().trim().optional(),
  audience: z.string().trim().optional(),
  website: z.string().url('website must be a valid URL').optional(),
  instagramUsername: z.string().trim().optional(),
  instagramUserId: z.string().trim().optional(),
  // Allow empty string so the settings form can explicitly clear a stored token.
  instagramAccessToken: z.string().optional(),
  defaultTextProvider: z.string().optional(),
  defaultImageProvider: z.string().optional(),
  defaultTextModel: z.string().optional(),
  defaultImageModel: z.string().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
