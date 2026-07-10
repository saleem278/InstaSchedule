import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/core/utils/cn';
import { uploadBrandLogo } from '../api/brand.api';
import { toast } from 'sonner';

interface LogoDropzoneProps {
  value?: string;
  fallbackLabel: string;
  onChange: (url: string) => void;
  /**
   * Render as a plain, non-interactive preview (no drop target, no file
   * picker). Used on the wizard's Review step, where an editable dropzone
   * whose changes are discarded would let the user "upload" into a black hole.
   */
  readOnly?: boolean;
}

/**
 * Circular logo dropzone: drag/drop or click to upload an image, shows a
 * circular preview, uploads immediately via the shared media endpoint and
 * reports the resulting hosted URL back to the form.
 */
export function LogoDropzone({ value, fallbackLabel, onChange, readOnly = false }: LogoDropzoneProps): React.JSX.Element {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  // Track the last object URL we created so we can revoke it (avoiding a
  // memory leak) once it's replaced or the component unmounts.
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const localPreview = URL.createObjectURL(file);
      objectUrlRef.current = localPreview;
      setPreviewUrl(localPreview);
      setIsUploading(true);

      uploadBrandLogo(file)
        .then((url) => {
          onChange(url);
          // The hosted URL is now the source of truth; drop the local blob.
          setPreviewUrl(url);
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
        })
        .catch(() => {
          toast.error('Logo upload failed. Please try again.');
          setPreviewUrl(value);
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
        })
        .finally(() => {
          setIsUploading(false);
        });
    },
    [onChange, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
    disabled: readOnly,
  });

  // Read-only: a plain circular avatar, no drop handlers or hidden input.
  if (readOnly) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-backgroundMuted">
        <Avatar className="h-full w-full">
          <AvatarImage src={previewUrl} alt="Brand logo" />
          <AvatarFallback className="bg-transparent text-xl">{fallbackLabel}</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border bg-backgroundMuted transition-colors',
        isDragActive && 'border-accent bg-accentSubtle'
      )}
    >
      <input {...getInputProps()} />
      <Avatar className="h-full w-full">
        <AvatarImage src={previewUrl} alt="Brand logo" />
        <AvatarFallback className="bg-transparent text-xl">{fallbackLabel}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100',
          isUploading && 'opacity-100'
        )}
      >
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
      </div>
    </div>
  );
}
