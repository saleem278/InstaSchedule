/**
 * Centralized TanStack Query key factory for the ai-generation feature.
 */
export const generationKeys = {
  all: ['generation'] as const,
  job: (projectId: string, jobId: string) => [...generationKeys.all, 'job', projectId, jobId] as const,
  history: (projectId: string) => [...generationKeys.all, 'history', projectId] as const,
};
