import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, filters as fabricFilters, Rect, Textbox } from 'fabric';

/** Tool ids for the left icon rail / bottom toolbar. */
export type EditorTool = 'crop' | 'resize' | 'rotate-flip' | 'text' | 'logo' | 'filters' | null;

export type CropPreset = 'square' | 'portrait' | 'story' | 'original' | 'freeform';

export interface FilterValues {
  /** -1 to 1 */
  brightness: number;
  /** -1 to 1 */
  contrast: number;
  /** -1 to 1 (0 = no saturation change; -1 fully desaturated) */
  saturation: number;
  /** -1 to 1, negative = cooler, positive = warmer (see index.ts note on approach) */
  warmth: number;
}

export const DEFAULT_FILTERS: FilterValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
};

const MAX_HISTORY = 20;
const MAX_CANVAS_DIMENSION = 900; // px — keeps the editor viewport reasonable regardless of source image size

interface UseImageEditorOptions {
  imageUrl: string;
}

interface UseImageEditorResult {
  canvasElRef: React.RefObject<HTMLCanvasElement | null>;
  canvasRef: React.RefObject<Canvas | null>;
  baseImageRef: React.RefObject<FabricImage | null>;
  isReady: boolean;
  activeTool: EditorTool;
  setActiveTool: (tool: EditorTool) => void;
  selectedObject: unknown;
  // history
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: () => void;
  // filters
  filterValues: FilterValues;
  applyFilter: (patch: Partial<FilterValues>) => void;
  // export
  exportToBlob: (mimeType?: string, quality?: number) => Promise<Blob>;
}

/**
 * Owns the fabric.js Canvas instance lifecycle (create on mount, dispose on
 * unmount), a JSON-snapshot undo/redo stack capped at MAX_HISTORY, active
 * tool state, and the four Filters/Adjust slider values. Individual tool
 * panels (CropTool, ResizeTool, ...) read/mutate the canvas via
 * `canvasRef.current` and call `pushHistory()` after each committed edit.
 */
export function useImageEditor({ imageUrl }: UseImageEditorOptions): UseImageEditorResult {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const baseImageRef = useRef<FabricImage | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [activeTool, setActiveTool] = useState<EditorTool>(null);
  const [selectedObject, setSelectedObject] = useState<unknown>(null);
  const [filterValues, setFilterValues] = useState<FilterValues>(DEFAULT_FILTERS);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const suppressHistoryRef = useRef(false);

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    });
  }, []);

  // ---- Setup / teardown ----
  useEffect(() => {
    if (!canvasElRef.current) return;

    let disposed = false;
    const canvas = new Canvas(canvasElRef.current, {
      preserveObjectStacking: true,
      backgroundColor: '#00000000',
    });
    canvasRef.current = canvas;

    const handleSelection = () => setSelectedObject(canvas.getActiveObject() ?? null);
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => setSelectedObject(null));

    FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' })
      .then((img) => {
        if (disposed) return;

        const scale = Math.min(MAX_CANVAS_DIMENSION / (img.width ?? 1), MAX_CANVAS_DIMENSION / (img.height ?? 1), 1);
        const width = Math.round((img.width ?? 1) * scale);
        const height = Math.round((img.height ?? 1) * scale);

        canvas.setDimensions({ width, height });
        img.set({
          left: 0,
          top: 0,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          name: 'base-image',
        });

        canvas.add(img);
        canvas.sendObjectToBack(img);
        baseImageRef.current = img;
        canvas.requestRenderAll();

        historyRef.current = [JSON.stringify(canvas.toJSON())];
        historyIndexRef.current = 0;
        syncHistoryState();
        setIsReady(true);
      })
      .catch(() => {
        setIsReady(false);
      });

    return () => {
      disposed = true;
      canvas.dispose();
      canvasRef.current = null;
      baseImageRef.current = null;
    };
    // imageUrl is treated as fixed for the editor's lifetime — a new image
    // means mounting a new ImageEditor instance (parent controls this via key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- History (JSON snapshot stack, capped at MAX_HISTORY) ----
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || suppressHistoryRef.current) return;

    const snapshot = JSON.stringify(canvas.toJSON());
    const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
    truncated.push(snapshot);

    const overflow = truncated.length - MAX_HISTORY;
    const trimmed = overflow > 0 ? truncated.slice(overflow) : truncated;

    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
    syncHistoryState();
  }, [syncHistoryState]);

  const loadSnapshot = useCallback((snapshot: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    suppressHistoryRef.current = true;
    canvas.loadFromJSON(JSON.parse(snapshot)).then(() => {
      canvas.getObjects().forEach((obj) => {
        if ((obj as { name?: string }).name === 'base-image') {
          baseImageRef.current = obj as FabricImage;
        }
      });
      canvas.requestRenderAll();
      suppressHistoryRef.current = false;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    loadSnapshot(historyRef.current[historyIndexRef.current]);
    syncHistoryState();
  }, [loadSnapshot, syncHistoryState]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    loadSnapshot(historyRef.current[historyIndexRef.current]);
    syncHistoryState();
  }, [loadSnapshot, syncHistoryState]);

  const reset = useCallback(() => {
    if (historyRef.current.length === 0) return;
    historyIndexRef.current = 0;
    loadSnapshot(historyRef.current[0]);
    historyRef.current = [historyRef.current[0]];
    setFilterValues(DEFAULT_FILTERS);
    syncHistoryState();
  }, [loadSnapshot, syncHistoryState]);

  // ---- Filters/Adjust ----
  // Brightness/Contrast/Saturation use fabric's built-in filter classes
  // directly. Warmth has no built-in equivalent, so it's approximated with a
  // BlendColor filter in 'tint' mode: positive values tint toward warm
  // orange, negative values tint toward cool blue, with alpha scaled by the
  // magnitude of the slider. See index.ts for the written note on this.
  const applyFilter = useCallback(
    (patch: Partial<FilterValues>) => {
      const image = baseImageRef.current;
      const canvas = canvasRef.current;
      if (!image || !canvas) return;

      const next = { ...filterValues, ...patch };
      setFilterValues(next);

      const built: NonNullable<FabricImage['filters']> = [];

      if (next.brightness !== 0) {
        built.push(new fabricFilters.Brightness({ brightness: next.brightness }));
      }
      if (next.contrast !== 0) {
        built.push(new fabricFilters.Contrast({ contrast: next.contrast }));
      }
      if (next.saturation !== 0) {
        built.push(new fabricFilters.Saturation({ saturation: next.saturation }));
      }
      if (next.warmth !== 0) {
        const warm = next.warmth > 0;
        built.push(
          new fabricFilters.BlendColor({
            color: warm ? '#ff9d3d' : '#3d7bff',
            mode: 'tint',
            alpha: Math.min(Math.abs(next.warmth) * 0.5, 0.5),
          })
        );
      }

      image.filters = built;
      image.applyFilters();
      canvas.requestRenderAll();
    },
    [filterValues]
  );

  const exportToBlob = useCallback(async (mimeType = 'image/png', quality = 0.92): Promise<Blob> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not ready');

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const dataUrl = canvas.toDataURL({
      format: mimeType === 'image/jpeg' ? 'jpeg' : 'png',
      quality,
      multiplier: 1,
    });

    const res = await fetch(dataUrl);
    return res.blob();
  }, []);

  return {
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
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    reset,
    filterValues,
    applyFilter,
    exportToBlob,
  };
}

// Re-export the fabric classes tool panels need, so they all import fabric
// primitives from this hook module rather than each adding a direct
// `import ... from 'fabric'` (keeps the fabric API surface centralized).
export { Rect, Textbox, FabricImage, fabricFilters };
