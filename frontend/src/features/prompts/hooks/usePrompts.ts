import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  importExcelPrompts,
} from '../api/prompt.api';
import type { CreatePromptPayload, UpdatePromptPayload } from '../schemas/prompt.types';

export const promptKeys = {
  all: ['prompts'] as const,
  lists: () => [...promptKeys.all, 'list'] as const,
  details: () => [...promptKeys.all, 'detail'] as const,
  detail: (id: string) => [...promptKeys.details(), id] as const,
};

export function usePrompts() {
  return useQuery({
    queryKey: promptKeys.lists(),
    queryFn: listPrompts,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePromptPayload) => createPrompt(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      toast.success('Prompt template saved successfully.');
    },
    onError: () => {
      toast.error('Could not save prompt template. Please try again.');
    },
  });
}

interface UpdatePromptVariables {
  id: string;
  payload: UpdatePromptPayload;
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdatePromptVariables) => updatePrompt(id, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: promptKeys.detail(variables.id) });
      toast.success('Prompt template updated successfully.');
    },
    onError: () => {
      toast.error('Could not update prompt template. Please try again.');
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePrompt(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      toast.success('Prompt template deleted.');
    },
    onError: () => {
      toast.error('Could not delete prompt template. Please try again.');
    },
  });
}

export function useImportExcelPrompts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importExcelPrompts(file),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      toast.success(`Successfully imported ${data.importedCount} templates from Excel library.`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not import templates. Please try again.';
      toast.error(msg);
    },
  });
}
