import { MEDIA_ENDPOINTS } from '@/core/api/endpoints';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`;

/**
 * Resolve the URL Fabric should load an image from inside the editor. A
 * cross-origin image taints the canvas (breaking toDataURL/toBlob on export)
 * unless the host sends permissive CORS headers — which pollinations does not.
 * So route remote images through the same-origin, credentialed backend proxy;
 * leave already-same-origin URLs (relative `/uploads`, or same-origin absolute)
 * untouched. Callers must NOT set crossOrigin on the returned src — it's
 * same-origin, and CORS mode would drop the auth cookie the proxy requires.
 */
export function toEditorSrc(imageUrl: string): string {
  if (imageUrl.startsWith('/')) return imageUrl;
  try {
    const parsed = new URL(imageUrl, window.location.origin);
    if (parsed.origin === window.location.origin) return imageUrl;
  } catch {
    return imageUrl;
  }
  return `${API_BASE}${MEDIA_ENDPOINTS.proxy(imageUrl)}`;
}
