import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteMediaAsset } from '../api/media.api';
import { mediaKeys } from './mediaKeys';

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => deleteMediaAsset(assetId),
    onSuccess: async (_data, assetId) => {
      queryClient.removeQueries({ queryKey: mediaKeys.detail(assetId) });
      await queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      toast.success('Asset deleted');
    },
    onError: () => {
      toast.error('Could not delete asset. Please try again.');
    },
  });
}
