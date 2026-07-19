import { useQuery } from '@tanstack/react-query';
import { searchInstagramAudio } from '../api/brand.api';

export function useBrandAudio(brandId: string | undefined, query: string, enabled = false) {
  return useQuery({
    queryKey: ['brands', brandId, 'instagram-audio', query],
    queryFn: () => {
      if (!brandId) return [];
      return searchInstagramAudio(brandId, query);
    },
    enabled: enabled && !!brandId,
    staleTime: 5 * 60 * 1000,
  });
}
