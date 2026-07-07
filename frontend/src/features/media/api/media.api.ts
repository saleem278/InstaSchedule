import { apiClient, type WithMeta } from '@/core/api/apiClient';
import { MEDIA_ENDPOINTS } from '@/core/api/endpoints';
import type {
  CreateCollectionPayload,
  ListMediaParams,
  ListMediaResult,
  MediaAsset,
  MediaCollection,
  UpdateAssetPayload,
  UpdateCollectionPayload,
} from '../schemas/media.types';

/**
 * Media API calls. `apiClient`'s response interceptor already unwraps the
 * `{ success, data }` envelope, so every call below resolves directly to the
 * typed payload — never re-unwrap `.data.data` here.
 *
 * `GET /media` sends `data` as the bare asset array and `meta` (total/page/
 * limit) as a non-enumerable `__meta` property on that array (see
 * apiClient's WithMeta convention). `listMedia` below reads it off and
 * returns a proper `{ items, total, page, limit }` shape for callers.
 */

interface PageMeta {
  total: number;
  page: number;
  limit: number;
}

export async function listMedia(params: ListMediaParams): Promise<ListMediaResult> {
  const query: Record<string, string | number> = {};
  if (params.favorite !== undefined) query.favorite = String(params.favorite);
  if (params.collectionId) query.collectionId = params.collectionId;
  if (params.search) query.search = params.search;
  if (params.brandId) query.brandId = params.brandId;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  const items = await apiClient
    .get<MediaAsset[]>(MEDIA_ENDPOINTS.list, { params: query })
    .then((res) => res.data);

  const meta = (items as unknown as WithMeta).__meta as PageMeta | undefined;

  return {
    items,
    total: meta?.total ?? items.length,
    page: meta?.page ?? params.page ?? 1,
    limit: meta?.limit ?? params.limit ?? items.length,
  };
}

export async function getMediaAsset(assetId: string): Promise<MediaAsset> {
  return apiClient.get<MediaAsset>(MEDIA_ENDPOINTS.detail(assetId)).then((res) => res.data);
}

export async function uploadMedia(
  file: File,
  brandId: string | undefined,
  onUploadProgress?: (percent: number) => void
): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);
  if (brandId) formData.append('brandId', brandId);

  return apiClient
    .post<MediaAsset>(MEDIA_ENDPOINTS.upload, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    })
    .then((res) => res.data);
}

export async function updateMediaAsset(assetId: string, payload: UpdateAssetPayload): Promise<MediaAsset> {
  return apiClient.patch<MediaAsset>(MEDIA_ENDPOINTS.update(assetId), payload).then((res) => res.data);
}

export async function deleteMediaAsset(assetId: string): Promise<void> {
  await apiClient.delete(MEDIA_ENDPOINTS.delete(assetId));
}

export async function toggleFavoriteMediaAsset(assetId: string): Promise<MediaAsset> {
  return apiClient.post<MediaAsset>(MEDIA_ENDPOINTS.favorite(assetId)).then((res) => res.data);
}

// ---- Collections ----

export async function listCollections(): Promise<MediaCollection[]> {
  return apiClient.get<MediaCollection[]>(MEDIA_ENDPOINTS.collections).then((res) => res.data);
}

export async function createCollection(payload: CreateCollectionPayload): Promise<MediaCollection> {
  return apiClient.post<MediaCollection>(MEDIA_ENDPOINTS.createCollection, payload).then((res) => res.data);
}

export async function updateCollection(
  collectionId: string,
  payload: UpdateCollectionPayload
): Promise<MediaCollection> {
  return apiClient
    .patch<MediaCollection>(MEDIA_ENDPOINTS.updateCollection(collectionId), payload)
    .then((res) => res.data);
}

export async function deleteCollection(collectionId: string): Promise<void> {
  await apiClient.delete(MEDIA_ENDPOINTS.deleteCollection(collectionId));
}

export async function addAssetToCollection(collectionId: string, assetId: string): Promise<MediaAsset> {
  return apiClient
    .post<MediaAsset>(MEDIA_ENDPOINTS.addAssetToCollection(collectionId, assetId))
    .then((res) => res.data);
}

export async function removeAssetFromCollection(collectionId: string, assetId: string): Promise<MediaAsset> {
  return apiClient
    .delete<MediaAsset>(MEDIA_ENDPOINTS.removeAssetFromCollection(collectionId, assetId))
    .then((res) => res.data);
}
