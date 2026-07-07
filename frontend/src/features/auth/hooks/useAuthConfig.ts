import { useQuery } from '@tanstack/react-query';
import { getAuthConfig } from '../api/auth.api';

/**
 * Fetches public auth configuration (currently just whether Google OAuth is
 * enabled) once per session. Backing endpoint: GET /auth/config.
 */
export function useAuthConfig() {
  return useQuery({
    queryKey: ['auth', 'config'],
    queryFn: getAuthConfig,
    staleTime: Infinity,
    retry: 1,
  });
}
