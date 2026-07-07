import { useEffect, useState } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { cn } from '@/core/utils/cn';

interface DevelopingImageProps {
  imageUrl?: string;
  imageLoading?: boolean;
  /** True once the image job has failed or timed out — shows a retry affordance instead of pulsing forever. */
  imageFailed?: boolean;
  onRetry?: () => void;
  alt?: string;
  /** 'fill' = absolute inset-0 (StoryMock's full-bleed layout), 'block' = relative h-full w-full (Feed/Carousel). */
  variant?: 'fill' | 'block';
  className?: string;
}

/**
 * Shared "developing photo" image cell for the Instagram preview family
 * (Feed/Story/Carousel): a pulsing violet gradient while generating, a
 * blur-to-sharp reveal once the image arrives, and a clear failed/retry
 * state so a failed or timed-out image job doesn't pulse forever with no
 * way out (see useJobPolling's POLL_TIMEOUT_MS).
 */
export function DevelopingImage({
  imageUrl,
  imageLoading,
  imageFailed,
  onRetry,
  alt = 'Post preview',
  variant = 'block',
  className,
}: DevelopingImageProps): React.JSX.Element {
  const [developed, setDeveloped] = useState(false);

  useEffect(() => {
    if (imageUrl && !imageLoading) {
      const raf = requestAnimationFrame(() => setDeveloped(true));
      return () => cancelAnimationFrame(raf);
    }
    setDeveloped(false);
    return undefined;
  }, [imageUrl, imageLoading]);

  const wrapperClass = variant === 'fill' ? 'absolute inset-0' : 'h-full w-full';

  if (imageFailed && !imageUrl) {
    return (
      <div
        className={cn(
          wrapperClass,
          'flex flex-col items-center justify-center gap-2 bg-backgroundMuted text-center',
          className
        )}
      >
        <AlertCircle className="h-6 w-6 text-danger" />
        <p className="max-w-[80%] text-xs text-textSecondary">Couldn't generate the image.</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-textPrimary shadow-sm transition-colors hover:bg-backgroundMuted"
          >
            <RotateCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!imageUrl || imageLoading) {
    return (
      <div
        className={cn(
          wrapperClass,
          'animate-pulse-gradient bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/0.35),transparent_60%),radial-gradient(circle_at_70%_70%,hsl(var(--accent)/0.25),transparent_55%)] bg-[length:200%_200%] bg-backgroundMuted',
          className
        )}
        role="img"
        aria-label="Generating image"
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={cn(wrapperClass, 'object-cover transition-[filter] duration-500 ease-out', className)}
      style={{ filter: developed ? 'blur(0px)' : 'blur(24px)' }}
    />
  );
}
