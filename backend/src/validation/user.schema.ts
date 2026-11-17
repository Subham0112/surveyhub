import { z } from 'zod';

export const submitResponseSchema = z.object({
  answers: z.unknown(),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
