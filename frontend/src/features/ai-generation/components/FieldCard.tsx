import type { ReactNode } from 'react';
import { RotateCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/cn';

interface FieldCardProps {
  title: string;
  children: ReactNode;
  /** Shows a spinning regenerate icon button in the header; omit to hide it entirely. */
  onRegenerate?: () => void;
  regenerating?: boolean;
  /** Disables the regenerate button (e.g. no image prompt yet) without hiding it. */
  regenerateDisabled?: boolean;
  /** Renders a localized border-pulse shimmer in accent color ONLY on this card while true. */
  shimmer?: boolean;
  counter?: string;
  extraAction?: ReactNode;
  className?: string;
}

/**
 * Shared card shell for the Preview & Edit step's right-hand field list
 * (Caption, CTA, Hashtags, Alt Text, Image Prompt). Each card owns its own
 * regenerate affordance and shimmer state so other cards stay fully
 * interactive while one field's regeneration is in flight.
 */
export function FieldCard({
  title,
  children,
  onRegenerate,
  regenerating = false,
  regenerateDisabled = false,
  shimmer = false,
  counter,
  extraAction,
  className,
}: FieldCardProps): React.JSX.Element {
  return (
    <Card
      className={cn(
        'transition-shadow duration-300',
        shimmer && 'animate-pulse border-accent shadow-glow-accent',
        className
      )}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-textPrimary">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {counter && <span className="text-xs text-textTertiary">{counter}</span>}
          {extraAction}
          {onRegenerate && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRegenerate}
              disabled={regenerating || regenerateDisabled}
              aria-label={`Regenerate ${title}`}
            >
              {regenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCw className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
