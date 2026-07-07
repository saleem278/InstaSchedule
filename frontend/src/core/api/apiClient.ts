import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_ENDPOINTS } from './endpoints';

/**
 * UNWRAPPING CONVENTION (read this before writing any feature api/*.ts file):
 *
 * The backend success envelope is `{ success: true, data, meta? }`.
 * This axios instance's response interceptor unwraps that envelope so every
 * call site gets the `data` payload directly:
 *
 *   const brand = await apiClient.get<Brand>(BRAND_ENDPOINTS.detail(id));
 *   //    ^ Brand, NOT { success: true, data: Brand }
 *
 * If a `meta` field is present alongside `data` (e.g. pagination), it is
 * attached as a non-enumerable `__meta` property on the returned value so it
 * doesn't pollute the shape callers destructure, but can still be read via
 * `(result as WithMeta<T>).__meta` when needed. Prefer a dedicated typed
 * response (e.g. `{ items, meta }`) returned by the backend endpoint itself
 * for anything that needs pagination metadata in normal use.
 *
 * Do NOT add another layer of `.data.data` unwrapping in feature code —
 * it is already done here, once, globally.
 */

export interface WithMeta {
  __meta?: unknown;
}

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`,
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

function isAuthBootstrapRequest(url?: string): boolean {
  if (!url) return false;
  return url.includes(AUTH_ENDPOINTS.refresh) || url.includes(AUTH_ENDPOINTS.login);
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as unknown;

    if (
      body &&
      typeof body === 'object' &&
      'success' in body &&
      'data' in body &&
      (body as { success: unknown }).success === true
    ) {
      const { data, meta } = body as unknown as { data: unknown; meta?: unknown };

      if (meta !== undefined && data && typeof data === 'object') {
        Object.defineProperty(data, '__meta', {
          value: meta,
          enumerable: false,
          configurable: true,
        });
      }

      return { ...response, data };
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const status = error.response?.status;
    const requestUrl = originalRequest?.url;

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthBootstrapRequest(requestUrl)) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = apiClient
            .post(AUTH_ENDPOINTS.refresh)
            .then(() => undefined)
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }

        await refreshPromise;
        return apiClient.request(originalRequest);
      } catch {
        window.location.assign('/login');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
