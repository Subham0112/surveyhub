export type QuestionType = 'text' | 'single' | 'multiple' | 'rating';
export type ConditionOperator = 'equals' | 'not_equals';
export type SurveyStatus = 'DRAFT' | 'PUBLISHED';
export type Role = 'ADMIN' | 'USER';

export interface QuestionCondition {
  questionId: string;
  operator: ConditionOperator;
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
  condition?: QuestionCondition;
}

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

export interface SurveyInput {
  title: string;
  description: string;
  questions: Question[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AdminSurveySummary {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
  responseCount: number;
}

export interface SurveyDetail extends SurveyInput {
  id: string;
  status: SurveyStatus;
  createdAt: string;
  updatedAt: string;
  responseCount: number;
}

export interface UserSurveySummary {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  questionCount: number;
  completed: boolean;
  submittedAt: string | null;
  newQuestionCount: number;
}

export interface SurveyHistoryEntry {
  id: string;
  submittedAt: string;
  answerCount: number;
  survey: {
    id: string;
    title: string;
    description: string;
    status: SurveyStatus;
    questionCount: number;
  };
}

export interface UserSurvey extends SurveyInput {
  id: string;
  updatedAt: string;
  completed: boolean;
  submittedAt: string | null;
  answers: Answers | null;
  seenQuestionIds: string[];
}

interface BaseQuestionAnalytics {
  id: string;
  label: string;
  required: boolean;
  options: string[];
  answerCount: number;
}

export interface ChoiceQuestionAnalytics extends BaseQuestionAnalytics {
  type: 'single' | 'multiple';
  counts: { label: string; count: number }[];
}

export interface RatingQuestionAnalytics extends BaseQuestionAnalytics {
  type: 'rating';
  average: number | null;
  distribution: { rating: number; count: number }[];
}

export interface TextQuestionAnalytics extends BaseQuestionAnalytics {
  type: 'text';
  responses: string[];
}

export type QuestionAnalytics =
  | ChoiceQuestionAnalytics
  | RatingQuestionAnalytics
  | TextQuestionAnalytics;

export interface SurveyRespondent {
  id: string;
  submittedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  answers: Answers;
  answerCount: number;
}

export interface SurveyAnalytics {
  survey: {
    id: string;
    title: string;
    description: string;
    status: SurveyStatus;
  };
  totalResponses: number;
  questions: QuestionAnalytics[];
  respondents: SurveyRespondent[];
}
