import { z } from 'zod';

export const createProjectSchema = z.object({
  brandId: z.string().trim().min(1, 'brandId is required'),
  topic: z.string().trim().min(3, 'Topic must be at least 3 characters'),
  postType: z.enum(['feed', 'story', 'carousel']).optional(),
});

const contentSchema = z.object({
  caption: z.string().optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  altText: z.string().optional(),
  imagePrompt: z.string().optional(),
});

const musicSchema = z.object({
  audioAssetId: z.string().trim().min(1, 'audioAssetId is required'),
  title: z.string().trim().min(1, 'title is required'),
  artistName: z.string().trim().min(1, 'artistName is required'),
  previewUrl: z.string().trim().nullable().optional(),
});

export const updateProjectSchema = z.object({
  topic: z.string().trim().min(3, 'Topic must be at least 3 characters').optional(),
  content: contentSchema.optional(),
  postType: z.enum(['feed', 'story', 'carousel']).optional(),
  // Set when the user edits/replaces the post image (e.g. via the image editor);
  // points the project at a different MediaAsset the user owns.
  imageAssetId: z.string().trim().min(1).optional(),
  imageAssetIds: z.array(z.string().trim().min(1)).optional(),
  music: musicSchema.nullable().optional(),
});

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Must be a valid ISO date string' });

export const updateStatusSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'published']),
  scheduledAt: isoDateString.nullable().optional(),
});

export const listQuerySchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
