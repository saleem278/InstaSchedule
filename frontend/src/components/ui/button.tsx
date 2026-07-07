import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/core/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accentForeground shadow-xs hover:bg-accentHover',
        secondary: 'bg-backgroundMuted text-textPrimary shadow-xs hover:bg-borderStrong/40',
        outline: 'border border-border bg-transparent text-textPrimary hover:bg-backgroundMuted',
        ghost: 'text-textPrimary hover:bg-backgroundMuted',
        destructive: 'bg-danger text-accentForeground shadow-xs hover:bg-danger/90',
        link: 'text-accent underline-offset-4 hover:underline',
        'accent-glow':
          'bg-accent text-accentForeground shadow-xs transition-shadow duration-200 hover:bg-accentHover hover:shadow-glow-accent',
      },
      size: {
        sm: 'h-8 rounded-sm px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 rounded-lg px-6 text-base',
        icon: 'h-10 w-10 shrink-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
