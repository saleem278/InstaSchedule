import { useQuery } from '@tanstack/react-query';
import { getMediaAsset } from '../api/media.api';
import { mediaKeys } from './mediaKeys';
import type { MediaAsset } from '../schemas/media.types';

/**
 * Live single-asset query keyed by `mediaKeys.detail(id)` — the same key every
 * media mutation (favorite/tags/collections) writes to via `setQueryData`. The
 * detail drawer subscribes to this instead of rendering a captured prop
 * snapshot, so those mutations reflect immediately without reopening.
 *
 * Seed with the asset the caller already has (from the list) as `initialData`
 * so the drawer renders instantly and never has to refetch just to display.
 */
export function useMediaAsset(assetId: string | undefined, initialData?: MediaAsset) {
  return useQuery({
    queryKey: mediaKeys.detail(assetId ?? ''),
    queryFn: () => getMediaAsset(assetId as string),
    enabled: Boolean(assetId),
    initialData,
  });
}
