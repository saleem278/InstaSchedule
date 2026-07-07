import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../../config/env';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as AccessTokenPayload;
}

const cookieBaseOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict' as const,
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('accessToken', accessToken, { ...cookieBaseOptions, maxAge: ACCESS_TOKEN_TTL_MS });
  res.cookie('refreshToken', refreshToken, { ...cookieBaseOptions, maxAge: REFRESH_TOKEN_TTL_MS });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', cookieBaseOptions);
  res.clearCookie('refreshToken', cookieBaseOptions);
}
