import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomToken } from '@credible/shared/utils/crypto';
import { env } from '../../config/env';
import { UnauthorizedError } from '../errors/AppError';
import type { AuthPayload } from '../../middleware/auth';
import type { UserRole } from '@credible/types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const EXPIRES_IN_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

function parseExpires(exp: string): number {
  const m = /^(\d+)([smhd])$/.exec(exp);
  if (!m) return 900;
  return parseInt(m[1], 10) * EXPIRES_IN_SECONDS[m[2]];
}

export function signAccessToken(payload: AuthPayload): { token: string; expiresIn: number } {
  const expiresIn = parseExpires(env.JWT_ACCESS_EXPIRES_IN);
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
  return { token, expiresIn };
}

export function signRefreshToken(userId: string): { token: string; expiresAt: Date } {
  const expiresIn = parseExpires(env.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  const token = jwt.sign({ sub: userId, type: 'refresh', jti: randomToken(8) }, env.JWT_REFRESH_SECRET, opts);
  return { token, expiresAt };
}

export function verifyRefreshToken(token: string): { userId: string; jti: string } {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };
    return { userId: payload.sub, jti: payload.jti };
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export function issueTokenPair(user: { id: string; email: string; role: UserRole }): TokenPair {
  const { token, expiresIn } = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: refreshToken } = signRefreshToken(user.id);
  return { accessToken: token, refreshToken, expiresIn };
}