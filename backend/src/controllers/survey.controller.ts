import type { Request, Response } from 'express';
import { SurveyStatus } from '@prisma/client';
import { prisma } from '../prisma';
import {
  isEmptyAnswer,
  readQuestions,
  type Question,
} from '../lib/questions';
import type { SurveyStatusInput } from '../validation/survey.schema';

async function findOwnedSurvey(id: string, adminId: string) {
  return prisma.survey.findFirst({ where: { id, adminId } });
}

function paramId(req: Request): string {
  return String(req.params.id);
}

export async function listSurveys(req: Request, res: Response) {
  const surveys = await prisma.survey.findMany({
    where: { adminId: req.userId! },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { responses: true } } },
  });

  res.json({
    surveys: surveys.map((survey) => ({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      questionCount: readQuestions(survey.questions).length,
      responseCount: survey._count.responses,
    })),
  });
}

export async function createSurvey(req: Request, res: Response) {
  const { title, description, questions } = req.body as {
    title: string;
    description?: string;
    questions: Question[];
  };

  const survey = await prisma.survey.create({
    data: {
      title,
      description: description ?? '',
      questions,
      adminId: req.userId!,
    },
  });

  res.status(201).json({ survey: { ...survey, questions: readQuestions(survey.questions) } });
}

export async function getSurvey(req: Request, res: Response) {
  const survey = await findOwnedSurvey(paramId(req), req.userId!);
  if (!survey) {
    res.status(404).json({ message: 'Survey not found.' });
    return;
  }

  const responseCount = await prisma.response.count({ where: { surveyId: survey.id } });
  res.json({
    survey: {
      ...survey,
      questions: readQuestions(survey.questions),
      responseCount,
    },
  });
}

export async function updateSurvey(req: Request, res: Response) {
  const existing = await findOwnedSurvey(paramId(req), req.userId!);
  if (!existing) {
    res.status(404).json({ message: 'Survey not found.' });
    return;
  }

  const { title, description, questions } = req.body as {
    title: string;
    description?: string;
    questions: Question[];
  };

  const survey = await prisma.survey.update({
    where: { id: existing.id },
    data: {
      title,
      description: description ?? '',
      questions,
    },
  });

  res.json({ survey: { ...survey, questions: readQuestions(survey.questions) } });
}

export async function updateSurveyStatus(req: Request, res: Response) {
  const existing = await findOwnedSurvey(paramId(req), req.userId!);
  if (!existing) {
    res.status(404).json({ message: 'Survey not found.' });
    return;
  }

  const { published } = req.body as SurveyStatusInput;

  const survey = await prisma.survey.update({
    where: { id: existing.id },
    data: { status: published ? SurveyStatus.PUBLISHED : SurveyStatus.DRAFT },
  });

  res.json({
    survey: {
      id: survey.id,
      title: survey.title,
      status: survey.status,
      updatedAt: survey.updatedAt,
    },
  });
}

export async function deleteSurvey(req: Request, res: Response) {
  const existing = await findOwnedSurvey(paramId(req), req.userId!);
  if (!existing) {
    res.status(404).json({ message: 'Survey not found.' });
    return;
  }

  await prisma.survey.delete({ where: { id: existing.id } });
  res.json({ ok: true });
}

export async function getSurveyAnalytics(req: Request, res: Response) {
  const survey = await findOwnedSurvey(paramId(req), req.userId!);
  if (!survey) {
    res.status(404).json({ message: 'Survey not found.' });
    return;
  }

  const responses = await prisma.response.findMany({
    where: { surveyId: survey.id },
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      submittedAt: true,
      answers: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const questions = readQuestions(survey.questions) as Question[];

  const questionAnalytics = questions.map((question) => {
    const values = responses
      .map((response) => (response.answers as Record<string, unknown>)[question.id])
      .filter((value) => !isEmptyAnswer(value));

    const base = {
      id: question.id,
      label: question.label,
      type: question.type,
      required: question.required,
      options: question.options ?? [],
      answerCount: values.length,
    };

    if (question.type === 'single') {
      return {
        ...base,
        counts: (question.options ?? []).map((option) => ({
          label: option,
          count: values.filter((value) => value === option).length,
        })),
      };
    }

    if (question.type === 'multiple') {
      return {
        ...base,
        counts: (question.options ?? []).map((option) => ({
          label: option,
          count: values.filter((value) => Array.isArray(value) && value.includes(option)).length,
        })),
      };
    }

    if (question.type === 'rating') {
      const ratings = values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);
      const average =
        ratings.length > 0
          ? Math.round((ratings.reduce((total, value) => total + value, 0) / ratings.length) * 10) / 10
          : null;

      return {
        ...base,
        average,
        distribution: [1, 2, 3, 4, 5].map((rating) => ({
          rating,
          count: ratings.filter((value) => value === rating).length,
        })),
      };
    }

    return {
      ...base,
      responses: values.filter((value): value is string => typeof value === 'string'),
    };
  });

  res.json({
    survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
    },
    totalResponses: responses.length,
    questions: questionAnalytics,
    respondents: responses.map((response) => ({
      id: response.id,
      submittedAt: response.submittedAt,
      user: response.user,
      answers: response.answers,
      answerCount: Object.keys(response.answers as Record<string, unknown>).length,
    })),
  });
}
