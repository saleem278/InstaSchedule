import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProject } from '../api/project.api';
import { projectKeys } from './projectKeys';
import type { UpdateProjectPayload } from '../schemas/project.types';

interface UpdateProjectVariables {
  projectId: string;
  payload: UpdateProjectPayload;
}

/**
 * Used by the Preview & Edit step to persist field edits (caption/cta/
 * hashtags/altText/imagePrompt) back onto the Project document, independent
 * of triggering a new AI generation.
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }: UpdateProjectVariables) => updateProject(projectId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: () => {
      toast.error('Could not save changes. Please try again.');
    },
  });
}
