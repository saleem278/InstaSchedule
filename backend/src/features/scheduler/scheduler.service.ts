import { NotFoundError, ValidationError } from '../../core/errors/AppError';
import * as schedulerRepository from './scheduler.repository';
import { ProjectDocument } from '../projects/project.model';
import { CalendarQueryInput } from './scheduler.validation';

export async function getCalendar(userId: string, filters: CalendarQueryInput): Promise<ProjectDocument[]> {
  const fromDate = new Date(filters.from);
  const toDate = new Date(filters.to);

  if (fromDate.getTime() > toDate.getTime()) {
    throw new ValidationError('"from" must be before or equal to "to"');
  }

  return schedulerRepository.findScheduledInRange(userId, fromDate, toDate, filters.brandId);
}

export async function updateSchedule(
  projectId: string,
  userId: string,
  scheduledAt: string | null
): Promise<ProjectDocument> {
  const project = await schedulerRepository.findByIdForUser(projectId, userId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (scheduledAt === null) {
    const cleared = await schedulerRepository.clearSchedule(projectId, userId);
    if (!cleared) {
      throw new NotFoundError('Project not found');
    }
    return cleared;
  }

  const date = new Date(scheduledAt);
  const updated = await schedulerRepository.setSchedule(projectId, userId, date);
  if (!updated) {
    throw new NotFoundError('Project not found');
  }
  return updated;
}
