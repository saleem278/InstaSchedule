import { apiClient } from '@/core/api/apiClient';
import { BRAND_ENDPOINTS, MEDIA_ENDPOINTS } from '@/core/api/endpoints';
import type { Brand, BrandPayload } from '../schemas/brand.types';
import type { ProjectMusic } from '@/features/projects/schemas/project.types';

/**
 * Brand API calls. `apiClient`'s response interceptor already unwraps the
 * `{ success, data }` envelope, so every call below resolves directly to the
 * typed payload — never re-unwrap `.data.data` here.
 */

export async function listBrands(): Promise<Brand[]> {
  return apiClient.get<Brand[]>(BRAND_ENDPOINTS.list).then((res) => res.data);
}

export async function getBrand(brandId: string): Promise<Brand> {
  return apiClient.get<Brand>(BRAND_ENDPOINTS.detail(brandId)).then((res) => res.data);
}

export async function createBrand(payload: BrandPayload): Promise<Brand> {
  return apiClient.post<Brand>(BRAND_ENDPOINTS.create, payload).then((res) => res.data);
}

export async function updateBrand(brandId: string, payload: Partial<BrandPayload>): Promise<Brand> {
  return apiClient.patch<Brand>(BRAND_ENDPOINTS.update(brandId), payload).then((res) => res.data);
}

export async function deleteBrand(brandId: string): Promise<void> {
  await apiClient.delete(BRAND_ENDPOINTS.delete(brandId));
}

interface UploadedAsset {
  url: string;
}

/**
 * Uploads a logo file via the shared media upload endpoint and returns the
 * resulting hosted URL to store as `Brand.logoUrl`.
 */
export async function uploadBrandLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const asset = await apiClient
    .post<UploadedAsset>(MEDIA_ENDPOINTS.upload, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
  return asset.url;
}

export async function searchInstagramAudio(
  brandId: string,
  q: string,
  type: 'music' | 'original_sound' = 'music'
): Promise<ProjectMusic[]> {
  return apiClient
    .get<ProjectMusic[]>(`/brands/${brandId}/instagram-audio`, { params: { q, type } })
    .then((res) => res.data);
}
