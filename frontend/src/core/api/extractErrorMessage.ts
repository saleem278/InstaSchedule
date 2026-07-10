import { isAxiosError } from 'axios';

function truncateMessage(value: string, maxLength = 300): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3)}...`;
}

function isUnsafeMessage(value: string): boolean {
  const trimmed = value.trim();
  return /\b(?:key|token|secret|bearer)=|https?:\/\/|www\./i.test(trimmed);
}

function extractNestedMessage(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const entry = value as Record<string, unknown>;

  const directCandidates: Array<string | undefined> = [
    typeof entry.error === 'string' ? entry.error : undefined,
    typeof entry.message === 'string' ? entry.message : undefined,
    typeof entry.errorMessage === 'string' ? entry.errorMessage : undefined,
  ];

  for (const candidate of directCandidates) {
    if (candidate && !isUnsafeMessage(candidate)) return truncateMessage(candidate);
  }

  const nestedCandidates = [entry.error, entry.details];

  for (const candidate of nestedCandidates) {
    if (typeof candidate === 'object' && candidate !== null) {
      const nested = extractNestedMessage(candidate);
      if (nested) return nested;
    }
  }

  if (typeof entry.details === 'string' && !isUnsafeMessage(entry.details)) {
    return truncateMessage(entry.details);
  }

  return undefined;
}

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
    const data = error.response?.data;
    const extracted = extractNestedMessage(data);
    if (typeof extracted === 'string') return extracted;
    if (typeof data === 'string') {
      if (isUnsafeMessage(data)) return fallback;
      return truncateMessage(data);
    }
    if (error.message) return truncateMessage(error.message);
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
