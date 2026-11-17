import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, LoadingBlock, Notice } from '../components/ui';
import { buttonClasses, cn } from '../lib/styles';
import { useAuth } from '../context/auth';
import { usePageReveal } from '../hooks/usePageReveal';
import { api, ApiError } from '../lib/api';
import { formatDate, pluralize } from '../lib/format';
import type { UserSurveySummary } from '../lib/types';

export function HomePage() {
  const { user } = useAuth();
  const ref = usePageReveal<HTMLDivElement>();

  const [surveys, setSurveys] = useState<UserSurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .listUserSurveys()
      .then((result) => {
        if (active) setSurveys(result.surveys);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Could not load surveys.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  function retryLoad() {
    setLoading(true);
    setError('');
    setReloadToken((value) => value + 1);
  }

  const completedCount = surveys.filter((survey) => survey.completed).length;
  const openCount = surveys.length - completedCount;

  return (
    <div ref={ref} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      {user?.role === 'ADMIN' ? (
        <Notice>
          You are signed in as an administrator.{' '}
          <Link to="/admin" className="font-medium text-accent underline underline-offset-4">
            Open the admin dashboard
          </Link>
          .
        </Notice>
      ) : null}

      <div className={cn('grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16', user?.role === 'ADMIN' && 'mt-10')}>
        <div data-reveal>
          <p className="mono-label">Available surveys</p>
          <h1 className="mt-4 max-w-xl text-4xl sm:text-5xl">Choose a survey and answer it.</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft">
            Every survey below is open for responses. A completed survey stays marked and
            appears in your history with the date you submitted it.
          </p>
        </div>

        <div data-reveal className="border border-line bg-surface p-5">
          <p className="mono-label">Your record</p>
          <dl className="mt-4 divide-y divide-line">
            <div className="flex items-baseline justify-between py-2.5">
              <dt className="text-sm text-ink-soft">Completed</dt>
              <dd className="font-serif text-2xl">{String(completedCount).padStart(2, '0')}</dd>
            </div>
            <div className="flex items-baseline justify-between py-2.5">
              <dt className="text-sm text-ink-soft">Still open</dt>
              <dd className="font-serif text-2xl">{String(openCount).padStart(2, '0')}</dd>
            </div>
          </dl>
          <Link to="/history" className={cn(buttonClasses('secondary', 'sm'), 'mt-4 w-full')}>
            View history
          </Link>
        </div>
      </div>

      <section className="mt-14 border-t border-line pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl">Published surveys</h2>
          <p className="mono-label">
            {surveys.length > 0 ? pluralize(surveys.length, 'survey') : 'No surveys'}
          </p>
        </div>

        {loading ? <LoadingBlock label="Loading surveys" /> : null}

        {!loading && error ? (
          <div className="mt-6 space-y-4">
            <Notice tone="error">{error}</Notice>
            <Button variant="secondary" onClick={retryLoad}>
              Try again
            </Button>
          </div>
        ) : null}

        {!loading && !error && surveys.length === 0 ? (
          <div className="mt-6 border border-dashed border-line-strong bg-surface px-6 py-12">
            <p className="font-serif text-2xl">No published surveys yet.</p>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              When an administrator publishes a survey, it will appear here for you to answer.
            </p>
          </div>
        ) : null}

        {!loading && !error && surveys.length > 0 ? (
          <ul className="mt-6 border-t border-line">
            {surveys.map((survey, index) => (
              <li
                key={survey.id}
                data-reveal
                className="grid gap-4 border-b border-line py-6 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start sm:gap-6"
              >
                <span className="font-mono text-[11px] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-xl">{survey.title}</h3>
                    {survey.completed ? <Badge tone="completed">Completed</Badge> : null}
                    {survey.newQuestionCount > 0 ? (
                      <Badge tone="accent">
                        {pluralize(survey.newQuestionCount, 'new question')}
                      </Badge>
                    ) : null}
                  </div>
                  {survey.description ? (
                    <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-ink-soft">
                      {survey.description}
                    </p>
                  ) : null}
                  <p className="mono-label mt-3">
                    {pluralize(survey.questionCount, 'question')}
                    <span className="mx-2 text-line-strong">/</span>
                    Updated {formatDate(survey.updatedAt)}
                    {survey.completed && survey.submittedAt ? (
                      <>
                        <span className="mx-2 text-line-strong">/</span>
                        Submitted {formatDate(survey.submittedAt)}
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="sm:pt-1">
                  {survey.completed ? (
                    <Link
                      to={`/s/${survey.id}`}
                      className={buttonClasses(
                        survey.newQuestionCount > 0 ? 'primary' : 'secondary',
                        'sm',
                      )}
                    >
                      {survey.newQuestionCount > 0
                        ? 'Answer new questions'
                        : 'View completed survey'}
                    </Link>
                  ) : (
                    <Link to={`/s/${survey.id}`} className={buttonClasses('primary', 'sm')}>
                      Start survey
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
