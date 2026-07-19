import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneFrame } from './PhoneFrame';
import { DevelopingImage } from './DevelopingImage';
import { cn } from '@/core/utils/cn';
import type { InstagramMockProps } from './types';

/**
 * Like FeedMock but with dot pagination + native touch/swipe scroll
 * across slides. Supports a 4:5 aspect ratio viewport to prevent portrait
 * crop/cutoff issues, matching modern Instagram formats.
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
  activeSlideIndex,
  onActiveSlideIndexChange,
}: InstagramMockProps): React.JSX.Element {
  const displayImages = imageUrls && imageUrls.length > 0
    ? imageUrls
    : imageUrl ? [imageUrl, imageUrl, imageUrl] : [];
  const slideCount = displayImages.length;
  
  const [localIndex, setLocalIndex] = useState(0);
  const index = activeSlideIndex !== undefined ? activeSlideIndex : localIndex;
  
  const setIndex = (newIdx: number) => {
    if (onActiveSlideIndexChange) {
      onActiveSlideIndexChange(newIdx);
    } else {
      setLocalIndex(newIdx);
    }
  };

  const sliderRef = useRef<HTMLDivElement>(null);
  const isProgrammaticRef = useRef(false);

  // Sync scroll position when activeSlideIndex changes from outside
  useEffect(() => {
    const container = sliderRef.current;
    if (container && activeSlideIndex !== undefined) {
      const targetScrollLeft = activeSlideIndex * container.clientWidth;
      if (Math.abs(container.scrollLeft - targetScrollLeft) > 5) {
        isProgrammaticRef.current = true;
        container.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isProgrammaticRef.current = false;
        }, 350);
      }
    }
  }, [activeSlideIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticRef.current) return;
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== index) {
        setIndex(newIndex);
      }
    }
  };

  const scrollToIndex = (idx: number) => {
    const container = sliderRef.current;
    if (container) {
      isProgrammaticRef.current = true;
      container.scrollTo({
        left: idx * container.clientWidth,
        behavior: 'smooth',
      });
      setIndex(idx);
      setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 350);
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

        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-black border-y border-border/10">
          {loading || imageLoading || displayImages.length === 0 ? (
            <DevelopingImage
              imageUrl={imageUrl}
              imageLoading={loading || imageLoading}
              imageFailed={imageFailed}
              onRetry={onRetryImage}
              variant="fill"
            />
          ) : (
            <div
              ref={sliderRef}
              onScroll={handleScroll}
              className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
            >
              {displayImages.map((imgUrl, i) => (
                <div key={i} className="h-full w-full shrink-0 snap-start snap-always">
                  <img src={imgUrl} alt={`Slide ${i + 1}`} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          )}

          {/* Navigation Arrows */}
          {!loading && !imageLoading && displayImages.length > 1 && (
            <>
              {index > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToIndex(index - 1);
                  }}
                  className="absolute left-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors shadow-sm"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
              {index < slideCount - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToIndex(index + 1);
                  }}
                  className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors shadow-sm"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        <div className="relative flex shrink-0 items-center justify-between px-3 py-2 border-t border-border/20">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
            <MessageCircle className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
            <Send className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
          </div>

          {/* Dot Pagination indicators in the center */}
          {!loading && !imageLoading && displayImages.length > 1 && (
            <div className="absolute inset-x-0 flex justify-center gap-1 pointer-events-none">
              {displayImages.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all duration-250',
                    i === index ? 'bg-accent w-2.5' : 'bg-textSecondary/30'
                  )}
                />
              ))}
            </div>
          )}

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
