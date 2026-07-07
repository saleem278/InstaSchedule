import { Schema, model, Document, Types } from 'mongoose';

export type GenerationType = 'full' | 'caption' | 'cta' | 'hashtags' | 'altText' | 'imagePrompt' | 'image';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationOutput {
  caption: string;
  cta: string;
  hashtags: string[];
  altText: string;
  imagePrompt: string;
  imageUrl: string;
}

export interface GenerationDocument extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  user: Types.ObjectId;
  brand: Types.ObjectId;
  type: GenerationType;
  inputTopic: string;
  inputPromptOverride?: string | null;
  output: GenerationOutput;
  textProvider?: string | null;
  imageProvider?: string | null;
  status: GenerationStatus;
  jobId?: string | null;
  errorMessage?: string | null;
  isDuplicateOf?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const generationOutputSchema = new Schema<GenerationOutput>(
  {
    caption: { type: String, default: '' },
    cta: { type: String, default: '' },
    hashtags: { type: [String], default: [] },
    altText: { type: String, default: '' },
    imagePrompt: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { _id: false }
);

const generationSchema = new Schema<GenerationDocument>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    type: {
      type: String,
      enum: ['full', 'caption', 'cta', 'hashtags', 'altText', 'imagePrompt', 'image'],
      required: true,
    },
    inputTopic: { type: String, required: true },
    inputPromptOverride: { type: String, default: null },
    output: { type: generationOutputSchema, default: () => ({}) },
    textProvider: { type: String, default: null },
    imageProvider: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    jobId: { type: String, default: null },
    errorMessage: { type: String, default: null },
    isDuplicateOf: { type: Schema.Types.ObjectId, ref: 'Generation', default: null },
  },
  { timestamps: true }
);

generationSchema.index({ project: 1, createdAt: -1 });
generationSchema.index({ user: 1, status: 1 });

export const GenerationModel = model<GenerationDocument>('Generation', generationSchema);
