import { cn } from '@/core/utils/cn';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-backgroundMuted', className)} {...props} />;
}

export { Skeleton };
