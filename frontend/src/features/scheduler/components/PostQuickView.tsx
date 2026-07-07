import { format } from 'date-fns';
import { Pencil, CalendarClock, Trash2, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/cn';
import { ProjectStatusBadge } from '@/features/projects/components/ProjectStatusBadge';
import type { Project } from '@/features/projects/schemas/project.types';

interface PostQuickViewProps {
  project: Project;
  onRequestReschedule: () => void;
  onRequestDelete: () => void;
}

/**
 * Popover content shown when a post thumbnail is clicked: mini preview plus
 * Edit / Reschedule / Delete quick actions. Never navigates on its own —
 * "Edit" is the only action that routes away (to the project editor).
 */
export function PostQuickView({ project, onRequestReschedule, onRequestDelete }: PostQuickViewProps): React.JSX.Element {
  const navigate = useNavigate();
  const scheduledAt = project.schedule.scheduledAt;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-backgroundMuted">
          {project.imageAsset ? (
            <img src={project.imageAsset.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-textTertiary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-textPrimary">{project.topic}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-textSecondary">
            {project.content.caption || 'No caption yet'}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            {scheduledAt && (
              <span className="text-[11px] text-textTertiary">{format(new Date(scheduledAt), 'MMM d, h:mm a')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border pt-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/projects/${project._id}`)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onRequestReschedule}>
          <CalendarClock className="h-3.5 w-3.5" />
          Reschedule
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn('text-danger hover:bg-dangerSubtle hover:text-danger')}
          onClick={onRequestDelete}
          aria-label="Delete post"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
