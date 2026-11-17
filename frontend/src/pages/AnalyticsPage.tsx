import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingBlock } from '../components/ui';
import { buttonClasses, cn } from '../lib/styles';
import { usePageReveal } from '../hooks/usePageReveal';
import { api, ApiError } from '../lib/api';
import { formatDateTime, pluralize } from '../lib/format';
import { QUESTION_TYPE_LABELS } from '../lib/questions';
import type { AnswerValue, SurveyAnalytics } from '../lib/types';

function formatAnswer(value: AnswerValue | undefined): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  return '—';
}

export function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const ref = usePageReveal<HTMLDivElement>();

  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;

    api
      .getAnalytics(id)
      .then((result) => {
        if (active) setAnalytics(result);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Could not load analytics.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <LoadingBlock label="Loading analytics" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <p className="mono-label">Analytics</p>
        <h1 className="mt-4 text-3xl">These results cannot be opened.</h1>
        <p className="mt-3 text-sm text-ink-soft">{error || 'The survey may have been removed.'}</p>
        <Link to="/admin" className={cn(buttonClasses('primary', 'sm'), 'mt-6')}>
          Back to surveys
        </Link>
      </div>
    );
  }

  const { survey, questions, respondents, totalResponses } = analytics;
  const averageAnswers =
    respondents.length > 0
      ? Math.round(
          (respondents.reduce((total, item) => total + item.answerCount, 0) /
            respondents.length) *
            10,
        ) / 10
      : 0;

  return (
    <div ref={ref} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <Link to="/admin" className="mono-label transition-colors hover:text-ink" data-reveal>
        Back to surveys
      </Link>

      <div
        data-reveal
        className="mt-5 flex flex-wrap items-end justify-between gap-5"
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="mono-label">Analytics</p>
            <StatusBadge status={survey.status} />
          </div>
          <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">{survey.title}</h1>
          {survey.description ? (
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              {survey.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/admin/surveys/${survey.id}/edit`}
            className={buttonClasses('secondary', 'sm')}
          >
            Edit survey
          </Link>
          {survey.status === 'PUBLISHED' ? (
            <Link to={`/s/${survey.id}`} className={buttonClasses('primary', 'sm')}>
              Open form
            </Link>
          ) : null}
        </div>
      </div>

      <div data-reveal className="mt-10 grid border border-line bg-surface sm:grid-cols-3">
        <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
          <p className="mono-label">Responses</p>
          <p className="mt-2 font-serif text-4xl">{String(totalResponses).padStart(2, '0')}</p>
        </div>
        <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
          <p className="mono-label">Questions</p>
          <p className="mt-2 font-serif text-4xl">{String(questions.length).padStart(2, '0')}</p>
        </div>
        <div className="p-5">
          <p className="mono-label">Avg. answers per respondent</p>
          <p className="mt-2 font-serif text-4xl">{averageAnswers}</p>
        </div>
      </div>

      {totalResponses === 0 ? (
        <div className="mt-8 border border-dashed border-line-strong bg-surface px-6 py-12">
          <p className="font-serif text-2xl">No responses yet.</p>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            Publish the survey and share it with users. Completed responses will be listed
            here with each respondent's answers.
          </p>
          <Link
            to={`/admin/surveys/${survey.id}/edit`}
            className={cn(buttonClasses('secondary', 'sm'), 'mt-5')}
          >
            Open survey builder
          </Link>
        </div>
      ) : null}

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
          <h2 className="text-2xl">Question breakdown</h2>
          <p className="mono-label">{pluralize(questions.length, 'question')}</p>
        </div>

        <div className="mt-5 space-y-4">
          {questions.map((question, index) => (
            <article key={question.id} data-reveal className="border border-line bg-surface">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="pt-0.5 font-mono text-[11px] text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg leading-snug">{question.label}</h3>
                    <p className="mono-label mt-1">{QUESTION_TYPE_LABELS[question.type]}</p>
                  </div>
                </div>
                <p className="mono-label">
                  {pluralize(question.answerCount, 'answer')}
                </p>
              </div>

              <div className="p-5">
                {question.type === 'rating' ? (
                  <div className="grid gap-6 sm:grid-cols-[11rem_minmax(0,1fr)]">
                    <div className="border border-line bg-paper p-4">
                      <p className="mono-label">Average rating</p>
                      <p className="mt-2 font-serif text-5xl">
                        {question.average ?? '—'}
                        <span className="ml-1 font-sans text-base text-muted">/ 5</span>
                      </p>
                      <p className="mono-label mt-2">
                        {pluralize(question.answerCount, 'rating')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count =
                          question.distribution.find((item) => item.rating === rating)?.count ?? 0;
                        const width =
                          question.answerCount > 0
                            ? Math.round((count / question.answerCount) * 100)
                            : 0;
                        return (
                          <div
                            key={rating}
                            className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-3"
                          >
                            <span className="font-mono text-[11px] text-muted">{rating}</span>
                            <div className="h-2.5 bg-surface-strong">
                              <div
                                className="h-full bg-accent transition-[width] duration-300"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <span className="text-right font-mono text-[11px] text-muted">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {question.type === 'text' ? (
                  question.responses.length > 0 ? (
                    <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {question.responses.map((response, responseIndex) => (
                        <li
                          key={`${responseIndex}-${response.slice(0, 12)}`}
                          className="border-l-2 border-accent/40 bg-paper px-4 py-3 text-sm text-ink-soft"
                        >
                          <span className="mono-label mr-2">
                            {String(responseIndex + 1).padStart(2, '0')}
                          </span>
                          {response}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No text answers yet.</p>
                  )
                ) : null}

                {question.type === 'single' || question.type === 'multiple' ? (
                  <div className="space-y-3">
                    {question.counts.map((item) => {
                      const percentage =
                        question.answerCount > 0
                          ? Math.round((item.count / question.answerCount) * 100)
                          : 0;
                      return (
                        <div
                          key={item.label}
                          className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-4"
                        >
                          <div>
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-sm text-ink-soft">{item.label}</span>
                              <span className="font-mono text-[11px] text-muted">
                                {item.count}
                              </span>
                            </div>
                            <div className="mt-1.5 h-2.5 bg-surface-strong">
                              <div
                                className="h-full bg-accent transition-[width] duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-right font-mono text-[11px] text-muted">
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
          <h2 className="text-2xl">Completed responses</h2>
          <p className="mono-label">{pluralize(respondents.length, 'respondent')}</p>
        </div>

        {respondents.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            Each user who completes this survey will be listed here with their answers.
          </p>
        ) : (
          <ul className="mt-3 border-t border-line">
            {respondents.map((respondent, index) => (
              <li key={respondent.id} data-reveal className="border-b border-line">
                <details className="group">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-5 gap-y-2 py-4 [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-[11px] text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{respondent.user.name}</p>
                      <p className="truncate text-xs text-muted">{respondent.user.email}</p>
                    </div>
                    <span className="mono-label">{formatDateTime(respondent.submittedAt)}</span>
                    <span className="mono-label">
                      {pluralize(respondent.answerCount, 'answer')}
                    </span>
                    <span className="mono-label text-accent group-open:hidden">
                      View answers
                    </span>
                    <span className="mono-label hidden text-accent group-open:inline">
                      Hide answers
                    </span>
                  </summary>

                  <dl className="space-y-3 pb-5 pl-8">
                    {questions.map((question, questionIndex) => {
                      const answer = respondent.answers[question.id];
                      if (answer === undefined || answer === null) return null;

                      return (
                        <div key={question.id} className="border-l border-line pl-4">
                          <dt className="flex flex-wrap items-baseline gap-2">
                            <span className="mono-label">
                              Q{String(questionIndex + 1).padStart(2, '0')}
                            </span>
                            <span className="text-sm font-medium text-ink">
                              {question.label}
                            </span>
                          </dt>
                          <dd className="mt-1 text-sm text-ink-soft">
                            {formatAnswer(answer)}
                          </dd>
                        </div>
                      );
                    })}
                    {Object.entries(respondent.answers)
                      .filter(
                        ([questionId]) =>
                          !questions.some((question) => question.id === questionId),
                      )
                      .map(([questionId, answer]) => (
                        <div key={questionId} className="border-l border-line pl-4">
                          <dt className="mono-label">Removed question</dt>
                          <dd className="mt-1 text-sm text-ink-soft">
                            {formatAnswer(answer)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
