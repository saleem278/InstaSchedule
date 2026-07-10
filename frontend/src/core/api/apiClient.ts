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

/**
 * Called once when a session is definitively gone (refresh failed). The app
 * wires this (see App.tsx) to clear the `me` query cache and navigate to
 * /login via React Router, so we avoid a jarring full-page `window.location`
 * reload that would blow away app state and the preserved `from` location.
 * Until wired, we fall back to a guarded location redirect.
 */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler;
}

function handleSessionExpired(): void {
  if (onSessionExpired) {
    onSessionExpired();
    return;
  }
  // Fallback: only hard-redirect if we're not already on the login page.
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

// Shared refresh state. `refreshPromise` resolves to whether the refresh
// SUCCEEDED, so every concurrent 401 waiter branches on one shared result
// (retry on success, reject-without-loop on failure) rather than each firing
// its own refresh/redirect.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post(AUTH_ENDPOINTS.refresh)
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Requests that must NOT trigger the refresh-and-retry dance on a 401:
 *  - refresh/login: bootstrapping the session itself.
 *  - me/config: unauthenticated PROBES — a 401 here is a normal "logged out"
 *    signal that useCurrentUser resolves to null; refreshing/redirecting on it
 *    would spuriously reload on every logged-out page visit.
 */
function isAuthBootstrapRequest(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes(AUTH_ENDPOINTS.refresh) ||
    url.includes(AUTH_ENDPOINTS.login) ||
    url.includes(AUTH_ENDPOINTS.me) ||
    url.includes(AUTH_ENDPOINTS.config)
  );
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

      const refreshed = await refreshSession();
      if (refreshed) {
        return apiClient.request(originalRequest);
      }
      // Refresh failed → session is gone. Signal once (all concurrent waiters
      // call this; it's idempotent) and reject so callers stop.
      handleSessionExpired();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export { apiClient };
