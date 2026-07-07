import { NotFoundError } from '../../core/errors/AppError';
import { BrandModel } from '../brands/brand.model';
import * as projectRepository from './project.repository';
import { ListFilters, ListResult, ProjectWithImage } from './project.repository';
import { ProjectDocument, ProjectStatus } from './project.model';
import { CreateProjectInput, UpdateProjectInput, UpdateStatusInput, ListQueryInput } from './project.validation';

export async function list(userId: string, query: ListQueryInput): Promise<ListResult> {
  const filters: ListFilters = { brandId: query.brandId, status: query.status };
  return projectRepository.list(userId, filters, query.page, query.limit);
}

export async function getById(id: string, userId: string): Promise<ProjectWithImage> {
  const project = await projectRepository.findByIdForUser(id, userId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  return project;
}

export async function create(userId: string, data: CreateProjectInput): Promise<ProjectDocument> {
  const brand = await BrandModel.findOne({ _id: data.brandId, user: userId }).lean().exec();
  if (!brand) {
    throw new NotFoundError('Brand not found');
  }
  return projectRepository.create(userId, data.brandId, data.topic);
}

export async function update(id: string, userId: string, data: UpdateProjectInput): Promise<ProjectDocument> {
  await getById(id, userId);
  const updated = await projectRepository.update(id, userId, data);
  if (!updated) {
    throw new NotFoundError('Project not found');
  }
  return updated;
}

export async function updateStatus(
  id: string,
  userId: string,
  data: UpdateStatusInput
): Promise<ProjectDocument> {
  await getById(id, userId);
  const scheduledAt = data.scheduledAt !== undefined ? (data.scheduledAt === null ? null : new Date(data.scheduledAt)) : undefined;
  const updated = await projectRepository.updateStatus(id, userId, data.status as ProjectStatus, scheduledAt);
  if (!updated) {
    throw new NotFoundError('Project not found');
  }
  return updated;
}

export async function remove(id: string, userId: string): Promise<void> {
  await getById(id, userId);
  await projectRepository.remove(id, userId);
}

export async function duplicate(id: string, userId: string): Promise<ProjectDocument> {
  const original = await getById(id, userId);
  return projectRepository.createFromExisting(userId, original.brand.toString(), original.topic, original.content);
}
