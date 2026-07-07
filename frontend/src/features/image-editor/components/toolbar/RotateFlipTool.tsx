import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Canvas } from 'fabric';

interface RotateFlipToolProps {
  canvas: Canvas | null;
  onCommit: () => void;
}

/**
 * Rotates/flips the whole canvas content as a group (every object plus the
 * canvas viewport itself), keeping the simplified "no free-angle slider"
 * spec — only discrete 90-degree steps and horizontal/vertical flips.
 */
export function RotateFlipTool({ canvas, onCommit }: RotateFlipToolProps): React.JSX.Element {
  function rotate(degrees: 90 | -90) {
    if (!canvas) return;

    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const centerX = width / 2;
    const centerY = height / 2;

    canvas.getObjects().forEach((obj) => {
      const point = { x: (obj.left ?? 0) - centerX, y: (obj.top ?? 0) - centerY };
      const radians = (degrees * Math.PI) / 180;
      const rotatedX = point.x * Math.cos(radians) - point.y * Math.sin(radians);
      const rotatedY = point.x * Math.sin(radians) + point.y * Math.cos(radians);

      obj.set({
        left: rotatedX + centerY, // width/height swap after rotation, see below
        top: rotatedY + centerX,
        angle: (obj.angle ?? 0) + degrees,
      });
      obj.setCoords();
    });

    // Canvas viewport swaps width/height on a 90-degree turn.
    canvas.setDimensions({ width: height, height: width });
    canvas.requestRenderAll();
    onCommit();
  }

  function flip(axis: 'horizontal' | 'vertical') {
    if (!canvas) return;

    const width = canvas.getWidth();
    const height = canvas.getHeight();

    canvas.getObjects().forEach((obj) => {
      if (axis === 'horizontal') {
        obj.set({ left: width - (obj.left ?? 0) - (obj.width ?? 0) * (obj.scaleX ?? 1), flipX: !obj.flipX });
      } else {
        obj.set({ top: height - (obj.top ?? 0) - (obj.height ?? 0) * (obj.scaleY ?? 1), flipY: !obj.flipY });
      }
      obj.setCoords();
    });

    canvas.requestRenderAll();
    onCommit();
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-textTertiary">Rotate</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1 gap-2" onClick={() => rotate(-90)}>
            <RotateCcw className="size-4" />
            90° Left
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1 gap-2" onClick={() => rotate(90)}>
            <RotateCw className="size-4" />
            90° Right
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-textTertiary">Flip</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => flip('horizontal')}
          >
            <FlipHorizontal className="size-4" />
            Horizontal
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1 gap-2" onClick={() => flip('vertical')}>
            <FlipVertical className="size-4" />
            Vertical
          </Button>
        </div>
      </div>
    </div>
  );
}
