import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import type { Project } from '@/features/projects/schemas/project.types';

const STATUS_STRIPE: Record<Project['status'], string> = {
  draft: 'border-l-textTertiary',
  scheduled: 'border-l-accent',
  published: 'border-l-success',
};

interface PostThumbnailProps extends React.HTMLAttributes<HTMLButtonElement> {
  project: Project;
  isDragging?: boolean;
  compact?: boolean;
}

/**
 * Mini post card: color-coded left-border stripe by status, thumbnail image,
 * time, and truncated topic. Used inside day cells, the day-detail popover,
 * and the agenda (mobile) list. Forwards ref so dnd-kit can attach its drag
 * listeners/attributes directly to the rendered button.
 */
export const PostThumbnail = forwardRef<HTMLButtonElement, PostThumbnailProps>(
  ({ project, isDragging, compact = true, className, ...props }, ref) => {
    const scheduledAt = project.schedule.scheduledAt;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex w-full items-center gap-1.5 overflow-hidden rounded-sm border border-border border-l-2 bg-surface px-1.5 py-1 text-left shadow-xs transition-opacity hover:bg-backgroundMuted',
          STATUS_STRIPE[project.status],
          isDragging && 'opacity-40',
          className
        )}
        {...props}
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-backgroundMuted">
          {project.imageAsset ? (
            <img src={project.imageAsset.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-3 w-3 text-textTertiary" />
          )}
        </div>
        <span className="min-w-0 flex-1 truncate text-[11px] text-textPrimary">{project.topic}</span>
        {scheduledAt && !compact && (
          <span className="shrink-0 text-[10px] text-textTertiary">{format(new Date(scheduledAt), 'h:mm a')}</span>
        )}
        {scheduledAt && compact && (
          <span className="shrink-0 text-[10px] text-textTertiary">{format(new Date(scheduledAt), 'h:mma')}</span>
        )}
      </button>
    );
  }
);
PostThumbnail.displayName = 'PostThumbnail';
