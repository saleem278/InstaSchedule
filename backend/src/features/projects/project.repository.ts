import { ProjectModel, ProjectDocument, ProjectStatus } from './project.model';
import { UpdateProjectInput } from './project.validation';

export interface ListFilters {
  brandId?: string;
  status?: ProjectStatus;
}

// Read-path projection where `imageAsset` / `imageAssets` are populated with just their URL,
// used by list/detail reads so the frontend can render real thumbnails
// without a separate media lookup per project.
export type ProjectWithImage = Omit<ProjectDocument, 'imageAsset' | 'imageAssets'> & {
  imageAsset: { _id: any; url: string } | null;
  imageAssets: { _id: any; url: string }[];
};

export interface ListResult {
  items: ProjectWithImage[];
  total: number;
}

export async function list(userId: string, filters: ListFilters, page: number, limit: number): Promise<ListResult> {
  const query = {
    user: userId,
    ...(filters.brandId ? { brand: filters.brandId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [items, total] = await Promise.all([
    ProjectModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('imageAsset', 'url')
      .populate('imageAssets', 'url')
      .lean<ProjectWithImage[]>()
      .exec(),
    ProjectModel.countDocuments(query).exec(),
  ]);

  return { items, total };
}

export async function findByIdForUser(id: string, userId: string): Promise<ProjectWithImage | null> {
  return ProjectModel.findOne({ _id: id, user: userId })
    .populate('imageAsset', 'url')
    .populate('imageAssets', 'url')
    .lean<ProjectWithImage>()
    .exec();
}

export async function create(
  userId: string,
  brandId: string,
  topic: string,
  postType?: 'feed' | 'story' | 'carousel'
): Promise<ProjectDocument> {
  const project = await ProjectModel.create({ user: userId, brand: brandId, topic, postType });
  return project.toObject();
}

export async function createFromExisting(
  userId: string,
  brand: string,
  topic: string,
  content: ProjectDocument['content'],
  postType?: 'feed' | 'story' | 'carousel',
  imageAsset?: string | null,
  imageAssets?: string[]
): Promise<ProjectDocument> {
  const project = await ProjectModel.create({
    user: userId,
    brand,
    topic,
    content,
    postType,
    imageAsset,
    imageAssets,
    status: 'draft',
    schedule: { scheduledAt: null, publishedAt: null },
  });
  return project.toObject();
}

export async function update(id: string, userId: string, data: UpdateProjectInput & { imageAssetIds?: string[] }): Promise<ProjectWithImage | null> {
  const update: Record<string, unknown> = {};
  if (data.topic !== undefined) {
    update.topic = data.topic;
  }
  if (data.content !== undefined) {
    for (const [key, value] of Object.entries(data.content)) {
      if (value !== undefined) {
        update[`content.${key}`] = value;
      }
    }
  }
  if (data.postType !== undefined) {
    update.postType = data.postType;
  }
  // no per-project model overrides; ignore textModel/imageModel if present
  if (data.imageAssetId !== undefined) {
    update.imageAsset = data.imageAssetId;
  }
  if (data.imageAssetIds !== undefined) {
    update.imageAssets = data.imageAssetIds;
  }

  return ProjectModel.findOneAndUpdate({ _id: id, user: userId }, { $set: update }, { new: true })
    .populate('imageAsset', 'url')
    .populate('imageAssets', 'url')
    .lean<ProjectWithImage>()
    .exec();
}

export async function updateStatus(
  id: string,
  userId: string,
  status: ProjectStatus,
  scheduledAt?: Date | null
): Promise<ProjectWithImage | null> {
  const update: Record<string, unknown> = { status };
  if (scheduledAt !== undefined) {
    update['schedule.scheduledAt'] = scheduledAt;
  }
  if (status === 'published') {
    update['schedule.publishedAt'] = new Date();
  }

  return ProjectModel.findOneAndUpdate({ _id: id, user: userId }, { $set: update }, { new: true })
    .populate('imageAsset', 'url')
    .populate('imageAssets', 'url')
    .lean<ProjectWithImage>()
    .exec();
}

export async function markPublished(
  id: string,
  userId: string,
  result: { instagramMediaId: string; instagramPermalink: string | null }
): Promise<ProjectWithImage | null> {
  return ProjectModel.findOneAndUpdate(
    { _id: id, user: userId },
    {
      $set: {
        status: 'published',
        'schedule.publishedAt': new Date(),
        'schedule.instagramMediaId': result.instagramMediaId,
        'schedule.instagramPermalink': result.instagramPermalink,
        'schedule.lastPublishError': null,
      },
    },
    { new: true }
  )
    .populate('imageAsset', 'url')
    .populate('imageAssets', 'url')
    .lean<ProjectWithImage>()
    .exec();
}

/**
 * Records a failed publish. `terminal` controls the resulting status:
 *  - true  -> 'failed' (scheduler path): removes it from the due-query so it is
 *             NOT retried forever every tick; the user can reschedule/retry.
 *  - false -> status left unchanged (immediate "Publish now" path): the user
 *             sees the error toast and can just click Publish again.
 */
export async function recordPublishError(
  id: string,
  userId: string,
  message: string,
  terminal = false
): Promise<ProjectWithImage | null> {
  const set: Record<string, unknown> = { 'schedule.lastPublishError': message };
  if (terminal) set.status = 'failed';
  return ProjectModel.findOneAndUpdate({ _id: id, user: userId }, { $set: set }, { new: true })
    .populate('imageAsset', 'url')
    .populate('imageAssets', 'url')
    .lean<ProjectWithImage>()
    .exec();
}

/**
 * Finds scheduled projects due to publish (scheduledAt at or before `now`).
 * The work-list for the scheduled-publish engine — NOT user-scoped. This is
 * only a CANDIDATE list; each candidate must still be atomically claimed via
 * claimForPublishing before publishing, so it need not be race-free itself.
 */
export async function findDueScheduled(now: Date, limit = 25): Promise<ProjectDocument[]> {
  return ProjectModel.find({
    status: 'scheduled',
    'schedule.scheduledAt': { $ne: null, $lte: now },
  })
    .sort({ 'schedule.scheduledAt': 1 })
    .limit(limit)
    .lean<ProjectDocument[]>()
    .exec();
}

/**
 * Atomically claims a due project for publishing by flipping 'scheduled' ->
 * 'publishing' in a single conditional update. Returns the claimed document, or
 * null if another worker/tick/process already claimed it (the status:'scheduled'
 * filter no longer matches). This is the real concurrency guard against
 * double-publishing: only ONE caller can win the flip for a given project,
 * regardless of overlapping ticks, multiple instances, or a manual publish
 * racing the scheduler.
 */
export async function claimForPublishing(id: string): Promise<ProjectDocument | null> {
  return ProjectModel.findOneAndUpdate(
    { _id: id, status: 'scheduled' },
    { $set: { status: 'publishing' } },
    { new: true }
  )
    .lean<ProjectDocument>()
    .exec();
}

export async function remove(id: string, userId: string): Promise<void> {
  await ProjectModel.deleteOne({ _id: id, user: userId }).exec();
}
