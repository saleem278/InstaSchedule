import type { ReactNode } from 'react';
import { cn } from '@/core/utils/cn';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  /**
   * Aspect ratio of the frame's viewport area. `tall` (9:16) is for Story's
   * full-bleed layout. `auto` lets the frame grow to its content's natural
   * height — required for Feed/Carousel, whose header + square image +
   * scrollable caption must NOT be clipped by a fixed outer aspect box.
   */
  aspect?: 'square' | 'portrait' | 'tall' | 'auto';
  /** Applies the restrained success-cue glow pulse (300ms in / 500ms out). */
  glow?: boolean;
}

const ASPECT_CLASS: Record<NonNullable<PhoneFrameProps['aspect']>, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[4/5]',
  tall: 'aspect-[9/16]',
  auto: '',
};

/**
 * Minimal rounded-rect device bezel — a status-bar-style top strip, not a
 * literal iPhone skeuomorph (no notch/camera cutout). Shared by FeedMock,
 * StoryMock, and CarouselMock so all three previews sit inside identical
 * chrome.
 */
export function PhoneFrame({ children, className, aspect = 'square', glow = false }: PhoneFrameProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-md transition-shadow duration-300',
        glow && 'shadow-glow-accent duration-300',
        className
      )}
    >
      {/* status-bar-style top strip */}
      <div className="flex h-6 shrink-0 items-center justify-between bg-surface px-4 text-[10px] font-medium text-textTertiary">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-3 rounded-sm bg-textTertiary/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-textTertiary/60" />
          <span className="h-1.5 w-4 rounded-sm bg-textTertiary/60" />
        </div>
      </div>
      <div className={cn('relative w-full overflow-hidden bg-backgroundMuted', ASPECT_CLASS[aspect])}>
        {children}
      </div>
    </div>
  );
}
