import { z } from 'zod';

export { surveyInputSchema } from '../lib/questions';

export const surveyStatusSchema = z.object({
  published: z.boolean(),
});

export type SurveyStatusInput = z.infer<typeof surveyStatusSchema>;
