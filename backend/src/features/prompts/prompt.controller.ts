import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import * as promptService from './prompt.service';
import { CreatePromptInput, UpdatePromptInput } from './prompt.validation';
import * as XLSX from 'xlsx';
import path from 'path';
import { ValidationError } from '../../core/errors/AppError';
import { PromptTemplateModel } from './prompt.model';

export const listPrompts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const prompts = await promptService.list(userId);
  sendSuccess(res, prompts);
});

export const getPrompt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const promptId = req.params.promptId!;
  const prompt = await promptService.getById(promptId, userId);
  sendSuccess(res, prompt);
});

export const createPrompt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as CreatePromptInput;
  const prompt = await promptService.create(userId, data);
  sendSuccess(res, prompt, 201);
});

export const updatePrompt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const promptId = req.params.promptId!;
  const data = req.body as UpdatePromptInput;
  const prompt = await promptService.update(promptId, userId, data);
  sendSuccess(res, prompt);
});

export const deletePrompt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const promptId = req.params.promptId!;
  await promptService.remove(promptId, userId);
  sendSuccess(res, null);
});

export const importExcelPrompts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  if (!req.file) {
    throw new ValidationError('No Excel file uploaded');
  }
  
  let workbook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  } catch (err: any) {
    throw new ValidationError('Failed to parse uploaded Excel file: ' + err.message);
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new ValidationError('Excel workbook is empty.');
  }
  
  const worksheet = workbook.Sheets[firstSheetName]!;
  const rows = XLSX.utils.sheet_to_json<any>(worksheet);

  let importedCount = 0;
  for (const row of rows) {
    const topic = row.Topic;
    const detailedContentPrompt = row["Detailed Content Prompt"];
    const postType = (row["Post Type"] || 'feed').toLowerCase();

    if (!topic || !detailedContentPrompt) continue;

    // Check duplicate
    const existing = await PromptTemplateModel.findOne({ user: userId, name: topic });
    if (existing) {
      existing.promptText = detailedContentPrompt;
      existing.postType = postType as any;
      await existing.save();
    } else {
      await PromptTemplateModel.create({
        user: userId,
        name: topic,
        promptText: detailedContentPrompt,
        postType: postType as any,
      });
    }
    importedCount++;
  }

  sendSuccess(res, { importedCount });
});
