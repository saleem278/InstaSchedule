import { CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Consistent empty-state template (matches the pattern used by the media
 * library: dashed border, icon in an accent-tinted circle, heading + helper
 * copy, single primary CTA) shown when no posts have ever been scheduled.
 */
export function SchedulerEmptyState(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accentSubtle text-accent">
        <CalendarClock className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-textPrimary">No scheduled posts yet</h3>
      <p className="mt-1 max-w-sm text-sm text-textSecondary">
        Create a project and schedule it to see it appear here on your content calendar.
      </p>
      <Button className="mt-6" onClick={() => navigate('/projects/new')}>
        Create a project
      </Button>
    </div>
  );
}
