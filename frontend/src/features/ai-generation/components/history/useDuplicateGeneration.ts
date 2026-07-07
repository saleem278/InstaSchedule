import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateGeneration } from './history.api';
import { historyKeys } from './historyKeys';

/**
 * Duplicates a past generation. On success, invalidates all cached history
 * pages so the new duplicate entry appears next time a project's history is
 * refetched.
 */
export function useDuplicateGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generationId: string) => duplicateGeneration(generationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}
