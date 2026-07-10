import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/core/api/extractErrorMessage';
import { createBrand } from '../api/brand.api';
import { brandKeys } from './brandKeys';
import type { BrandPayload } from '../schemas/brand.types';

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BrandPayload) => createBrand(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      toast.success('Brand created');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Could not create brand. Please try again.'));
    },
  });
}
