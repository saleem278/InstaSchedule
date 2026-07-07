import { useState } from 'react';
import { Star, Download, Trash2, FolderPlus, Sparkles, UploadIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/core/utils/cn';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { useDeleteAsset } from '../hooks/useDeleteAsset';
import type { MediaAsset } from '../schemas/media.types';

interface MediaTileProps {
  asset: MediaAsset;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (assetId: string) => void;
  onOpenDetail: (asset: MediaAsset) => void;
  onRequestAddToCollection: (asset: MediaAsset) => void;
}

/**
 * A single grid tile: aspect-ratio-preserved image, hover overlay with quick
 * actions (favorite, add-to-collection, download, delete), and a
 * hover-revealed checkbox for bulk selection.
 */
export function MediaTile({
  asset,
  selectionMode,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onRequestAddToCollection,
}: MediaTileProps): React.JSX.Element {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toggleFavorite = useToggleFavorite();
  const deleteAsset = useDeleteAsset();

  return (
    <>
      <div
        className={cn(
          'group relative aspect-square overflow-hidden rounded-lg border border-border bg-backgroundMuted shadow-xs transition-shadow hover:shadow-md',
          isSelected && 'ring-2 ring-accent'
        )}
      >
        <button
          type="button"
          className="absolute inset-0 h-full w-full"
          onClick={() => (selectionMode ? onToggleSelect(asset._id) : onOpenDetail(asset))}
          aria-label={`Open ${asset.tags[0] ?? 'media asset'}`}
        >
          <img
            src={asset.url}
            alt={asset.tags.join(', ') || 'Media asset'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </button>

        {/* Source badge */}
        <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {asset.source === 'ai-generated' ? (
            <>
              <Sparkles className="h-2.5 w-2.5" /> AI
            </>
          ) : (
            <>
              <UploadIcon className="h-2.5 w-2.5" /> Upload
            </>
          )}
        </div>

        {/* Selection checkbox (always visible in selection mode, hover otherwise) */}
        <div
          className={cn(
            'absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100',
            selectionMode && 'opacity-100'
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(asset._id)}
            className="border-white/80 bg-black/30 data-[state=checked]:bg-accent"
            aria-label="Select asset"
          />
        </div>

        {/* Hover overlay with quick actions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="pointer-events-auto rounded-md p-1.5 text-white hover:bg-white/20"
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite.mutate(asset._id);
            }}
            aria-label={asset.isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className={cn('h-4 w-4', asset.isFavorite && 'fill-warning text-warning')} />
          </button>

          <div className="pointer-events-auto flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-1.5 text-white hover:bg-white/20"
              onClick={(event) => {
                event.stopPropagation();
                onRequestAddToCollection(asset);
              }}
              aria-label="Add to collection"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <a
              href={asset.url}
              download
              className="rounded-md p-1.5 text-white hover:bg-white/20"
              onClick={(event) => event.stopPropagation()}
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              type="button"
              className="rounded-md p-1.5 text-white hover:bg-danger/70"
              onClick={(event) => {
                event.stopPropagation();
                setConfirmDelete(true);
              }}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete asset</DialogTitle>
            <DialogDescription>This will permanently delete this media asset and cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleteAsset.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAsset.mutate(asset._id, { onSuccess: () => setConfirmDelete(false) })}
              disabled={deleteAsset.isPending}
            >
              {deleteAsset.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
