import bcrypt from 'bcryptjs';
import { ConflictError, UnauthorizedError } from '../../core/errors/AppError';
import { UserDocument } from '../users/user.model';
import * as authRepository from './auth.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.utils';
import { RegisterInput, LoginInput } from './auth.validation';

const PASSWORD_SALT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: UserDocument;
}

async function issueTokenPair(userId: string): Promise<AuthTokens> {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  const refreshTokenHash = await bcrypt.hash(refreshToken, PASSWORD_SALT_ROUNDS);
  await authRepository.setRefreshTokenHash(userId, refreshTokenHash);
  return { accessToken, refreshToken };
}

export async function register(data: RegisterInput): Promise<AuthResult> {
  const existing = await authRepository.findByEmail(data.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(data.password, PASSWORD_SALT_ROUNDS);
  const user = await authRepository.create({
    name: data.name,
    email: data.email,
    passwordHash,
    authProvider: 'local',
  });

  const tokens = await issueTokenPair(user._id.toString());
  return { user, ...tokens };
}

export async function login(data: LoginInput): Promise<AuthResult> {
  const user = await authRepository.findByEmail(data.email, true);
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = await issueTokenPair(user._id.toString());
  return { user, ...tokens };
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await authRepository.findByIdWithRefreshHash(payload.sub);
  if (!user || !user.refreshTokenHash) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  return issueTokenPair(user._id.toString());
}

export async function logout(userId: string): Promise<void> {
  await authRepository.setRefreshTokenHash(userId, null);
}

export async function issueTokensForUser(userId: string): Promise<AuthTokens> {
  return issueTokenPair(userId);
}
