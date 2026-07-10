import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import type { UseFormSetError } from 'react-hook-form';
import * as authApi from '../api/auth.api';
import { AUTH_ME_QUERY_KEY } from './useCurrentUser';
import { useActiveBrandStore } from '@/features/brands/store/activeBrandStore';
import type { LoginFormValues, RegisterFormValues } from '../schemas/auth.schema';

function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

/**
 * Pin a server error under the email field ONLY when it's specifically about
 * the email (e.g. "account with this email already exists"). A generic
 * credential failure like "Invalid email or password" also contains the word
 * "email" but is NOT an email-field problem — pinning it there wrongly implies
 * the email is wrong when the password may be. Those fall through to a
 * form-level toast instead.
 */
function maybeSetInlineEmailError(
  message: string,
  setError?: UseFormSetError<LoginFormValues | RegisterFormValues>
): boolean {
  if (!setError) return false;
  const isEmailSpecific = /already (exists|registered)|email is (invalid|already)|valid email/i.test(message);
  if (isEmailSpecific) {
    setError('email', { type: 'server', message });
    return true;
  }
  return false;
}

interface AuthMutationOptions {
  setError?: UseFormSetError<LoginFormValues | RegisterFormValues>;
}

/**
 * Login/register/logout actions only — does NOT check or query the current
 * session. Mounting this hook never fires `/auth/me`. For session state
 * (`user`, `isAuthenticated`, `isLoading`), use `useCurrentUser` instead.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (user) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, user);
      await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
      navigate('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (user) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, user);
      await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
      navigate('/dashboard');
    },
  });

  // Logout should always leave the client logged out, even if the network
  // call fails (backend logout is now idempotent and unauthenticated, so this
  // is belt-and-suspenders). Tear down session state in a shared helper run
  // from both onSuccess and onError.
  const teardownSession = useCallback(() => {
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
    useActiveBrandStore.getState().setActiveBrandId(null);
    navigate('/login');
  }, [queryClient, navigate]);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: teardownSession,
    onError: teardownSession,
  });

  const login = useCallback(
    async (values: LoginFormValues, options?: AuthMutationOptions): Promise<string | null> => {
      try {
        await loginMutation.mutateAsync(values);
        return null;
      } catch (error) {
        const message = extractErrorMessage(error);
        const handledInline = maybeSetInlineEmailError(message, options?.setError);
        if (!handledInline) {
          toast.error(message);
        }
        return message;
      }
    },
    [loginMutation]
  );

  const register = useCallback(
    async (values: RegisterFormValues, options?: AuthMutationOptions): Promise<string | null> => {
      try {
        await registerMutation.mutateAsync(values);
        return null;
      } catch (error) {
        const message = extractErrorMessage(error);
        const handledInline = maybeSetInlineEmailError(message, options?.setError);
        if (!handledInline) {
          toast.error(message);
        }
        return message;
      }
    },
    [registerMutation]
  );

  const logout = useCallback(() => logoutMutation.mutateAsync(), [logoutMutation]);

  return {
    login,
    register,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
