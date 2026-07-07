import { GenerationModel, GenerationDocument, GenerationType, GenerationStatus } from './generation.model';

export interface CreateGenerationInput {
  project: string;
  user: string;
  brand: string;
  type: GenerationType;
  inputTopic: string;
  inputPromptOverride?: string | null;
  output?: Partial<GenerationDocument['output']>;
  textProvider?: string | null;
  imageProvider?: string | null;
  status?: GenerationStatus;
  jobId?: string | null;
  isDuplicateOf?: string | null;
}

export interface UpdateGenerationInput {
  status?: GenerationStatus;
  output?: Partial<GenerationDocument['output']>;
  textProvider?: string | null;
  imageProvider?: string | null;
  jobId?: string | null;
  errorMessage?: string | null;
}

export async function create(data: CreateGenerationInput): Promise<GenerationDocument> {
  const generation = await GenerationModel.create(data);
  return generation.toObject();
}

export async function findByIdForUser(id: string, userId: string): Promise<GenerationDocument | null> {
  return GenerationModel.findOne({ _id: id, user: userId }).lean<GenerationDocument>().exec();
}

// Used internally by the job processor, which runs outside request context and has no userId to filter by.
export async function findByIdRaw(id: string): Promise<GenerationDocument | null> {
  return GenerationModel.findById(id).lean<GenerationDocument>().exec();
}

export async function updateStatus(id: string, updates: UpdateGenerationInput): Promise<GenerationDocument | null> {
  const set: Record<string, unknown> = {};
  if (updates.status !== undefined) set.status = updates.status;
  if (updates.textProvider !== undefined) set.textProvider = updates.textProvider;
  if (updates.imageProvider !== undefined) set.imageProvider = updates.imageProvider;
  if (updates.jobId !== undefined) set.jobId = updates.jobId;
  if (updates.errorMessage !== undefined) set.errorMessage = updates.errorMessage;
  if (updates.output !== undefined) {
    for (const [key, value] of Object.entries(updates.output)) {
      if (value !== undefined) {
        set[`output.${key}`] = value;
      }
    }
  }

  return GenerationModel.findByIdAndUpdate(id, { $set: set }, { new: true }).lean<GenerationDocument>().exec();
}

export async function listByProject(projectId: string, userId: string): Promise<GenerationDocument[]> {
  return GenerationModel.find({ project: projectId, user: userId })
    .sort({ createdAt: -1 })
    .lean<GenerationDocument[]>()
    .exec();
}
