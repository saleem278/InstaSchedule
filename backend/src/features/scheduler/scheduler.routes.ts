import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { validate } from '../../core/middleware/validate';
import { calendarQuerySchema, scheduleUpdateSchema } from './scheduler.validation';
import { getCalendar, updateSchedule } from './scheduler.controller';

export const schedulerRouter = Router();

schedulerRouter.use(authenticate);

schedulerRouter.get('/calendar', validate(calendarQuerySchema, 'query'), getCalendar);
schedulerRouter.patch('/:projectId/schedule', validate(scheduleUpdateSchema), updateSchedule);
