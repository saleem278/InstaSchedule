import { apiClient } from '@/core/api/apiClient';
import { GENERATION_ENDPOINTS } from '@/core/api/endpoints';
import type { Generation } from '../../schemas/generation.types';

/**
 * Prompt History API calls, scoped to this history/ subfolder so this
 * feature slice doesn't touch files owned by the parallel ai-generation
 * agent. `listHistory` here is the same GET /generation/history/:projectId
 * endpoint already wrapped as `listGenerationHistory` in
 * ../../api/generation.api.ts — re-declared locally (rather than imported)
 * only to keep this subfolder self-contained; behavior is identical.
 *
 * `apiClient`'s response interceptor already unwraps the `{ success, data }`
 * envelope, so every call below resolves directly to the typed payload.
 */

export interface DuplicateGenerationResult {
  generation: Generation;
  prefill: { topic: string; brandId: string };
}

export async function listHistory(projectId: string): Promise<Generation[]> {
  return apiClient.get<Generation[]>(GENERATION_ENDPOINTS.history(projectId)).then((res) => res.data);
}

export async function duplicateGeneration(generationId: string): Promise<DuplicateGenerationResult> {
  return apiClient
    .post<DuplicateGenerationResult>(GENERATION_ENDPOINTS.duplicate(generationId))
    .then((res) => res.data);
}

export async function restoreGeneration(generationId: string): Promise<unknown> {
  return apiClient.post(GENERATION_ENDPOINTS.restore(generationId)).then((res) => res.data);
}
