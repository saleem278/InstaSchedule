import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/core/utils/cn';

export interface Step {
  key: string;
  label: string;
}

interface StepTrackerProps {
  steps: Step[];
  /** Index of the currently active (pulsing) step. */
  activeIndex: number;
  /** Indices of steps considered complete (render spring-scale checkmark). */
  completedIndices: Set<number>;
  /** True when the active step has errored (renders it in the danger color instead of pulsing). */
  errored?: boolean;
}

/**
 * Slim horizontal step tracker: dot + label per step. The active step's dot
 * pulses via a framer-motion opacity loop; completed steps show a
 * spring-scale checkmark that pops in.
 */
export function StepTracker({ steps, activeIndex, completedIndices, errored = false }: StepTrackerProps): React.JSX.Element {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex w-full min-w-max items-center justify-center gap-1.5 px-1 sm:gap-3">
        {steps.map((step, index) => {
          const isCompleted = completedIndices.has(index);
          const isActive = index === activeIndex && !isCompleted;

          return (
            <div key={step.key} className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                    isCompleted && 'border-success bg-success text-accentForeground',
                    isActive && !errored && 'border-accent bg-accent text-accentForeground',
                    isActive && errored && 'border-danger bg-danger text-accentForeground',
                    !isCompleted && !isActive && 'border-border bg-backgroundMuted text-textTertiary'
                  )}
                >
                  {isCompleted ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </motion.span>
                  ) : isActive ? (
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-current"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </div>
                <span
                  className={cn(
                    'hidden whitespace-nowrap text-center text-[10px] font-medium sm:block',
                    isCompleted && 'text-success',
                    isActive && !errored && 'text-accent',
                    isActive && errored && 'text-danger',
                    !isCompleted && !isActive && 'text-textTertiary'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn('h-px w-3 shrink-0 sm:w-6', isCompleted ? 'bg-success' : 'bg-border')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
