import { NotFoundError } from '../../core/errors/AppError';
import { logger } from '../../config/logger';
import { BrandModel, BrandDocument } from '../brands/brand.model';
import { ProjectModel, ProjectDocument } from '../projects/project.model';
import { getTextProvider } from '../../providers/text/TextProviderFactory';
import { RegenerableField } from '../../providers/text/TextProvider.interface';
import { GenerateImageOptions } from '../../providers/image/ImageProvider.interface';
import { imageGenerationQueue } from '../../jobs/queue';
import { processImageGenerationJob } from '../../jobs/processors/generateImage.processor';
import * as generationRepository from './generation.repository';
import { GenerationDocument, GenerationStatus, GenerationType } from './generation.model';

export interface ImageJobResult {
  jobId: string;
  status: GenerationStatus;
  mode: 'async' | 'sync';
}

export interface GenerateFullResult {
  generation: GenerationDocument;
  imageJob: ImageJobResult;
}

async function getOwnedProjectWithBrand(
  projectId: string,
  userId: string
): Promise<{ project: ProjectDocument; brand: BrandDocument }> {
  const project = await ProjectModel.findOne({ _id: projectId, user: userId }).lean<ProjectDocument>().exec();
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  const brand = await BrandModel.findOne({ _id: project.brand, user: userId }).lean<BrandDocument>().exec();
  if (!brand) {
    throw new NotFoundError('Brand not found');
  }
  return { project, brand };
}

/**
 * Enqueues (or synchronously runs, if Redis/BullMQ is not configured) an image generation job
 * for the given generation record. When run synchronously, failures are caught here so that the
 * calling API request does not 500 — the accompanying text content is still valid and already
 * persisted, so we surface the failed image status instead of throwing.
 */
async function runImageGeneration(
  generationId: string,
  prompt: string,
  options?: GenerateImageOptions
): Promise<ImageJobResult> {
  if (imageGenerationQueue) {
    const job = await imageGenerationQueue.add('generate-image', { generationId, prompt, options });
    await generationRepository.updateStatus(generationId, { status: 'processing', jobId: job.id ?? null });
    return { jobId: job.id ?? generationId, status: 'processing', mode: 'async' };
  }

  try {
    await processImageGenerationJob({ data: { generationId, prompt, options } });
  } catch (error) {
    // processImageGenerationJob already persisted status:'failed' + errorMessage; swallow here.
    logger.warn({ err: error, generationId }, 'Synchronous image generation failed');
  }

  const fresh = await generationRepository.findByIdRaw(generationId);
  return { jobId: generationId, status: fresh?.status ?? 'failed', mode: 'sync' };
}

export async function generateFull(projectId: string, userId: string): Promise<GenerateFullResult> {
  const { project, brand } = await getOwnedProjectWithBrand(projectId, userId);

  const textProvider = getTextProvider();
  const output = await textProvider.generateFullContent({
    topic: project.topic,
    brand: { name: brand.name, tone: brand.tone, audience: brand.audience },
  });

  const generation = await generationRepository.create({
    project: projectId,
    user: userId,
    brand: brand._id.toString(),
    type: 'full',
    inputTopic: project.topic,
    output,
    textProvider: textProvider.name,
    status: 'completed',
  });

  await ProjectModel.findOneAndUpdate(
    { _id: projectId, user: userId },
    {
      $set: {
        'content.caption': output.caption,
        'content.cta': output.cta,
        'content.hashtags': output.hashtags,
        'content.altText': output.altText,
        'content.imagePrompt': output.imagePrompt,
        activeGeneration: generation._id,
      },
    }
  ).exec();

  const imageJob = await runImageGeneration(generation._id.toString(), output.imagePrompt);

  return { generation, imageJob };
}

export type RegenerateFieldResult =
  | { field: Exclude<RegenerableField, never>; value: string | string[] }
  | { field: 'image'; imageJob: ImageJobResult; generation: GenerationDocument };

