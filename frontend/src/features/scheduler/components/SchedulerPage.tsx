import { useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaQuery } from '@/core/hooks/useMediaQuery';
import { useBrands } from '@/features/brands/hooks/useBrands';
import { useActiveBrandStore } from '@/features/brands/store/activeBrandStore';
import { useCalendar } from '../hooks/useCalendar';
import { CalendarView } from './CalendarView';
import { AgendaView } from './AgendaView';

const ALL_BRANDS_VALUE = 'all';
const DESKTOP_BREAKPOINT_QUERY = '(min-width: 1024px)'; // Tailwind `lg`

/**
 * Scheduler feature entry point. Desktop/tablet (>= lg) renders the
 * drag-and-drop month CalendarView; mobile (< lg) swaps to the chronological
 * AgendaView since a 7-column grid doesn't fit usably on small screens.
 * Breakpoint is detected via the shared useMediaQuery hook
 * (core/hooks/useMediaQuery.ts) matching Tailwind's `lg` (1024px) cutoff.
 */
export function SchedulerPage(): React.JSX.Element {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const isDesktop = useMediaQuery(DESKTOP_BREAKPOINT_QUERY);

  const { data: brands } = useBrands();
  const activeBrandId = useActiveBrandStore((state) => state.activeBrandId);
  const setActiveBrandId = useActiveBrandStore((state) => state.setActiveBrandId);

  const range = useMemo(() => {
    const from = startOfWeek(startOfMonth(visibleMonth));
    const to = endOfWeek(endOfMonth(visibleMonth));
    return { from: from.toISOString(), to: to.toISOString() };
  }, [visibleMonth]);

  const calendarQuery = useMemo(
    () => ({ ...range, brandId: activeBrandId ?? undefined }),
    [range, activeBrandId]
  );

  const { data: projects, isLoading } = useCalendar(calendarQuery);

  // "Ever scheduled" (for choosing between the true first-run empty state and
  // an ordinary "nothing this month" grid) is approximated by whether the
  // current fetch returned anything — the calendar query is already scoped
  // to a generous full-weeks month range, so an empty result for the active
  // month/brand is treated as the empty state moment.
  const hasAnyScheduledEver = Boolean(projects && projects.length > 0);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-8 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-textPrimary">Scheduler</h1>
          <p className="text-sm text-textSecondary">Plan and drag-and-drop reschedule your Instagram posts.</p>
        </div>

        <Select
          value={activeBrandId ?? ALL_BRANDS_VALUE}
          onValueChange={(value) => setActiveBrandId(value === ALL_BRANDS_VALUE ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BRANDS_VALUE}>All brands</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand._id} value={brand._id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isDesktop ? (
        <CalendarView
          visibleMonth={visibleMonth}
          onVisibleMonthChange={setVisibleMonth}
          projects={projects ?? []}
          isLoading={isLoading}
          hasAnyScheduledEver={hasAnyScheduledEver}
        />
      ) : (
        <AgendaView projects={projects ?? []} isLoading={isLoading} />
      )}
    </div>
  );
}
