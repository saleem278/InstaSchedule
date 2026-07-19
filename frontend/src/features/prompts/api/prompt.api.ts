import { apiClient } from '@/core/api/apiClient';
import { PROMPT_ENDPOINTS } from '@/core/api/endpoints';
import type {
  CreatePromptPayload,
  PromptTemplate,
  UpdatePromptPayload,
} from '../schemas/prompt.types';

export async function listPrompts(): Promise<PromptTemplate[]> {
  return apiClient.get<PromptTemplate[]>(PROMPT_ENDPOINTS.list).then((res) => res.data);
}

export async function getPrompt(id: string): Promise<PromptTemplate> {
  return apiClient.get<PromptTemplate>(PROMPT_ENDPOINTS.detail(id)).then((res) => res.data);
}

export async function createPrompt(payload: CreatePromptPayload): Promise<PromptTemplate> {
  return apiClient.post<PromptTemplate>(PROMPT_ENDPOINTS.create, payload).then((res) => res.data);
}

export async function updatePrompt(id: string, payload: UpdatePromptPayload): Promise<PromptTemplate> {
  return apiClient.patch<PromptTemplate>(PROMPT_ENDPOINTS.update(id), payload).then((res) => res.data);
}

export async function deletePrompt(id: string): Promise<void> {
  await apiClient.delete(PROMPT_ENDPOINTS.delete(id));
}

export async function importExcelPrompts(file: File): Promise<{ importedCount: number }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient
    .post<{ importedCount: number }>('/prompts/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
}
