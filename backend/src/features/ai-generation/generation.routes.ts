import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { validate } from '../../core/middleware/validate';
import { regenerateFieldParamsSchema } from './generation.validation';
import {
  duplicateGeneration,
  generateFull,
  getJobStatus,
  listHistory,
  regenerateField,
  restoreGeneration,
} from './generation.controller';

export const generationRouter = Router();

generationRouter.use(authenticate);

generationRouter.post('/:projectId/generate', generateFull);
generationRouter.post('/:projectId/regenerate/:field', validate(regenerateFieldParamsSchema, 'params'), regenerateField);
generationRouter.get('/:projectId/jobs/:jobId', getJobStatus);
generationRouter.get('/history/:projectId', listHistory);
generationRouter.post('/history/:generationId/duplicate', duplicateGeneration);
generationRouter.post('/history/:generationId/restore', restoreGeneration);
