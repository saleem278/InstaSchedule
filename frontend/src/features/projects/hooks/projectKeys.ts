/**
 * Centralized TanStack Query key factory for the projects feature.
 */
import type { ListProjectsQuery } from '../schemas/project.types';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (query: ListProjectsQuery) => [...projectKeys.lists(), query] as const,
  detail: (projectId: string) => [...projectKeys.all, 'detail', projectId] as const,
};
