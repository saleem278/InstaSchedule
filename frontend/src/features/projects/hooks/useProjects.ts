import { useQuery } from '@tanstack/react-query';
import { listProjects } from '../api/project.api';
import { projectKeys } from './projectKeys';
import type { ListProjectsQuery } from '../schemas/project.types';

export function useProjects(query: ListProjectsQuery = {}) {
  return useQuery({
    queryKey: projectKeys.list(query),
    queryFn: () => listProjects(query),
  });
}
