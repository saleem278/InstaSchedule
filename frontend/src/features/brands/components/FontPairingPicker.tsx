import { cn } from '@/core/utils/cn';
import { FONT_PAIRINGS } from '../schemas/brand.schema';

interface FontPairingPickerProps {
  value: string;
  onChange: (fontPairingId: string) => void;
}

export function FontPairingPicker({ value, onChange }: FontPairingPickerProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FONT_PAIRINGS.map((pairing) => {
        const isSelected = value === pairing.id;
        return (
          <button
            key={pairing.id}
            type="button"
            onClick={() => onChange(pairing.id)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-md border border-border bg-surface p-3 text-left transition-colors hover:border-borderStrong',
              isSelected && 'border-accent bg-accentSubtle ring-1 ring-accent'
            )}
          >
            <span
              className="text-base leading-tight text-textPrimary"
              style={{ fontFamily: pairing.headingFont }}
            >
              Aa
            </span>
            <span className="text-xs font-medium text-textSecondary">{pairing.name}</span>
          </button>
        );
      })}
    </div>
  );
}
