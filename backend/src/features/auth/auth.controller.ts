import { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/asyncHandler';
import { sendSuccess } from '../../core/utils/apiResponse';
import { UnauthorizedError } from '../../core/errors/AppError';
import { config } from '../../config/env';
import { setAuthCookies, clearAuthCookies, verifyAccessToken, verifyRefreshToken } from './token.utils';
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
  sendSuccess(res, null);
});

/**
 * Idempotent logout. Not behind `authenticate` (see auth.routes.ts): it must
 * succeed even with an expired/missing access token. We best-effort revoke the
 * stored refresh-token hash by decoding whichever token cookie is present, then
 * always clear the cookies regardless of outcome.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = req.cookies?.accessToken as string | undefined;
  const refreshToken = req.cookies?.refreshToken as string | undefined;

  const userId = resolveUserIdFromTokens(accessToken, refreshToken);
  if (userId) {
    // Don't let a DB hiccup block cookie clearing — logout should always leave
    // the client logged out client-side.
    await authService.logout(userId).catch(() => undefined);
  }

  clearAuthCookies(res);
  sendSuccess(res, null);
});

/** Decodes the user id from the access token, falling back to the refresh token. Returns null if neither verifies. */
function resolveUserIdFromTokens(accessToken?: string, refreshToken?: string): string | null {
  if (accessToken) {
    try {
      return verifyAccessToken(accessToken).sub;
    } catch {
      // fall through to refresh token
    }
  }
  if (refreshToken) {
    try {
      return verifyRefreshToken(refreshToken).sub;
    } catch {
      return null;
    }
  }
  return null;
}

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
