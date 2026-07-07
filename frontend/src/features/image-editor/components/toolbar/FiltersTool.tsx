import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { FilterValues } from '../../hooks/useImageEditor';

interface FiltersToolProps {
  values: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
}

const SLIDERS: { key: keyof FilterValues; label: string }[] = [
  { key: 'brightness', label: 'Brightness' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'saturation', label: 'Saturation' },
  { key: 'warmth', label: 'Warmth' },
];

/**
 * Exactly 4 sliders per spec, each ranging -1..1 (0 = untouched).
 * Brightness/Contrast/Saturation map directly onto fabric's built-in
 * filters.Brightness/Contrast/Saturation classes. Warmth has no built-in
 * fabric filter, so it is approximated with a BlendColor ('tint') filter —
 * see the doc comment on `applyFilter` in useImageEditor.ts for details.
 */
export function FiltersTool({ values, onChange }: FiltersToolProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-5 p-4">
      {SLIDERS.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-textSecondary">{label}</Label>
            <span className="text-xs tabular-nums text-textTertiary">{values[key].toFixed(2)}</span>
          </div>
          <Slider
            min={-1}
            max={1}
            step={0.01}
            value={[values[key]]}
            onValueChange={([value]) => onChange({ [key]: value })}
          />
        </div>
      ))}
    </div>
  );
}
