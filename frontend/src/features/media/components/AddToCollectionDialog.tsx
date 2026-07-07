import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollections } from '../hooks/useCollections';
import { useAddAssetToCollection, useRemoveAssetFromCollection } from '../hooks/useAssetCollections';
import type { MediaAsset } from '../schemas/media.types';

interface AddToCollectionDialogProps {
  asset: MediaAsset | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lightweight collection multi-select for a single asset, reused by both the
 * tile's quick action and the detail drawer. Each toggle is one API call
 * (no bulk single-asset/multi-collection endpoint exists).
 */
export function AddToCollectionDialog({ asset, onOpenChange }: AddToCollectionDialogProps): React.JSX.Element {
  const { data: collections, isLoading } = useCollections();
  const addToCollection = useAddAssetToCollection();
  const removeFromCollection = useRemoveAssetFromCollection();

  const isMember = (collectionId: string): boolean => Boolean(asset?.collections.includes(collectionId));

  const handleToggle = (collectionId: string): void => {
    if (!asset) return;
    if (isMember(collectionId)) {
      removeFromCollection.mutate({ collectionId, assetId: asset._id });
    } else {
      addToCollection.mutate({ collectionId, assetId: asset._id });
    }
  };

  return (
    <Dialog open={Boolean(asset)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to collection</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : !collections || collections.length === 0 ? (
          <p className="text-sm text-textSecondary">No collections yet. Create one from the top bar first.</p>
        ) : (
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {collections.map((collection) => (
              <label
                key={collection._id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-backgroundMuted"
              >
                <Checkbox checked={isMember(collection._id)} onCheckedChange={() => handleToggle(collection._id)} />
                <span className="text-sm text-textPrimary">{collection.name}</span>
              </label>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
