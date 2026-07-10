import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { validate } from '../../core/middleware/validate';
import { uploadRateLimiter } from '../../core/middleware/rateLimit';
import { uploadSingleImage } from './upload.middleware';
import {
  createCollectionSchema,
  listQuerySchema,
  updateAssetSchema,
  updateCollectionSchema,
} from './media.validation';
import {
  addAssetToCollection,
  createCollection,
  deleteAsset,
  deleteCollection,
  favoriteAsset,
  getAsset,
  listAssets,
  listCollections,
  proxyImage,
  removeAssetFromCollection,
  updateAsset,
  updateCollection,
  uploadAsset,
} from './media.controller';

export const mediaRouter = Router();

mediaRouter.use(authenticate);

// Collections (registered before /:assetId routes to avoid path collisions)
mediaRouter.get('/collections', listCollections);
mediaRouter.post('/collections', validate(createCollectionSchema), createCollection);
mediaRouter.patch('/collections/:collectionId', validate(updateCollectionSchema), updateCollection);
mediaRouter.delete('/collections/:collectionId', deleteCollection);
mediaRouter.post('/collections/:collectionId/assets/:assetId', addAssetToCollection);
mediaRouter.delete('/collections/:collectionId/assets/:assetId', removeAssetFromCollection);

// Assets
mediaRouter.get('/', validate(listQuerySchema, 'query'), listAssets);
mediaRouter.post('/upload', uploadRateLimiter, uploadSingleImage, uploadAsset);
// Registered before /:assetId so "proxy" isn't captured as an asset id.
mediaRouter.get('/proxy', proxyImage);
mediaRouter.get('/:assetId', getAsset);
mediaRouter.patch('/:assetId', validate(updateAssetSchema), updateAsset);
mediaRouter.delete('/:assetId', deleteAsset);
mediaRouter.post('/:assetId/favorite', favoriteAsset);
