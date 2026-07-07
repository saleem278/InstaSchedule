import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Crop,
  Maximize2,
  RotateCw,
  Type,
  Image as ImageIcon,
  SlidersHorizontal,
  Undo2,
  Redo2,
  RotateCcw as ResetIcon,
  X,
  Loader2,
} from 'lucide-react';
import type { Textbox, FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/core/utils/cn';
import { uploadMedia } from '@/features/media/api/media.api';
import { useMediaQuery } from '@/core/hooks/useMediaQuery';
import { useImageEditor, type EditorTool } from '../hooks/useImageEditor';
import { CropTool } from './toolbar/CropTool';
import { ResizeTool } from './toolbar/ResizeTool';
import { RotateFlipTool } from './toolbar/RotateFlipTool';
import { TextTool } from './toolbar/TextTool';
import { LogoWatermarkTool } from './toolbar/LogoWatermarkTool';
import { FiltersTool } from './toolbar/FiltersTool';

export interface ImageEditorProps {
  imageUrl: string;
  brandLogoUrl?: string;
  brandId?: string;
  /** Called with the newly-created MediaAsset (id + url) after the edit is uploaded. */
  onDone: (newAsset: { _id: string; url: string }) => void;
  onCancel: () => void;
}

const TOOLS: { id: NonNullable<EditorTool>; label: string; icon: typeof Crop }[] = [
  { id: 'crop', label: 'Crop', icon: Crop },
  { id: 'resize', label: 'Resize', icon: Maximize2 },
  { id: 'rotate-flip', label: 'Rotate/Flip', icon: RotateCw },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'logo', label: 'Logo', icon: ImageIcon },
  { id: 'filters', label: 'Filters', icon: SlidersHorizontal },
];

/**
 * Simple, purpose-built image editor overlay — NOT a general canvas/Canva
 * clone. Full-screen fixed overlay matching the Create Wizard's takeover
 * pattern. Fabric.js canvas is created/disposed in useImageEditor's effect;
 * this component only wires UI around it.
 *
 * Mount as a controlled overlay from any parent:
 *   {isEditingImage && (
 *     <ImageEditor
 *       imageUrl={asset.url}
 *       brandLogoUrl={activeBrand?.logoUrl}
 *       brandId={activeBrand?._id}
 *       onDone={(url) => { ...; setIsEditingImage(false); }}
 *       onCancel={() => setIsEditingImage(false)}
 *     />
 *   )}
 */
