/**
 * Scheduler feature types. The scheduler operates on `Project` documents
 * (see features/projects/schemas/project.types.ts) that carry a
 * `schedule.scheduledAt` field — there is no separate "scheduled post" model.
 */
import type { Project } from '@/features/projects/schemas/project.types';

export type ScheduledProject = Project;

export interface CalendarQuery {
  from: string;
  to: string;
  brandId?: string;
}

export interface UpdateScheduleVariables {
  projectId: string;
  scheduledAt: string | null;
}
