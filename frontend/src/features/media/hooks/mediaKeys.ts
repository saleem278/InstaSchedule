import type { ListMediaParams } from '../schemas/media.types';

/**
 * Centralized TanStack Query key factory for the media feature.
 */
export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (params: ListMediaParams) => [...mediaKeys.lists(), params] as const,
  detail: (assetId: string) => [...mediaKeys.all, 'detail', assetId] as const,
  collections: () => [...mediaKeys.all, 'collections'] as const,
};
