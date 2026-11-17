import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { formatZodError } from '../lib/questions';

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: formatZodError(parsed.error) });
      return;
    }

    req.body = parsed.data;
    next();
  };
}
