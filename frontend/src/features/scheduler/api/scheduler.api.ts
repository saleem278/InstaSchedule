import { apiClient } from '@/core/api/apiClient';
import { SCHEDULER_ENDPOINTS } from '@/core/api/endpoints';
import type { Project } from '@/features/projects/schemas/project.types';
import type { CalendarQuery } from '../schemas/scheduler.types';

/**
 * Scheduler API calls. `apiClient`'s response interceptor already unwraps the
 * `{ success, data }` envelope, so every call below resolves directly to the
 * typed payload — never re-unwrap `.data.data` here.
 */

export async function getCalendar(query: CalendarQuery): Promise<Project[]> {
  return apiClient
    .get<Project[]>(SCHEDULER_ENDPOINTS.calendar, { params: query })
    .then((res) => res.data);
}

export async function updateProjectSchedule(projectId: string, scheduledAt: string | null): Promise<Project> {
  return apiClient
    .patch<Project>(SCHEDULER_ENDPOINTS.updateSchedule(projectId), { scheduledAt })
    .then((res) => res.data);
}
