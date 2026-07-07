import { useCallback, useState } from 'react';
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
}

/**
 * Circular logo dropzone: drag/drop or click to upload an image, shows a
 * circular preview, uploads immediately via the shared media endpoint and
 * reports the resulting hosted URL back to the form.
 */
export function LogoDropzone({ value, fallbackLabel, onChange }: LogoDropzoneProps): React.JSX.Element {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setIsUploading(true);

      uploadBrandLogo(file)
        .then((url) => {
          onChange(url);
        })
        .catch(() => {
          toast.error('Logo upload failed. Please try again.');
          setPreviewUrl(value);
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
  });

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
