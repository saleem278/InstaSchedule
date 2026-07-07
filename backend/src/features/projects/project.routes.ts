import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { validate } from '../../core/middleware/validate';
import { createProjectSchema, updateProjectSchema, updateStatusSchema, listQuerySchema } from './project.validation';
import {
  createProject,
  deleteProject,
  duplicateProject,
  getProject,
  listProjects,
  publishProject,
  updateProject,
  updateProjectStatus,
} from './project.controller';

export const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.get('/', validate(listQuerySchema, 'query'), listProjects);
projectRouter.post('/', validate(createProjectSchema), createProject);
projectRouter.get('/:projectId', getProject);
projectRouter.patch('/:projectId', validate(updateProjectSchema), updateProject);
projectRouter.delete('/:projectId', deleteProject);
projectRouter.post('/:projectId/duplicate', duplicateProject);
projectRouter.patch('/:projectId/status', validate(updateStatusSchema), updateProjectStatus);
projectRouter.post('/:projectId/publish', publishProject);
