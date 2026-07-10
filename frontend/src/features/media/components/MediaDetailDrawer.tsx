import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Download, Star, Trash2, X as XIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { useUpdateAsset } from '../hooks/useUpdateAsset';
import { useDeleteAsset } from '../hooks/useDeleteAsset';
import { useCollections } from '../hooks/useCollections';
import { useMediaAsset } from '../hooks/useMediaAsset';
import { useAddAssetToCollection, useRemoveAssetFromCollection } from '../hooks/useAssetCollections';
import type { MediaAsset } from '../schemas/media.types';

interface MediaDetailDrawerProps {
  /** The asset selected from the grid — used as identity + initial render data. */
  asset: MediaAsset | null;
  onOpenChange: (open: boolean) => void;
}

export function MediaDetailDrawer({ asset: selectedAsset, onOpenChange }: MediaDetailDrawerProps): React.JSX.Element {
  const [tagInput, setTagInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleFavorite = useToggleFavorite();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const addToCollection = useAddAssetToCollection();
  const removeFromCollection = useRemoveAssetFromCollection();

  // Render from the LIVE detail-cache entry (seeded by the selected asset), not
  // the captured prop, so favorite/tag/collection mutations — which all
  // setQueryData(mediaKeys.detail(id)) — reflect instantly instead of only
  // after reopening the drawer.
  const { data: asset } = useMediaAsset(selectedAsset?._id, selectedAsset ?? undefined);

  useEffect(() => {
    setTagInput('');
  }, [selectedAsset?._id]);

  // Openness tracks the SELECTION (prop), not the cached asset — the detail
  // cache entry lingers after close, so gating on `asset` would keep it open.
  if (!selectedAsset || !asset) {
    return (
      <Sheet open={false} onOpenChange={onOpenChange}>
        <SheetContent />
      </Sheet>
    );
  }

  const isMember = (collectionId: string): boolean => asset.collections.includes(collectionId);

  const handleToggleCollection = (collectionId: string): void => {
    if (isMember(collectionId)) {
      removeFromCollection.mutate({ collectionId, assetId: asset._id });
    } else {
      addToCollection.mutate({ collectionId, assetId: asset._id });
    }
  };

  const handleAddTag = (): void => {
    const value = tagInput.trim();
    if (!value || asset.tags.includes(value)) {
      setTagInput('');
      return;
    }
    updateAsset.mutate({ assetId: asset._id, payload: { tags: [...asset.tags, value] } });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string): void => {
    updateAsset.mutate({ assetId: asset._id, payload: { tags: asset.tags.filter((t) => t !== tag) } });
  };

  return (
    <>
      <Sheet open={Boolean(asset)} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Media details</SheetTitle>
            <SheetDescription className="sr-only">
              Preview, metadata, tags, and collections for the selected media asset.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-col gap-6">
            <div className="overflow-hidden rounded-lg border border-border bg-backgroundMuted">
              <img src={asset.url} alt={asset.tags.join(', ') || 'Media asset'} className="w-full object-contain" />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFavorite.mutate(asset._id)}
                disabled={toggleFavorite.isPending}
              >
                <Star className={asset.isFavorite ? 'fill-warning text-warning' : ''} />
                {asset.isFavorite ? 'Favorited' : 'Favorite'}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={asset.url} download>
                  <Download />
                  Download
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-danger hover:bg-dangerSubtle hover:text-danger"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 />
                Delete
              </Button>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-textTertiary">Metadata</h4>
              <dl className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-textSecondary">Dimensions</dt>
                <dd className="text-textPrimary">
                  {asset.width && asset.height ? `${asset.width} × ${asset.height}px` : 'Unknown'}
                </dd>
                <dt className="text-textSecondary">Source</dt>
                <dd className="text-textPrimary">
                  <Badge variant={asset.source === 'ai-generated' ? 'accent' : 'neutral'}>
                    {asset.source === 'ai-generated' ? 'AI-generated' : 'Uploaded'}
                  </Badge>
                </dd>
                <dt className="text-textSecondary">Format</dt>
                <dd className="text-textPrimary">{asset.format?.toUpperCase() ?? 'Unknown'}</dd>
                <dt className="text-textSecondary">Created</dt>
                <dd className="text-textPrimary">{format(new Date(asset.createdAt), 'MMM d, yyyy')}</dd>
              </dl>
            </div>

            <div>
              <Label htmlFor="media-tag-input">Tags</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {asset.tags.map((tag) => (
                  <Badge key={tag} variant="neutral" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="rounded-full p-0.5 hover:bg-borderStrong/40"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  id="media-tag-input"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <Button variant="secondary" onClick={handleAddTag} disabled={!tagInput.trim()}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-textTertiary">Collections</h4>
              {collectionsLoading ? (
                <div className="mt-2 flex flex-col gap-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  ))}
                </div>
              ) : !collections || collections.length === 0 ? (
                <p className="mt-2 text-sm text-textSecondary">No collections yet.</p>
              ) : (
                <div className="mt-2 flex flex-col gap-1">
                  {collections.map((collection) => (
                    <label
                      key={collection._id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-backgroundMuted"
                    >
                      <Checkbox
                        checked={isMember(collection._id)}
                        onCheckedChange={() => handleToggleCollection(collection._id)}
                      />
                      <span className="text-sm text-textPrimary">{collection.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
              disabled={deleteAsset.isPending}
              onClick={() =>
                deleteAsset.mutate(asset._id, {
                  onSuccess: () => {
                    setConfirmDelete(false);
                    onOpenChange(false);
                  },
                })
              }
            >
              {deleteAsset.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
