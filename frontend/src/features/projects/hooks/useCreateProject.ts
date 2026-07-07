import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createProject } from '../api/project.api';
import { projectKeys } from './projectKeys';
import type { CreateProjectPayload } from '../schemas/project.types';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: () => {
      toast.error('Could not create project. Please try again.');
    },
  });
}
