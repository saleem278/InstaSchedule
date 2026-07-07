/**
 * Simple Image Editor feature — a full-screen fabric.js-based editor overlay
 * (crop, resize, rotate/flip, text, logo/watermark, 4-slider filters). This
 * is deliberately NOT a general-purpose canvas editor; the tool set is fixed
 * per the design spec.
 *
 * Usage from any parent (e.g. the Create Wizard's "Edit Image" step):
 *
 *   import { ImageEditor } from '@/features/image-editor';
 *
 *   {isEditing && (
 *     <ImageEditor
 *       imageUrl={asset.url}
 *       brandLogoUrl={activeBrand?.logoUrl}
 *       brandId={activeBrand?._id}
 *       onDone={(newAssetUrl) => { setIsEditing(false); ... }}
 *       onCancel={() => setIsEditing(false)}
 *     />
 *   )}
 *
 * Simplifications / implementation notes (see also inline doc comments):
 * - Text tool's font list is a small hardcoded curated set — it does not
 *   dynamically pull the active brand's font pairing.
 * - "Warmth" filter has no built-in fabric.js filter, so it is approximated
 *   with fabric's `filters.BlendColor` in 'tint' mode (warm orange tint for
 *   positive values, cool blue tint for negative values, alpha scaled by
 *   slider magnitude). See `useImageEditor.ts`'s `applyFilter`.
 * - Undo/redo is a JSON-snapshot stack (fabric.js has no built-in history),
 *   capped at 20 steps.
 * - "Done" uploads the exported PNG via the real media upload API
 *   (`uploadMedia` from `@/features/media/api/media.api.ts`, which existed
 *   already) as a NEW MediaAsset — the original image is never mutated.
 */
export { ImageEditor } from './components/ImageEditor';
export type { ImageEditorProps } from './components/ImageEditor';
export { useImageEditor } from './hooks/useImageEditor';
export type { EditorTool, CropPreset, FilterValues } from './hooks/useImageEditor';
