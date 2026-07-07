import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadMedia } from '../api/media.api';
import { mediaKeys } from './mediaKeys';

interface UploadMediaVariables {
  file: File;
  brandId?: string;
  onProgress?: (percent: number) => void;
}

/**
 * Uploads a single file via multipart/form-data (field name `file`, matching
 * the backend's multer config) with upload progress reported through axios's
 * `onUploadProgress`. Call once per file — callers looping over multiple
 * files invoke this mutation sequentially (see MediaUploadDropzone).
 */
export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, brandId, onProgress }: UploadMediaVariables) =>
      uploadMedia(file, brandId, onProgress),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
    onError: () => {
      toast.error('Upload failed. Please try again.');
    },
  });
}
