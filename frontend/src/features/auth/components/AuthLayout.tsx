import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Centered single-column auth shell: logo mark + product name above a card,
 * on a subtle animated gradient/mesh background using accent tokens at low
 * opacity. Shared by LoginPage and RegisterPage.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="auth-mesh-blob auth-mesh-blob--one" />
        <div className="auth-mesh-blob auth-mesh-blob--two" />
        <div className="auth-mesh-blob auth-mesh-blob--three" />
      </div>

      <div className="flex w-full max-w-[400px] flex-col items-center">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accentForeground shadow-glow-accent">
            <span className="text-lg font-bold leading-none">A</span>
          </div>
          <span className="text-base font-semibold text-textPrimary">AI Instagram Content Studio</span>
        </div>

        <div className="w-full rounded-lg border border-border bg-surface p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-textPrimary">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-textSecondary">{subtitle}</p> : null}
          </div>

          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-textSecondary">{footer}</div> : null}
      </div>

      <style>{`
        .auth-mesh-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.25;
          background: hsl(var(--accent));
          animation: auth-mesh-drift 18s ease-in-out infinite;
        }
        .auth-mesh-blob--one {
          top: -10%;
          left: -10%;
          width: 480px;
          height: 480px;
          animation-delay: 0s;
        }
        .auth-mesh-blob--two {
          bottom: -15%;
          right: -10%;
          width: 520px;
          height: 520px;
          background: hsl(var(--accent-hover));
          animation-delay: -6s;
        }
        .auth-mesh-blob--three {
          top: 40%;
          left: 60%;
          width: 380px;
          height: 380px;
          background: hsl(var(--accent-subtle));
          opacity: 0.4;
          animation-delay: -12s;
        }
        @keyframes auth-mesh-drift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(4%, 6%) scale(1.08);
          }
          66% {
            transform: translate(-5%, -4%) scale(0.95);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-mesh-blob {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
