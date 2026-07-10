import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PostThumbnail } from './PostThumbnail';
import { PostQuickView } from './PostQuickView';
import { RescheduleMiniPicker } from './RescheduleMiniPicker';
import { useRescheduleProject } from '../hooks/useRescheduleProject';
import { useDeleteScheduledProject } from '../hooks/useDeleteScheduledProject';
import type { Project } from '@/features/projects/schemas/project.types';

interface DraggablePostProps {
  project: Project;
  compact?: boolean;
  /**
   * Whether the thumbnail is actually drag-enabled. Defaults to true (the
   * desktop CalendarView wraps posts in a DndContext with DayCell drop
   * targets). AgendaView passes false: it has NO DndContext or drop targets,
   * so wiring drag listeners there produces a card that lifts under the finger
   * but can never drop — a broken-feeling dead interaction. Disabled → the
   * card is click-only (quick-view → reschedule popover).
   */
  draggable?: boolean;
}

/**
 * A single post thumbnail. Click opens a quick-view popover (Edit / Reschedule
 * / Delete). When `draggable`, drag (via @dnd-kit useDraggable) lets the user
 * drop it on a different DayCell to reschedule.
 */
export function DraggablePost({ project, compact, draggable = true }: DraggablePostProps): React.JSX.Element {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const reschedule = useRescheduleProject();
  const deleteProject = useDeleteScheduledProject();

  // Hook must run unconditionally, but we only apply its wiring when draggable.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project._id,
    data: { project },
  });

  const dragProps = draggable
    ? { isDragging, ...attributes, ...listeners }
    : {};
  const style =
    draggable && transform
      ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
      : undefined;

  const currentDate = project.schedule.scheduledAt ? new Date(project.schedule.scheduledAt) : new Date();

  return (
    <>
      <Popover open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <PopoverTrigger asChild>
          <PostThumbnail
            ref={draggable ? setNodeRef : undefined}
            style={style}
            project={project}
            compact={compact}
            onClick={() => setQuickViewOpen(true)}
            {...dragProps}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <PostQuickView
            project={project}
            onRequestReschedule={() => {
              setQuickViewOpen(false);
              setRescheduleOpen(true);
            }}
            onRequestDelete={() => {
              setQuickViewOpen(false);
              setConfirmDeleteOpen(true);
            }}
          />
        </PopoverContent>
      </Popover>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Reschedule post</DialogTitle>
            <DialogDescription>Pick a new date and time for "{project.topic}".</DialogDescription>
          </DialogHeader>
          <RescheduleMiniPicker
            initialDate={currentDate}
            isSaving={reschedule.isPending}
            onCancel={() => setRescheduleOpen(false)}
            onConfirm={(date) =>
              reschedule.mutate(
                { projectId: project._id, scheduledAt: date.toISOString() },
                { onSuccess: () => setRescheduleOpen(false) }
              )
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post</DialogTitle>
            <DialogDescription>
              This will permanently delete "{project.topic}" and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={deleteProject.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteProject.mutate(project._id, { onSuccess: () => setConfirmDeleteOpen(false) })
              }
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
