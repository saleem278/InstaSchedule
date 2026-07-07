/**
 * Generation shapes as returned by the API.
 * Mirrors backend/src/features/ai-generation/generation.model.ts.
 *
 * ASSUMPTION (documented in task summary too): the exact JSON shape of
 * POST /generation/:projectId/generate's response was inferred from
 * generation.service.ts's `GenerateFullResult` return type — it is not
 * independently confirmed against a live response. We assume the envelope's
 * `data` is `{ generation: Generation, imageJob: ImageJob }` with no further
 * transformation by the controller (the controller just does
 * `sendSuccess(res, result, 201)` where `result` is that same object).
 */
export type GenerationType = 'full' | 'caption' | 'cta' | 'hashtags' | 'altText' | 'imagePrompt' | 'image';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type RegenerableField = 'caption' | 'cta' | 'hashtags' | 'altText' | 'imagePrompt';

export interface GenerationOutput {
  caption: string;
  cta: string;
  hashtags: string[];
  altText: string;
  imagePrompt: string;
  imageUrl: string;
}

export interface Generation {
  _id: string;
  project: string;
  user: string;
  brand: string;
  type: GenerationType;
  inputTopic: string;
  inputPromptOverride?: string | null;
  output: GenerationOutput;
  textProvider?: string | null;
  imageProvider?: string | null;
  status: GenerationStatus;
  jobId?: string | null;
  errorMessage?: string | null;
  isDuplicateOf?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImageJob {
  jobId: string;
  status: GenerationStatus;
  mode: 'async' | 'sync';
}

export interface GenerateFullResult {
  generation: Generation;
  imageJob: ImageJob;
}

export type RegenerateFieldResult =
  | { field: RegenerableField; value: string | string[] }
  | { field: 'image'; imageJob: ImageJob; generation: Generation };
