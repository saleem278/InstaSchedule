import { cn } from '@/core/utils/cn';
import { MAX_TONE_SELECTION, TONE_OPTIONS, type ToneOption } from '../schemas/brand.schema';

interface ToneChipSelectorProps {
  value: ToneOption[];
  onChange: (tones: ToneOption[]) => void;
}

export function ToneChipSelector({ value, onChange }: ToneChipSelectorProps): React.JSX.Element {
  const toggle = (tone: ToneOption): void => {
    if (value.includes(tone)) {
      onChange(value.filter((item) => item !== tone));
      return;
    }
    if (value.length >= MAX_TONE_SELECTION) return;
    onChange([...value, tone]);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TONE_OPTIONS.map((tone) => {
          const isSelected = value.includes(tone);
          const isDisabled = !isSelected && value.length >= MAX_TONE_SELECTION;
          return (
            <button
              key={tone}
              type="button"
              disabled={isDisabled}
              onClick={() => toggle(tone)}
              className={cn(
                'rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors',
                isSelected
                  ? 'border-accent bg-accent text-accentForeground'
                  : 'bg-surface text-textSecondary hover:border-borderStrong',
                isDisabled && 'cursor-not-allowed opacity-40'
              )}
            >
              {tone}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-textTertiary">
        {value.length}/{MAX_TONE_SELECTION} selected
      </p>
    </div>
  );
}
