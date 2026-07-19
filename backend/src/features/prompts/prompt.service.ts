import { NotFoundError } from '../../core/errors/AppError';
import * as promptRepository from './prompt.repository';
import { PromptTemplateDocument } from './prompt.model';
import { CreatePromptInput, UpdatePromptInput } from './prompt.validation';

export async function list(userId: string): Promise<PromptTemplateDocument[]> {
  return promptRepository.listForUser(userId);
}

export async function getById(id: string, userId: string): Promise<PromptTemplateDocument> {
  const prompt = await promptRepository.findByIdForUser(id, userId);
  if (!prompt) {
    throw new NotFoundError('Prompt template not found');
  }
  return prompt;
}

export async function create(userId: string, data: CreatePromptInput): Promise<PromptTemplateDocument> {
  return promptRepository.create(userId, data);
}

export async function update(
  id: string,
  userId: string,
  data: UpdatePromptInput
): Promise<PromptTemplateDocument> {
  const updated = await promptRepository.update(id, userId, data);
  if (!updated) {
    throw new NotFoundError('Prompt template not found');
  }
  return updated;
}

export async function remove(id: string, userId: string): Promise<void> {
  const success = await promptRepository.remove(id, userId);
  if (!success) {
    throw new NotFoundError('Prompt template not found');
  }
}
