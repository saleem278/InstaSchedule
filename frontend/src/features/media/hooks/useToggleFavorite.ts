import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toggleFavoriteMediaAsset } from '../api/media.api';
import { mediaKeys } from './mediaKeys';

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => toggleFavoriteMediaAsset(assetId),
    onSuccess: async (updated) => {
      queryClient.setQueryData(mediaKeys.detail(updated._id), updated);
      await queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
    onError: () => {
      toast.error('Could not update favorite. Please try again.');
    },
  });
}
