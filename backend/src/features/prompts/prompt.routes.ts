import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../core/middleware/authenticate';
import { validate } from '../../core/middleware/validate';
import { createPromptSchema, updatePromptSchema } from './prompt.validation';
import {
  createPrompt,
  deletePrompt,
  getPrompt,
  listPrompts,
  updatePrompt,
  importExcelPrompts,
} from './prompt.controller';

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single('file');

export const promptRouter = Router();

promptRouter.use(authenticate);

promptRouter.get('/', listPrompts);
promptRouter.post('/', validate(createPromptSchema), createPrompt);
promptRouter.post('/import-excel', excelUpload, importExcelPrompts);
promptRouter.get('/:promptId', getPrompt);
promptRouter.patch('/:promptId', validate(updatePromptSchema), updatePrompt);
promptRouter.delete('/:promptId', deletePrompt);
