import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Providers } from '@/app/providers';
import { router } from '@/app/router';
import { setSessionExpiredHandler } from '@/core/api/apiClient';
import { AUTH_ME_QUERY_KEY } from '@/features/auth/hooks/useCurrentUser';

/**
 * Bridges the axios interceptor's "session expired" signal to React state:
 * clears the cached `me` user and navigates to /login via the router (a soft,
 * client-side redirect) instead of the interceptor's hard-reload fallback.
 * Guards against redirecting when already on an auth page.
 */
function SessionExpiryBridge(): null {
  const queryClient = useQueryClient();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        void router.navigate('/login', { state: { from: path } });
      }
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  return null;
}

export function App(): React.JSX.Element {
  return (
    <Providers>
      <SessionExpiryBridge />
      <RouterProvider router={router} />
    </Providers>
  );
}
