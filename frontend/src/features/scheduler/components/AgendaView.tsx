import { useMemo } from 'react';
import { format, isSameDay, isToday, isTomorrow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { SchedulerEmptyState } from './SchedulerEmptyState';
import { DraggablePost } from './DraggablePost';
import type { Project } from '@/features/projects/schemas/project.types';

interface AgendaViewProps {
  projects: Project[];
  isLoading: boolean;
}

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMM d');
}

/**
 * Mobile (< lg breakpoint) agenda/list view: a chronological list of
 * scheduled posts grouped by day. Swaps in for CalendarView because a 7-col
 * month grid is too cramped to be usable on small screens — see
 * SchedulerPage's useMediaQuery('(min-width: 1024px)') breakpoint check.
 * Posts are click-only here (draggable={false}): this list has no DndContext
 * or drop targets, so drag would lift a card that can never drop. Reschedule
 * is done via the quick-view popover.
 */
export function AgendaView({ projects, isLoading }: AgendaViewProps): React.JSX.Element {
  const groups = useMemo(() => {
    const scheduled = projects
      .filter((project) => project.schedule.scheduledAt)
      .sort(
        (a, b) =>
          new Date(a.schedule.scheduledAt as string).getTime() -
          new Date(b.schedule.scheduledAt as string).getTime()
      );

    const byDay: { date: Date; projects: Project[] }[] = [];
    scheduled.forEach((project) => {
      const date = new Date(project.schedule.scheduledAt as string);
      const existingGroup = byDay.find((group) => isSameDay(group.date, date));
      if (existingGroup) {
        existingGroup.projects.push(project);
      } else {
        byDay.push({ date, projects: [project] });
      }
    });
    return byDay;
  }, [projects]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return <SchedulerEmptyState />;
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.date.toISOString()} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-textTertiary">
            {dayLabel(group.date)}
          </h3>
          <div className="flex flex-col gap-2">
            {group.projects.map((project) => (
              <DraggablePost key={project._id} project={project} compact={false} draggable={false} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
