import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { validate } from '../../core/middleware/validate';
import { generationRateLimiter } from '../../core/middleware/rateLimit';
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

// Rate-limit the paid LLM/image-provider calls per user (denial-of-wallet guard).
generationRouter.post('/:projectId/generate', generationRateLimiter, generateFull);
generationRouter.post(
  '/:projectId/regenerate/:field',
  generationRateLimiter,
  validate(regenerateFieldParamsSchema, 'params'),
  regenerateField
);
generationRouter.get('/:projectId/jobs/:jobId', getJobStatus);
generationRouter.get('/history/:projectId', listHistory);
generationRouter.post('/history/:generationId/duplicate', duplicateGeneration);
generationRouter.post('/history/:generationId/restore', restoreGeneration);
