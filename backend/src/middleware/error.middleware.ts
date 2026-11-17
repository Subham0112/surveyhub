import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../env';
import { formatZodError } from '../lib/questions';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found.' });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ message: formatZodError(error) });
    return;
  }

  if (typeof error === 'object' && error !== null && 'type' in error) {
    const type = (error as { type?: unknown }).type;
    if (type === 'entity.parse.failed') {
      res.status(400).json({ message: 'Request body must be valid JSON.' });
      return;
    }
  }

  if (env.nodeEnv !== 'test') {
    console.error(error);
  }

  res.status(500).json({ message: 'Something went wrong on the server.' });
}
