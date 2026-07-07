import { useMemo } from 'react';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveBrandStore } from '@/features/brands/store/activeBrandStore';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { usePromptHistory } from './usePromptHistory';
import { PromptHistoryList } from './PromptHistoryList';

/**
 * Global Prompt History page.
 *
 * ADAPTATION NOTE: the backend only exposes per-project history
 * (GET /generation/history/:projectId) — there is no global history
 * endpoint. This page adapts by first listing every project belonging to
 * the active brand (reusing the existing `useProjects` hook from the
 * projects feature, which was already built when this was authored), then
 * fetching + flattening each project's history client-side into one
 * reverse-chronological feed via `usePromptHistory`. See that hook's doc
 * comment for the full rationale and the suggested backend follow-up
 * (a proper `GET /generation/history?brandId=...` aggregate endpoint).
 */
export function PromptHistoryPage(): React.JSX.Element {
  const activeBrandId = useActiveBrandStore((state) => state.activeBrandId);

  const { data: projectsResult, isLoading: projectsLoading } = useProjects(
    activeBrandId ? { brandId: activeBrandId, limit: 100 } : {}
  );

  const projectIds = useMemo(() => (projectsResult?.items ?? []).map((p) => p._id), [projectsResult]);

  const { data: entries, isLoading: historyLoading } = usePromptHistory(projectIds);

  const isLoading = projectsLoading || (projectIds.length > 0 && historyLoading);

  if (!activeBrandId) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accentSubtle text-accent">
          <History className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-textPrimary">Select a brand to see its history</h1>
        <p className="max-w-md text-sm text-textSecondary">
          Prompt history is scoped to a brand&apos;s projects. Choose an active brand from the switcher to
          continue.
        </p>
      </div>
    );
  }

  if (!projectsLoading && projectIds.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
        <PageHeader />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accentSubtle text-accent">
            <History className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-textPrimary">No generation history yet</h3>
          <p className="mt-1 max-w-sm text-sm text-textSecondary">
            Create a project and generate content to start building history here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
      <PageHeader />
      {projectsLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <PromptHistoryList entries={entries} isLoading={isLoading} />
      )}
    </div>
  );
}

function PageHeader(): React.JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-textPrimary">Prompt History</h1>
        <p className="text-sm text-textSecondary">
          Every generation across this brand&apos;s projects, newest first.
        </p>
      </div>
    </div>
  );
}
