/**
 * TanStack Query key factory for the Prompt History feature. Kept local to
 * this history/ subfolder (rather than extending the shared generationKeys
 * factory in ../../hooks/generationKeys.ts) to avoid editing files owned by
 * the parallel ai-generation agent in this run.
 */
export const historyKeys = {
  all: ['generation-history'] as const,
  byProject: (projectId: string) => [...historyKeys.all, 'project', projectId] as const,
};
