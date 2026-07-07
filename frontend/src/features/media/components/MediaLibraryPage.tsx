import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckSquare, FolderPlus, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/core/utils/cn';
import { useMediaAssets } from '../hooks/useMediaAssets';
import { useCollections } from '../hooks/useCollections';
import { useDeleteAsset } from '../hooks/useDeleteAsset';
import { useAddAssetToCollection } from '../hooks/useAssetCollections';
import { MediaGrid } from './MediaGrid';
import { MediaUploadDropzone } from './MediaUploadDropzone';
import { MediaDetailDrawer } from './MediaDetailDrawer';
import { AddToCollectionDialog } from './AddToCollectionDialog';
import { CreateCollectionDialog } from './CreateCollectionDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MediaAsset, MediaFilter } from '../schemas/media.types';

const PAGE_SIZE = 24;
const ALL_COLLECTIONS_VALUE = 'all';

const FILTER_CHIPS: { value: MediaFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ai-generated', label: 'AI-Generated' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'favorites', label: 'Favorites' },
];

export function MediaLibraryPage(): React.JSX.Element {
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [search, setSearch] = useState('');
  const [collectionId, setCollectionId] = useState<string>(ALL_COLLECTIONS_VALUE);
  const [page, setPage] = useState(1);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<MediaAsset | null>(null);
  const [collectionTargetAsset, setCollectionTargetAsset] = useState<MediaAsset | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirmDelete, setBulkConfirmDelete] = useState(false);
  const [bulkCollectionOpen, setBulkCollectionOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const queryParams = useMemo(
    () => ({
      favorite: filter === 'favorites' ? true : undefined,
      collectionId: collectionId === ALL_COLLECTIONS_VALUE ? undefined : collectionId,
      search: search.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [filter, collectionId, search, page]
  );

  const { data, isLoading, isError } = useMediaAssets(queryParams);
  const { data: collections } = useCollections();
  const deleteAsset = useDeleteAsset();
  const addToCollection = useAddAssetToCollection();

  // Source filter (upload/ai-generated) is client-applied since the backend
  // list endpoint doesn't expose a `source` query param — favorite/collection/
  // search/pagination are server-side; this narrows the current page only.
  const assets = useMemo(() => {
    const items = data?.items ?? [];
    if (filter === 'ai-generated') return items.filter((asset) => asset.source === 'ai-generated');
    if (filter === 'uploaded') return items.filter((asset) => asset.source === 'upload');
    return items;
  }, [data, filter]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = filter !== 'all' || Boolean(search.trim()) || collectionId !== ALL_COLLECTIONS_VALUE;

  const toggleSelect = (assetId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const exitSelectionMode = (): void => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Bulk actions loop: sequential individual API calls (POST /favorite, DELETE
  // /:assetId, POST /collections/:id/assets/:id) since there is no bulk
  // backend endpoint. Acceptable N+1 tradeoff for MVP scale — the media
  // library is expected to handle bulk ops over small selections (tens, not
  // thousands) of assets at a time; a true bulk endpoint can be added later
  // without changing this call site's shape.
  const handleBulkDelete = async (): Promise<void> => {
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    let failures = 0;
    for (const id of ids) {
      try {
        await deleteAsset.mutateAsync(id);
      } catch {
        failures += 1;
      }
    }
    setBulkBusy(false);
    setBulkConfirmDelete(false);
    exitSelectionMode();
    if (failures > 0) {
      toast.error(`${failures} of ${ids.length} assets could not be deleted.`);
    } else {
      toast.success(`${ids.length} asset${ids.length === 1 ? '' : 's'} deleted`);
    }
  };

  const handleBulkAddToCollection = async (targetCollectionId: string): Promise<void> => {
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    let failures = 0;
    for (const id of ids) {
      try {
        await addToCollection.mutateAsync({ collectionId: targetCollectionId, assetId: id });
      } catch {
        failures += 1;
      }
    }
    setBulkBusy(false);
    setBulkCollectionOpen(false);
    exitSelectionMode();
    if (failures > 0) {
      toast.error(`${failures} of ${ids.length} assets could not be added.`);
    } else {
      toast.success(`${ids.length} asset${ids.length === 1 ? '' : 's'} added to collection`);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-textPrimary">Media Library</h1>
            <p className="text-sm text-textSecondary">Browse, organize, and reuse your uploaded and AI-generated media.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <Button variant="outline" onClick={exitSelectionMode}>
                <X className="h-4 w-4" />
                Cancel selection
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setSelectionMode(true)}>
                <CheckSquare className="h-4 w-4" />
                Select
              </Button>
            )}
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>

        {/* Top bar: search, filter chips, collection select */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => {
                  setFilter(chip.value);
                  setPage(1);
                }}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === chip.value
                    ? 'border-accent bg-accentSubtle text-accent'
                    : 'border-border bg-transparent text-textSecondary hover:bg-backgroundMuted'
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textTertiary" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by tag…"
                className="pl-9"
              />
            </div>

            <Select
              value={collectionId}
              onValueChange={(value) => {
                setCollectionId(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All collections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_COLLECTIONS_VALUE}>All collections</SelectItem>
                {collections?.map((collection) => (
                  <SelectItem key={collection._id} value={collection._id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={() => setCreateCollectionOpen(true)} aria-label="New collection">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bulk selection bar */}
        {selectionMode && selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-md border border-accent bg-accentSubtle px-4 py-2">
            <span className="text-sm font-medium text-accent">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setBulkCollectionOpen(true)} disabled={bulkBusy}>
                <FolderPlus className="h-4 w-4" />
                Add to collection
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-danger hover:bg-dangerSubtle hover:text-danger"
                onClick={() => setBulkConfirmDelete(true)}
                disabled={bulkBusy}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      <MediaGrid
        assets={assets}
        isLoading={isLoading}
        isError={isError}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onOpenDetail={setDetailAsset}
        onRequestAddToCollection={setCollectionTargetAsset}
        onUploadClick={() => setUploadOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {!isLoading && !isError && total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-textSecondary">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <MediaUploadDropzone open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateCollectionDialog open={createCollectionOpen} onOpenChange={setCreateCollectionOpen} />
      <MediaDetailDrawer asset={detailAsset} onOpenChange={(open) => !open && setDetailAsset(null)} />
      <AddToCollectionDialog
        asset={collectionTargetAsset}
        onOpenChange={(open) => !open && setCollectionTargetAsset(null)}
      />

      {/* Bulk delete confirm */}
      <Dialog open={bulkConfirmDelete} onOpenChange={setBulkConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} assets</DialogTitle>
            <DialogDescription>
              This will permanently delete {selectedIds.size} selected asset{selectedIds.size === 1 ? '' : 's'} and
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirmDelete(false)} disabled={bulkBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkBusy}>
              {bulkBusy ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk add-to-collection */}
      <Dialog open={bulkCollectionOpen} onOpenChange={setBulkCollectionOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add {selectedIds.size} assets to collection</DialogTitle>
          </DialogHeader>
          {!collections || collections.length === 0 ? (
            <p className="text-sm text-textSecondary">No collections yet. Create one from the top bar first.</p>
          ) : (
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {collections.map((collection) => (
                <button
                  key={collection._id}
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => handleBulkAddToCollection(collection._id)}
                  className="flex items-center justify-between rounded-md px-2 py-2 text-left text-sm text-textPrimary hover:bg-backgroundMuted disabled:opacity-50"
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCollectionOpen(false)} disabled={bulkBusy}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
