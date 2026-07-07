import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/core/utils/cn';
import { AUTH_ENDPOINTS } from '@/core/api/endpoints';
import { useAuthConfig } from '../hooks/useAuthConfig';

/**
 * Renders "Continue with Google" only when GET /auth/config reports
 * googleEnabled:true. This is a plain anchor (full-page redirect into the
 * backend's OAuth flow), not an axios call — the browser must navigate away.
 *
 * Icon choice: inline SVG (Google's official multi-color "G" mark). Not
 * using a lucide-react icon here since lucide has no brand glyph for Google
 * and a generic icon would misrepresent the provider.
 */
export function GoogleButton(): React.JSX.Element | null {
  const { data, isLoading } = useAuthConfig();

  if (isLoading || !data?.googleEnabled) {
    return null;
  }

  return (
    <a
      href={AUTH_ENDPOINTS.google}
      className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full gap-3')}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.998 11.998 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.998 11.998 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
        />
      </svg>
      Continue with Google
    </a>
  );
}
