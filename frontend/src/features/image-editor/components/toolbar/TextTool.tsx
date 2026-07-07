import { useEffect } from 'react';
import { Textbox } from 'fabric';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/core/utils/cn';
import type { Canvas, TPointerEventInfo, TPointerEvent } from 'fabric';

interface TextToolProps {
  canvas: Canvas | null;
  selectedTextbox: Textbox | null;
  onCommit: () => void;
}

/**
 * Curated font list — this intentionally does NOT pull the active brand's
 * font pairing dynamically (noted simplification per spec). A reasonable
 * fixed set of widely available web-safe / bundled fonts is used instead.
 */
const FONT_OPTIONS = [
  { label: 'Geist (default)', value: 'Geist Variable, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const COLOR_SWATCHES = [
  '#111111',
  '#ffffff',
  '#7c3aed',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#ec4899',
];

/**
 * Clicking the canvas (in text-tool mode) places a new fabric.Textbox at the
 * click point. Once a Textbox is selected, this panel's controls (font,
 * size, color, alignment) edit that instance directly.
 */
export function TextTool({ canvas, selectedTextbox, onCommit }: TextToolProps): React.JSX.Element {
  useEffect(() => {
    if (!canvas) return;
    const activeCanvas = canvas;

    function handleCanvasClick(event: TPointerEventInfo<TPointerEvent>) {
      if (event.target) return; // clicked an existing object — let selection handle it, don't stack new textboxes

      const point = event.scenePoint;

      const textbox = new Textbox('Your text', {
        left: point.x,
        top: point.y,
        width: 220,
        fontSize: 32,
        fontFamily: FONT_OPTIONS[0].value,
        fill: '#111111',
        textAlign: 'left',
      });

      activeCanvas.add(textbox);
      activeCanvas.setActiveObject(textbox);
      activeCanvas.requestRenderAll();
      onCommit();
    }

    activeCanvas.on('mouse:up', handleCanvasClick);
    return () => {
      activeCanvas.off('mouse:up', handleCanvasClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  function updateSelected(patch: Record<string, unknown>) {
    if (!selectedTextbox || !canvas) return;
    const activeCanvas = canvas;
    selectedTextbox.set(patch);
    activeCanvas.requestRenderAll();
  }

  if (!selectedTextbox) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-textSecondary">Click anywhere on the canvas to add a text box.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-textSecondary">Font</Label>
        <Select
          value={String(selectedTextbox.fontFamily ?? FONT_OPTIONS[0].value)}
          onValueChange={(value) => {
            updateSelected({ fontFamily: value });
            onCommit();
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-textSecondary">Size</Label>
        <Slider
          min={8}
          max={160}
          step={1}
          value={[Number(selectedTextbox.fontSize ?? 32)]}
          onValueChange={([value]) => updateSelected({ fontSize: value })}
          onValueCommit={onCommit}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-textSecondary">Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Set text color ${color}`}
              className={cn(
                'size-7 rounded-full border-2 border-border transition-transform hover:scale-110',
                String(selectedTextbox.fill) === color && 'ring-2 ring-accent ring-offset-2 ring-offset-surfaceRaised'
              )}
              style={{ backgroundColor: color }}
              onClick={() => {
                updateSelected({ fill: color });
                onCommit();
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-textSecondary">Alignment</Label>
        <div className="flex gap-2">
          {(
            [
              { value: 'left', icon: AlignLeft },
              { value: 'center', icon: AlignCenter },
              { value: 'right', icon: AlignRight },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              size="icon"
              variant={selectedTextbox.textAlign === value ? 'default' : 'outline'}
              onClick={() => {
                updateSelected({ textAlign: value });
                onCommit();
              }}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
