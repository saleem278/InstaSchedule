import type { PostType } from '../../projects/schemas/project.types';

export interface PromptTemplate {
  _id: string;
  user: string;
  name: string;
  promptText: string;
  postType: PostType;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptPayload {
  name: string;
  promptText: string;
  postType?: PostType;
}

export interface UpdatePromptPayload {
  name?: string;
  promptText?: string;
  postType?: PostType;
}
