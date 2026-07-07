import { ProjectModel, ProjectDocument } from '../projects/project.model';

export async function findScheduledInRange(
  userId: string,
  from: Date,
  to: Date,
  brandId?: string
): Promise<ProjectDocument[]> {
  return ProjectModel.find({
    user: userId,
    'schedule.scheduledAt': { $gte: from, $lte: to },
    ...(brandId ? { brand: brandId } : {}),
  })
    .populate('imageAsset', 'url')
    .sort({ 'schedule.scheduledAt': 1 })
    .lean<ProjectDocument[]>()
    .exec();
}

export async function findByIdForUser(id: string, userId: string): Promise<ProjectDocument | null> {
  return ProjectModel.findOne({ _id: id, user: userId }).exec() as Promise<ProjectDocument | null>;
}

export async function setSchedule(id: string, userId: string, scheduledAt: Date): Promise<ProjectDocument | null> {
  return ProjectModel.findOneAndUpdate(
    { _id: id, user: userId },
    {
      $set: {
        status: 'scheduled',
        'schedule.scheduledAt': scheduledAt,
      },
    },
    { new: true }
  )
    .populate('imageAsset', 'url')
    .lean<ProjectDocument>()
    .exec();
}

export async function clearSchedule(id: string, userId: string): Promise<ProjectDocument | null> {
  return ProjectModel.findOneAndUpdate(
    { _id: id, user: userId },
    {
      $set: {
        status: 'draft',
        'schedule.scheduledAt': null,
      },
    },
    { new: true }
  )
    .populate('imageAsset', 'url')
    .lean<ProjectDocument>()
    .exec();
}
