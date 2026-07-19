import { PromptTemplateModel, PromptTemplateDocument } from './prompt.model';
import { CreatePromptInput, UpdatePromptInput } from './prompt.validation';

export async function listForUser(userId: string): Promise<PromptTemplateDocument[]> {
  return PromptTemplateModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean<PromptTemplateDocument[]>()
    .exec();
}

export async function findByIdForUser(id: string, userId: string): Promise<PromptTemplateDocument | null> {
  return PromptTemplateModel.findOne({ _id: id, user: userId })
    .lean<PromptTemplateDocument>()
    .exec();
}

export async function create(userId: string, data: CreatePromptInput): Promise<PromptTemplateDocument> {
  const prompt = await PromptTemplateModel.create({
    user: userId,
    name: data.name,
    promptText: data.promptText,
    postType: data.postType || 'feed',
  });
  return prompt.toObject();
}

export async function update(
  id: string,
  userId: string,
  data: UpdatePromptInput
): Promise<PromptTemplateDocument | null> {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) {
    update.name = data.name;
  }
  if (data.promptText !== undefined) {
    update.promptText = data.promptText;
  }
  if (data.postType !== undefined) {
    update.postType = data.postType;
  }

  return PromptTemplateModel.findOneAndUpdate({ _id: id, user: userId }, { $set: update }, { new: true })
    .lean<PromptTemplateDocument>()
    .exec();
}

export async function remove(id: string, userId: string): Promise<boolean> {
  const result = await PromptTemplateModel.deleteOne({ _id: id, user: userId }).exec();
  return result.deletedCount > 0;
}
