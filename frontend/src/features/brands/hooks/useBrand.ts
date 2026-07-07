import { useQuery } from '@tanstack/react-query';
import { getBrand } from '../api/brand.api';
import { brandKeys } from './brandKeys';

export function useBrand(brandId: string | null | undefined) {
  return useQuery({
    queryKey: brandKeys.detail(brandId ?? ''),
    queryFn: () => getBrand(brandId as string),
    enabled: Boolean(brandId),
  });
}
