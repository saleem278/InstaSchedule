import fs from 'fs/promises';
import path from 'path';
import { NotFoundError, ValidationError } from '../../core/errors/AppError';
import { logger } from '../../config/logger';
import { config } from '../../config/env';
import * as brandRepository from '../brands/brand.repository';
import { getInstagramPublisher } from '../../providers/instagram/InstagramPublisherFactory';
import { CloudinaryStorageProvider } from '../media/storage/CloudinaryStorageProvider';
import * as mediaRepository from '../media/media.repository';
import * as projectRepository from './project.repository';
import { ProjectDocument } from './project.model';

/**
 * Composes the final Instagram caption from a project's content: caption body,
 * then the CTA on its own line, then hashtags. Mirrors what the preview shows.
 */
export function composeCaption(content: ProjectDocument['content']): string {
  const parts: string[] = [];
  if (content.caption?.trim()) parts.push(content.caption.trim());
  if (content.cta?.trim()) parts.push(content.cta.trim());
  if (content.hashtags?.length) {
    parts.push(content.hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' '));
  }
  return parts.join('\n\n');
}

export interface PublishOutcome {
  project: ProjectDocument;
  mediaId: string;
  permalink?: string;
  provider: string;
}

/**
 * Publishes a single project to Instagram immediately and persists the result.
 *
 * Preconditions checked here (throws a descriptive error otherwise):
 *  - project exists and has a generated image (public URL)
 *  - the brand has an IG user id + access token configured
 *
 * On failure the caller decides how to surface it; we also record the error
 * message on the project's schedule so the scheduler path can show why a
 * scheduled publish didn't go through.
 */
/**
 * Core publish: validates preconditions, calls the Instagram publisher, and
 * marks the project published. Throws (without recording an error) on any
 * failure — the caller decides how to record it (immediate vs scheduled path).
 */
async function ensurePublicUrl(
  url: string,
  assetId: string,
  project: any
): Promise<string> {
  if (!url.startsWith('/uploads/')) {
    return url;
  }

  if (!config.features.cloudinaryEnabled) {
    if (!config.SERVER_URL) {
      throw new ValidationError(
        'Local image assets require SERVER_URL to publish. Set SERVER_URL in your environment.'
      );
    }
    return `${config.SERVER_URL.replace(/\/+$/, '')}${url}`;
  }

  const localPath = path.join(
    path.resolve(__dirname, '../../../../uploads'),
    url.replace(/^\/uploads\//, '')
  );
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(localPath);
  } catch (error) {
    logger.warn({ err: error, url, localPath }, 'Local uploaded image file not found for publish');
    throw new ValidationError('Local uploaded image file not found for publish.');
  }

  const cloudinaryProvider = new CloudinaryStorageProvider();
  const uploadResult = await cloudinaryProvider.upload(buffer, path.basename(localPath), project.user.toString());

  await mediaRepository.update(assetId, project.user.toString(), { url: uploadResult.url });
  return uploadResult.url;
}

/**
 * Core publish: validates preconditions, calls the Instagram publisher, and
 * marks the project published. Throws (without recording an error) on any
 * failure — the caller decides how to record it (immediate vs scheduled path).
 */
async function performPublish(projectId: string, userId: string): Promise<PublishOutcome> {
  const project = await projectRepository.findByIdForUser(projectId, userId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const brand = await brandRepository.findByIdWithToken(project.brand.toString(), userId);
  if (!brand) {
    throw new NotFoundError('Brand not found');
  }
  if (!brand.instagramUserId || !brand.instagramAccessToken) {
    throw new ValidationError(
      'This brand is not connected to Instagram. Add the Instagram account id and access token in Brand Settings before publishing.'
    );
  }

  const caption = composeCaption(project.content);
  const publisher = getInstagramPublisher();
  let result: any;

  if (project.postType === 'carousel') {
    const assets = project.imageAssets && project.imageAssets.length > 0
      ? project.imageAssets
      : project.imageAsset ? [project.imageAsset] : [];

    if (assets.length < 2) {
      throw new ValidationError('An Instagram carousel post requires at least 2 images.');
    }

    const imageUrls: string[] = [];
    for (const asset of assets) {
      const publicUrl = await ensurePublicUrl(asset.url, asset._id.toString(), project);
      imageUrls.push(publicUrl);
    }

    result = await publisher.publishCarouselPost({
      imageUrls,
      caption,
      instagramUserId: brand.instagramUserId,
      accessToken: brand.instagramAccessToken,
    });
  } else if (project.postType === 'story') {
    let imageUrl = project.imageAsset?.url;
    if (!imageUrl) {
      throw new ValidationError('This project has no generated image yet — generate one before publishing.');
    }

    imageUrl = await ensurePublicUrl(imageUrl, project.imageAsset!._id.toString(), project);

    result = await publisher.publishStoryPost({
      imageUrl,
      instagramUserId: brand.instagramUserId,
      accessToken: brand.instagramAccessToken,
    });
  } else {
    // Default/Feed post
    let imageUrl = project.imageAsset?.url;
    if (!imageUrl) {
      throw new ValidationError('This project has no generated image yet — generate one before publishing.');
    }

    imageUrl = await ensurePublicUrl(imageUrl, project.imageAsset!._id.toString(), project);

    result = await publisher.publishImagePost({
      imageUrl,
      caption,
      instagramUserId: brand.instagramUserId,
      accessToken: brand.instagramAccessToken,
    });
  }

  const updated = await projectRepository.markPublished(projectId, userId, {
    instagramMediaId: result.mediaId,
    instagramPermalink: result.permalink ?? null,
  });
  if (!updated) {
    throw new NotFoundError('Project not found');
  }

  logger.info({ projectId, mediaId: result.mediaId, provider: result.provider }, 'Published project to Instagram');
  return { project: updated, mediaId: result.mediaId, permalink: result.permalink, provider: result.provider };
}

/**
 * Immediate "Publish now" path. On failure records a NON-terminal error (status
 * unchanged) — the user is looking at the toast and can retry directly.
 */
export async function publishProject(projectId: string, userId: string): Promise<PublishOutcome> {
  try {
    return await performPublish(projectId, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error while publishing to Instagram';
    await projectRepository
      .recordPublishError(projectId, userId, message, false)
      .catch((persistError) => logger.error({ err: persistError, projectId }, 'Failed to record publish error'));
    throw error;
  }
}

/**
 * Scheduled path. Atomically CLAIMS the project ('scheduled' -> 'publishing')
 * before doing any work; if the claim fails, another tick/instance already owns
 * it and we skip (prevents double-publishing). On success it becomes
 * 'published'; on failure it becomes terminal 'failed' so it is not retried
 * every tick forever — the user can reschedule to retry. Returns null if the
 * claim was lost.
 */
export async function publishScheduledProject(
  projectId: string,
  userId: string
): Promise<PublishOutcome | null> {
  const claimed = await projectRepository.claimForPublishing(projectId);
  if (!claimed) {
    // Lost the race (already claimed/published by another tick or the manual endpoint).
    return null;
  }

  try {
    return await performPublish(projectId, userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error while publishing to Instagram';
    await projectRepository
      .recordPublishError(projectId, userId, message, true)
      .catch((persistError) => logger.error({ err: persistError, projectId }, 'Failed to record publish error'));
    throw error;
  }
}
