import { useQuery } from '@tanstack/react-query';
import { listCollections } from '../api/media.api';
import { mediaKeys } from './mediaKeys';

export function useCollections() {
  return useQuery({
    queryKey: mediaKeys.collections(),
    queryFn: listCollections,
  });
}
