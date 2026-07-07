import { useEffect, useRef, useState } from 'react';
import { Rect } from 'fabric';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/cn';
import type { Canvas, FabricImage } from 'fabric';
import type { CropPreset } from '../../hooks/useImageEditor';

interface CropToolProps {
  canvas: Canvas | null;
  baseImage: FabricImage | null;
  onCommit: () => void;
}

const PRESETS: { id: CropPreset; label: string; ratio: number | null }[] = [
  { id: 'square', label: 'Square (1:1)', ratio: 1 },
  { id: 'portrait', label: 'Portrait (4:5)', ratio: 4 / 5 },
  { id: 'story', label: 'Story (9:16)', ratio: 9 / 16 },
  { id: 'original', label: 'Original', ratio: null },
];

/**
 * Crop is implemented as a clipping-rect overlay: a draggable/resizable
 * fabric.Rect is placed over the canvas. Preset buttons snap the rect to a
 * fixed aspect ratio centered on the canvas; the rect's own corner handles
 * allow freeform adjustment. "Apply Crop" bakes the crop by setting the
 * base image's clipPath to the rect's final geometry (converted to
 * image-local coordinates) and then resizing the canvas viewport to the
 * crop bounds so the exported image is actually cropped, not just masked.
 */
export function CropTool({ canvas, baseImage, onCommit }: CropToolProps): React.JSX.Element {
  const overlayRef = useRef<Rect | null>(null);
  const [activePreset, setActivePreset] = useState<CropPreset>('original');

  useEffect(() => {
    if (!canvas || !baseImage) return;

    const width = canvas.getWidth();
    const height = canvas.getHeight();

    const rect = new Rect({
      left: width * 0.1,
      top: height * 0.1,
      width: width * 0.8,
      height: height * 0.8,
      fill: 'rgba(124, 58, 237, 0.08)',
      stroke: '#7c3aed',
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      cornerColor: '#7c3aed',
      cornerStyle: 'circle',
      transparentCorners: false,
      name: 'crop-overlay',
    });

    overlayRef.current = rect;
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();

    return () => {
      if (overlayRef.current) {
        canvas.remove(overlayRef.current);
        canvas.requestRenderAll();
        overlayRef.current = null;
      }
    };
  }, [canvas, baseImage]);

  function applyPreset(preset: CropPreset, ratio: number | null) {
    const rect = overlayRef.current;
    if (!rect || !canvas) return;

    setActivePreset(preset);

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    let width: number;
    let height: number;

    if (ratio === null) {
      width = canvasWidth * 0.9;
      height = canvasHeight * 0.9;
    } else if (ratio >= 1) {
      width = canvasWidth * 0.8;
      height = width / ratio;
    } else {
      height = canvasHeight * 0.8;
      width = height * ratio;
    }

    rect.set({
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      left: (canvasWidth - width) / 2,
      top: (canvasHeight - height) / 2,
    });
    rect.setCoords();
    canvas.requestRenderAll();
  }

  function applyCrop() {
    const rect = overlayRef.current;
    if (!rect || !canvas || !baseImage) return;

    const cropLeft = rect.left ?? 0;
    const cropTop = rect.top ?? 0;
    const cropWidth = (rect.width ?? 0) * (rect.scaleX ?? 1);
    const cropHeight = (rect.height ?? 0) * (rect.scaleY ?? 1);

    canvas.remove(rect);
    overlayRef.current = null;

    // Shift every object so the crop's top-left becomes the new origin, then
    // shrink the canvas viewport to the crop dimensions.
    canvas.getObjects().forEach((obj) => {
      obj.set({ left: (obj.left ?? 0) - cropLeft, top: (obj.top ?? 0) - cropTop });
      obj.setCoords();
    });

    canvas.setDimensions({ width: cropWidth, height: cropHeight });
    canvas.requestRenderAll();
    onCommit();
  }

  function cancelCrop() {
    const rect = overlayRef.current;
    if (rect && canvas) {
      canvas.remove(rect);
      overlayRef.current = null;
      canvas.requestRenderAll();
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-textTertiary">Crop preset</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={activePreset === preset.id ? 'default' : 'outline'}
              className={cn('justify-center')}
              onClick={() => applyPreset(preset.id, preset.ratio)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-textTertiary">
          Drag the handles on the overlay for a freeform crop, or pick a preset above.
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={cancelCrop}>
          Cancel
        </Button>
        <Button type="button" size="sm" className="flex-1" onClick={applyCrop}>
          Apply Crop
        </Button>
      </div>
    </div>
  );
}
