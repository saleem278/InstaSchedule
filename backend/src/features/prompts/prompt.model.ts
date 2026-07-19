import { Schema, model, Document, Types } from 'mongoose';

export interface PromptTemplateDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  promptText: string;
  postType?: 'feed' | 'story' | 'carousel';
  createdAt: Date;
  updatedAt: Date;
}

const promptTemplateSchema = new Schema<PromptTemplateDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    promptText: { type: String, required: true, trim: true },
    postType: {
      type: String,
      enum: ['feed', 'story', 'carousel'],
      default: 'feed',
    },
  },
  { timestamps: true }
);

promptTemplateSchema.index({ user: 1, name: 1 });

export const PromptTemplateModel = model<PromptTemplateDocument>('PromptTemplate', promptTemplateSchema);
