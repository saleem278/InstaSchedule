import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import * as schedulerService from './scheduler.service';
import { CalendarQueryInput, ScheduleUpdateInput } from './scheduler.validation';

export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = req.query as unknown as CalendarQueryInput;
  const projects = await schedulerService.getCalendar(userId, query);
  sendSuccess(res, projects);
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const { scheduledAt } = req.body as ScheduleUpdateInput;
  const project = await schedulerService.updateSchedule(projectId, userId, scheduledAt);
  sendSuccess(res, project);
});
