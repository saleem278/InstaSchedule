import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import { ValidationError } from '../../core/errors/AppError';
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
