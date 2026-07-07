import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, RotateCw, Shuffle, CalendarClock, ImageIcon, Send } from 'lucide-react';
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
import { useRegenerateField } from '../hooks/useRegenerateField';
import { useJobPolling } from '../hooks/useJobPolling';
import { useUpdateProject } from '@/features/projects/hooks/useUpdateProject';
import { useUpdateProjectStatus } from '@/features/projects/hooks/useUpdateProjectStatus';
import { usePublishProject } from '@/features/projects/hooks/usePublishProject';
import { ImageEditor } from '@/features/image-editor';
import type { Project } from '@/features/projects/schemas/project.types';
import type { RegenerableField } from '../schemas/generation.types';

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
  const [imageJobId, setImageJobId] = useState<string | undefined>(undefined);

  // Local editable field state, seeded from the project's persisted content —
  // this is also the initial state while a fresh generation is in flight (the
  // fields just render as skeleton/disabled until phase flips to 'ready').
  const [caption, setCaption] = useState(project.content.caption);
  const [cta, setCta] = useState(project.content.cta);
  const [hashtags, setHashtags] = useState<string[]>(project.content.hashtags);
  const [altText, setAltText] = useState(project.content.altText);
  const [imagePrompt, setImagePrompt] = useState(project.content.imagePrompt);
  const [imageUrl, setImageUrl] = useState<string | undefined>(project.imageAsset?.url);

  const generateMutation = useGenerateContent();
  const regenerateMutation = useRegenerateField();
  const updateProjectMutation = useUpdateProject();
  const updateStatusMutation = useUpdateProjectStatus();
  const publishMutation = usePublishProject();

  const jobQuery = useJobPolling(project._id, imageJobId);

  const hasFiredRef = useRef(false);

  // --- Step 2: fire the generate mutation on mount, with a short cosmetic
  // pacing timer to advance "Understanding topic" -> "Writing caption" while
  // we wait (the backend has no granular progress to drive this off of). ---
  useEffect(() => {
    if (skipGeneration) return;
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    const pacingTimer = setTimeout(() => {
      setPacingStepIndex(1);
      setLiveMessage('Writing caption');
    }, 800);

    generateMutation.mutate(project._id, {
      onSuccess: (result) => {
        setCaption(result.generation.output.caption);
        setCta(result.generation.output.cta);
        setHashtags(result.generation.output.hashtags);
        setAltText(result.generation.output.altText);
        setImagePrompt(result.generation.output.imagePrompt);
        if (result.generation.output.imageUrl) {
          setImageUrl(result.generation.output.imageUrl);
        }
        setImageJobId(result.imageJob.jobId);

        // Step 3: stagger the CHECKMARK animations for "Understanding topic"
        // and "Writing caption" even though the text arrived in one response
        // together — this is a deliberate cosmetic choice to keep the
        // tracker feeling sequential/alive rather than all steps completing
        // instantly. Hashtags checkmark follows shortly after.
        setCompletedIndices((prev) => new Set(prev).add(0));
        setPacingStepIndex(2);
        setTimeout(() => setCompletedIndices((prev) => new Set(prev).add(1)), 350);
        setTimeout(() => {
          setCompletedIndices((prev) => new Set(prev).add(2));
          setPacingStepIndex(3);
          setLiveMessage('Generating image');
        }, 700);
      },
    });

    return () => {
      clearTimeout(pacingTimer);
      // Reset the guard on cleanup so React 19 StrictMode's dev-only
      // mount->cleanup->remount cycle doesn't skip firing the mutation on
      // the remount that actually persists (the ref would otherwise still
      // read `true` from the discarded first mount, silently attaching
      // onSuccess to a component instance that gets thrown away).
      hasFiredRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  // --- Step 4: once the polled job completes, capture the image URL. ---
  useEffect(() => {
    if (jobQuery.data?.status === 'completed' && jobQuery.data.output.imageUrl) {
      setImageUrl(jobQuery.data.output.imageUrl);
      setCompletedIndices((prev) => new Set(prev).add(3));
      setPacingStepIndex(4);
      setLiveMessage('Finalizing');
    }
  }, [jobQuery.data]);

  const textReady = generateMutation.isSuccess;
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

  const generateFailed = generateMutation.isError;

  const regeneratingField = regenerateMutation.isPending ? regenerateMutation.variables?.field : undefined;

  function handleRegenerate(field: RegenerableField | 'image') {
    regenerateMutation.mutate(
      { projectId: project._id, field },
      {
        onSuccess: (result) => {
          if (result.field === 'image') {
            setImageJobId(result.imageJob.jobId);
            if (result.generation.output.imageUrl) {
              setImageUrl(result.generation.output.imageUrl);
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
      return; // useUpdateProject toasts its own error
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
      return;
    }
    publishMutation.mutate(project._id, { onSuccess: () => onDone?.() });
  }

  function handleShuffleHashtags() {
    setHashtags((prev) => [...prev].sort(() => Math.random() - 0.5));
  }

  const isReady = phase === 'ready';

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
            caption={caption}
            hashtags={hashtags}
            cta={cta}
            altText={altText}
            imageLoading={!imageReady && !imageFailed}
            imageFailed={imageFailed}
            onRetryImage={() => handleRegenerate('image')}
            textReady={textReady || phase === 'ready'}
            glow={glowPulse}
          />
        </div>

        {/* Right: field cards, 40% on desktop */}
        <div className="flex flex-col gap-4 sm:w-[45%]">
          {generateFailed ? (
            <FieldCard title="Caption">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="h-8 w-8 text-danger" />
                <p className="text-sm text-textSecondary">Something went wrong generating this.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateMutation.mutate(project._id)}
                  disabled={generateMutation.isPending}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            </FieldCard>
          ) : (
            <FieldCard
              title="Caption"
              counter={`${caption.length}/2200`}
              onRegenerate={isReady ? () => handleRegenerate('caption') : undefined}
              regenerating={regeneratingField === 'caption'}
              shimmer={regeneratingField === 'caption'}
            >
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                disabled={!isReady}
                rows={5}
                placeholder={isReady ? undefined : 'Writing caption…'}
              />
            </FieldCard>
          )}

          <FieldCard
            title="Call to Action"
            onRegenerate={isReady ? () => handleRegenerate('cta') : undefined}
            regenerating={regeneratingField === 'cta'}
            shimmer={regeneratingField === 'cta'}
          >
            <Input value={cta} onChange={(e) => setCta(e.target.value)} disabled={!isReady} placeholder={isReady ? undefined : 'Crafting CTA…'} />
          </FieldCard>

          <FieldCard
            title="Hashtags"
            onRegenerate={isReady ? () => handleRegenerate('hashtags') : undefined}
            regenerating={regeneratingField === 'hashtags'}
            shimmer={regeneratingField === 'hashtags'}
            extraAction={
              isReady ? (
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
            <HashtagChipInput hashtags={hashtags} onChange={setHashtags} disabled={!isReady} />
          </FieldCard>

          <FieldCard title="Alt Text">
            <Textarea
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={!isReady}
              rows={3}
              placeholder={isReady ? undefined : 'Writing alt text…'}
            />
          </FieldCard>

          <FieldCard
            title="Image Prompt"
            onRegenerate={isReady ? () => handleRegenerate('image') : undefined}
            regenerating={regeneratingField === 'image'}
            shimmer={regeneratingField === 'image'}
          >
            <div className="space-y-2">
              <Textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                disabled={!isReady}
                rows={3}
                placeholder={isReady ? undefined : 'Generating image prompt…'}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={!isReady || regeneratingField === 'image'}
                onClick={() => handleRegenerate('image')}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Regenerate Image
              </Button>
            </div>
          </FieldCard>
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-surface px-4 py-3 sm:px-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="outline"
                onClick={() => setIsEditingImage(true)}
                disabled={!isReady || !imageUrl || !imageReady}
              >
                <ImageIcon className="h-4 w-4" />
                Edit Image
              </Button>
            </span>
          </TooltipTrigger>
          {(!imageUrl || !imageReady) && <TooltipContent>Generate an image first</TooltipContent>}
        </Tooltip>

        <Button variant="secondary" onClick={handleSaveDraft} disabled={!isReady || updateStatusMutation.isPending}>
          Save as Draft
        </Button>

        <ScheduleButton
          disabled={!isReady || publishMutation.isPending}
          onSchedule={handleSchedule}
        />

        <Button
          variant="accent-glow"
          onClick={handlePublishNow}
          disabled={
            !isReady || !imageUrl || !imageReady || publishMutation.isPending || updateProjectMutation.isPending
          }
        >
          <Send className="h-4 w-4" />
          {publishMutation.isPending ? 'Publishing…' : 'Publish now'}
        </Button>
      </div>

      {isEditingImage && imageUrl && (
        <ImageEditor
          imageUrl={imageUrl}
          brandLogoUrl={brandLogoUrl}
          brandId={project.brand}
          onCancel={() => setIsEditingImage(false)}
          onDone={(asset) => {
            // Reflect the edit in the preview immediately, then persist the new
            // MediaAsset as the project's image so publishing/revisits use it.
            setImageUrl(asset.url);
            setIsEditingImage(false);
            updateProjectMutation.mutate({ projectId: project._id, payload: { imageAssetId: asset._id } });
          }}
        />
      )}
    </div>
  );
}

interface ScheduleButtonProps {
  disabled?: boolean;
  onSchedule: (date: Date) => void;
}

function ScheduleButton({ disabled, onSchedule }: ScheduleButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('09:00');

  function confirm() {
    if (!date) return;
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours ?? 9, minutes ?? 0, 0, 0);
    onSchedule(combined);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="accent-glow" disabled={disabled}>
          <CalendarClock className="h-4 w-4" />
          Schedule
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="end">
        <div className="space-y-3">
          <Calendar mode="single" selected={date} onSelect={setDate} disabled={{ before: new Date() }} />
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Button className="w-full" onClick={confirm} disabled={!date}>
            Confirm Schedule
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
