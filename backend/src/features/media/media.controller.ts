import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import { ValidationError } from '../../core/errors/AppError';
import { config } from '../../config/env';
import * as mediaService from './media.service';
import {
  CreateCollectionInput,
  ListQueryInput,
  UpdateAssetInput,
  UpdateCollectionInput,
} from './media.validation';

export const listAssets = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = req.query as unknown as ListQueryInput;
  const result = await mediaService.list(userId, query);
  sendSuccess(res, result.items, 200, {
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
});

export const uploadAsset = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const file = req.file;
  if (!file) {
    throw new ValidationError('No file uploaded');
  }
  const brandId = typeof req.body?.brandId === 'string' ? req.body.brandId : undefined;
  const asset = await mediaService.uploadAsset(
    userId,
    { buffer: file.buffer, originalname: file.originalname },
    brandId
  );
  sendSuccess(res, asset, 201);
});

export const getAsset = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const assetId = req.params.assetId!;
  const asset = await mediaService.getById(assetId, userId);
  sendSuccess(res, asset);
});

export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const assetId = req.params.assetId!;
  const data = req.body as UpdateAssetInput;
  const asset = await mediaService.update(assetId, userId, data);
  sendSuccess(res, asset);
});

export const deleteAsset = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const assetId = req.params.assetId!;
  await mediaService.remove(assetId, userId);
  sendSuccess(res, null);
});

export const favoriteAsset = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const assetId = req.params.assetId!;
  const asset = await mediaService.toggleFavorite(assetId, userId);
  sendSuccess(res, asset);
});

/**
 * Streams a remote image back through THIS origin so the browser image editor
 * can load it CORS-clean (a cross-origin image, even loaded with
 * crossOrigin='anonymous', taints the canvas and makes toDataURL/toBlob throw
 * if the source host doesn't send permissive CORS headers — which pollinations
 * does not reliably do).
 *
 * SSRF-guarded: only fetches from an allowlist of known image hosts
 * (pollinations, Cloudinary) plus the app's own SERVER_URL — never an
 * arbitrary user-supplied host. Requires auth (mounted under the media router).
 */
const PROXY_ALLOWED_HOSTS = ['image.pollinations.ai', 'res.cloudinary.com'];
const PROXY_MAX_BYTES = 15 * 1024 * 1024;
const PROXY_TIMEOUT_MS = 20_000;

function isProxyableUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  if (PROXY_ALLOWED_HOSTS.includes(host)) return url;
  // Also allow the app's own configured origin (serves /uploads).
  if (config.SERVER_URL) {
    try {
      if (host === new URL(config.SERVER_URL).hostname.toLowerCase()) return url;
    } catch {
      /* ignore malformed SERVER_URL */
    }
  }
  return null;
}

export const proxyImage = asyncHandler(async (req: Request, res: Response) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
  const url = isProxyableUrl(rawUrl);
  if (!url) {
    throw new ValidationError('Image URL is not allowed for proxying.');
  }

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(url.toString(), { signal: AbortSignal.timeout(PROXY_TIMEOUT_MS) });
  } catch {
    throw new ValidationError('Could not fetch the source image.');
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !contentType.startsWith('image/')) {
    throw new ValidationError('Source did not return a valid image.');
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  if (buffer.length === 0 || buffer.length > PROXY_MAX_BYTES) {
    throw new ValidationError('Source image is empty or too large to proxy.');
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(buffer);
});

// ---- Collections ----

export const listCollections = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const collections = await mediaService.listCollections(userId);
  sendSuccess(res, collections);
});

export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as CreateCollectionInput;
  const collection = await mediaService.createCollection(userId, data);
  sendSuccess(res, collection, 201);
});

export const updateCollection = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const collectionId = req.params.collectionId!;
  const data = req.body as UpdateCollectionInput;
  const collection = await mediaService.updateCollection(collectionId, userId, data);
  sendSuccess(res, collection);
});

export const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const collectionId = req.params.collectionId!;
  await mediaService.deleteCollection(collectionId, userId);
  sendSuccess(res, null);
});

export const addAssetToCollection = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const collectionId = req.params.collectionId!;
  const assetId = req.params.assetId!;
  const asset = await mediaService.addAssetToCollection(collectionId, assetId, userId);
  sendSuccess(res, asset);
});

export const removeAssetFromCollection = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const collectionId = req.params.collectionId!;
  const assetId = req.params.assetId!;
  const asset = await mediaService.removeAssetFromCollection(collectionId, assetId, userId);
  sendSuccess(res, asset);
});
