import { ImageOff, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MediaTile } from './MediaTile';
import type { MediaAsset } from '../schemas/media.types';

interface MediaGridProps {
  assets: MediaAsset[];
  isLoading: boolean;
  isError: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (assetId: string) => void;
  onOpenDetail: (asset: MediaAsset) => void;
  onRequestAddToCollection: (asset: MediaAsset) => void;
  onUploadClick: () => void;
  hasActiveFilters: boolean;
}

const GRID_CLASSES =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

export function MediaGrid({
  assets,
  isLoading,
  isError,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
  onRequestAddToCollection,
  onUploadClick,
  hasActiveFilters,
}: MediaGridProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-textSecondary">Could not load media. Please try again.</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accentSubtle text-accent">
          {hasActiveFilters ? <ImageOff className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-textPrimary">
          {hasActiveFilters ? 'No media matches your filters' : 'No media yet'}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-textSecondary">
          {hasActiveFilters
            ? 'Try a different filter, search term, or collection.'
            : 'Upload images or generate AI content to start building your media library.'}
        </p>
        {!hasActiveFilters && (
          <Button className="mt-6" onClick={onUploadClick}>
            <UploadCloud className="h-4 w-4" />
            Upload media
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={GRID_CLASSES}>
      {assets.map((asset) => (
        <MediaTile
          key={asset._id}
          asset={asset}
          selectionMode={selectionMode}
          isSelected={selectedIds.has(asset._id)}
          onToggleSelect={onToggleSelect}
          onOpenDetail={onOpenDetail}
          onRequestAddToCollection={onRequestAddToCollection}
        />
      ))}
    </div>
  );
}
