/**
 * Project shape as returned by the API (Mongoose document serialized to JSON).
 * Mirrors backend/src/features/projects/project.model.ts.
 */
export type ProjectStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface ProjectContent {
  caption: string;
  cta: string;
  hashtags: string[];
  altText: string;
  imagePrompt: string;
}

export interface ProjectSchedule {
  scheduledAt: string | null;
  publishedAt: string | null;
  instagramMediaId?: string | null;
  instagramPermalink?: string | null;
  lastPublishError?: string | null;
}

export interface PublishProjectResult {
  project: Project;
  mediaId: string;
  permalink?: string;
  provider: string;
}

export interface PopulatedImageAsset {
  _id: string;
  url: string;
}

export type PostType = 'feed' | 'story' | 'carousel';

export interface Project {
  _id: string;
  brand: string;
  user: string;
  topic: string;
  status: ProjectStatus;
  postType: PostType;
  content: ProjectContent;
  /** Populated by the API (list/detail reads) with just its URL — never a raw id. */
  imageAsset: PopulatedImageAsset | null;
  imageAssets: PopulatedImageAsset[];
  schedule: ProjectSchedule;
  activeGeneration: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  brandId: string;
  topic: string;
  postType?: PostType;
}

export interface UpdateProjectPayload {
  topic?: string;
  content?: Partial<ProjectContent>;
  postType?: PostType;
  /** Point the project at a different MediaAsset (e.g. after editing the image). */
  imageAssetId?: string;
  imageAssetIds?: string[];
}

export interface UpdateProjectStatusPayload {
  status: ProjectStatus;
  scheduledAt?: string | null;
}

export interface ListProjectsQuery {
  brandId?: string;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
}

export interface ListProjectsResult {
  items: Project[];
  meta: { page: number; limit: number; total: number };
}
