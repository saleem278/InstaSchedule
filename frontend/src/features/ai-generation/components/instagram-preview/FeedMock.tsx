import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneFrame } from './PhoneFrame';
import { DevelopingImage } from './DevelopingImage';
import { cn } from '@/core/utils/cn';
import type { InstagramMockProps } from './types';

const wordVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
};

const captionContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03 },
  },
};

const hashtagContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const hashtagVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 22 } },
};

export function FeedMock({
  brandName,
  brandLogoUrl,
  imageUrl,
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
  const words = caption ? caption.split(' ') : [];

  return (
    <PhoneFrame aspect="auto" glow={glow} className={className}>
      <div className="flex h-full flex-col bg-surface">
        {/* Header */}
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

        {/* Image */}
        <div className="relative aspect-square w-full shrink-0 bg-backgroundMuted">
          <DevelopingImage
            imageUrl={imageUrl}
            imageLoading={loading || imageLoading}
            imageFailed={imageFailed}
            onRetry={onRetryImage}
            alt="Post preview"
          />
        </div>

        {/* Action row */}
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
            <MessageCircle className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
            <Send className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
          </div>
          <Bookmark className="h-5 w-5 text-textPrimary" strokeWidth={1.75} />
        </div>

        {/* Likes + caption */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-xs font-semibold text-textPrimary">1,204 likes</p>

          {loading || !textReady ? (
            <div className="mt-1.5 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-textPrimary">
              <span className="font-semibold">{brandName}</span>{' '}
              <motion.span
                variants={captionContainerVariants}
                initial="hidden"
                animate="visible"
                className="inline"
              >
                {words.map((word, i) => (
                  <motion.span key={`${word}-${i}`} variants={wordVariants} className="inline-block">
                    {word}
                    {i < words.length - 1 ? ' ' : ''}
                  </motion.span>
                ))}
              </motion.span>
              {caption ? <span className="text-textTertiary"> ...more</span> : null}
            </p>
          )}

          {loading || !textReady ? (
            <div className="mt-1.5 flex gap-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          ) : hashtags.length > 0 ? (
            <motion.p
              variants={hashtagContainerVariants}
              initial="hidden"
              animate="visible"
              className="mt-1 flex flex-wrap gap-x-1.5 text-xs"
            >
              {hashtags.map((tag) => (
                <motion.span
                  key={tag}
                  variants={hashtagVariants}
                  className={cn('font-medium text-accent')}
                >
                  #{tag.replace(/^#/, '')}
                </motion.span>
              ))}
            </motion.p>
          ) : null}

          <p className="mt-1 text-[10px] uppercase tracking-wide text-textTertiary">2 hours ago</p>
        </div>
      </div>
    </PhoneFrame>
  );
}
