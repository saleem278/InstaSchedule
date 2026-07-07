import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listMedia } from '../api/media.api';
import { mediaKeys } from './mediaKeys';
import type { ListMediaParams } from '../schemas/media.types';

/**
 * Paginated media asset list, filtered by favorite/collection/search/brand.
 * Keeps the previous page's data visible while a new page/filter loads to
 * avoid the grid flashing empty during pagination.
 */
export function useMediaAssets(params: ListMediaParams) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => listMedia(params),
    placeholderData: keepPreviousData,
  });
}
