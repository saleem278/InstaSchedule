import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronDown, Copy, Eye, ImageOff, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/core/utils/cn';
import { useDeleteProject } from '@/features/projects/hooks/useDeleteProject';
import { useDuplicateGeneration } from './useDuplicateGeneration';
import type { PromptHistoryEntry } from './usePromptHistory';
import type { GenerationStatus } from '../../schemas/generation.types';

const STATUS_BADGE: Record<GenerationStatus, { label: string; variant: BadgeProps['variant'] }> = {
  completed: { label: 'Completed', variant: 'success' },
  processing: { label: 'Processing', variant: 'accent' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
};

interface PromptHistoryRowProps {
  entry: PromptHistoryEntry;
}

/**
 * A single history row rendered as a card (not a dense table row). Clicking
 * the row body toggles an inline accordion (animated height via
 * framer-motion, matching the spring/duration conventions used elsewhere in
 * this feature) revealing the full generation output snapshot.
 */
export function PromptHistoryRow({ entry }: PromptHistoryRowProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const duplicateMutation = useDuplicateGeneration();
  const deleteProjectMutation = useDeleteProject();

  const statusBadge = STATUS_BADGE[entry.status];
  const timestamp = new Date(entry.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    duplicateMutation.mutate(entry._id, {
      onSuccess: (result) => {
        toast.success('Prompt duplicated');
        // CreateWizard only reads the `topic` query param (see its
        // `prefillTopic` usage) — pass the prefill topic straight through
        // rather than re-fetching the duplicate record there.
        navigate(`/projects/new?topic=${encodeURIComponent(result.prefill.topic)}`);
      },
      onError: () => {
        toast.error('Failed to duplicate this prompt');
      },
    });
  }

  function handleEditAndRegenerate(e: React.MouseEvent) {
    e.stopPropagation();
    // Same pre-fill convention as Duplicate, but skips creating a duplicate
    // Generation record — this just opens the topic step pre-filled so the
    // user can tweak the topic before generating fresh content.
    navigate(`/projects/new?topic=${encodeURIComponent(entry.inputTopic)}`);
  }

  function handleView(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/projects/${entry.projectId}`);
  }

  function handleDeleteConfirmed() {
    deleteProjectMutation.mutate(entry.projectId, {
      onSuccess: () => setConfirmDeleteOpen(false),
    });
  }

  return (
    <Card className="overflow-hidden transition-colors hover:border-borderStrong">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-center gap-3 p-4 text-left sm:flex-nowrap sm:gap-4"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-backgroundMuted">
          {entry.output.imageUrl ? (
            <img src={entry.output.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-textTertiary">
              <ImageOff className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <p className="truncate text-sm font-medium text-textPrimary">{entry.inputTopic}</p>
          <p className="mt-0.5 text-xs text-textSecondary">{timestamp}</p>
        </div>

        <Badge variant={statusBadge.variant} className="shrink-0">
          {statusBadge.label}
        </Badge>

        {/* Desktop: full labeled buttons inline. Mobile: collapse into an overflow menu so the row never overflows. */}
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            disabled={duplicateMutation.isPending}
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
          <Button variant="ghost" size="sm" onClick={handleEditAndRegenerate} title="Edit & Regenerate">
            <Pencil className="h-3.5 w-3.5" />
            Edit &amp; Regenerate
          </Button>
          <Button variant="ghost" size="sm" onClick={handleView} title="View">
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteOpen(true);
            }}
            title="Delete"
            className="text-danger hover:bg-dangerSubtle hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>

        <div className="shrink-0 sm:hidden" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditAndRegenerate}>
                <Pencil className="h-3.5 w-3.5" />
                Edit &amp; Regenerate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleView}>
                <Eye className="h-3.5 w-3.5" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDeleteOpen(true)}
                className="text-danger focus:bg-dangerSubtle focus:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-textTertiary transition-transform duration-200', expanded && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-[96px_1fr]">
              <div className="h-24 w-24 overflow-hidden rounded-md bg-backgroundMuted">
                {entry.output.imageUrl ? (
                  <img src={entry.output.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-textTertiary">
                    <ImageOff className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-textTertiary">Caption</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-textPrimary">
                    {entry.output.caption || '—'}
                  </p>
                </div>
                {entry.output.cta && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-textTertiary">CTA</p>
                    <p className="mt-1 text-sm text-textPrimary">{entry.output.cta}</p>
                  </div>
                )}
                {entry.output.hashtags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-textTertiary">Hashtags</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {entry.output.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-accentSubtle px-2 py-0.5 text-xs font-medium text-accent"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {entry.errorMessage && (
                  <p className="text-xs text-danger">{entry.errorMessage}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              This will permanently delete "{entry.inputTopic}" and its generated content. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={deleteProjectMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed} disabled={deleteProjectMutation.isPending}>
              {deleteProjectMutation.isPending ? 'Deleting…' : 'Delete project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
