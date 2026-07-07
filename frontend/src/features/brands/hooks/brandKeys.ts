/**
 * Centralized TanStack Query key factory for the brands feature.
 */
export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  detail: (brandId: string) => [...brandKeys.all, 'detail', brandId] as const,
};
