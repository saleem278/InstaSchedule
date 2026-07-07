import { logger } from '../config/logger';
import * as projectRepository from '../features/projects/project.repository';
import { publishScheduledProject } from '../features/projects/publish.service';

const POLL_INTERVAL_MS = 60_000; // check for due scheduled posts every minute
const BATCH_LIMIT = 100; // max posts drained per tick (bounds catch-up after downtime)

let timer: ReturnType<typeof setInterval> | null = null;
// Holds the in-flight tick's promise so shutdown can await it; also serves as
// the overlap guard (a new tick is skipped while one is still running).
let inFlight: Promise<void> | null = null;

/**
 * Processes scheduled projects whose scheduledAt has passed by publishing them
 * to Instagram. Each project is atomically CLAIMED before publishing
 * (publishScheduledProject), so an overlapping tick or a second instance can't
 * double-publish. Each publish is isolated: one failure marks that project
 * 'failed' and does not block the others.
 */
export async function processDueScheduledPosts(now: Date): Promise<{ published: number; failed: number; skipped: number }> {
  const due = await projectRepository.findDueScheduled(now, BATCH_LIMIT);
  let published = 0;
  let failed = 0;
  let skipped = 0;

  for (const project of due) {
    try {
      const outcome = await publishScheduledProject(project._id.toString(), project.user.toString());
      if (outcome) published += 1;
      else skipped += 1; // claim lost to another tick/instance — expected, not an error
    } catch (error) {
      failed += 1;
      logger.warn(
        { err: error, projectId: project._id.toString() },
        'Scheduled publish failed; project marked failed'
      );
    }
  }

  if (due.length > 0) {
    logger.info({ due: due.length, published, failed, skipped }, 'Processed due scheduled posts');
  }
  return { published, failed, skipped };
}

function tick(): void {
  if (inFlight) return; // don't overlap a still-running tick
  inFlight = (async () => {
    try {
      await processDueScheduledPosts(new Date());
    } catch (error) {
      logger.error({ err: error }, 'Scheduled-publish tick failed');
    } finally {
      inFlight = null;
    }
  })();
}

/**
 * Starts the in-process scheduled-publish poller. Returns a stop function
 * (async) for graceful shutdown that also waits for any in-flight tick.
 *
 * Runs inside the API process (no Redis required). Because each project is
 * atomically claimed ('scheduled' -> 'publishing') before publishing, running
 * this in multiple instances is SAFE from double-publishing — at most one
 * instance wins each claim. (A BullMQ repeatable job would still be tidier at
 * scale to avoid every instance polling, but correctness no longer depends on
 * single-instance.)
 */
export function startScheduledPublishEngine(): () => Promise<void> {
  if (timer) return stopScheduledPublishEngine;
  logger.info({ intervalMs: POLL_INTERVAL_MS }, 'Starting scheduled-publish engine');
  timer = setInterval(() => {
    tick();
  }, POLL_INTERVAL_MS);
  // Don't keep the event loop alive solely for this timer.
  timer.unref?.();
  return stopScheduledPublishEngine;
}

/** Stops the poller and awaits any in-flight tick so shutdown doesn't sever a publish mid-flight. */
export async function stopScheduledPublishEngine(): Promise<void> {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (inFlight) {
    await inFlight;
  }
}
