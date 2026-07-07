import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { isSameDay, isToday } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/core/utils/cn';
import { DraggablePost } from './DraggablePost';
import type { Project } from '@/features/projects/schemas/project.types';

const VISIBLE_LIMIT = 2;

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  projects: Project[];
}

/**
 * A single month-grid day cell. Droppable target for drag-and-drop
 * rescheduling (dropping a DraggablePost here reschedules it to `date`,
 * keeping its existing time-of-day — handled by the drag end handler in
 * CalendarView). Shows up to 2 post thumbnails with a "+N more" overflow
 * that opens a day-detail popover listing every post for the day.
 */
export function DayCell({ date, isCurrentMonth, projects }: DayCellProps): React.JSX.Element {
  const [detailOpen, setDetailOpen] = useState(false);
  const dayKey = date.toISOString().slice(0, 10);

  const { setNodeRef, isOver } = useDroppable({
    id: `day:${dayKey}`,
    data: { date },
  });

  const visible = projects.slice(0, VISIBLE_LIMIT);
  const overflowCount = projects.length - visible.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-28 flex-col gap-1 border-b border-r border-border p-1.5 transition-colors',
        !isCurrentMonth && 'bg-backgroundSubtle',
        isOver && 'bg-accentSubtle'
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
            isToday(date) ? 'bg-accent text-accentForeground' : 'text-textSecondary',
            !isCurrentMonth && 'text-textTertiary'
          )}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {visible.map((project) => (
          <DraggablePost key={project._id} project={project} />
        ))}
      </div>

      {overflowCount > 0 && (
        <Popover open={detailOpen} onOpenChange={setDetailOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="mt-auto text-left text-[11px] font-medium text-accent hover:underline"
            >
              +{overflowCount} more
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72">
            <DayDetailList date={date} projects={projects} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

interface DayDetailListProps {
  date: Date;
  projects: Project[];
}

function DayDetailList({ date, projects }: DayDetailListProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-textPrimary">
        {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
        {projects.map((project) => (
          <DraggablePost key={project._id} project={project} compact={false} />
        ))}
      </div>
    </div>
  );
}

// Re-exported so CalendarView can group fetched projects by local calendar
// day without duplicating the date-key logic used by the droppable id above.
export function dayKeyFor(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function projectsOnDay(projects: Project[], date: Date): Project[] {
  return projects.filter(
    (project) => project.schedule.scheduledAt && isSameDay(new Date(project.schedule.scheduledAt), date)
  );
}
