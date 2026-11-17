import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePageReveal } from '../hooks/usePageReveal';
import { Badge, Button, LoadingBlock, Notice } from '../components/ui';
import { buttonClasses, cn } from '../lib/styles';
import { api, ApiError } from '../lib/api';
import { formatDateTime, pluralize } from '../lib/format';
import {
  collectVisibleAnswers,
  isEmptyAnswer,
  validateAnswers,
  visibleQuestions,
} from '../lib/questions';
import type { Answers, Question, UserSurvey } from '../lib/types';

function QuestionField({
  question,
  index,
  value,
  error,
  onChange,
}: {
  question: Question;
  index: number;
  value: Answers[string] | undefined;
  error?: string;
  onChange: (value: Answers[string]) => void;
}) {
  const fieldId = `question-${question.id}`;
  const labelId = `label-${question.id}`;
  const errorId = `error-${question.id}`;
  const errorProps = error
    ? { 'aria-invalid': true, 'aria-describedby': errorId }
    : {};

  return (
    <div className="border-b border-line py-7">
      <div className="flex items-start gap-4">
        <span className="pt-1 font-mono text-[11px] text-muted">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p id={labelId} className="text-[15px] font-medium leading-snug text-ink">
              {question.label}
            </p>
            {question.required ? (
              <span className="mono-label text-accent">Required</span>
            ) : (
              <span className="mono-label">Optional</span>
            )}
          </div>

          {question.type === 'text' ? (
            <textarea
              id={fieldId}
              aria-labelledby={labelId}
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => onChange(event.target.value)}
              className="field mt-4 min-h-[7.5rem]"
              placeholder="Write your answer"
              maxLength={5000}
              {...errorProps}
            />
          ) : null}

          {question.type === 'single' ? (
            <div
              id={fieldId}
              role="radiogroup"
              aria-labelledby={labelId}
              tabIndex={-1}
              className="mt-4 grid gap-2"
              {...errorProps}
            >
              {(question.options ?? []).map((option) => {
                const checked = value === option;
                return (
                  <label
                    key={option}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors',
                      checked
                        ? 'border-accent bg-accent-soft text-ink'
                        : 'border-line-strong bg-surface text-ink-soft hover:border-ink hover:text-ink',
                    )}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={checked}
                      onChange={() => onChange(option)}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          ) : null}

          {question.type === 'multiple' ? (
            <div
              id={fieldId}
              role="group"
              aria-labelledby={labelId}
              tabIndex={-1}
              className="mt-4 grid gap-2"
              {...errorProps}
            >
              {(question.options ?? []).map((option) => {
                const selected = Array.isArray(value) ? value : [];
                const checked = selected.includes(option);
                return (
                  <label
                    key={option}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors',
                      checked
                        ? 'border-accent bg-accent-soft text-ink'
                        : 'border-line-strong bg-surface text-ink-soft hover:border-ink hover:text-ink',
                    )}
                  >
                    <input
                      type="checkbox"
                      value={option}
                      checked={checked}
                      onChange={() =>
                        onChange(
                          checked
                            ? selected.filter((item) => item !== option)
                            : [...selected, option],
                        )
                      }
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          ) : null}

          {question.type === 'rating' ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div
                id={fieldId}
                role="radiogroup"
                aria-labelledby={labelId}
                tabIndex={-1}
                className="flex items-center gap-2"
                {...errorProps}
              >
                {[1, 2, 3, 4, 5].map((rating) => {
                  const checked = value === rating;
                  return (
                    <label
                      key={rating}
                      className={cn(
                        'flex h-11 w-11 cursor-pointer items-center justify-center border font-mono text-sm transition-colors',
                        checked
                          ? 'border-accent bg-accent text-paper'
                          : 'border-line-strong bg-surface text-ink-soft hover:border-ink hover:text-ink',
                      )}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={rating}
                        checked={checked}
                        onChange={() => onChange(rating)}
                        aria-label={`Rating ${rating} of 5`}
                        className="sr-only"
                      />
                      {rating}
                    </label>
                  );
                })}
              </div>
              <span className="mono-label ml-1">1 low / 5 high</span>
            </div>
          ) : null}

          {error ? (
            <p id={errorId} className="mt-2 text-xs text-accent-deep">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReadonlyAnswer({
  question,
  value,
}: {
  question: Question;
  value: Answers[string] | undefined;
}) {
  if (isEmptyAnswer(value)) {
    return <p className="text-sm text-muted">Not answered</p>;
  }

  if (question.type === 'text' && typeof value === 'string') {
    return (
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">{value}</p>
    );
  }

  if (question.type === 'multiple' && Array.isArray(value)) {
    return (
      <ul className="space-y-1.5">
        {value.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-ink-soft">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (question.type === 'rating') {
    const rating = Number(value);
    return (
      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <span
            key={item}
            className={cn(
              'grid h-9 w-9 place-items-center border text-sm',
              item === rating
                ? 'border-accent bg-accent text-paper'
                : 'border-line-strong bg-surface text-muted',
            )}
          >
            {item}
          </span>
        ))}
        <span className="mono-label ml-2">{rating} / 5</span>
      </div>
    );
  }

  return <p className="text-[15px] text-ink-soft">{String(value)}</p>;
}

export function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const ref = usePageReveal<HTMLDivElement>();

  const [survey, setSurvey] = useState<UserSurvey | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;

    api
      .getUserSurvey(id)
      .then((result) => {
        if (active) setSurvey(result.survey);
      })
      .catch((err) => {
        if (active) {
          setLoadError(
            err instanceof ApiError && err.status === 404
              ? err.message
              : 'Could not load this survey.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  function focusFirstError(nextErrors: Record<string, string>) {
    const firstQuestionId = Object.keys(nextErrors)[0];
    const element = document.getElementById(`question-${firstQuestionId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (element as HTMLElement | null)?.focus({ preventScroll: true });
  }

  function setAnswer(questionId: string, value: Answers[string]) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setErrors((current) => {
      if (!current[questionId]) return current;
      const next = { ...current };
      delete next[questionId];
      return next;
    });
    setFormError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!survey || !id) return;

    setFormError('');
    setSuccessMessage('');
    const validationErrors = validateAnswers(survey.questions, answers);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      return;
    }

    const payload = collectVisibleAnswers(survey.questions, answers);
    if (Object.keys(payload).length === 0) {
      setFormError('Answer at least one question before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.submitResponse(id, payload);
      setSurvey({
        ...survey,
        completed: true,
        submittedAt: result.response.submittedAt,
        answers: payload,
        seenQuestionIds: survey.questions.map((question) => question.id),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) setErrors(err.errors);
        setFormError(err.message);
      } else {
        setFormError('Could not submit the response. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddendumSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!survey || !id) return;

    const savedAnswers = survey.answers ?? {};
    const seen = new Set(survey.seenQuestionIds ?? []);
    const mergedAnswers = { ...savedAnswers, ...answers };
    const addedQuestions = survey.questions.filter((question) => !seen.has(question.id));
    const pendingQuestions = visibleQuestions(addedQuestions, mergedAnswers);

    setFormError('');
    setSuccessMessage('');
    const validationErrors = validateAnswers(pendingQuestions, mergedAnswers);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      return;
    }

    const payload = collectVisibleAnswers(pendingQuestions, mergedAnswers);
    if (Object.keys(payload).length === 0) {
      setFormError('Answer at least one new question before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.submitResponse(id, payload);
      setSurvey({
        ...survey,
        completed: true,
        submittedAt: result.response.submittedAt,
        answers: { ...savedAnswers, ...payload },
        seenQuestionIds: survey.questions.map((question) => question.id),
      });
      setAnswers({});
      setErrors({});
      setSubmitted(true);
      setSuccessMessage('Your new answers were saved.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) setErrors(err.errors);
        setFormError(err.message);
      } else {
        setFormError('Could not save the new answers. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <LoadingBlock label="Loading survey" />
      </div>
    );
  }

  if (loadError || !survey) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <p className="mono-label">Survey unavailable</p>
        <h1 className="mt-4 text-3xl">This survey cannot be opened.</h1>
        <p className="mt-3 text-sm text-ink-soft">{loadError || 'It may have been removed.'}</p>
        <Link to="/" className={cn(buttonClasses('primary', 'sm'), 'mt-6')}>
          Back to surveys
        </Link>
      </div>
    );
  }

  if (survey.completed || submitted) {
    const savedAnswers = survey.answers ?? {};
    const reviewQuestions = visibleQuestions(survey.questions, savedAnswers);
    const answeredCount = reviewQuestions.filter(
      (question) => !isEmptyAnswer(savedAnswers[question.id]),
    ).length;
    const seen = new Set(survey.seenQuestionIds ?? []);
    const mergedAnswers = { ...savedAnswers, ...answers };
    const addedQuestions = survey.questions.filter((question) => !seen.has(question.id));
    const pendingQuestions = visibleQuestions(addedQuestions, mergedAnswers);

    return (
      <div ref={ref} className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 lg:py-16">
        <div data-reveal>
          <div className="flex flex-wrap items-center gap-3">
            <p className="mono-label">
              {pendingQuestions.length > 0 ? 'Response update' : 'Submitted response'}
            </p>
            <Badge tone={pendingQuestions.length > 0 ? 'accent' : 'completed'}>
              {pendingQuestions.length > 0 ? 'Update available' : 'Completed'}
            </Badge>
            <span className="mono-label">
              {pendingQuestions.length > 0 ? 'New questions' : 'Read only'}
            </span>
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl">{survey.title}</h1>
          {survey.description ? (
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              {survey.description}
            </p>
          ) : null}
          <p className="mono-label mt-4">
            Submitted {survey.submittedAt ? formatDateTime(survey.submittedAt) : 'just now'}
            <span className="mx-2 text-line-strong">/</span>
            {pluralize(answeredCount, 'answer')}
          </p>

          {pendingQuestions.length > 0 ? (
            <div className="mt-8 border border-accent/30 bg-accent-soft p-5">
              <p className="text-sm text-accent-deep">
                The administrator added {pluralize(pendingQuestions.length, 'new question')}.
                Answer {pendingQuestions.length === 1 ? 'it' : 'them'} below. Your existing
                answers stay locked and will not be changed.
              </p>
            </div>
          ) : (
            <div className="mt-8 border border-forest/30 bg-forest-soft p-5">
              <p className="text-sm text-forest">
                These are the answers you submitted. This response cannot be edited.
              </p>
            </div>
          )}

          {successMessage ? (
            <Notice tone="success" autoHideMs={4000} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Notice>
          ) : null}
        </div>

        {pendingQuestions.length > 0 ? (
          <section data-reveal className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
              <h2 className="text-2xl">New questions</h2>
              <p className="mono-label">{pluralize(pendingQuestions.length, 'question')}</p>
            </div>

            {formError ? (
              <div className="mt-5">
                <Notice tone="error">{formError}</Notice>
              </div>
            ) : null}

            <form onSubmit={handleAddendumSubmit} className="mt-1" noValidate>
              {pendingQuestions.map((question) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  index={survey.questions.findIndex((item) => item.id === question.id)}
                  value={answers[question.id]}
                  error={errors[question.id]}
                  onChange={(value) => setAnswer(question.id, value)}
                />
              ))}

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Submit new answers'}
                </Button>
                <p className="mono-label">Previous answers stay unchanged</p>
              </div>
            </form>
          </section>
        ) : null}

        <section data-reveal className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
            <h2 className="text-2xl">
              {pendingQuestions.length > 0 ? 'Your existing answers' : 'Your answers'}
            </h2>
            <p className="mono-label">{pluralize(reviewQuestions.length, 'question')}</p>
          </div>

          <ol className="mt-1">
            {reviewQuestions.map((question, index) => (
              <li key={question.id} className="border-b border-line py-6">
                <div className="flex items-start gap-4">
                  <span className="pt-1 font-mono text-[11px] text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="text-[15px] font-medium leading-snug text-ink">
                        {question.label}
                      </p>
                      <span className="mono-label">
                        {question.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <div className="mt-3 border-l-2 border-accent/40 bg-paper px-4 py-3">
                      <ReadonlyAnswer question={question} value={savedAnswers[question.id]} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/history" className={buttonClasses('primary', 'sm')}>
            View history
          </Link>
          <Link to="/" className={buttonClasses('secondary', 'sm')}>
            Back to surveys
          </Link>
        </div>
      </div>
    );
  }

  const questions = survey.questions;
  const visible = visibleQuestions(questions, answers);
  const answered = visible.filter((question) => !isEmptyAnswer(answers[question.id])).length;
  const progress = visible.length > 0 ? Math.round((answered / visible.length) * 100) : 0;

  return (
    <div ref={ref} className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 lg:py-16">
      <div data-reveal>
        <p className="mono-label">Survey / {pluralize(questions.length, 'question')}</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">{survey.title}</h1>
        {survey.description ? (
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            {survey.description}
          </p>
        ) : null}
      </div>

      <div data-reveal className="mt-9 border-y border-line py-4">
        <div className="flex items-center justify-between">
          <span className="mono-label">Progress</span>
          <span className="font-mono text-[11px] text-muted">
            {answered} / {visible.length} answered
          </span>
        </div>
        <div className="mt-2 h-[3px] w-full bg-surface-strong">
          <div
            className="h-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {formError ? (
        <div className="mt-6">
          <Notice tone="error">{formError}</Notice>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-1" noValidate>
        {visible.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            index={questions.findIndex((item) => item.id === question.id)}
            value={answers[question.id]}
            error={errors[question.id]}
            onChange={(value) => setAnswer(question.id, value)}
          />
        ))}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit response'}
          </Button>
          <p className="mono-label">One response per account</p>
        </div>
      </form>
    </div>
  );
}
