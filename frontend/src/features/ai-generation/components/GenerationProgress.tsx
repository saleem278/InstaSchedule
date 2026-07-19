import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, RotateCw, Shuffle, CalendarClock, ImageIcon, Send, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { extractErrorMessage } from '@/core/api/extractErrorMessage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InstagramPreview } from './instagram-preview/InstagramPreview';
import { StepTracker, type Step } from './StepTracker';
import { FieldCard } from './FieldCard';
import { HashtagChipInput } from './HashtagChipInput';
import { useGenerateContent } from '../hooks/useGenerateContent';
import { listProviders, ProvidersResponse } from '@/features/system/api/providers.api';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useRegenerateField } from '../hooks/useRegenerateField';
import { useJobPolling } from '../hooks/useJobPolling';
import { useUpdateProject } from '@/features/projects/hooks/useUpdateProject';
import { useUpdateProjectStatus } from '@/features/projects/hooks/useUpdateProjectStatus';
import { usePublishProject } from '@/features/projects/hooks/usePublishProject';
import { ImageEditor } from '@/features/image-editor';
import { MediaUploadDropzone } from '@/features/media/components/MediaUploadDropzone';
import type { Project } from '@/features/projects/schemas/project.types';
import type { GenerateFullResult, RegenerableField } from '../schemas/generation.types';
import { cn } from '@/core/utils/cn';
import { MusicSelectionPanel } from '@/features/projects/components/MusicSelectionPanel';

