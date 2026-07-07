/**
 * Centralized TanStack Query key factory for the scheduler feature.
 */
import type { CalendarQuery } from '../schemas/scheduler.types';

export const schedulerKeys = {
  all: ['scheduler'] as const,
  calendars: () => [...schedulerKeys.all, 'calendar'] as const,
  calendar: (query: CalendarQuery) => [...schedulerKeys.calendars(), query] as const,
};
