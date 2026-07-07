import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surfaceRaised group-[.toaster]:text-textPrimary group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-textSecondary',
          actionButton: 'group-[.toast]:bg-accent group-[.toast]:text-accentForeground',
          cancelButton: 'group-[.toast]:bg-backgroundMuted group-[.toast]:text-textSecondary',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
