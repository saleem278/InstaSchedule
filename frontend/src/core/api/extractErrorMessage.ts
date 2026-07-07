import { isAxiosError } from 'axios';

/**
 * Pulls the most useful human-readable message out of an unknown thrown value,
 * preferring the backend's `{ error: { message } }` envelope (see
 * backend errorHandler) so descriptive server errors — e.g. "This brand is not
 * connected to Instagram" — reach the user instead of a generic axios string.
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
