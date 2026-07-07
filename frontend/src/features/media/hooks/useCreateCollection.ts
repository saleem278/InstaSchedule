import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCollection } from '../api/media.api';
import { mediaKeys } from './mediaKeys';
import type { CreateCollectionPayload } from '../schemas/media.types';

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCollectionPayload) => createCollection(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.collections() });
      toast.success('Collection created');
    },
    onError: () => {
      toast.error('Could not create collection. Please try again.');
    },
  });
}
