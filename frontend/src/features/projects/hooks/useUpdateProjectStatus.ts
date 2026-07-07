import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProjectStatus } from '../api/project.api';
import { projectKeys } from './projectKeys';
import type { UpdateProjectStatusPayload } from '../schemas/project.types';

interface UpdateProjectStatusVariables {
  projectId: string;
  payload: UpdateProjectStatusPayload;
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }: UpdateProjectStatusVariables) => updateProjectStatus(projectId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      const label =
        variables.payload.status === 'scheduled'
          ? 'Project scheduled'
          : variables.payload.status === 'published'
            ? 'Project published'
            : 'Saved as draft';
      toast.success(label);
    },
    onError: () => {
      toast.error('Could not update project status. Please try again.');
    },
  });
}
