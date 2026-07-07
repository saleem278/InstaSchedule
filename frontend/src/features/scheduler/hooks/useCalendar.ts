import { useQuery } from '@tanstack/react-query';
import { getCalendar } from '../api/scheduler.api';
import { schedulerKeys } from './schedulerKeys';
import type { CalendarQuery } from '../schemas/scheduler.types';

/**
 * Fetches all scheduled/published projects whose `schedule.scheduledAt` falls
 * within [from, to] (inclusive), optionally narrowed to a single brand.
 * Callers pass the currently visible month range (typically padded to full
 * calendar weeks so leading/trailing days from adjacent months populate too).
 */
export function useCalendar(query: CalendarQuery) {
  return useQuery({
    queryKey: schedulerKeys.calendar(query),
    queryFn: () => getCalendar(query),
    placeholderData: (previousData) => previousData,
  });
}