export async function regenerateField(
  projectId: string,
  userId: string,
  field: RegenerableField | 'image'
): Promise<RegenerateFieldResult> {
  const { project, brand } = await getOwnedProjectWithBrand(projectId, userId);

  if (field === 'image') {
    // Simplification: reuse the already-stored imagePrompt rather than regenerating the prompt
    // text first via the text provider. This keeps the image regeneration fast/cheap and
    // predictable (the user can explicitly regenerate the "imagePrompt" field first if they
    // want a different prompt before regenerating the image itself).
    const prompt = project.content.imagePrompt;
    if (!prompt) {
      throw new NotFoundError('Project has no image prompt yet — generate full content first');
    }

    const generation = await generationRepository.create({
      project: projectId,
      user: userId,
      brand: brand._id.toString(),
      type: 'image',
      inputTopic: project.topic,
      inputPromptOverride: prompt,
      status: 'pending',
    });

    const imageJob = await runImageGeneration(generation._id.toString(), prompt);

    if (imageJob.status === 'completed') {
      const fresh = await generationRepository.findByIdRaw(generation._id.toString());
      if (fresh?.output.imageUrl) {
        await ProjectModel.findOneAndUpdate(
          { _id: projectId, user: userId },
          { $set: { 'content.imagePrompt': prompt } }
        ).exec();
      }
    }

    const finalGeneration = (await generationRepository.findByIdRaw(generation._id.toString())) ?? generation;
    return { field: 'image', imageJob, generation: finalGeneration };
  }

  const textProvider = getTextProvider();
  const result = await textProvider.regenerateField(field, {
    topic: project.topic,
    brand: { name: brand.name, tone: brand.tone, audience: brand.audience },
    previousOutput: project.content,
  });

  const generationType: GenerationType = field;
  await generationRepository.create({
    project: projectId,
    user: userId,
    brand: brand._id.toString(),
    type: generationType,
    inputTopic: project.topic,
    output: result,
    textProvider: textProvider.name,
    status: 'completed',
  });

  const value = result[field];
  if (value === undefined) {
    throw new NotFoundError(`Text provider did not return a value for field "${field}"`);
  }

  await ProjectModel.findOneAndUpdate(
    { _id: projectId, user: userId },
    { $set: { [`content.${field}`]: value } }
  ).exec();

  return { field, value };
}

export async function getJobStatus(generationId: string, userId: string): Promise<GenerationDocument> {
  const generation = await generationRepository.findByIdForUser(generationId, userId);
  if (!generation) {
    throw new NotFoundError('Generation not found');
  }
  return generation;
}

export async function listHistory(projectId: string, userId: string): Promise<GenerationDocument[]> {
  return generationRepository.listByProject(projectId, userId);
}

export interface DuplicateGenerationResult {
  generation: GenerationDocument;
  prefill: { topic: string; brandId: string };
}

/**
 * Simplification: rather than also creating (or requiring) a new Project here, this just
 * creates the duplicated Generation record (with isDuplicateOf set) and returns enough
 * information (topic + brandId) for the frontend to pre-fill a "new project" form. Wiring the
 * duplicated generation to a freshly created Project is left to the caller/frontend flow via the
 * existing POST /projects endpoint, keeping this service focused on the generation record itself.
 */
export async function duplicateGeneration(generationId: string, userId: string): Promise<DuplicateGenerationResult> {
  const original = await generationRepository.findByIdForUser(generationId, userId);
  if (!original) {
    throw new NotFoundError('Generation not found');
  }

  const duplicate = await generationRepository.create({
    project: original.project.toString(),
    user: userId,
    brand: original.brand.toString(),
    type: original.type,
    inputTopic: original.inputTopic,
    inputPromptOverride: original.inputPromptOverride,
    output: original.output,
    textProvider: original.textProvider,
    imageProvider: original.imageProvider,
    status: original.status,
    isDuplicateOf: original._id.toString(),
  });

  return { generation: duplicate, prefill: { topic: original.inputTopic, brandId: original.brand.toString() } };
}

export async function restoreGeneration(generationId: string, userId: string): Promise<ProjectDocument> {
  const generation = await generationRepository.findByIdForUser(generationId, userId);
  if (!generation) {
    throw new NotFoundError('Generation not found');
  }

  const project = await ProjectModel.findOneAndUpdate(
    { _id: generation.project, user: userId },
    {
      $set: {
        'content.caption': generation.output.caption,
        'content.cta': generation.output.cta,
        'content.hashtags': generation.output.hashtags,
        'content.altText': generation.output.altText,
        'content.imagePrompt': generation.output.imagePrompt,
        activeGeneration: generation._id,
      },
    },
    { new: true }
  )
    .lean<ProjectDocument>()
    .exec();

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  return project;
}
