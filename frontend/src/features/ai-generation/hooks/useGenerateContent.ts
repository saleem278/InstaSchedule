import { useMutation } from '@tanstack/react-query';
import { generateFull, type GenerationOptions } from '../api/generation.api';

/**
 * Fires POST /generation/:projectId/generate. Resolves with text content
 * (caption/cta/hashtags/altText/imagePrompt) already populated plus an
 * `imageJob` descriptor — the image itself is generated asynchronously and
 * must be tracked separately via useJobPolling(projectId, imageJob.jobId).
 */
export function useGenerateContent() {
  return useMutation({
    mutationFn: (payload: { projectId: string; options?: GenerationOptions }) =>
      generateFull(payload.projectId, payload.options),
  });
}
