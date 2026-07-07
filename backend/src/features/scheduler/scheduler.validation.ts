import { z } from 'zod';

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Must be a valid ISO date string' });

export const calendarQuerySchema = z.object({
  from: isoDateString,
  to: isoDateString,
  brandId: z.string().trim().min(1).optional(),
});

export const scheduleUpdateSchema = z.object({
  scheduledAt: isoDateString.nullable(),
});

export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
export type ScheduleUpdateInput = z.infer<typeof scheduleUpdateSchema>;
