import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import { UnauthorizedError } from '../../core/errors/AppError';
import { config } from '../../config/env';
import { setAuthCookies, clearAuthCookies } from './token.utils';
import * as authService from './auth.service';
import * as authRepository from './auth.repository';
import { UserDocument } from '../users/user.model';
import { RegisterInput, LoginInput } from './auth.validation';

function toPublicUser(user: UserDocument): Record<string, unknown> {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    authProvider: user.authProvider,
    avatarUrl: user.avatarUrl,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const { user, accessToken, refreshToken } = await authService.register(input);
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, { user: toPublicUser(user) }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginInput;
  const { user, accessToken, refreshToken } = await authService.login(input);
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, { user: toPublicUser(user) });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken as string | undefined;
  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token missing');
  }
  const tokens = await authService.refresh(refreshToken);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  sendSuccess(res, { success: true });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await authService.logout(userId);
  clearAuthCookies(res);
  sendSuccess(res, { success: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  sendSuccess(res, { user: toPublicUser(user) });
});

export const getAuthConfig = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { googleEnabled: config.features.googleAuthEnabled });
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError('Google authentication failed');
  }

  const tokens = await authService.issueTokensForUser(userId);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  res.redirect(config.CLIENT_URL);
});
