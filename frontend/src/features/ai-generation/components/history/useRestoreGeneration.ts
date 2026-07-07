import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreGeneration } from './history.api';
import { historyKeys } from './historyKeys';

/**
 * Restores a past generation's output back onto its parent project
 * (POST /generation/history/:generationId/restore). Not explicitly listed in
 * the task's "Create:" file list, but the backend route exists and the row
 * actions need a way to invoke it, so it's included alongside
 * useDuplicateGeneration for symmetry.
 */
export function useRestoreGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generationId: string) => restoreGeneration(generationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}
