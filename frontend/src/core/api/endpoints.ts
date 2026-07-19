/**
 * Centralized backend route path constants (relative to the `/api/v1` baseURL
 * configured on `apiClient`). Feature `api/*.ts` modules must import from
 * here rather than hardcoding path strings.
 */

export const AUTH_ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
  config: '/auth/config',
  google: '/auth/google',
  googleCallback: '/auth/google/callback',
} as const;

export const BRAND_ENDPOINTS = {
  list: '/brands',
  create: '/brands',
  detail: (brandId: string) => `/brands/${brandId}`,
  update: (brandId: string) => `/brands/${brandId}`,
  delete: (brandId: string) => `/brands/${brandId}`,
} as const;

export const PROJECT_ENDPOINTS = {
  list: '/projects',
  create: '/projects',
  detail: (projectId: string) => `/projects/${projectId}`,
  update: (projectId: string) => `/projects/${projectId}`,
  delete: (projectId: string) => `/projects/${projectId}`,
  duplicate: (projectId: string) => `/projects/${projectId}/duplicate`,
  updateStatus: (projectId: string) => `/projects/${projectId}/status`,
  publish: (projectId: string) => `/projects/${projectId}/publish`,
} as const;

export const GENERATION_ENDPOINTS = {
  generateFull: (projectId: string) => `/generation/${projectId}/generate`,
  regenerateField: (projectId: string, field: string) => `/generation/${projectId}/regenerate/${field}`,
  jobStatus: (projectId: string, jobId: string) => `/generation/${projectId}/jobs/${jobId}`,
  history: (projectId: string) => `/generation/history/${projectId}`,
  duplicate: (generationId: string) => `/generation/history/${generationId}/duplicate`,
  restore: (generationId: string) => `/generation/history/${generationId}/restore`,
} as const;

export const MEDIA_ENDPOINTS = {
  list: '/media',
  upload: '/media/upload',
  /** Same-origin image proxy — load remote images through this so the editor canvas doesn't taint. */
  proxy: (url: string) => `/media/proxy?url=${encodeURIComponent(url)}`,
  detail: (assetId: string) => `/media/${assetId}`,
  update: (assetId: string) => `/media/${assetId}`,
  delete: (assetId: string) => `/media/${assetId}`,
  favorite: (assetId: string) => `/media/${assetId}/favorite`,
  collections: '/media/collections',
  createCollection: '/media/collections',
  updateCollection: (collectionId: string) => `/media/collections/${collectionId}`,
  deleteCollection: (collectionId: string) => `/media/collections/${collectionId}`,
  addAssetToCollection: (collectionId: string, assetId: string) =>
    `/media/collections/${collectionId}/assets/${assetId}`,
  removeAssetFromCollection: (collectionId: string, assetId: string) =>
    `/media/collections/${collectionId}/assets/${assetId}`,
} as const;

export const SCHEDULER_ENDPOINTS = {
  calendar: '/scheduler/calendar',
  updateSchedule: (projectId: string) => `/scheduler/${projectId}/schedule`,
} as const;

export const PROVIDER_ENDPOINTS = {
  list: '/providers',
} as const;

export const PROMPT_ENDPOINTS = {
  list: '/prompts',
  create: '/prompts',
  detail: (id: string) => `/prompts/${id}`,
  update: (id: string) => `/prompts/${id}`,
  delete: (id: string) => `/prompts/${id}`,
} as const;

