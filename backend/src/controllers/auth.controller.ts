import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import { clearAuthCookie, setAuthCookie } from '../lib/auth';
import { publicUser } from '../lib/http';
import type { LoginInput, RegisterInput } from '../validation/auth.schema';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    res.status(401).json({ message: 'Incorrect email or password.' });
    return;
  }

  setAuthCookie(res, user.id);
  res.json({ user: publicUser(user) });
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: Role.USER },
  });

  setAuthCookie(res, user.id);
  res.status(201).json({ user: publicUser(user) });
}

export function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) {
    res.status(401).json({ message: 'Your session is no longer valid.' });
    return;
  }

  res.json({ user: publicUser(user) });
}
