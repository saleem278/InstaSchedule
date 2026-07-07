import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addAssetToCollection, removeAssetFromCollection } from '../api/media.api';
import { mediaKeys } from './mediaKeys';

interface AssetCollectionVariables {
  collectionId: string;
  assetId: string;
}

/**
 * Toggles a single asset's membership in a single collection. The backend
 * has no bulk/multi-collection endpoint, so the multi-select in
 * MediaDetailDrawer calls these one collection at a time (small N, always
 * <= number of collections shown in the picker — negligible cost).
 */
export function useAddAssetToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, assetId }: AssetCollectionVariables) =>
      addAssetToCollection(collectionId, assetId),
    onSuccess: async (updated) => {
      queryClient.setQueryData(mediaKeys.detail(updated._id), updated);
      await queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
    onError: () => {
      toast.error('Could not add to collection. Please try again.');
    },
  });
}

export function useRemoveAssetFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, assetId }: AssetCollectionVariables) =>
      removeAssetFromCollection(collectionId, assetId),
    onSuccess: async (updated) => {
      queryClient.setQueryData(mediaKeys.detail(updated._id), updated);
      await queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
    onError: () => {
      toast.error('Could not remove from collection. Please try again.');
    },
  });
}
