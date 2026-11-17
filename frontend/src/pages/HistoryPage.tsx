import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, LoadingBlock, Notice } from '../components/ui';
import { buttonClasses, cn } from '../lib/styles';
import { usePageReveal } from '../hooks/usePageReveal';
import { api, ApiError } from '../lib/api';
import type { SurveyHistoryEntry } from '../lib/types';

export function HistoryPage() {
  const ref = usePageReveal<HTMLDivElement>();
  const [history, setHistory] = useState<SurveyHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .getHistory()
      .then((result) => {
        if (active) setHistory(result.history);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Could not load history.');
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

  return (
    <div ref={ref} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:gap-16">
        <div data-reveal>
          <p className="mono-label">Response history</p>
          <h1 className="mt-4 text-4xl sm:text-5xl">Surveys you have completed.</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft">
            Each completed survey is recorded here. Select View answers to see the responses
            you submitted; submitted answers are read-only.
          </p>
        </div>

        <div data-reveal className="border border-line bg-surface p-5">
          <p className="mono-label">Total responses</p>
          <p className="mt-2 font-serif text-4xl">{String(history.length).padStart(2, '0')}</p>
          <Link to="/" className={cn(buttonClasses('secondary', 'sm'), 'mt-4 w-full')}>
            Browse surveys
          </Link>
        </div>
      </div>

      <section className="mt-14 border-t border-line pt-8">
        {loading ? <LoadingBlock label="Loading history" /> : null}

        {!loading && error ? (
          <div className="space-y-4">
            <Notice tone="error">{error}</Notice>
            <Button variant="secondary" onClick={retryLoad}>
              Try again
            </Button>
          </div>
        ) : null}

        {!loading && !error && history.length === 0 ? (
          <div className="border border-dashed border-line-strong bg-surface px-6 py-12">
            <p className="font-serif text-2xl">Nothing submitted yet.</p>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              Answer a published survey and it will be listed here.
            </p>
            <Link to="/" className={cn(buttonClasses('primary', 'sm'), 'mt-5')}>
              Find a survey
            </Link>
          </div>
        ) : null}

        {!loading && !error && history.length > 0 ? (
          <ul className="border-t border-line">
            {history.map((entry) => (
              <li
                key={entry.id}
                data-reveal
                className="flex flex-col gap-4 border-b border-line py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
              >
                <div className="min-w-0">
                  <h2 className="text-xl">{entry.survey.title}</h2>
                  {entry.survey.description ? (
                    <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-ink-soft">
                      {entry.survey.description}
                    </p>
                  ) : null}
                </div>

                <Link
                  to={`/s/${entry.survey.id}`}
                  className={cn(buttonClasses('secondary', 'sm'), 'shrink-0')}
                >
                  View answers
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
