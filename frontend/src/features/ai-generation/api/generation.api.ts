import { apiClient } from '@/core/api/apiClient';
import { GENERATION_ENDPOINTS } from '@/core/api/endpoints';
import type {
  GenerateFullResult,
  Generation,
  RegenerableField,
  RegenerateFieldResult,
} from '../schemas/generation.types';

/**
 * Generation API calls. `apiClient`'s response interceptor already unwraps
 * the `{ success, data }` envelope, so every call below resolves directly to
 * the typed payload — never re-unwrap `.data.data` here.
 */

export interface GenerationOptions {
  textProvider?: string;
  imageProvider?: string;
  textModel?: string;
  imageModel?: string;
}

export async function generateFull(
  projectId: string,
  options?: GenerationOptions
): Promise<GenerateFullResult> {
  return apiClient
    .post<GenerateFullResult>(GENERATION_ENDPOINTS.generateFull(projectId), options ?? {})
    .then((res) => res.data);
}

export async function regenerateField(
  projectId: string,
  field: RegenerableField | 'image',
  options?: GenerationOptions
): Promise<RegenerateFieldResult> {
  return apiClient
    .post<RegenerateFieldResult>(GENERATION_ENDPOINTS.regenerateField(projectId, field), options ?? {})
    .then((res) => res.data);
}

export async function getJobStatus(projectId: string, jobId: string): Promise<Generation> {
  return apiClient
    .get<Generation>(GENERATION_ENDPOINTS.jobStatus(projectId, jobId))
    .then((res) => res.data);
}

export async function listGenerationHistory(projectId: string): Promise<Generation[]> {
  return apiClient.get<Generation[]>(GENERATION_ENDPOINTS.history(projectId)).then((res) => res.data);
}
