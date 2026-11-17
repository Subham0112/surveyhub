import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { Button, LoadingBlock, Notice } from '../components/ui';
import { buttonClasses, cn } from '../lib/styles';
import { usePageReveal } from '../hooks/usePageReveal';
import { api, ApiError } from '../lib/api';
import { formatDate, pluralize } from '../lib/format';
import type { AdminSurveySummary } from '../lib/types';

export function AdminSurveysPage() {
  const ref = usePageReveal<HTMLDivElement>();

  const [surveys, setSurveys] = useState<AdminSurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [pendingDelete, setPendingDelete] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .listSurveys()
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

  async function togglePublished(survey: AdminSurveySummary) {
    setBusyId(survey.id);
    setError('');
    setMessage('');
    try {
      const published = survey.status !== 'PUBLISHED';
      const result = await api.setSurveyStatus(survey.id, published);
      setSurveys((current) =>
        current.map((item) =>
          item.id === survey.id ? { ...item, status: result.survey.status } : item,
        ),
      );
      setMessage(published ? 'Survey published.' : 'Survey moved back to draft.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the survey.');
    } finally {
      setBusyId('');
    }
  }

  async function deleteSurvey(survey: AdminSurveySummary) {
    setBusyId(survey.id);
    setError('');
    setMessage('');
    try {
      await api.deleteSurvey(survey.id);
      setSurveys((current) => current.filter((item) => item.id !== survey.id));
      setPendingDelete('');
      setMessage('Survey deleted.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the survey.');
    } finally {
      setBusyId('');
    }
  }

  const publishedCount = surveys.filter((survey) => survey.status === 'PUBLISHED').length;
  const responseTotal = surveys.reduce((total, survey) => total + survey.responseCount, 0);

  return (
    <div ref={ref} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5" data-reveal>
        <div>
          <p className="mono-label">Admin dashboard</p>
          <h1 className="mt-4 text-4xl sm:text-5xl">Your surveys.</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Build a survey, publish it when the questions are ready, and review each
            respondent's completed submission.
          </p>
        </div>
        <Link to="/admin/surveys/new" className={buttonClasses('primary')}>
          New survey
        </Link>
      </div>

      <div data-reveal className="mt-10 grid border border-line bg-surface sm:grid-cols-3">
        <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
          <p className="mono-label">Surveys</p>
          <p className="mt-2 font-serif text-3xl">{String(surveys.length).padStart(2, '0')}</p>
        </div>
        <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
          <p className="mono-label">Published</p>
          <p className="mt-2 font-serif text-3xl">{String(publishedCount).padStart(2, '0')}</p>
        </div>
        <div className="p-5">
          <p className="mono-label">Responses</p>
          <p className="mt-2 font-serif text-3xl">{String(responseTotal).padStart(2, '0')}</p>
        </div>
      </div>

      {message ? (
        <div className="mt-6">
          <Notice tone="success">{message}</Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 space-y-3">
          <Notice tone="error">{error}</Notice>
          <Button variant="secondary" size="sm" onClick={retryLoad}>
            Try again
          </Button>
        </div>
      ) : null}

      <section className="mt-10 border-t border-line pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl">All surveys</h2>
          <p className="mono-label">{pluralize(surveys.length, 'survey')}</p>
        </div>

        {loading ? <LoadingBlock label="Loading surveys" /> : null}

        {!loading && !error && surveys.length === 0 ? (
          <div className="mt-6 border border-dashed border-line-strong bg-surface px-6 py-12">
            <p className="font-serif text-2xl">No surveys yet.</p>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              Create the first survey, add questions, then publish it for users to answer.
            </p>
            <Link to="/admin/surveys/new" className={cn(buttonClasses('primary', 'sm'), 'mt-5')}>
              Create a survey
            </Link>
          </div>
        ) : null}

        {!loading && surveys.length > 0 ? (
          <ul className="mt-6 border-t border-line">
            {surveys.map((survey, index) => (
              <li key={survey.id} data-reveal className="border-b border-line py-6">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4">
                    <span className="pt-1 font-mono text-[11px] text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-xl">{survey.title}</h3>
                        <StatusBadge status={survey.status} />
                      </div>
                      {survey.description ? (
                        <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-ink-soft">
                          {survey.description}
                        </p>
                      ) : null}
                      <p className="mono-label mt-3">
                        {pluralize(survey.questionCount, 'question')}
                        <span className="mx-2 text-line-strong">/</span>
                        {pluralize(survey.responseCount, 'response')}
                        <span className="mx-2 text-line-strong">/</span>
                        Updated {formatDate(survey.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pl-12 lg:justify-end lg:pl-0">
                    <Link
                      to={`/admin/surveys/${survey.id}/edit`}
                      className={buttonClasses('secondary', 'sm')}
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/admin/surveys/${survey.id}/analytics`}
                      className={buttonClasses('ghost', 'sm')}
                    >
                      Analytics
                    </Link>
                    {survey.status === 'PUBLISHED' ? (
                      <Link to={`/s/${survey.id}`} className={buttonClasses('ghost', 'sm')}>
                        Open form
                      </Link>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublished(survey)}
                      disabled={busyId === survey.id}
                    >
                      {survey.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingDelete(survey.id)}
                      disabled={busyId === survey.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {pendingDelete === survey.id ? (
                  <div className="mt-4 flex flex-col gap-3 border border-accent/40 bg-accent-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-accent-deep">
                      Delete “{survey.title}” and all of its responses? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteSurvey(survey)}
                        disabled={busyId === survey.id}
                      >
                        {busyId === survey.id ? 'Deleting…' : 'Delete survey'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPendingDelete('')}
                        disabled={busyId === survey.id}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
