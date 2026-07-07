import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { regenerateField } from '../api/generation.api';
import { projectKeys } from '@/features/projects/hooks/projectKeys';
import type { RegenerableField } from '../schemas/generation.types';

interface RegenerateFieldVariables {
  projectId: string;
  field: RegenerableField | 'image';
}

/**
 * Regenerates a single field via POST /generation/:projectId/regenerate/:field.
 * Callers key their own per-card pending state off `variables.field` (via
 * `mutation.variables?.field === thisCardField && mutation.isPending`) so
 * only the card being regenerated shows a shimmer — every other card stays
 * fully interactive.
 */
export function useRegenerateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, field }: RegenerateFieldVariables) => regenerateField(projectId, field),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
    },
    onError: (_error, variables) => {
      toast.error(`Could not regenerate ${variables.field}. Please try again.`);
    },
  });
}
