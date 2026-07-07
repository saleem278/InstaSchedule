import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Canvas } from 'fabric';

interface ResizeToolProps {
  canvas: Canvas | null;
  onCommit: () => void;
}

/**
 * Resizes the whole canvas (and scales every object proportionally) rather
 * than resizing an individual selected object — this is a whole-image resize
 * tool per spec, not an object transform tool.
 */
export function ResizeTool({ canvas, onCommit }: ResizeToolProps): React.JSX.Element {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    if (!canvas) return;
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    setWidth(Math.round(w));
    setHeight(Math.round(h));
    setAspect(w / h);
  }, [canvas]);

  function handleWidthChange(value: string) {
    const next = Number(value) || 0;
    setWidth(next);
    if (lockAspect) setHeight(Math.round(next / aspect));
  }

  function handleHeightChange(value: string) {
    const next = Number(value) || 0;
    setHeight(next);
    if (lockAspect) setWidth(Math.round(next * aspect));
  }

  function applyResize() {
    if (!canvas || width <= 0 || height <= 0) return;

    const currentWidth = canvas.getWidth();
    const currentHeight = canvas.getHeight();
    const scaleX = width / currentWidth;
    const scaleY = height / currentHeight;

    canvas.getObjects().forEach((obj) => {
      obj.set({
        left: (obj.left ?? 0) * scaleX,
        top: (obj.top ?? 0) * scaleY,
        scaleX: (obj.scaleX ?? 1) * scaleX,
        scaleY: (obj.scaleY ?? 1) * scaleY,
      });
      obj.setCoords();
    });

    canvas.setDimensions({ width, height });
    canvas.requestRenderAll();
    setAspect(width / height);
    onCommit();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resize-width" className="text-xs text-textSecondary">
            Width (px)
          </Label>
          <Input
            id="resize-width"
            type="number"
            min={1}
            value={width}
            onChange={(e) => handleWidthChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resize-height" className="text-xs text-textSecondary">
            Height (px)
          </Label>
          <Input
            id="resize-height"
            type="number"
            min={1}
            value={height}
            onChange={(e) => handleHeightChange(e.target.value)}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit gap-2 text-textSecondary"
        onClick={() => setLockAspect((v) => !v)}
      >
        {lockAspect ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
        {lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
      </Button>

      <Button type="button" size="sm" onClick={applyResize}>
        Apply Resize
      </Button>
    </div>
  );
}
