import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import * as projectService from './project.service';
import * as publishService from './publish.service';
import { CreateProjectInput, UpdateProjectInput, UpdateStatusInput, ListQueryInput } from './project.validation';

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = req.query as unknown as ListQueryInput;
  const { items, total } = await projectService.list(userId, query);
  sendSuccess(res, items, 200, { page: query.page, limit: query.limit, total });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const project = await projectService.getById(projectId, userId);
  sendSuccess(res, project);
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as CreateProjectInput;
  const project = await projectService.create(userId, data);
  sendSuccess(res, project, 201);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const data = req.body as UpdateProjectInput;
  const project = await projectService.update(projectId, userId, data);
  sendSuccess(res, project);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  await projectService.remove(projectId, userId);
  sendSuccess(res, null);
});

export const duplicateProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const project = await projectService.duplicate(projectId, userId);
  sendSuccess(res, project, 201);
});

export const updateProjectStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const data = req.body as UpdateStatusInput;
  const project = await projectService.updateStatus(projectId, userId, data);
  sendSuccess(res, project);
});

export const publishProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const outcome = await publishService.publishProject(projectId, userId);
  sendSuccess(res, {
    project: outcome.project,
    mediaId: outcome.mediaId,
    permalink: outcome.permalink,
    provider: outcome.provider,
  });
});
