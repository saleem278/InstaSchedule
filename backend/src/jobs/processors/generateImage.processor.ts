import { logger } from '../../config/logger';
import { NotFoundError } from '../../core/errors/AppError';
import { getImageProvider } from '../../providers/image/ImageProviderFactory';
import { GenerateImageOptions } from '../../providers/image/ImageProvider.interface';
import { getStorageProvider } from '../../features/media/storage/StorageProviderFactory';
import * as mediaRepository from '../../features/media/media.repository';
import * as generationRepository from '../../features/ai-generation/generation.repository';
import { ProjectModel } from '../../features/projects/project.model';

export interface GenerateImageJobData {
  generationId: string;
  prompt: string;
  options?: GenerateImageOptions;
}

/**
 * Processes an image-generation job: generates the image via the configured ImageProvider,
 * uploads it via the configured StorageProvider, creates a MediaAsset, and updates the
 * corresponding Generation record.
 *
 * Contract: this function is invoked BOTH by the BullMQ Worker (see worker.ts) AND directly,
 * synchronously, as a fallback when Redis/BullMQ is not configured (see generation.service.ts).
 * It therefore only reads `job.data` and never calls any BullMQ-specific job methods (no
 * `job.updateProgress`, etc). On any failure it marks the Generation as 'failed' and RETHROWS —
 * callers running this via BullMQ rely on the rethrow to mark the job failed, and the
 * sync-fallback caller in generation.service.ts MUST catch this rethrow itself so a failed
 * image generation does not 500 the whole "generate full content" request (the text content
 * generated alongside it is still valid and already persisted).
 */
export async function processImageGenerationJob(job: { data: GenerateImageJobData }): Promise<void> {
  const { generationId, prompt, options } = job.data;

  try {
    await generationRepository.updateStatus(generationId, { status: 'processing' });

    const generation = await generationRepository.findByIdRaw(generationId);
    if (!generation) {
      throw new NotFoundError('Generation not found');
    }

    const imageProvider = getImageProvider();
    const generatedImage = await imageProvider.generate(prompt, options);

    if (!generatedImage.buffer) {
      throw new Error('Image provider did not return image bytes to upload');
    }

    const storageProvider = getStorageProvider();
    const uploadResult = await storageProvider.upload(
      generatedImage.buffer,
      `generation-${generationId}.jpg`,
      generation.user.toString()
    );

    const mediaAsset = await mediaRepository.create({
      user: generation.user.toString(),
      brand: generation.brand.toString(),
      source: 'ai-generated',
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      storageProvider: storageProvider.name as 'cloudinary' | 'local',
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      generation: generationId,
      tags: [],
    });

    await ProjectModel.findByIdAndUpdate(generation.project, { $set: { imageAsset: mediaAsset._id } }).exec();

    await generationRepository.updateStatus(generationId, {
      status: 'completed',
      output: { imageUrl: uploadResult.url },
      imageProvider: imageProvider.name,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during image generation';
    logger.error({ err: error, generationId }, 'Image generation job failed');
    await generationRepository.updateStatus(generationId, { status: 'failed', errorMessage }).catch((updateError) => {
      logger.error({ err: updateError, generationId }, 'Failed to persist failed status on Generation');
    });
    throw error;
  }
}
