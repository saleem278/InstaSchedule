import { useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptHistoryRow } from './PromptHistoryRow';
import type { PromptHistoryEntry } from './usePromptHistory';

interface PromptHistoryListProps {
  entries: PromptHistoryEntry[];
  isLoading: boolean;
}

/**
 * Search bar + from/to date range filter, then a reverse-chronological
 * card-styled list of history rows. `entries` is expected to already be
 * sorted newest-first by the caller (usePromptHistory does this).
 */
export function PromptHistoryList({ entries, isLoading }: PromptHistoryListProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate).getTime() : null;
    // Add a day so the "to" bound is inclusive of the whole selected day.
    const to = toDate ? new Date(toDate).getTime() + 24 * 60 * 60 * 1000 : null;

    return entries.filter((entry) => {
      if (query && !entry.inputTopic.toLowerCase().includes(query)) return false;
      const createdAt = new Date(entry.createdAt).getTime();
      if (from !== null && createdAt < from) return false;
      if (to !== null && createdAt >= to) return false;
      return true;
    });
  }, [entries, search, fromDate, toDate]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textTertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic..."
            className="pl-9"
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="history-from-date" className="text-xs text-textSecondary">
              From
            </Label>
            <Input
              id="history-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-36 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="history-to-date" className="text-xs text-textSecondary">
              To
            </Label>
            <Input
              id="history-to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-36 text-xs"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFilters={Boolean(search || fromDate || toDate)} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <PromptHistoryRow key={entry._id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accentSubtle text-accent">
        <History className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-textPrimary">
        {hasFilters ? 'No history matches your filters' : 'No generation history yet'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-textSecondary">
        {hasFilters
          ? 'Try widening your search or date range.'
          : 'Generate content from a project and it will show up here.'}
      </p>
    </div>
  );
}
