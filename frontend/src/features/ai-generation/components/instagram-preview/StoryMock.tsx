import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneFrame } from './PhoneFrame';
import { DevelopingImage } from './DevelopingImage';
import type { InstagramMockProps } from './types';

/**
 * 9:16 phone-frame story. CTA renders as a pill-shaped sticker near the
 * bottom, mimicking Instagram's link/swipe-up sticker treatment.
 */
export function StoryMock({
  brandName,
  brandLogoUrl,
  imageUrl,
  cta,
  loading = false,
  imageLoading = false,
  imageFailed = false,
  onRetryImage,
  textReady = true,
  glow = false,
  className,
}: InstagramMockProps): React.JSX.Element {
  return (
    <PhoneFrame aspect="tall" glow={glow} className={className}>
      <div className="relative h-full w-full bg-black">
        {/* Progress bar segments */}
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full w-full bg-white" />
          </div>
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30" />
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30" />
        </div>

        {/* Header */}
        <div className="absolute inset-x-2 top-5 z-10 flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-6 w-6 rounded-full" />
          ) : (
            <Avatar className="h-6 w-6 border border-white/40">
              <AvatarImage src={brandLogoUrl} alt={brandName} />
              <AvatarFallback className="text-[9px]">{brandName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs font-semibold text-white drop-shadow">{brandName}</span>
        </div>

        {/* Full-bleed image */}
        <DevelopingImage
          imageUrl={imageUrl}
          imageLoading={loading || imageLoading}
          imageFailed={imageFailed}
          onRetry={onRetryImage}
          alt="Story preview"
          variant="fill"
        />

        {/* CTA pill sticker */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center">
          {loading || !textReady ? (
            <Skeleton className="h-8 w-32 rounded-full" />
          ) : cta ? (
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-textPrimary shadow-md">
              {cta}
            </span>
          ) : null}
        </div>
      </div>
    </PhoneFrame>
  );
}
