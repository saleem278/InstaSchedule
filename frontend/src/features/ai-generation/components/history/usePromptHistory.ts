import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listHistory } from './history.api';
import { historyKeys } from './historyKeys';
import type { Generation } from '../../schemas/generation.types';

/**
 * ARCHITECTURAL NOTE — global vs. per-project history adaptation:
 *
 * The backend only exposes GET /generation/history/:projectId (per-project).
 * There is no global "all history for this brand/user" endpoint. Since the
 * product spec calls for a single global "Prompt History" nav item, this
 * hook adapts by:
 *   1. Taking the list of the active brand's projects (fetched via the
 *      existing `useProjects` hook from the projects feature).
 *   2. Firing one GET /generation/history/:projectId request per project in
 *      parallel (via useQueries).
 *   3. Flattening + client-side sorting the combined results into a single
 *      reverse-chronological list.
 *
 * This is O(n) requests for n projects, which is fine for typical usage
 * (a brand with a handful to a few dozen projects) but does not scale
 * gracefully to hundreds of projects. A future backend enhancement should
 * add a proper `GET /generation/history?brandId=...` (or `?userId=...`)
 * endpoint that does this aggregation server-side with real pagination;
 * this client-side flatten is a stopgap until that exists.
 */
export interface PromptHistoryEntry extends Generation {
  projectId: string;
}

export function usePromptHistory(projectIds: string[]) {
  const results = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: historyKeys.byProject(projectId),
      queryFn: () => listHistory(projectId),
      enabled: projectIds.length > 0,
    })),
  });

  const isLoading = projectIds.length > 0 && results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  const data = useMemo<PromptHistoryEntry[]>(() => {
    const flattened = results.flatMap((r, idx) => {
      const projectId = projectIds[idx];
      if (!r.data || !projectId) return [];
      return r.data.map((generation) => ({ ...generation, projectId }));
    });
    return flattened.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [results, projectIds]);

  return { data, isLoading, isError };
}
