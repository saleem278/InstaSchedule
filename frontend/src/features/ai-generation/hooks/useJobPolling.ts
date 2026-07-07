import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobStatus } from '../api/generation.api';
import { generationKeys } from './generationKeys';
import type { Generation, GenerationStatus } from '../schemas/generation.types';

const TERMINAL_STATUSES: GenerationStatus[] = ['completed', 'failed'];
const POLL_TIMEOUT_MS = 45_000;

/**
 * Polls GET /generation/:projectId/jobs/:jobId every 2s until the image job
 * reaches a terminal status ('completed' | 'failed'). Pass `jobId: undefined`
 * before a job exists yet to keep the query disabled.
 *
 * Gives up after POLL_TIMEOUT_MS with `timedOut: true` — without this, a job
 * that never reaches a terminal status (a hung request, a swallowed error in
 * the sync-fallback path) would poll forever with no way for the UI to show
 * an error or offer a retry.
 *
 * ASSUMPTION: the jobs/:jobId route is implemented by
 * generationService.getJobStatus, which looks up a Generation document BY
 * ITS OWN _id (not a separate BullMQ job id) — see generation.service.ts's
 * `runImageGeneration`, which returns `jobId: job.id ?? generationId` (async/
 * BullMQ mode) or `jobId: generationId` (sync/no-Redis mode). Either way the
 * value returned as `imageJob.jobId` from the generate call is the correct
 * id to pass here as `jobId`, so this hook treats it as an opaque id string.
 */
export function useJobPolling(projectId: string | undefined, jobId: string | undefined) {
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const query = useQuery<Generation>({
    queryKey: generationKeys.job(projectId ?? '', jobId ?? ''),
    queryFn: () => getJobStatus(projectId as string, jobId as string),
    enabled: Boolean(projectId && jobId) && !timedOut,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status && TERMINAL_STATUSES.includes(status)) {
        return false;
      }
      return 2000;
    },
  });

  useEffect(() => {
    setTimedOut(false);
    if (!projectId || !jobId) return undefined;

    timeoutRef.current = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [projectId, jobId]);

  return { ...query, timedOut };
}
