import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/core/api/extractErrorMessage';
import { deleteBrand } from '../api/brand.api';
import { brandKeys } from './brandKeys';
import { useActiveBrandStore } from '../store/activeBrandStore';
import type { Brand } from '../schemas/brand.types';

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) => deleteBrand(brandId),
    onSuccess: async (_data, brandId) => {
      await queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      queryClient.removeQueries({ queryKey: brandKeys.detail(brandId) });

      const { activeBrandId, setActiveBrandId } = useActiveBrandStore.getState();
      if (activeBrandId === brandId) {
        // Don't leave the app in a "no brand selected" limbo when other brands
        // remain — re-point the active brand at the first survivor (or null
        // only when this was the last brand). Read the just-refreshed list.
        const lists = queryClient.getQueriesData<Brand[]>({ queryKey: brandKeys.lists() });
        const remaining = lists.flatMap(([, brands]) => brands ?? []).filter((b) => b._id !== brandId);
        setActiveBrandId(remaining[0]?._id ?? null);
      }

      toast.success('Brand deleted');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Could not delete brand. Please try again.'));
    },
  });
}
