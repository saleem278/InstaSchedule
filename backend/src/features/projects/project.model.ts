import { Schema, model, Document, Types } from 'mongoose';

export type ProjectStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

/** Statuses a user can set directly via the status endpoint (the others are managed by the publish pipeline). */
export const USER_SETTABLE_STATUSES = ['draft', 'scheduled', 'published'] as const;

export interface ProjectContent {
  caption: string;
  cta: string;
  hashtags: string[];
  altText: string;
  imagePrompt: string;
}

export interface ProjectSchedule {
  scheduledAt: Date | null;
  publishedAt: Date | null;
  /** Instagram media id returned on a successful publish. */
  instagramMediaId?: string | null;
  /** Public permalink to the published Instagram post. */
  instagramPermalink?: string | null;
  /** Message from the most recent failed publish attempt (cleared on success). */
  lastPublishError?: string | null;
}

export interface ProjectDocument extends Document {
  _id: Types.ObjectId;
  brand: Types.ObjectId;
  user: Types.ObjectId;
  topic: string;
  status: ProjectStatus;
  content: ProjectContent;
  imageAsset: Types.ObjectId | null;
  schedule: ProjectSchedule;
  activeGeneration: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectContentSchema = new Schema<ProjectContent>(
  {
    caption: { type: String, default: '' },
    cta: { type: String, default: '' },
    hashtags: { type: [String], default: [] },
    altText: { type: String, default: '' },
    imagePrompt: { type: String, default: '' },
  },
  { _id: false }
);

const projectScheduleSchema = new Schema<ProjectSchedule>(
  {
    scheduledAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    instagramMediaId: { type: String, default: null },
    instagramPermalink: { type: String, default: null },
    lastPublishError: { type: String, default: null },
  },
  { _id: false }
);

const projectSchema = new Schema<ProjectDocument>(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'publishing', 'published', 'failed'],
      default: 'draft',
      index: true,
    },
    content: { type: projectContentSchema, default: () => ({}) },
    imageAsset: { type: Schema.Types.ObjectId, ref: 'MediaAsset', default: null },
    schedule: { type: projectScheduleSchema, default: () => ({}) },
    activeGeneration: { type: Schema.Types.ObjectId, ref: 'Generation', default: null },
  },
  { timestamps: true }
);

projectSchema.index({ brand: 1, status: 1 });
projectSchema.index({ user: 1, 'schedule.scheduledAt': 1 });

export const ProjectModel = model<ProjectDocument>('Project', projectSchema);
