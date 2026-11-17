import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma';
import { AUTH_COOKIE, clearAuthCookie, verifyAuthToken } from '../lib/auth';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    const userId = typeof token === 'string' ? verifyAuthToken(token) : null;

    if (!userId) {
      clearAuthCookie(res);
      res.status(401).json({ message: 'Sign in to continue.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ message: 'Your session is no longer valid.' });
      return;
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    res.status(403).json({ message: 'Administrator access is required.' });
    return;
  }
  next();
}
