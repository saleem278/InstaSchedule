import { apiClient } from '@/core/api/apiClient';
import { PROVIDER_ENDPOINTS } from '@/core/api/endpoints';

export interface ProviderInfo {
  name: string;
  displayName: string;
  available: boolean;
}

export interface ProvidersResponse {
  defaultTextProvider: string;
  defaultImageProvider: string;
  defaultTextModel?: string;
  defaultImageModel?: string;
  textProviders: ProviderInfo[];
  imageProviders: ProviderInfo[];
}

export async function listProviders(brandId?: string): Promise<ProvidersResponse> {
  const url = brandId ? `${PROVIDER_ENDPOINTS.list}?brandId=${encodeURIComponent(brandId)}` : PROVIDER_ENDPOINTS.list;
  return apiClient.get<ProvidersResponse>(url).then((res) => res.data);
}
