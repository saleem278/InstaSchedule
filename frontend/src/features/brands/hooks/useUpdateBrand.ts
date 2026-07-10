import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/core/api/extractErrorMessage';
import { updateBrand } from '../api/brand.api';
import { brandKeys } from './brandKeys';
import type { BrandPayload } from '../schemas/brand.types';

interface UpdateBrandVariables {
  brandId: string;
  payload: Partial<BrandPayload>;
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ brandId, payload }: UpdateBrandVariables) => updateBrand(brandId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: brandKeys.detail(variables.brandId) });
      toast.success('Brand updated');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Could not update brand. Please try again.'));
    },
  });
}