export function ImageEditor({ imageUrl, brandLogoUrl, brandId, onDone, onCancel }: ImageEditorProps): React.JSX.Element {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isExporting, setIsExporting] = useState(false);

  const {
    canvasElRef,
    canvasRef,
    baseImageRef,
    isReady,
    activeTool,
    setActiveTool,
    selectedObject,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    filterValues,
    applyFilter,
    exportToBlob,
  } = useImageEditor({ imageUrl });

  // Esc closes the editor (only when not mid-export).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isExporting) onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isExporting]);

  const selectedTextbox =
    selectedObject && (selectedObject as unknown as { isType?: (t: string) => boolean }).isType?.('textbox')
      ? (selectedObject as Textbox)
      : null;

  async function handleDone() {
    setIsExporting(true);
    try {
      const blob = await exportToBlob('image/png');
      const file = new File([blob], `edited-${Date.now()}.png`, { type: 'image/png' });
      const asset = await uploadMedia(file, brandId);
      toast.success('Edited image saved to your media library.');
      onDone({ _id: asset._id, url: asset.url });
    } catch {
      toast.error('Could not save the edited image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  function handleToolSelect(tool: EditorTool) {
    setActiveTool(activeTool === tool ? null : tool);
  }

  const panelContent = activeTool ? (
    <ToolPanel
      activeTool={activeTool}
      canvas={canvasRef.current}
      baseImage={baseImageRef.current}
      selectedObject={selectedObject as FabricObject | null}
      selectedTextbox={selectedTextbox}
      brandLogoUrl={brandLogoUrl}
      filterValues={filterValues}
      onApplyFilter={applyFilter}
      onCommit={pushHistory}
    />
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel editing">
          <X className="size-5" />
        </Button>

        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="icon" disabled={!canUndo} onClick={undo} aria-label="Undo">
            <Undo2 className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" disabled={!canRedo} onClick={redo} aria-label="Redo">
            <Redo2 className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={reset}>
            <ResetIcon className="size-4" />
            Reset
          </Button>
        </div>

        <Button type="button" size="sm" disabled={!isReady || isExporting} onClick={handleDone} className="gap-2">
          {isExporting && <Loader2 className="size-4 animate-spin" />}
          Done
        </Button>
      </div>

      {/* Body: icon rail + canvas + side panel (desktop) */}
      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        {/* Left icon rail (desktop) / bottom toolbar (mobile) */}
        <div
          className={cn(
            'flex shrink-0 gap-1 border-border bg-surface',
            'border-t p-2 md:w-20 md:flex-col md:border-r md:border-t-0 md:p-3',
            'overflow-x-auto md:overflow-x-visible'
          )}
        >
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleToolSelect(id)}
              className={cn(
                'flex shrink-0 flex-col items-center gap-1 rounded-md px-3 py-2 text-[11px] font-medium transition-colors md:w-full',
                activeTool === id
                  ? 'bg-accentMuted text-accent'
                  : 'text-textSecondary hover:bg-backgroundMuted hover:text-textPrimary'
              )}
            >
              <Icon className="size-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-backgroundSubtle p-4 md:p-8">
          {!isReady && (
            <div className="flex flex-col items-center gap-2 text-textSecondary">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Loading image…</span>
            </div>
          )}
          <canvas ref={canvasElRef} className={cn('shadow-lg', !isReady && 'hidden')} />
        </div>

        {/* Property panel — side panel on desktop */}
        {isDesktop && activeTool && (
          <div className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-textPrimary">
                {TOOLS.find((t) => t.id === activeTool)?.label}
              </p>
            </div>
            {panelContent}
          </div>
        )}
      </div>

      {/* Property panel — bottom Sheet on mobile */}
      {!isDesktop && (
        <Sheet open={Boolean(activeTool)} onOpenChange={(open) => !open && setActiveTool(null)}>
          <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-lg">
            <SheetHeader>
              <SheetTitle>{TOOLS.find((t) => t.id === activeTool)?.label}</SheetTitle>
            </SheetHeader>
            {panelContent}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

interface ToolPanelProps {
  activeTool: NonNullable<EditorTool>;
  canvas: ReturnType<typeof useImageEditor>['canvasRef']['current'];
  baseImage: ReturnType<typeof useImageEditor>['baseImageRef']['current'];
  selectedObject: FabricObject | null;
  selectedTextbox: Textbox | null;
  brandLogoUrl?: string;
  filterValues: ReturnType<typeof useImageEditor>['filterValues'];
  onApplyFilter: ReturnType<typeof useImageEditor>['applyFilter'];
  onCommit: () => void;
}

function ToolPanel({
  activeTool,
  canvas,
  baseImage,
  selectedObject,
  selectedTextbox,
  brandLogoUrl,
  filterValues,
  onApplyFilter,
  onCommit,
}: ToolPanelProps): React.JSX.Element | null {
  switch (activeTool) {
    case 'crop':
      return <CropTool canvas={canvas} baseImage={baseImage} onCommit={onCommit} />;
    case 'resize':
      return <ResizeTool canvas={canvas} onCommit={onCommit} />;
    case 'rotate-flip':
      return <RotateFlipTool canvas={canvas} onCommit={onCommit} />;
    case 'text':
      return <TextTool canvas={canvas} selectedTextbox={selectedTextbox} onCommit={onCommit} />;
    case 'logo':
      return (
        <LogoWatermarkTool
          canvas={canvas}
          brandLogoUrl={brandLogoUrl}
          selectedObject={selectedObject}
          onCommit={onCommit}
        />
      );
    case 'filters':
      return <FiltersTool values={filterValues} onChange={onApplyFilter} />;
    default:
      return null;
  }
}
