import { z } from 'zod';

export const createPromptSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  promptText: z.string().trim().min(3, 'Prompt must be at least 3 characters'),
  postType: z.enum(['feed', 'story', 'carousel']).optional(),
});

export const updatePromptSchema = createPromptSchema.partial();

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
