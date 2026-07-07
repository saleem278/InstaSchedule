import { z } from 'zod';

export const updateAssetSchema = z.object({
  tags: z.array(z.string().trim().min(1)).optional(),
  isFavorite: z.boolean().optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const listQuerySchema = z.object({
  favorite: z.enum(['true', 'false']).optional(),
  collectionId: z.string().optional(),
  search: z.string().trim().optional(),
  brandId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
