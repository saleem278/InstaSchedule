import { useQuery } from '@tanstack/react-query';
import { listBrands } from '../api/brand.api';
import { brandKeys } from './brandKeys';

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.lists(),
    queryFn: listBrands,
  });
}
