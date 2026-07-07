import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import * as authApi from '../api/auth.api';
import type { AuthUser } from '../api/auth.api';

export const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const;

/**
 * Owns the `/auth/me` session check. Use this (not `useAuth`) anywhere that
 * genuinely needs to know who's logged in or whether a session exists —
 * ProtectedRoute, the `/` redirect, account/profile displays. Login/register
 * forms should use `useAuth` instead so mounting them doesn't fire a
 * session check that's irrelevant on an unauthenticated page.
 */
export function useCurrentUser() {
  const meQuery = useQuery<AuthUser | null>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: async () => {
      try {
        return await authApi.getMe();
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    isAuthenticated: Boolean(meQuery.data),
  };
}
