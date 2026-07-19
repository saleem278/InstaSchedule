/**
 * Shared prop contract for the FeedMock / StoryMock / CarouselMock family,
 * reused by both the static Preview & Edit step and the staged-reveal
 * GenerationProgress step (via `loading`/per-field ready flags).
 */
export interface InstagramPreviewContent {
  brandName: string;
  brandLogoUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
  postType?: string;
  caption: string;
  hashtags: string[];
  cta?: string;
  altText?: string;
}

export interface InstagramMockProps extends InstagramPreviewContent {
  /** Renders full skeleton placeholders in the exact same layout when true. */
  loading?: boolean;
  /** Independent of `loading` — lets the image area resolve before/after text (used by GenerationProgress). */
  imageLoading?: boolean;
  /** True once the image job has failed or timed out — shows a retry affordance instead of pulsing forever. */
  imageFailed?: boolean;
  /** Called when the user clicks Retry on a failed/timed-out image. */
  onRetryImage?: () => void;
  /** Independent of `loading` — lets caption/cta/hashtags resolve progressively (used by GenerationProgress). */
  textReady?: boolean;
  /** Applies the restrained success-cue box-shadow glow pulse (300ms in / 500ms out) to the phone frame. */
  glow?: boolean;
  className?: string;
}
