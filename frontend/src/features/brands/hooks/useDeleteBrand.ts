import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteBrand } from '../api/brand.api';
import { brandKeys } from './brandKeys';
import { useActiveBrandStore } from '../store/activeBrandStore';

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) => deleteBrand(brandId),
    onSuccess: async (_data, brandId) => {
      await queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      queryClient.removeQueries({ queryKey: brandKeys.detail(brandId) });

      const { activeBrandId, setActiveBrandId } = useActiveBrandStore.getState();
      if (activeBrandId === brandId) {
        setActiveBrandId(null);
      }

      toast.success('Brand deleted');
    },
    onError: () => {
      toast.error('Could not delete brand. Please try again.');
    },
  });
}
