import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RescheduleMiniPickerProps {
  initialDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  isSaving: boolean;
}

/**
 * Small inline date + time picker used inside the reschedule popover.
 * Keeps the previously-scheduled time-of-day when only the day is changed.
 */
export function RescheduleMiniPicker({
  initialDate,
  onConfirm,
  onCancel,
  isSaving,
}: RescheduleMiniPickerProps): React.JSX.Element {
  const [date, setDate] = useState<Date>(initialDate);
  const [time, setTime] = useState(format(initialDate, 'HH:mm'));
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = (): void => {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    // Rescheduling into the past would make the publish engine fire the post on
    // its next tick (≤60s) — never what dragging/rescheduling on a calendar
    // intends. Block it here (the backend also rejects it as a safety net).
    if (combined.getTime() <= Date.now()) {
      setError('Pick a time in the future.');
      return;
    }
    setError(null);
    onConfirm(combined);
  };

  return (
    <div className="flex flex-col gap-3">
      <Calendar
        mode="single"
        selected={date}
        onSelect={(value) => {
          if (value) {
            setDate(value);
            setError(null);
          }
        }}
        disabled={{ before: new Date() }}
        className="rounded-md border border-border p-0"
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reschedule-time" className="text-xs">
          Time
        </Label>
        <Input
          id="reschedule-time"
          type="time"
          value={time}
          onChange={(event) => {
            setTime(event.target.value);
            setError(null);
          }}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Confirm'}
        </Button>
      </div>
    </div>
  );
}
