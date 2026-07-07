/**
 * Media asset / collection shapes as returned by the API (Mongoose documents
 * serialized to JSON). Mirrors backend/src/features/media/media.model.ts and
 * collection.model.ts.
 */

export type MediaSource = 'upload' | 'ai-generated';
export type StorageProviderName = 'cloudinary' | 'local';

export interface MediaAsset {
  _id: string;
  user: string;
  brand?: string | null;
  source: MediaSource;
  url: string;
  publicId?: string | null;
  storageProvider: StorageProviderName;
  width?: number;
  height?: number;
  format?: string;
  isFavorite: boolean;
  collections: string[];
  generation?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaCollection {
  _id: string;
  user: string;
  name: string;
  description?: string;
  coverAsset?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Quick-filter chips in the media library top bar. */
export type MediaFilter = 'all' | 'ai-generated' | 'uploaded' | 'favorites';

export interface ListMediaParams {
  favorite?: boolean;
  collectionId?: string;
  search?: string;
  brandId?: string;
  page?: number;
  limit?: number;
}

export interface ListMediaResult {
  items: MediaAsset[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateAssetPayload {
  tags?: string[];
  isFavorite?: boolean;
}

export interface CreateCollectionPayload {
  name: string;
  description?: string;
}

export type UpdateCollectionPayload = Partial<CreateCollectionPayload>;
