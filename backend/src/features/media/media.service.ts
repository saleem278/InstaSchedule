import { NotFoundError } from '../../core/errors/AppError';
import * as mediaRepository from './media.repository';
import { MediaAssetDocument } from './media.model';
import { CollectionDocument } from './collection.model';
import { getStorageProvider } from './storage/StorageProviderFactory';
import {
  CreateCollectionInput,
  ListQueryInput,
  UpdateAssetInput,
  UpdateCollectionInput,
} from './media.validation';

export interface UploadFile {
  buffer: Buffer;
  originalname: string;
}

export interface ListAssetsResult {
  items: MediaAssetDocument[];
  total: number;
  page: number;
  limit: number;
}

export async function list(userId: string, query: ListQueryInput): Promise<ListAssetsResult> {
  const filters = {
    isFavorite: query.favorite === undefined ? undefined : query.favorite === 'true',
    collectionId: query.collectionId,
    brandId: query.brandId,
    search: query.search,
  };
  return mediaRepository.list(userId, filters, query.page, query.limit);
}

export async function getById(id: string, userId: string): Promise<MediaAssetDocument> {
  const asset = await mediaRepository.findByIdForUser(id, userId);
  if (!asset) {
    throw new NotFoundError('Media asset not found');
  }
  return asset;
}

export async function uploadAsset(
  userId: string,
  file: UploadFile,
  brandId?: string
): Promise<MediaAssetDocument> {
  const provider = getStorageProvider();
  const result = await provider.upload(file.buffer, file.originalname, userId);

  return mediaRepository.create({
    user: userId,
    brand: brandId ?? null,
    source: 'upload',
    url: result.url,
    publicId: result.publicId,
    storageProvider: provider.name as 'cloudinary' | 'local',
    width: result.width,
    height: result.height,
    format: result.format,
    tags: [],
  });
}

export async function update(id: string, userId: string, data: UpdateAssetInput): Promise<MediaAssetDocument> {
  await getById(id, userId);
  const updated = await mediaRepository.update(id, userId, data);
  if (!updated) {
    throw new NotFoundError('Media asset not found');
  }
  return updated;
}

export async function toggleFavorite(id: string, userId: string): Promise<MediaAssetDocument> {
  const asset = await getById(id, userId);
  const updated = await mediaRepository.update(id, userId, { isFavorite: !asset.isFavorite });
  if (!updated) {
    throw new NotFoundError('Media asset not found');
  }
  return updated;
}

export async function remove(id: string, userId: string): Promise<void> {
  const asset = await getById(id, userId);
  await mediaRepository.remove(id, userId);

  if (asset.publicId) {
    const provider = getStorageProvider();
    // Best-effort cleanup; do not fail the request if remote/local deletion fails.
    await provider.delete(asset.publicId).catch(() => undefined);
  }
}

// ---- Collections ----

export async function listCollections(userId: string): Promise<CollectionDocument[]> {
  return mediaRepository.listCollections(userId);
}

export async function getCollectionById(id: string, userId: string): Promise<CollectionDocument> {
  const collection = await mediaRepository.findCollectionByIdForUser(id, userId);
  if (!collection) {
    throw new NotFoundError('Collection not found');
  }
  return collection;
}

export async function createCollection(
  userId: string,
  data: CreateCollectionInput
): Promise<CollectionDocument> {
  return mediaRepository.createCollection(userId, data);
}

export async function updateCollection(
  id: string,
  userId: string,
  data: UpdateCollectionInput
): Promise<CollectionDocument> {
  await getCollectionById(id, userId);
  const updated = await mediaRepository.updateCollection(id, userId, data);
  if (!updated) {
    throw new NotFoundError('Collection not found');
  }
  return updated;
}

export async function deleteCollection(id: string, userId: string): Promise<void> {
  await getCollectionById(id, userId);
  await mediaRepository.deleteCollection(id, userId);
}

export async function addAssetToCollection(
  collectionId: string,
  assetId: string,
  userId: string
): Promise<MediaAssetDocument> {
  await getCollectionById(collectionId, userId);
  await getById(assetId, userId);
  const updated = await mediaRepository.addAssetToCollection(collectionId, assetId, userId);
  if (!updated) {
    throw new NotFoundError('Media asset not found');
  }
  return updated;
}

export async function removeAssetFromCollection(
  collectionId: string,
  assetId: string,
  userId: string
): Promise<MediaAssetDocument> {
  await getCollectionById(collectionId, userId);
  await getById(assetId, userId);
  const updated = await mediaRepository.removeAssetFromCollection(collectionId, assetId, userId);
  if (!updated) {
    throw new NotFoundError('Media asset not found');
  }
  return updated;
}
