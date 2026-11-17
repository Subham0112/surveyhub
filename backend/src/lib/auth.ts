import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../env';

export const AUTH_COOKIE = 'survey_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.cookieSecure,
    path: '/',
  };
}

export function setAuthCookie(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
}

export function verifyAuthToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const userId = typeof payload === 'object' && payload !== null ? payload.sub : undefined;
    return typeof userId === 'string' ? userId : null;
  } catch {
    return null;
  }
}
