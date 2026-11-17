import { z, type ZodError } from 'zod';

export const QUESTION_TYPES = ['text', 'single', 'multiple', 'rating'] as const;
export const CONDITION_OPERATORS = ['equals', 'not_equals'] as const;

export const questionTypeSchema = z.enum(QUESTION_TYPES);
export const conditionOperatorSchema = z.enum(CONDITION_OPERATORS);

export const questionConditionSchema = z.object({
  questionId: z.string().trim().min(1).max(64),
  operator: conditionOperatorSchema.default('equals'),
  value: z.string().trim().min(1).max(500),
});

export const questionSchema = z
  .object({
    id: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{1,64}$/, 'Question identifiers must be 1-64 letters, numbers, dashes or underscores.'),
    type: questionTypeSchema,
    label: z.string().trim().min(1, 'Every question needs a label.').max(300),
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1, 'Options cannot be empty.').max(300)).min(1).max(50).optional(),
    condition: questionConditionSchema.optional(),
  })
  .superRefine((question, ctx) => {
    const isChoice = question.type === 'single' || question.type === 'multiple';
    if (isChoice) {
      if (!question.options || question.options.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Choice questions need at least two options.',
        });
      } else if (new Set(question.options).size !== question.options.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Options must be unique.',
        });
      }
    } else if (question.options && question.options.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Only choice questions can have options.',
      });
    }
  });

export const questionListSchema = z.array(questionSchema).min(1, 'Add at least one question.').max(100);

export const surveyInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the survey a title.').max(160),
    description: z.string().trim().max(2000, 'Description is too long.').optional().default(''),
    questions: questionListSchema,
  })
  .superRefine((survey, ctx) => {
    const positions = new Map<string, number>();

    survey.questions.forEach((question, index) => {
      if (positions.has(question.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'id'],
          message: 'Question identifiers must be unique.',
        });
      } else {
        positions.set(question.id, index);
      }

      if (!question.condition) return;

      const sourceIndex = positions.get(question.condition.questionId);
      if (sourceIndex === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'condition', 'questionId'],
          message: 'Conditional logic references a question that does not exist.',
        });
        return;
      }
      if (sourceIndex >= index) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'condition', 'questionId'],
          message: 'A question can only depend on a question above it.',
        });
        return;
      }

      const source = survey.questions[sourceIndex];
      if (source.type === 'single' || source.type === 'multiple') {
        if (!source.options?.includes(question.condition.value)) {
          ctx.addIssue({
            code: 'custom',
            path: ['questions', index, 'condition', 'value'],
            message: 'The condition value must be one of the options on the selected question.',
          });
        }
      } else if (source.type === 'rating') {
        if (!['1', '2', '3', '4', '5'].includes(question.condition.value)) {
          ctx.addIssue({
            code: 'custom',
            path: ['questions', index, 'condition', 'value'],
            message: 'A rating condition must be a value from 1 to 5.',
          });
        }
      }
    });
  });

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];
export type QuestionCondition = z.infer<typeof questionConditionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type SurveyInput = z.infer<typeof surveyInputSchema>;
export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

export function readQuestions(value: unknown): Question[] {
  const parsed = questionListSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'The submitted data is invalid.';
  const location = issue.path.length > 0 ? `${issue.path.map(String).join('.')}: ` : '';
  return `${location}${issue.message}`;
}

export function isEmptyAnswer(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function isQuestionVisible(question: Question, answers: Answers): boolean {
  if (!question.condition) return true;

  const source = answers[question.condition.questionId];
  if (isEmptyAnswer(source)) return false;

  const expected = question.condition.value;
  const matches = Array.isArray(source)
    ? source.map(String).includes(expected)
    : String(source) === expected;

  return question.condition.operator === 'not_equals' ? !matches : matches;
}

export type SubmissionValidation = {
  errors: Record<string, string>;
  cleaned: Answers;
};

export type SubmissionValidationOptions = {
  existing?: Answers;
  allowedQuestionIds?: Set<string>;
};

type AnswerResult = {
  error?: string;
  value?: AnswerValue;
};

function validateAnswer(question: Question, value: unknown): AnswerResult {
  if (isEmptyAnswer(value)) {
    return question.required ? { error: 'This question is required.' } : {};
  }

  if (question.type === 'text') {
    if (typeof value !== 'string') return { error: 'Enter a text answer.' };

    const text = value.trim();
    if (text === '') {
      return question.required ? { error: 'This question is required.' } : {};
    }
    if (text.length > 5000) return { error: 'Keep the answer under 5,000 characters.' };

    return { value: text };
  }

  if (question.type === 'single') {
    if (typeof value !== 'string' || !question.options?.includes(value)) {
      return { error: 'Select one of the available options.' };
    }
    return { value };
  }

  if (question.type === 'multiple') {
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      return { error: 'Select one or more available options.' };
    }

    const unique = [...new Set(value as string[])];
    if (!unique.every((item) => question.options?.includes(item))) {
      return { error: 'One or more selected options are not available.' };
    }
    return { value: unique };
  }

  if (question.type === 'rating') {
    const rating = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: 'Choose a rating from 1 to 5.' };
    }
    return { value: rating };
  }

  return {};
}

export function validateSubmission(
  questions: Question[],
  payload: unknown,
  options: SubmissionValidationOptions = {},
): SubmissionValidation {
  const errors: Record<string, string> = {};
  const cleaned: Answers = {};
  const existing = options.existing ?? {};
  const context: Answers = { ...existing };

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { errors: { _form: 'Answers must be an object keyed by question id.' }, cleaned };
  }

  const raw = payload as Record<string, unknown>;

  for (const question of questions) {
    if (options.allowedQuestionIds && !options.allowedQuestionIds.has(question.id)) continue;
    if (!isEmptyAnswer(existing[question.id])) continue;
    if (!isQuestionVisible(question, context)) continue;

    const result = validateAnswer(question, raw[question.id]);
    if (result.error) {
      errors[question.id] = result.error;
      continue;
    }
    if (result.value === undefined) continue;

    cleaned[question.id] = result.value;
    context[question.id] = result.value;
  }

  return { errors, cleaned };
}

export function pendingSurveyQuestions(
  questions: Question[],
  answers: Answers,
  seenQuestionIds: string[],
): Question[] {
  const seen = new Set(seenQuestionIds);

  return questions.filter(
    (question) =>
      !seen.has(question.id) &&
      isEmptyAnswer(answers[question.id]) &&
      isQuestionVisible(question, answers),
  );
}