const TEXT_PROVIDER_MODELS: Record<string, { label: string; value: string }[]> = {
  groq: [
    { label: 'GPT OSS 20B (Default)', value: 'openai/gpt-oss-20b' },
    { label: 'Llama 3 8B', value: 'llama3-8b-8192' },
    { label: 'Llama 3 70B', value: 'llama3-70b-8192' },
    { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
  ],
  openai: [
    { label: 'GPT-4o Mini (Default)', value: 'gpt-4o-mini' },
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  ],
  gemini: [
    { label: 'Gemini 2.5 Flash (Default)', value: 'gemini-2.5-flash' },
    { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
  ],
};

const IMAGE_PROVIDER_MODELS: Record<string, { label: string; value: string }[]> = {
  gemini: [
    { label: 'Imagen 4.0 Generate (Default)', value: 'imagen-4.0-generate-001' },
    { label: 'Gemini 3.1 Flash Image', value: 'gemini-3.1-flash-image' },
  ],
  pollinations: [
    { label: 'Default Model', value: '' },
    { label: 'Flux', value: 'flux' },
  ],
  huggingface: [
    { label: 'FLUX.1 Schnell (Default)', value: 'black-forest-labs/FLUX.1-schnell' },
    { label: 'Stable Diffusion XL 1.0', value: 'stabilityai/stable-diffusion-xl-base-1.0' },
    { label: 'Stable Diffusion 3 Medium', value: 'stabilityai/stable-diffusion-3-medium-diffusers' },
    { label: 'Openjourney', value: 'prompthero/openjourney' },
  ],
  'cloudflare-workers': [
    { label: 'SDXL Lightning (Default)', value: '@cf/bytedance/stable-diffusion-xl-lightning' },
    { label: 'Stable Diffusion XL 1.0', value: '@cf/stabilityai/stable-diffusion-xl-base-1.0' },
    { label: 'Dreamshaper 8 LCM', value: '@cf/lykon/dreamshaper-8-lcm' },
  ],
};

const STEPS: Step[] = [
  { key: 'topic', label: 'Understanding topic' },
  { key: 'caption', label: 'Writing caption' },
  { key: 'hashtags', label: 'Crafting hashtags' },
  { key: 'image', label: 'Generating image' },
  { key: 'final', label: 'Finalizing' },
];

interface GenerationProgressProps {
  project: Project;
  brandName: string;
  brandLogoUrl?: string;
  /** Called when the user closes/leaves this step (e.g. after saving as draft/scheduling). */
  onDone?: () => void;
  /**
   * When true, skips the generate-on-mount behavior and renders directly in
   * the 'ready' phase using the project's already-persisted content/image.
   * Used when revisiting an existing project (e.g. from the Dashboard) where
   * re-generating fresh content on every visit would be wrong.
   */
  skipGeneration?: boolean;
}

/**
 * ONE component covering both the "magic moment" generation animation AND
 * the subsequent Preview & Edit step, using an internal `phase` state
 * ('generating' | 'ready') rather than two separate components handing off.
 * Rationale (documented for review): both phases render literally the same
 * split-pane tree (InstagramPreview + field cards) — the only difference is
 * whether the fields are read-only/skeleton or editable. Splitting into two
 * components would mean either duplicating that tree or passing the whole
 * tree back and forth as a render prop; an internal phase flag is simpler.
 */
export function GenerationProgress({
  project,
  brandName,
  brandLogoUrl,
  onDone,
  skipGeneration = false,
}: GenerationProgressProps): React.JSX.Element {
  const [phase, setPhase] = useState<'generating' | 'ready'>(skipGeneration ? 'ready' : 'generating');
  const [pacingStepIndex, setPacingStepIndex] = useState(skipGeneration ? STEPS.length - 1 : 0);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(
    skipGeneration ? new Set([0, 1, 2, 3, 4]) : new Set()
  );
  const [liveMessage, setLiveMessage] = useState('Understanding topic');
  const [glowPulse, setGlowPulse] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  // On revisit (skipGeneration), if the project has no image yet but does have
  // an activeGeneration, that generation may still be processing (the user left
  // the wizard early). Seed the poller with it so we resume tracking instead of
  // wrongly declaring the image failed. `getJobStatus` looks the Generation up
  // by its own _id, which is exactly what activeGeneration holds.
  const [imageJobId, setImageJobId] = useState<string | undefined>(
    skipGeneration && !project.imageAsset?.url && project.activeGeneration
      ? project.activeGeneration
      : undefined
  );

  // Local editable field state, seeded from the project's persisted content —
  // this is also the initial state while a fresh generation is in flight (the
  // fields just render as skeleton/disabled until phase flips to 'ready').
  const [caption, setCaption] = useState(project.content.caption);
  const [cta, setCta] = useState(project.content.cta);
  const [hashtags, setHashtags] = useState<string[]>(project.content.hashtags);
  const [altText, setAltText] = useState(project.content.altText);
  const [imagePrompt, setImagePrompt] = useState(project.content.imagePrompt);
  const [imageUrl, setImageUrl] = useState<string | undefined>(project.imageAsset?.url);
  const [imageAssets, setImageAssets] = useState<{ _id: string; url: string }[]>(
    project.imageAssets || []
  );
  const imageUrls = imageAssets.map((a) => a.url);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const generateMutation = useGenerateContent();
  const regenerateMutation = useRegenerateField();
  const updateProjectMutation = useUpdateProject();
  const updateStatusMutation = useUpdateProjectStatus();
  const publishMutation = usePublishProject();

  const jobQuery = useJobPolling(project._id, imageJobId);

  const hasFiredRef = useRef(false);
  const hasFailedToastRef = useRef(false);

  const { data: providers } = useQuery<ProvidersResponse>({ queryKey: ['providers', project.brand], queryFn: () => listProviders(project.brand) });
  const [selectedTextProvider, setSelectedTextProvider] = useState<string | undefined>(providers?.defaultTextProvider);
  const [selectedImageProvider, setSelectedImageProvider] = useState<string | undefined>(providers?.defaultImageProvider);
  const [selectedTextModel, setSelectedTextModel] = useState<string>('');
  const [selectedImageModel, setSelectedImageModel] = useState<string>('');

  useEffect(() => {
    if (providers) {
      setSelectedTextProvider(providers.defaultTextProvider);
      setSelectedImageProvider(providers.defaultImageProvider);
      setSelectedTextModel(providers.defaultTextModel || '');
      setSelectedImageModel(providers.defaultImageModel || '');
    }
  }, [providers]);

  // Consumes a successful generate result. Centralized (rather than inlined in
  // the mount effect's onSuccess) so the failure-retry button can re-run the
  // EXACT same result-handling — otherwise a retry succeeds on the server but
  // the component never reads the response and stays stuck in 'generating'.
  const applyGenerateResult = useCallback((result: GenerateFullResult) => {
    setCaption(result.generation.output.caption);
    setCta(result.generation.output.cta);
    setHashtags(result.generation.output.hashtags);
    setAltText(result.generation.output.altText);
    setImagePrompt(result.generation.output.imagePrompt);
    if (result.generation.output.imageUrl) {
      setImageUrl(result.generation.output.imageUrl);
      const mockAssets = project.postType === 'carousel'
        ? [
          { _id: 'mock-1', url: result.generation.output.imageUrl },
          { _id: 'mock-2', url: result.generation.output.imageUrl },
          { _id: 'mock-3', url: result.generation.output.imageUrl }
        ]
        : [{ _id: 'main', url: result.generation.output.imageUrl }];
      setImageAssets(mockAssets);
    }
    setImageJobId(result.imageJob.jobId);

    // Stagger the CHECKMARK animations even though the text arrived in one
    // response — a deliberate cosmetic choice to keep the tracker sequential.
    setCompletedIndices((prev) => new Set(prev).add(0));
    setPacingStepIndex(2);
    setLiveMessage('Crafting hashtags');
    setTimeout(() => setCompletedIndices((prev) => new Set(prev).add(1)), 350);
    setTimeout(() => {
      setCompletedIndices((prev) => new Set(prev).add(2));
      setPacingStepIndex(3);
      setLiveMessage('Generating image');
    }, 700);
  }, [project.postType]);

  const truncateToastText = (message: string, maxLength = 300) => {
    const trimmed = message.trim();
    return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength - 3)}...`;
  };

  // Fires the generate mutation and wires the shared result handler. Reused by
  // both the mount effect and the retry button.
  const runGeneration = useCallback(() => {
    hasFailedToastRef.current = false;
    // A retry after a failure needs the step tracker reset out of its errored
    // pacing so the animation restarts cleanly.
    setPacingStepIndex(1);
    setLiveMessage('Writing caption');
    generateMutation.mutate(
      {
        projectId: project._id,
        options: {
          textProvider: selectedTextProvider,
          imageProvider: selectedImageProvider,
          textModel: selectedTextModel || undefined,
          imageModel: selectedImageModel || undefined,
        },
      },
      {
        onSuccess: (result) => {
          applyGenerateResult(result);
          if (result.generation.status === 'failed' || result.imageJob.status === 'failed') {
            hasFailedToastRef.current = true;
            toast.error(
              truncateToastText(result.generation.errorMessage ?? 'Something went wrong generating this.'),
              { id: `generate-fail-${Date.now()}` }
            );
          }
        },
        onError: (error) => {
          hasFailedToastRef.current = true;
          toast.error(
            truncateToastText(extractErrorMessage(error, 'Something went wrong generating this.')),
            { id: `generate-error-${Date.now()}` }
          );
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id, applyGenerateResult, selectedTextProvider, selectedImageProvider, selectedTextModel, selectedImageModel]);

  // --- Step 2: fire the generate mutation on mount, with a short cosmetic
  // pacing timer to advance "Understanding topic" -> "Writing caption". ---
  useEffect(() => {
    if (skipGeneration) return;
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    const pacingTimer = setTimeout(() => {
      setPacingStepIndex(1);
      setLiveMessage('Writing caption');
    }, 800);

    runGeneration();

    return () => {
      clearTimeout(pacingTimer);
      // Reset the guard on cleanup so React 19 StrictMode's dev-only
      // mount->cleanup->remount cycle doesn't skip firing the mutation on
      // the remount that actually persists.
      hasFiredRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  // --- Step 4: once the polled job completes, capture the image URL. ---
  useEffect(() => {
    if (jobQuery.data?.status === 'completed' && jobQuery.data.output.imageUrl) {
      setImageUrl(jobQuery.data.output.imageUrl);
      const mockAssets = project.postType === 'carousel'
        ? [
          { _id: 'mock-1', url: jobQuery.data.output.imageUrl },
          { _id: 'mock-2', url: jobQuery.data.output.imageUrl },
          { _id: 'mock-3', url: jobQuery.data.output.imageUrl }
        ]
        : [{ _id: 'main', url: jobQuery.data.output.imageUrl }];
      setImageAssets(mockAssets);
      setCompletedIndices((prev) => new Set(prev).add(3));
      setPacingStepIndex(4);
      setLiveMessage('Finalizing');
    }

    if (jobQuery.data?.status === 'failed' && !hasFailedToastRef.current) {
      hasFailedToastRef.current = true;
      toast.error(truncateToastText(jobQuery.data.errorMessage ?? 'Something went wrong generating this.'), {
        id: `job-fail-${Date.now()}`,
      });
    }

    if (jobQuery.timedOut && !hasFailedToastRef.current) {
      hasFailedToastRef.current = true;
      toast.error('Image generation timed out. Please try again.', {
        id: `job-timeout-${Date.now()}`,
      });
    }
  }, [jobQuery.data, jobQuery.timedOut, project.postType]);

  const textReady = generateMutation.isSuccess || skipGeneration;
  // An image job is "in flight" whenever we have a jobId whose polled status
  // hasn't reached a terminal state yet (and hasn't timed out). In async mode
  // the regenerate mutation resolves the instant the job is ENQUEUED, so this
  // — not `regenerateMutation.isPending` — is the true "still generating"
  // signal used to gate the regenerate button and show the loader.
  const imageJobInFlight =
    Boolean(imageJobId) &&
    jobQuery.data?.status !== 'completed' &&
    jobQuery.data?.status !== 'failed' &&
    !jobQuery.timedOut;
  const imageReady = Boolean(imageUrl) && (jobQuery.data?.status === 'completed' || !imageJobId);
  // When revisiting an existing project (skipGeneration) there is no active
  // job to poll — if it also has no persisted image, that means a prior
  // generation attempt failed (or was never run), not that one is in
  // progress. Without this, DevelopingImage falls into its default "still
  // generating" branch and shimmers forever with no way to retry.
  const imageFailed =
    jobQuery.data?.status === 'failed' || jobQuery.timedOut || (skipGeneration && !imageJobId && !imageUrl);

  // --- Step 5: once both text and image are done, pulse the frame glow and
  // transition into the editable "ready" phase. ---
  useEffect(() => {
    if (textReady && (imageReady || imageFailed) && phase === 'generating') {
      setCompletedIndices((prev) => new Set(prev).add(4));
      setLiveMessage('Your post is ready');
      setGlowPulse(true);
      const glowOff = setTimeout(() => setGlowPulse(false), 800); // 300ms in + 500ms out
      const toReady = setTimeout(() => setPhase('ready'), 900);
      return () => {
        clearTimeout(glowOff);
        clearTimeout(toReady);
      };
    }
    return undefined;
  }, [textReady, imageReady, imageFailed, phase]);

  const activeStepIndex = useMemo(() => {
    if (phase === 'ready') return STEPS.length - 1;
    return pacingStepIndex;
  }, [phase, pacingStepIndex]);

  const generateFailed =
    generateMutation.isError ||
    generateMutation.data?.generation.status === 'failed' ||
    generateMutation.data?.imageJob.status === 'failed';

  const generateErrorMessage = generateMutation.isError
    ? extractErrorMessage(generateMutation.error, 'Something went wrong generating this.')
    : generateFailed
      ? generateMutation.data?.generation.errorMessage ?? 'Something went wrong generating this.'
      : undefined;

  const regeneratingField = regenerateMutation.isPending ? regenerateMutation.variables?.field : undefined;

  function handleRegenerate(field: RegenerableField | 'image') {
    if (field === 'image') {
      // Clear the previous image up front so the preview returns to the
      // loading state immediately, and — critically — so a failed/timed-out
      // regeneration surfaces the retry affordance instead of silently
      // leaving the stale prior image on screen (DevelopingImage only shows
      // its failed state when there is no imageUrl).
      setImageUrl(undefined);
    }
    regenerateMutation.mutate(
      {
        projectId: project._id,
        field,
        options: {
          textProvider: selectedTextProvider,
          imageProvider: selectedImageProvider,
          textModel: selectedTextModel || undefined,
          imageModel: selectedImageModel || undefined,
        },
      },
      {
        onSuccess: (result) => {
          if (result.field === 'image') {
            setImageJobId(result.imageJob.jobId);
            if (result.generation.output.imageUrl) {
              setImageUrl(result.generation.output.imageUrl);
              const mockAssets = project.postType === 'carousel'
                ? [
                  { _id: 'mock-1', url: result.generation.output.imageUrl },
                  { _id: 'mock-2', url: result.generation.output.imageUrl },
                  { _id: 'mock-3', url: result.generation.output.imageUrl }
                ]
                : [{ _id: 'main', url: result.generation.output.imageUrl }];
              setImageAssets(mockAssets);
            }
            return;
          }
          if (result.field === 'caption') setCaption(result.value as string);
          if (result.field === 'cta') setCta(result.value as string);
          if (result.field === 'hashtags') setHashtags(result.value as string[]);
          if (result.field === 'altText') setAltText(result.value as string);
          if (result.field === 'imagePrompt') setImagePrompt(result.value as string);
        },
      }
    );
  }

  // Persists the current field edits. Returns the promise so callers that then
  // change status (schedule/draft) or publish can AWAIT it first — the status
  // update and the server-side caption composition both read persisted content,
  // so a fire-and-forget save here would race and could act on stale text.
  function persistFields(): Promise<unknown> {
    return updateProjectMutation.mutateAsync({
      projectId: project._id,
      payload: { content: { caption, cta, hashtags, altText, imagePrompt } },
    });
  }

  async function handleSaveDraft() {
    try {
      await persistFields();
    } catch {
      toast.error("Couldn't save your changes, so the draft wasn't saved. Please try again.");
      return;
    }
    updateStatusMutation.mutate(
      { projectId: project._id, payload: { status: 'draft' } },
      { onSuccess: () => onDone?.() }
    );
  }

  async function handleSchedule(date: Date) {
    try {
      await persistFields();
    } catch {
      toast.error("Couldn't save your changes, so the post wasn't scheduled. Please try again.");
      return;
    }
    updateStatusMutation.mutate(
      { projectId: project._id, payload: { status: 'scheduled', scheduledAt: date.toISOString() } },
      { onSuccess: () => onDone?.() }
    );
  }

  async function handlePublishNow() {
    // Publish composes the caption server-side from the PERSISTED project
    // content, so any unsaved edits must be written first — otherwise we'd
    // publish stale text. Await the save (not fire-and-forget) before publish.
    try {
      await persistFields();
    } catch {
      toast.error("Couldn't save your changes, so nothing was published. Please try again.");
      return;
    }
    publishMutation.mutate(project._id, { onSuccess: () => onDone?.() });
  }

  async function handleMoveSlide(idx: number, direction: 'left' | 'right') {
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= imageAssets.length) return;

    const nextAssets = [...imageAssets];
    const temp = nextAssets[idx];
    nextAssets[idx] = nextAssets[targetIdx];
    nextAssets[targetIdx] = temp;
    setImageAssets(nextAssets);

    const assetIds = nextAssets.map((a) => a._id);
    try {
      await updateProjectMutation.mutateAsync({
        projectId: project._id,
        payload: { imageAssetIds: assetIds },
      });
      if (nextAssets[0]) {
        setImageUrl(nextAssets[0].url);
      }
    } catch {
      toast.error("Couldn't save slide sequence. Please try again.");
    }
  }

  async function handleRemoveSlide(idx: number) {
    if (imageAssets.length <= 2) {
      toast.error('Carousel posts require at least 2 slides.');
      return;
    }

    const nextAssets = imageAssets.filter((_, i) => i !== idx);
    setImageAssets(nextAssets);

    const assetIds = nextAssets.map((a) => a._id);
    try {
      await updateProjectMutation.mutateAsync({
        projectId: project._id,
        payload: { imageAssetIds: assetIds },
      });
      if (imageUrl === imageAssets[idx].url) {
        setImageUrl(nextAssets[0]?.url);
      }
    } catch {
      toast.error("Couldn't remove slide. Please try again.");
    }
  }

  // Handle user-uploaded images: attach the uploaded MediaAssets to the project
  async function handleUploadedAssets(assets: { _id: string; url: string }[]) {
    try {
      if (project.postType === 'carousel') {
        const filteredAssets = imageAssets.filter((a) => !a._id.startsWith('mock-'));
        const newAssets = [...filteredAssets, ...assets];
        setImageAssets(newAssets);

        const newAssetIds = newAssets.map((a) => a._id);
        await updateProjectMutation.mutateAsync({
          projectId: project._id,
          payload: { imageAssetIds: newAssetIds },
        });

        if (!imageUrl || imageUrl.startsWith('http://') || imageUrl.startsWith('https://') && imageUrl.includes('mock-')) {
          if (newAssets[0]) {
            setImageUrl(newAssets[0].url);
          }
        }
      } else {
        // Persist the last selected image on the Project so it's used for preview/publish
        const lastAsset = assets[assets.length - 1];
        if (lastAsset) {
          await updateProjectMutation.mutateAsync({ projectId: project._id, payload: { imageAssetId: lastAsset._id } });
          setImageUrl(lastAsset.url);
          setImageAssets([lastAsset]);
        }
      }
    } catch {
      toast.error("Couldn't attach uploaded images. Please try again.");
    }
  }

  function handleShuffleHashtags() {
    // Fisher–Yates: a `sort(() => Math.random() - 0.5)` comparator is
    // non-uniform and frequently returns the identical order for short arrays,
    // so the user sees "nothing happened" on click.
    setHashtags((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j]!, next[i]!];
      }
      return next;
    });
  }

  const isReady = phase === 'ready';
  const isEditable = isReady && project.status !== 'published' && project.status !== 'publishing';
  // Single busy flag so all three terminal actions (Save Draft / Schedule /
  // Publish) disable together while ANY of them is in flight — prevents racing
  // status writes and double onDone() navigations.
  const actionBusy =
    updateStatusMutation.isPending ||
    publishMutation.isPending ||
    updateProjectMutation.isPending ||
    project.status === 'publishing';

  return (
    <div className="flex h-full w-full flex-col">
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      <div className="shrink-0 border-b border-border bg-surface px-4 py-4 sm:px-8">
        <StepTracker
          steps={STEPS}
          activeIndex={activeStepIndex}
          completedIndices={completedIndices}
          errored={generateFailed}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:flex-row sm:gap-8 sm:p-8">
        {/* Left: live/staged preview, 60% on desktop, sticky on mobile */}
        <div className="top-4 sm:sticky sm:h-fit sm:w-[55%] sm:self-start">
          <InstagramPreview
            brandName={brandName}
            brandLogoUrl={brandLogoUrl}
            imageUrl={imageUrl}
            imageUrls={imageUrls}
            postType={project.postType}
            caption={caption}
            hashtags={hashtags}
            cta={cta}
            altText={altText}
            imageLoading={!imageReady && !imageFailed}
            imageFailed={imageFailed}
            onRetryImage={() => handleRegenerate('image')}
            textReady={textReady || phase === 'ready'}
            glow={glowPulse}
            activeSlideIndex={activeSlideIndex}
            onActiveSlideIndexChange={setActiveSlideIndex}
          />
        </div>

        {/* Right: field cards, 40% on desktop */}
        <div className="flex flex-col gap-4 sm:w-[45%]">
          {/* Provider & Model selectors */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-surfaceMuted/20 p-3 rounded-lg border border-border/40">
            {/* Text Generation Configuration */}
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary">Text Provider</label>
                <Select
                  value={selectedTextProvider || ''}
                  onValueChange={(v) => {
                    setSelectedTextProvider(v);
                    setSelectedTextModel('');
                  }}
                  disabled={!isEditable}
                >
                  <SelectTrigger className="w-full mt-1 h-9">
                    <SelectValue placeholder="Text provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers?.textProviders.map((p) => (
                      <SelectItem key={p.name} value={p.name} disabled={!p.available}>
                        {p.displayName} {p.available ? '' : ' (unavailable)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTextProvider && (
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary">Text Model</label>
                  <Select
                    value={
                      selectedTextModel !== '' && !(TEXT_PROVIDER_MODELS[selectedTextProvider] || []).some((m) => m.value === selectedTextModel)
                        ? '__custom__'
                        : selectedTextModel
                    }
                    onValueChange={(v) => {
                      if (v === '__custom__') {
                        setSelectedTextModel(' '); // Space to trigger custom render
                      } else {
                        setSelectedTextModel(v);
                      }
                    }}
                    disabled={!isEditable}
                  >
                    <SelectTrigger className="w-full mt-1 h-9">
                      <SelectValue placeholder="Select text model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Use system default</SelectItem>
                      {(TEXT_PROVIDER_MODELS[selectedTextProvider] || []).map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">Custom Model...</SelectItem>
                    </SelectContent>
                  </Select>

                  {(selectedTextModel === ' ' ||
                    (selectedTextModel !== '' && !(TEXT_PROVIDER_MODELS[selectedTextProvider] || []).some((m) => m.value === selectedTextModel))) && (
                      <Input
                        className="mt-1 h-8 text-xs"
                        placeholder="Enter custom model ID"
                        value={selectedTextModel === ' ' ? '' : selectedTextModel}
                        onChange={(e) => setSelectedTextModel(e.target.value)}
                        disabled={!isEditable}
                      />
                    )}
                </div>
              )}
            </div>

            {/* Image Generation Configuration */}
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary">Image Provider</label>
                <Select
                  value={selectedImageProvider || ''}
                  onValueChange={(v) => {
                    setSelectedImageProvider(v);
                    setSelectedImageModel('');
                  }}
                  disabled={!isEditable}
                >
                  <SelectTrigger className="w-full mt-1 h-9">
                    <SelectValue placeholder="Image provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers?.imageProviders.map((p) => (
                      <SelectItem key={p.name} value={p.name} disabled={!p.available}>
                        {p.displayName} {p.available ? '' : ' (unavailable)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedImageProvider && (
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary">Image Model</label>
                  <Select
                    value={
                      selectedImageModel !== '' && !(IMAGE_PROVIDER_MODELS[selectedImageProvider] || []).some((m) => m.value === selectedImageModel)
                        ? '__custom__'
                        : selectedImageModel
                    }
                    onValueChange={(v) => {
                      if (v === '__custom__') {
                        setSelectedImageModel(' '); // Space to trigger custom render
                      } else {
                        setSelectedImageModel(v);
                      }
                    }}
                    disabled={!isEditable}
                  >
                    <SelectTrigger className="w-full mt-1 h-9">
                      <SelectValue placeholder="Select image model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Use system default</SelectItem>
                      {(IMAGE_PROVIDER_MODELS[selectedImageProvider] || []).map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">Custom Model...</SelectItem>
                    </SelectContent>
                  </Select>

                  {(selectedImageModel === ' ' ||
                    (selectedImageModel !== '' && !(IMAGE_PROVIDER_MODELS[selectedImageProvider] || []).some((m) => m.value === selectedImageModel))) && (
                      <Input
                        className="mt-1 h-8 text-xs"
                        placeholder="Enter custom model ID"
                        value={selectedImageModel === ' ' ? '' : selectedImageModel}
                        onChange={(e) => setSelectedImageModel(e.target.value)}
                        disabled={!isEditable}
                      />
                    )}
                </div>
              )}
            </div>
          </div>
          {generateFailed ? (
            <FieldCard title="Caption">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="h-8 w-8 text-danger" />
                <p className="text-sm text-textSecondary">{generateErrorMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runGeneration}
                  disabled={generateMutation.isPending}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  {generateMutation.isPending ? 'Retrying…' : 'Retry'}
                </Button>
              </div>
            </FieldCard>
          ) : (
            <FieldCard
              title="Caption"
              counter={`${caption.length}/2200`}
              onRegenerate={isEditable ? () => handleRegenerate('caption') : undefined}
              regenerating={regeneratingField === 'caption'}
              shimmer={regeneratingField === 'caption'}
            >
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                disabled={!isEditable}
                rows={5}
                placeholder={isReady ? undefined : 'Writing caption…'}
              />
            </FieldCard>
          )}

          <FieldCard
            title="Call to Action"
            onRegenerate={isEditable ? () => handleRegenerate('cta') : undefined}
            regenerating={regeneratingField === 'cta'}
            shimmer={regeneratingField === 'cta'}
          >
            <Input value={cta} onChange={(e) => setCta(e.target.value)} disabled={!isEditable} placeholder={isReady ? undefined : 'Crafting CTA…'} />
          </FieldCard>

          <FieldCard
            title="Hashtags"
            onRegenerate={isEditable ? () => handleRegenerate('hashtags') : undefined}
            regenerating={regeneratingField === 'hashtags'}
            shimmer={regeneratingField === 'hashtags'}
            extraAction={
              isEditable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleShuffleHashtags}
                  aria-label="Shuffle hashtag order"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </Button>
              ) : undefined
            }
          >
            <HashtagChipInput hashtags={hashtags} onChange={setHashtags} disabled={!isEditable} />
          </FieldCard>

          <FieldCard title="Alt Text">
            <Textarea
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={!isEditable}
              rows={3}
              placeholder={isReady ? undefined : 'Writing alt text…'}
            />
          </FieldCard>

          <FieldCard
            title="Image Prompt"
            onRegenerate={isEditable ? () => handleRegenerate('image') : undefined}
            regenerating={regeneratingField === 'image' || imageJobInFlight}
            shimmer={regeneratingField === 'image' || imageJobInFlight}
          >
            <div className="space-y-2">
              <Textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                disabled={!isEditable}
                rows={3}
                placeholder={isReady ? undefined : 'Generating image prompt…'}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={!isEditable || regeneratingField === 'image' || imageJobInFlight}
                  onClick={() => handleRegenerate('image')}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {imageJobInFlight ? 'Generating…' : 'Regenerate Image'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setUploadOpen(true)}
                  disabled={!isEditable}
                >
                  Upload Image
                </Button>
              </div>
            </div>
          </FieldCard>

          {isReady && (
            <MusicSelectionPanel project={project} />
          )}

          {project.postType === 'carousel' && (
            <FieldCard title={`Carousel Slides (${imageAssets.length}/10)`}>
              <div className="space-y-3">
                <p className="text-xs text-textSecondary">
                  Add up to 10 slides. Use the arrows to change sequence, or remove slides.
                </p>
                <div className="flex flex-wrap gap-3">
                  {imageAssets.map((asset, idx) => (
                    <div
                      key={asset._id + '-' + idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={cn(
                        "group relative flex h-20 w-20 cursor-pointer flex-col overflow-hidden rounded-md border bg-backgroundMuted transition-all",
                        idx === activeSlideIndex ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-textSecondary"
                      )}
                    >
                      <img src={asset.url} alt="" className="h-full w-full object-cover" />
                      <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white shadow-sm">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSlide(idx);
                        }}
                        disabled={imageAssets.length <= 2 || !isEditable}
                        className="absolute right-1 top-1 hidden rounded bg-danger/80 p-1 text-white hover:bg-danger group-hover:block disabled:opacity-50"
                        title="Remove slide"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 flex h-6 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={idx === 0 || !isEditable}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSlide(idx, 'left');
                          }}
                          className="flex flex-1 items-center justify-center text-white hover:bg-white/20 disabled:opacity-30"
                          title="Move left"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === imageAssets.length - 1 || !isEditable}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSlide(idx, 'right');
                          }}
                          className="flex flex-1 items-center justify-center text-white hover:bg-white/20 disabled:opacity-30"
                          title="Move right"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {imageAssets.length < 10 && isEditable && (
                    <button
                      type="button"
                      onClick={() => setUploadOpen(true)}
                      className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-surface hover:bg-backgroundMuted transition-colors"
                    >
                      <Plus className="h-4 w-4 text-textTertiary" />
                      <span className="text-[10px] text-textTertiary font-semibold">Add Slide</span>
                    </button>
                  )}
                </div>
              </div>
            </FieldCard>
          )}
        </div>
      </div>

      <MediaUploadDropzone open={uploadOpen} onOpenChange={setUploadOpen} brandId={project.brand} onUploaded={handleUploadedAssets} />

      {/* Surface a prior failed publish (e.g. a background scheduled publish
          that failed) so the reason is visible when revisiting the project,
          not just an unexplained state. */}
      {project.status === 'failed' && project.schedule.lastPublishError && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-md border border-danger/30 bg-dangerSubtle px-3 py-2 sm:mx-8">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-danger">Last publish attempt failed</p>
            <p className="mt-0.5 break-words text-xs text-textSecondary">{project.schedule.lastPublishError}</p>
          </div>
        </div>
      )}

      {/* Sticky bottom action bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-surface px-4 py-3 sm:px-8">
        {project.status === 'published' ? (
          <Button variant="accent-glow" onClick={onDone}>
            Done
          </Button>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingImage(true)}
                    disabled={!isEditable || !imageUrl || !imageReady}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Edit Image
                  </Button>
                </span>
              </TooltipTrigger>
              {(!imageUrl || !imageReady) && <TooltipContent>Generate an image first</TooltipContent>}
            </Tooltip>

            <Button variant="secondary" onClick={handleSaveDraft} disabled={!isEditable || actionBusy}>
              {updateStatusMutation.isPending ? 'Saving…' : 'Save as Draft'}
            </Button>

            <ScheduleButton
              disabled={!isEditable || actionBusy}
              onSchedule={handleSchedule}
              isScheduled={project.status === 'scheduled' || project.status === 'failed' || !!project.schedule.scheduledAt}
            />

            <Button
              variant="accent-glow"
              onClick={handlePublishNow}
              disabled={!isEditable || !imageUrl || !imageReady || actionBusy}
            >
              <Send className="h-4 w-4" />
              {publishMutation.isPending || project.status === 'publishing' ? 'Publishing…' : 'Publish now'}
            </Button>
          </>
        )}
      </div>

      {isEditingImage && imageUrl && (
        <ImageEditor
          // Remount (fresh canvas) when the source image changes — the editor's
          // setup effect intentionally runs once per instance, so a new URL
          // must be a new instance or it would keep showing the old image.
          key={imageUrl}
          imageUrl={imageUrl}
          brandLogoUrl={brandLogoUrl}
          brandId={project.brand}
          onCancel={() => setIsEditingImage(false)}
          onDone={(asset) => {
            // Reflect the edit in the preview immediately, then persist the new
            // MediaAsset as the project's image so publishing/revisits use it.
            // Use mutateAsync so the write is in-flight (actionBusy true) — the
            // publish/schedule buttons stay disabled until it settles, matching
            // how text edits are awaited before publish.
            setImageUrl(asset.url);
            setIsEditingImage(false);
            void updateProjectMutation.mutateAsync({
              projectId: project._id,
              payload: { imageAssetId: asset._id },
            });
          }}
        />
      )}
    </div>
  );
}

interface ScheduleButtonProps {
  disabled?: boolean;
  onSchedule: (date: Date) => void;
  isScheduled?: boolean;
}

function ScheduleButton({ disabled, onSchedule, isScheduled }: ScheduleButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('09:00');

  const [error, setError] = useState<string | null>(null);

  function confirm() {
    if (!date) return;
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours ?? 9, minutes ?? 0, 0, 0);
    // The calendar disables past DAYS, but "today" is selectable and the time
    // input is unconstrained — so today + a past time yields an instant in the
    // past, which the publish engine would fire on its next tick. Block it.
    if (combined.getTime() <= Date.now()) {
      setError('Pick a time in the future.');
      return;
    }
    setError(null);
    onSchedule(combined);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="accent-glow" disabled={disabled}>
          <CalendarClock className="h-4 w-4" />
          {isScheduled ? 'Reschedule' : 'Schedule'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="end">
        <div className="space-y-3">
          <Calendar mode="single" selected={date} onSelect={setDate} disabled={{ before: new Date() }} />
          <Input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              setError(null);
            }}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button className="w-full" onClick={confirm} disabled={!date}>
            {isScheduled ? 'Confirm Reschedule' : 'Confirm Schedule'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
