import { z } from 'zod';

// NOTE: this validates the FULL :params object for the regenerate route (which also carries
// :projectId), not just `field` in isolation — the validate() middleware replaces req.params
// wholesale with the parsed result, so omitting projectId here would silently drop it from the
// request (Zod strips unrecognized keys by default).
export const regenerateFieldParamsSchema = z.object({
  projectId: z.string().trim().min(1),
  field: z.enum(['caption', 'cta', 'hashtags', 'altText', 'imagePrompt', 'image']),
});

export type RegenerateFieldParams = z.infer<typeof regenerateFieldParamsSchema>;
