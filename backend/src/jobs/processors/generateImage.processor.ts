import { logger } from '../../config/logger';
import { NotFoundError } from '../../core/errors/AppError';
import { getImageProvider, createImageProvider } from '../../providers/image/ImageProviderFactory';
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

    // Allow per-job override of the configured image provider via
    // `job.data.options.imageProvider` (set by callers that want to pick a
    // different provider for a specific generation). Fall back to configured.
    const overrideProviderName = (options as any)?.imageProvider as string | undefined;
    // Use the factory that supports creating by name if an override was provided.
    let providerInstance: any;
    if (overrideProviderName) {
      providerInstance = createImageProvider(overrideProviderName);
    } else {
      providerInstance = getImageProvider();
    }

    let generatedImage: any;
    let usedProviderName = providerInstance.name;
    try {
      generatedImage = await providerInstance.generate(prompt, options as any);
    } catch (error) {
      // Decide whether to attempt a fallback. Prefer fallback for external/billing/rate-limit or server errors.
      const details = (error as any)?.details ?? (error as any)?.details ?? undefined;
      const cause = details?.cause ?? undefined;
      const status = cause?.status ?? (error as any)?.status ?? undefined;

      const shouldFallback = typeof status === 'number' && (status >= 500 || status === 402 || status === 429);

      logger.warn({ err: error, generationId, provider: providerInstance.name, status }, 'Primary image provider failed');

      if (shouldFallback) {
        try {
          // First attempt fallback with a free public provider like Pollinations to try and render a real image
          const fallbackName = providerInstance.name === 'pollinations' ? 'huggingface' : 'pollinations';
          const fallbackOptions = options ? { ...options } : {};
          if ('model' in fallbackOptions) {
            delete fallbackOptions.model;
          }
          try {
            const fallbackReal = createImageProvider(fallbackName);
            usedProviderName = fallbackReal.name;
            generatedImage = await fallbackReal.generate(prompt, fallbackOptions as any);
            logger.info({ generationId, fallback: usedProviderName }, 'Used fallback real image provider');
          } catch (realFbErr) {
            logger.warn({ err: realFbErr, generationId, fallbackName }, 'Fallback real image provider failed, using placeholder');
            const fallback = createImageProvider('placeholder');
            usedProviderName = fallback.name;
            generatedImage = await fallback.generate(prompt, fallbackOptions as any);
            logger.info({ generationId, fallback: usedProviderName }, 'Used fallback placeholder image provider');
          }
        } catch (fbErr) {
          // fallback also failed — rethrow original to be handled below
          logger.error({ err: fbErr, generationId }, 'Fallback image provider failed');
          throw error;
        }
      } else {
        // Not a fallbackable error; rethrow
        throw error;
      }
    }

    if (!generatedImage.buffer || generatedImage.buffer.length === 0) {
      throw new Error('Image provider did not return image bytes to upload');
    }

    const storageProvider = getStorageProvider();
    const ext = usedProviderName === 'placeholder' ? '.svg' : '.jpg';
    const uploadResult = await storageProvider.upload(
      generatedImage.buffer,
      `generation-${generationId}${ext}`,
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
      imageProvider: usedProviderName,
    });
  } catch (error) {
      // Build an enriched error message including any structured 'details' the
      // provider threw (e.g. PollinationsProvider attaches { cause: { url, attempt } }).
      const baseMessage = error instanceof Error ? error.message : 'Unknown error during image generation';
      const details = (error as any)?.details ?? (error as any)?.details ?? undefined;
      const cause = details?.cause ?? (error as any)?.details?.cause ?? undefined;

      // Prefer any small textual snippet embedded on the cause (e.g. body
      // snippet captured by PollinationsProvider), otherwise include url/attempt
      // if present. Truncate to avoid storing enormous payloads in the DB.
      let extra = '';
      try {
        if (cause) {
          if (typeof cause === 'string') extra = cause;
          else if (cause?.body) extra = String(cause.body);
          else if (cause?.url || cause?.attempt) extra = JSON.stringify({ url: cause.url, attempt: cause.attempt });
          else extra = JSON.stringify(cause);
        }
      } catch {
        extra = '';
      }

      const combined = `${baseMessage}${extra ? ` — ${extra}` : ''}`.slice(0, 2000);

      logger.error({ err: error, generationId, providerCause: cause }, 'Image generation job failed');
      await generationRepository.updateStatus(generationId, { status: 'failed', errorMessage: combined }).catch((updateError) => {
        logger.error({ err: updateError, generationId }, 'Failed to persist failed status on Generation');
      });
      throw error;
  }
}
