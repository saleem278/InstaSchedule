import { useState } from 'react';
import { FabricImage, Textbox } from 'fabric';
import { ImagePlus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { Canvas, FabricObject } from 'fabric';

interface LogoWatermarkToolProps {
  canvas: Canvas | null;
  brandLogoUrl?: string;
  selectedObject: FabricObject | null;
  onCommit: () => void;
}

/**
 * "Insert brand logo" adds the active brand's logo (if provided) as a
 * fabric.Image anchored bottom-right, draggable/resizable via fabric's
 * built-in selection controls. A custom watermark text option is also
 * offered for brands without a logo (or as an alternative). Once the
 * inserted logo/watermark object is selected, an opacity slider appears.
 */
export function LogoWatermarkTool({
  canvas,
  brandLogoUrl,
  selectedObject,
  onCommit,
}: LogoWatermarkToolProps): React.JSX.Element {
  const [watermarkText, setWatermarkText] = useState('');
  const [isInserting, setIsInserting] = useState(false);

  async function insertBrandLogo() {
    if (!canvas || !brandLogoUrl) return;
    setIsInserting(true);
    try {
      const logo = await FabricImage.fromURL(brandLogoUrl, { crossOrigin: 'anonymous' });

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const targetWidth = canvasWidth * 0.18;
      const scale = targetWidth / (logo.width || 1);
      const margin = canvasWidth * 0.03;

      logo.set({
        scaleX: scale,
        scaleY: scale,
        left: canvasWidth - targetWidth - margin,
        top: canvasHeight - (logo.height || 1) * scale - margin,
        opacity: 0.9,
        name: 'brand-logo',
      });

      canvas.add(logo);
      canvas.setActiveObject(logo);
      canvas.requestRenderAll();
      onCommit();
    } finally {
      setIsInserting(false);
    }
  }

  function insertWatermarkText() {
    if (!canvas || !watermarkText.trim()) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    const textbox = new Textbox(watermarkText.trim(), {
      fontSize: Math.max(16, canvasWidth * 0.035),
      fill: '#ffffff',
      opacity: 0.7,
      fontFamily: 'Geist Variable, sans-serif',
      textAlign: 'right',
      name: 'watermark-text',
    });

    textbox.set({
      left: canvasWidth - textbox.width - canvasWidth * 0.03,
      top: canvasHeight - textbox.height - canvasHeight * 0.03,
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
    onCommit();
  }

  const isWatermarkOrLogoSelected =
    selectedObject &&
    (['brand-logo', 'watermark-text'] as const).includes(
      (selectedObject as unknown as { name?: string }).name as 'brand-logo' | 'watermark-text'
    );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-textTertiary">Brand logo</p>
        <Button
          type="button"
          size="sm"
          className="w-full gap-2"
          disabled={!brandLogoUrl || isInserting}
          onClick={insertBrandLogo}
        >
          <ImagePlus className="size-4" />
          {brandLogoUrl ? 'Insert brand logo' : 'No brand logo set'}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-textTertiary">Custom watermark</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="watermark-text" className="text-xs text-textSecondary">
            Watermark text
          </Label>
          <Input
            id="watermark-text"
            placeholder="@yourbrand"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 w-full gap-2"
          disabled={!watermarkText.trim()}
          onClick={insertWatermarkText}
        >
          <Type className="size-4" />
          Add watermark text
        </Button>
      </div>

      {isWatermarkOrLogoSelected && selectedObject && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-4">
          <Label className="text-xs text-textSecondary">Opacity</Label>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={[selectedObject.opacity ?? 1]}
            onValueChange={([value]) => {
              selectedObject.set({ opacity: value });
              canvas?.requestRenderAll();
            }}
            onValueCommit={onCommit}
          />
        </div>
      )}
    </div>
  );
}
