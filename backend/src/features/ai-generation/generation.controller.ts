import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import * as generationService from './generation.service';
import { RegenerateFieldParams } from './generation.validation';

export const generateFull = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const { textProvider, imageProvider, textModel, imageModel } = req.body as {
    textProvider?: string;
    imageProvider?: string;
    textModel?: string;
    imageModel?: string;
  };
  const result = await generationService.generateFull(projectId, userId, {
    textProvider,
    imageProvider,
    textModel,
    imageModel,
  });
  sendSuccess(res, result, 201);
});

export const regenerateField = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const { field } = req.params as unknown as RegenerateFieldParams;
  const { textProvider, imageProvider, textModel, imageModel } = req.body as {
    textProvider?: string;
    imageProvider?: string;
    textModel?: string;
    imageModel?: string;
  };
  const result = await generationService.regenerateField(projectId, userId, field, {
    textProvider,
    imageProvider,
    textModel,
    imageModel,
  });
  sendSuccess(res, result);
});

export const getJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const jobId = req.params.jobId!;
  const generation = await generationService.getJobStatus(jobId, userId);
  sendSuccess(res, generation);
});

export const listHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.projectId!;
  const history = await generationService.listHistory(projectId, userId);
  sendSuccess(res, history);
});

export const duplicateGeneration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const generationId = req.params.generationId!;
  const result = await generationService.duplicateGeneration(generationId, userId);
  sendSuccess(res, result, 201);
});

export const restoreGeneration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const generationId = req.params.generationId!;
  const project = await generationService.restoreGeneration(generationId, userId);
  sendSuccess(res, project);
});
