import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  setHours,
  setMinutes,
  setSeconds,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DayCell, projectsOnDay } from './DayCell';
import { PostThumbnail } from './PostThumbnail';
import { SchedulerEmptyState } from './SchedulerEmptyState';
import { useRescheduleProject } from '../hooks/useRescheduleProject';
import type { Project } from '@/features/projects/schemas/project.types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarViewProps {
  visibleMonth: Date;
  onVisibleMonthChange: (date: Date) => void;
  projects: Project[];
  isLoading: boolean;
  hasAnyScheduledEver: boolean;
}

/**
 * Hand-built CSS-grid month calendar (not react-day-picker).
 *
 * Rationale: react-day-picker (already used elsewhere as components/ui/calendar.tsx
 * for single-date selection) renders one interactive `day` button per cell and
 * isn't designed to host arbitrary rich content — stacking 1-2 post thumbnails,
 * an overflow affordance, and a dnd-kit droppable ref inside each cell would
 * mean fighting its internal DOM/class structure. A plain CSS grid of `DayCell`
 * gives full control over cell content and lets each cell register its own
 * `useDroppable` region directly, which is what the drag-and-drop reschedule
 * flow needs.
 */
export function CalendarView({
  visibleMonth,
  onVisibleMonthChange,
  projects,
  isLoading,
  hasAnyScheduledEver,
}: CalendarViewProps): React.JSX.Element {
  const [activeDrag, setActiveDrag] = useState<Project | null>(null);
  const reschedule = useRescheduleProject();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const days = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [visibleMonth]);

  const handleDragStart = (event: { active: { data: { current?: { project?: Project } } } }): void => {
    setActiveDrag(event.active.data.current?.project ?? null);
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const project = active.data.current?.project as Project | undefined;
    const targetDate = over.data.current?.date as Date | undefined;
    if (!project || !targetDate) return;

    const existing = project.schedule.scheduledAt ? new Date(project.schedule.scheduledAt) : new Date();
    const alreadyOnTargetDay =
      project.schedule.scheduledAt && format(existing, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
    if (alreadyOnTargetDay) return;

    const combined = setSeconds(
      setMinutes(setHours(targetDate, existing.getHours()), existing.getMinutes()),
      0
    );

    reschedule.mutate({ projectId: project._id, scheduledAt: combined.toISOString() });
  };

  const showEmptyState = !isLoading && !hasAnyScheduledEver;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-textPrimary">{format(visibleMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => onVisibleMonthChange(subMonths(visibleMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onVisibleMonthChange(new Date())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => onVisibleMonthChange(addMonths(visibleMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[600px] w-full rounded-lg" />
      ) : showEmptyState ? (
        <SchedulerEmptyState />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto rounded-lg border-l border-t border-border">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 border-border">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="border-b border-r border-border bg-backgroundSubtle px-2 py-1.5 text-center text-xs font-medium text-textSecondary"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => (
                  <DayCell
                    key={day.toISOString()}
                    date={day}
                    isCurrentMonth={isSameMonth(day, visibleMonth)}
                    projects={projectsOnDay(projects, day)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* DragOverlay renders a floating, non-interactive copy of the card
              under the pointer while dragging — the actual DraggablePost in
              the grid dims via its own isDragging state (see PostThumbnail). */}
          <DragOverlay>
            {activeDrag && (
              <div className="w-40 opacity-90">
                <PostThumbnail project={activeDrag} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
