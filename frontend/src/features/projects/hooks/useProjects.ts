import { useQuery } from '@tanstack/react-query';
import { listProjects } from '../api/project.api';
import { projectKeys } from './projectKeys';
import type { ListProjectsQuery } from '../schemas/project.types';

export function useProjects(query: ListProjectsQuery = {}) {
  return useQuery({
    queryKey: projectKeys.list(query),
    queryFn: () => listProjects(query),
    // A scheduled project can transition to published/failed in the background
    // (60s publish engine). Refresh when the user returns to the tab and poll
    // periodically so the dashboard status badges don't go stale.
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}
