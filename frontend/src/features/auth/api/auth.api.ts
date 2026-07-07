import { apiClient } from '@/core/api/apiClient';
import { AUTH_ENDPOINTS } from '@/core/api/endpoints';
import type { LoginFormValues, RegisterFormValues } from '../schemas/auth.schema';

/**
 * Public user shape returned by the backend's `toPublicUser` serializer
 * (backend/src/features/auth/auth.controller.ts).
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  authProvider: 'local' | 'google';
  avatarUrl?: string;
}

export interface AuthConfig {
  googleEnabled: boolean;
}

interface UserEnvelope {
  user: AuthUser;
}

// apiClient's response interceptor already unwraps `{ success, data }` to
// `data` — see core/api/apiClient.ts. Do not add another `.data` unwrap here.

export async function register(input: RegisterFormValues): Promise<AuthUser> {
  const response = await apiClient.post<UserEnvelope>(AUTH_ENDPOINTS.register, input);
  return response.data.user;
}

export async function login(input: LoginFormValues): Promise<AuthUser> {
  const response = await apiClient.post<UserEnvelope>(AUTH_ENDPOINTS.login, input);
  return response.data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post(AUTH_ENDPOINTS.logout);
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<UserEnvelope>(AUTH_ENDPOINTS.me);
  return response.data.user;
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const response = await apiClient.get<AuthConfig>(AUTH_ENDPOINTS.config);
  return response.data;
}
