import { useQuery } from '@tanstack/react-query';
import { getProject } from '../api/project.api';
import { projectKeys } from './projectKeys';

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => getProject(projectId as string),
    enabled: Boolean(projectId),
  });
}
