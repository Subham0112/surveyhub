import type {
  Answers,
  AnswerValue,
  ConditionOperator,
  Question,
  QuestionType,
} from './types';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Text answer',
  single: 'Single choice',
  multiple: 'Checkboxes',
  rating: 'Rating 1-5',
};

export const QUESTION_TYPE_HINTS: Record<QuestionType, string> = {
  text: 'A free-form written response.',
  single: 'Respondents choose one option.',
  multiple: 'Respondents can choose several options.',
  rating: 'Respondents choose a score from 1 to 5.',
};

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'is',
  not_equals: 'is not',
};

export function newQuestionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createQuestion(type: QuestionType): Question {
  const base: Question = {
    id: newQuestionId(),
    type,
    label: '',
    required: false,
  };

  if (type === 'single' || type === 'multiple') {
    base.options = ['Option 1', 'Option 2'];
  }

  return base;
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

export function visibleQuestions(questions: Question[], answers: Answers): Question[] {
  return questions.filter((question) => isQuestionVisible(question, answers));
}

export function validateAnswers(
  questions: Question[],
  answers: Answers,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const question of questions) {
    if (!isQuestionVisible(question, answers)) continue;

    const value = answers[question.id];
    const empty = isEmptyAnswer(value);

    if (empty) {
      if (question.required) errors[question.id] = 'This question is required.';
      continue;
    }

    if (question.type === 'text') {
      if (typeof value !== 'string') {
        errors[question.id] = 'Enter a text answer.';
      } else if (value.trim().length > 5000) {
        errors[question.id] = 'Keep the answer under 5,000 characters.';
      }
      continue;
    }

    if (question.type === 'single') {
      if (typeof value !== 'string' || !question.options?.includes(value)) {
        errors[question.id] = 'Select one of the available options.';
      }
      continue;
    }

    if (question.type === 'multiple') {
      if (!Array.isArray(value) || !value.every((item) => question.options?.includes(item))) {
        errors[question.id] = 'Select one or more available options.';
      }
      continue;
    }

    if (question.type === 'rating') {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
        errors[question.id] = 'Choose a rating from 1 to 5.';
      }
    }
  }

  return errors;
}

export function collectVisibleAnswers(questions: Question[], answers: Answers): Answers {
  const visible = visibleQuestions(questions, answers);
  const collected: Answers = {};

  for (const question of visible) {
    const value: AnswerValue | undefined = answers[question.id];
    if (isEmptyAnswer(value)) continue;
    collected[question.id] = question.type === 'text' && typeof value === 'string' ? value.trim() : value!;
  }

  return collected;
}

export function conditionValueOptions(source: Question | undefined): string[] {
  if (!source) return [];
  if (source.type === 'single' || source.type === 'multiple') return source.options ?? [];
  if (source.type === 'rating') return ['1', '2', '3', '4', '5'];
  return [];
}

export function defaultConditionValue(source: Question | undefined): string {
  if (!source) return '';
  if (source.type === 'single' || source.type === 'multiple') return source.options?.[0] ?? '';
  if (source.type === 'rating') return '5';
  return '';
}

export function normalizeConditions(questions: Question[]): Question[] {
  return questions.map((question, index) => {
    if (!question.condition) return question;

    const sourceIndex = questions.findIndex((item) => item.id === question.condition?.questionId);
    if (sourceIndex === -1 || sourceIndex >= index) {
      const rest = { ...question };
      delete rest.condition;
      return rest;
    }

    const source = questions[sourceIndex];
    const validValues = conditionValueOptions(source);
    if (validValues.length > 0 && !validValues.includes(question.condition.value)) {
      return {
        ...question,
        condition: { ...question.condition, value: validValues[0] },
      };
    }

    return question;
  });
}

export function validateDraft(title: string, questions: Question[]): string | null {
  if (title.trim() === '') return 'Give the survey a title.';
  if (questions.length === 0) return 'Add at least one question.';

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    if (question.label.trim() === '') {
      return `Question ${index + 1} needs a label.`;
    }

    if (question.type === 'single' || question.type === 'multiple') {
      const options = question.options ?? [];
      if (options.length < 2) return `Question ${index + 1} needs at least two options.`;
      if (options.some((option) => option.trim() === '')) {
        return `Question ${index + 1} has an empty option.`;
      }
      if (new Set(options.map((option) => option.trim())).size !== options.length) {
        return `Question ${index + 1} has duplicate options.`;
      }
    }

    if (question.condition && question.condition.value.trim() === '') {
      return `Question ${index + 1} has a condition without a value.`;
    }
  }

  return null;
}
