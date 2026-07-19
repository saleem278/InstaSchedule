import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneFrame } from './PhoneFrame';
import { DevelopingImage } from './DevelopingImage';
import { cn } from '@/core/utils/cn';
import type { InstagramMockProps } from './types';

const SWIPE_THRESHOLD = 60;

/**
 * Like FeedMock but with dot pagination + a framer-motion drag="x" swipe
 * across N slides. Since the API only ever returns a single generated image,
 * this synthesizes a fixed 3-slide carousel reusing the same image so the
 * interaction pattern can be demonstrated/reviewed.
 */
export function CarouselMock({
  brandName,
  brandLogoUrl,
  imageUrl,
  imageUrls,
  caption,
  hashtags,
  loading = false,
  imageLoading = false,
  imageFailed = false,
  onRetryImage,
  textReady = true,
  glow = false,
  className,
}: InstagramMockProps): React.JSX.Element {
  const displayImages = imageUrls && imageUrls.length > 0
    ? imageUrls
    : imageUrl ? [imageUrl, imageUrl, imageUrl] : [];
  const slideCount = displayImages.length;
  const [index, setIndex] = useState(0);

  const handleDragEnd = (_e: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -SWIPE_THRESHOLD && index < slideCount - 1) {
      setIndex((i) => i + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && index > 0) {
      setIndex((i) => i - 1);
    }
  };

  return (
    <PhoneFrame aspect="auto" glow={glow} className={className}>
      <div className="flex h-full flex-col bg-surface">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : (
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={brandLogoUrl} alt={brandName} />
                <AvatarFallback className="text-[10px]">{brandName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            {loading ? (
              <Skeleton className="h-3 w-20" />
            ) : (
              <span className="text-xs font-semibold text-textPrimary">{brandName}</span>
            )}
          </div>
          <MoreHorizontal className="h-4 w-4 text-textPrimary" />
        </div>

        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-backgroundMuted">
          {loading || imageLoading || displayImages.length === 0 ? (
            <DevelopingImage
              imageUrl={imageUrl}
              imageLoading={loading || imageLoading}
              imageFailed={imageFailed}
              onRetry={onRetryImage}
              variant="fill"
            />
          ) : (
            <motion.div
              className="flex h-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              animate={{ x: `${-index * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ width: `${slideCount * 100}%` }}
            >
              {displayImages.map((imgUrl, i) => (
                <div key={i} className="h-full w-full shrink-0" style={{ width: `${100 / slideCount}%` }}>
                  <img src={imgUrl} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </motion.div>
          )}

          {!loading && !imageLoading && displayImages.length > 0 && (
            <div className="absolute inset-x-0 top-2 flex justify-center gap-1">
              {displayImages.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    i === index ? 'bg-accent' : 'bg-white/60'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
            <MessageCircle className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
            <Send className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
          </div>
          <Bookmark className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-xs font-semibold text-textPrimary">1,204 likes</p>
          {loading || !textReady ? (
            <div className="mt-1.5 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-textPrimary">
              <span className="font-semibold">{brandName}</span> {caption}
              {caption ? <span className="text-textTertiary"> ...more</span> : null}
            </p>
          )}
          {!loading && textReady && hashtags.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-x-1.5 text-xs">
              {hashtags.map((tag) => (
                <span key={tag} className="font-medium text-accent">
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
