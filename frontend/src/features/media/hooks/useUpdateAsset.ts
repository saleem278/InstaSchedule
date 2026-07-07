import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateMediaAsset } from '../api/media.api';
import { mediaKeys } from './mediaKeys';
import type { UpdateAssetPayload } from '../schemas/media.types';

interface UpdateAssetVariables {
  assetId: string;
  payload: UpdateAssetPayload;
}

/** Updates asset metadata (tags, favorite). Used by the detail drawer's tag editor. */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, payload }: UpdateAssetVariables) => updateMediaAsset(assetId, payload),
    onSuccess: async (updated) => {
      queryClient.setQueryData(mediaKeys.detail(updated._id), updated);
      await queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
    onError: () => {
      toast.error('Could not save changes. Please try again.');
    },
  });
}
