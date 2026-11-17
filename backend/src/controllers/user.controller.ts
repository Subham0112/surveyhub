import type { Request, Response } from 'express';
import { Prisma, SurveyStatus } from '@prisma/client';
import { prisma } from '../prisma';
import {
  pendingSurveyQuestions,
  readQuestions,
  validateSubmission,
  type Answers,
  type Question,
} from '../lib/questions';
import type { SubmitResponseInput } from '../validation/user.schema';

const publishedSurveySelect = {
  id: true,
  title: true,
  description: true,
  updatedAt: true,
  questions: true,
} as const;

export async function listUserSurveys(req: Request, res: Response) {
  const [surveys, responses] = await Promise.all([
    prisma.survey.findMany({
      where: { status: SurveyStatus.PUBLISHED },
      orderBy: { updatedAt: 'desc' },
      select: publishedSurveySelect,
    }),
    prisma.response.findMany({
      where: { userId: req.userId! },
      select: { surveyId: true, submittedAt: true, answers: true, seenQuestionIds: true },
    }),
  ]);

  const completions = new Map(responses.map((response) => [response.surveyId, response]));

  res.json({
    surveys: surveys.map((survey) => {
      const questions = readQuestions(survey.questions);
      const response = completions.get(survey.id);

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        updatedAt: survey.updatedAt,
        questionCount: questions.length,
        completed: Boolean(response),
        submittedAt: response?.submittedAt ?? null,
        newQuestionCount: response
          ? pendingSurveyQuestions(
              questions,
              response.answers as Answers,
              response.seenQuestionIds,
            ).length
          : 0,
      };
    }),
  });
}

export async function getUserSurvey(req: Request, res: Response) {
  const survey = await prisma.survey.findUnique({
    where: { id: String(req.params.id) },
    select: { ...publishedSurveySelect, status: true },
  });

  if (!survey) {
    res.status(404).json({ message: 'This survey is not available.' });
    return;
  }

  const response = await prisma.response.findUnique({
    where: {
      surveyId_userId: { surveyId: survey.id, userId: req.userId! },
    },
    select: { id: true, submittedAt: true, answers: true, seenQuestionIds: true },
  });

  if (survey.status !== SurveyStatus.PUBLISHED && !response) {
    res.status(404).json({ message: 'This survey is not available.' });
    return;
  }

  res.json({
    survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      updatedAt: survey.updatedAt,
      questions: readQuestions(survey.questions),
      completed: Boolean(response),
      submittedAt: response?.submittedAt ?? null,
      answers: (response?.answers as Answers | undefined) ?? null,
      seenQuestionIds: response?.seenQuestionIds ?? [],
    },
  });
}

export async function submitUserResponse(req: Request, res: Response) {
  const survey = await prisma.survey.findFirst({
    where: { id: String(req.params.id), status: SurveyStatus.PUBLISHED },
    select: { id: true, questions: true },
  });

  if (!survey) {
    res.status(404).json({ message: 'This survey is not available.' });
    return;
  }

  const existing = await prisma.response.findUnique({
    where: {
      surveyId_userId: { surveyId: survey.id, userId: req.userId! },
    },
    select: { id: true, answers: true, seenQuestionIds: true },
  });

  const { answers } = req.body as SubmitResponseInput;
  const questions = readQuestions(survey.questions) as Question[];
  const questionIds = questions.map((question) => question.id);

  if (existing) {
    const existingAnswers = existing.answers as Answers;
    const seen = new Set(existing.seenQuestionIds);
    const newQuestionIds = new Set(
      questions.filter((question) => !seen.has(question.id)).map((question) => question.id),
    );
    const { errors, cleaned } = validateSubmission(questions, answers, {
      existing: existingAnswers,
      allowedQuestionIds: newQuestionIds,
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ message: 'Please fix the highlighted answers.', errors });
      return;
    }

    if (Object.keys(cleaned).length === 0) {
      res.status(409).json({ message: 'There are no new questions to answer.' });
      return;
    }

    const response = await prisma.response.update({
      where: { id: existing.id },
      data: {
        answers: { ...existingAnswers, ...cleaned } as Answers as Prisma.InputJsonValue,
        seenQuestionIds: questionIds,
      },
      select: { id: true, submittedAt: true },
    });

    res.json({ response });
    return;
  }

  const { errors, cleaned } = validateSubmission(questions, answers);

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ message: 'Please fix the highlighted answers.', errors });
    return;
  }

  if (Object.keys(cleaned).length === 0) {
    res.status(400).json({ message: 'Answer at least one question before submitting.' });
    return;
  }

  try {
    const response = await prisma.response.create({
      data: {
        surveyId: survey.id,
        userId: req.userId!,
        answers: cleaned as Answers as Prisma.InputJsonValue,
        seenQuestionIds: questionIds,
      },
      select: { id: true, submittedAt: true },
    });

    res.status(201).json({ response });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ message: 'You have already completed this survey.' });
      return;
    }
    throw error;
  }
}

export async function getUserHistory(req: Request, res: Response) {
  const responses = await prisma.response.findMany({
    where: { userId: req.userId! },
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      submittedAt: true,
      answers: true,
      survey: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          questions: true,
        },
      },
    },
  });

  res.json({
    history: responses.map((response) => ({
      id: response.id,
      submittedAt: response.submittedAt,
      answerCount: Object.keys(response.answers as Record<string, unknown>).length,
      survey: {
        id: response.survey.id,
        title: response.survey.title,
        description: response.survey.description,
        status: response.survey.status,
        questionCount: readQuestions(response.survey.questions).length,
      },
    })),
  });
}
