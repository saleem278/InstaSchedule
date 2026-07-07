import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileImage, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/core/utils/cn';
import { useUploadMedia } from '../hooks/useUploadMedia';

interface MediaUploadDropzoneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId?: string;
}

interface QueuedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

/**
 * Upload modal: react-dropzone drag-and-drop area inside a shadcn Dialog.
 * Files upload sequentially (one POST /media/upload per file, field name
 * `file`), each showing its own progress bar via axios `onUploadProgress`.
 */
export function MediaUploadDropzone({ open, onOpenChange, brandId }: MediaUploadDropzoneProps): React.JSX.Element {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const uploadMedia = useUploadMedia();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setQueue((prev) => [...prev, ...acceptedFiles.map((file) => ({ file, progress: 0, status: 'pending' as const }))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const isUploading = queue.some((item) => item.status === 'uploading');
  const hasPending = queue.some((item) => item.status === 'pending');

  const updateItem = (index: number, patch: Partial<QueuedFile>): void => {
    setQueue((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number): void => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const startUpload = async (): Promise<void> => {
    for (let i = 0; i < queue.length; i += 1) {
      if (queue[i]!.status !== 'pending') continue;
      updateItem(i, { status: 'uploading', progress: 0 });
      try {
        await uploadMedia.mutateAsync({
          file: queue[i]!.file,
          brandId,
          onProgress: (percent) => updateItem(i, { progress: percent }),
        });
        updateItem(i, { status: 'done', progress: 100 });
      } catch {
        updateItem(i, { status: 'error' });
      }
    }
  };

  const handleClose = (nextOpen: boolean): void => {
    if (!nextOpen && !isUploading) {
      setQueue([]);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload media</DialogTitle>
          <DialogDescription>Drag and drop images, or click to browse. PNG, JPG, WEBP up to 10MB.</DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-backgroundMuted py-10 text-center transition-colors',
            isDragActive && 'border-accent bg-accentSubtle'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="h-8 w-8 text-textTertiary" />
          <p className="text-sm font-medium text-textPrimary">
            {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-textTertiary">or click to browse</p>
        </div>

        {queue.length > 0 && (
          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {queue.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="flex items-center gap-3 rounded-md border border-border p-2"
              >
                <FileImage className="h-4 w-4 shrink-0 text-textTertiary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-textPrimary">{item.file.name}</p>
                  {item.status === 'uploading' || item.status === 'done' ? (
                    <Progress value={item.progress} className="mt-1 h-1.5" />
                  ) : item.status === 'error' ? (
                    <p className="text-xs text-danger">Upload failed</p>
                  ) : (
                    <p className="text-xs text-textTertiary">Ready to upload</p>
                  )}
                </div>
                {item.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => removeItem(index)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isUploading}>
            {queue.some((item) => item.status === 'done') ? 'Done' : 'Cancel'}
          </Button>
          <Button onClick={startUpload} disabled={!hasPending || isUploading}>
            {isUploading ? 'Uploading…' : `Upload ${queue.filter((i) => i.status === 'pending').length || ''}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
