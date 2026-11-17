import { useEffect, useState, type DragEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { Button, LoadingBlock, Notice } from '../components/ui';
import { buttonClasses, cn } from '../lib/styles';
import { usePageReveal } from '../hooks/usePageReveal';
import { api, ApiError } from '../lib/api';
import {
  QUESTION_TYPE_HINTS,
  QUESTION_TYPE_LABELS,
  conditionValueOptions,
  createQuestion,
  defaultConditionValue,
  normalizeConditions,
  validateDraft,
} from '../lib/questions';
import type {
  Question,
  QuestionType,
  SurveyInput,
  SurveyStatus,
} from '../lib/types';

const questionTypes: QuestionType[] = ['text', 'single', 'multiple', 'rating'];

interface QuestionEditorProps {
  question: Question;
  index: number;
  questions: Question[];
  onPatch: (patch: Partial<Question>) => void;
  onTypeChange: (type: QuestionType) => void;
  onMove: (direction: -1 | 1) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
  onRemove: () => void;
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="3" r="1" />
      <circle cx="11" cy="3" r="1" />
      <circle cx="5" cy="8" r="1" />
      <circle cx="11" cy="8" r="1" />
      <circle cx="5" cy="13" r="1" />
      <circle cx="11" cy="13" r="1" />
    </svg>
  );
}

function QuestionEditor({
  question,
  index,
  questions,
  onPatch,
  onTypeChange,
  onMove,
  onDragStart,
  onDragEnd,
  dragging,
  onRemove,
}: QuestionEditorProps) {
  const earlierQuestions = questions.slice(0, index);
  const condition = question.condition;
  const source = condition
    ? questions.find((item) => item.id === condition.questionId)
    : undefined;
  const valueOptions = conditionValueOptions(source);
  const isChoice = question.type === 'single' || question.type === 'multiple';
  const options = question.options ?? [];

  function toggleCondition(checked: boolean) {
    if (!checked) {
      onPatch({ condition: undefined });
      return;
    }
    const previous = earlierQuestions[earlierQuestions.length - 1];
    if (!previous) return;
    onPatch({
      condition: {
        questionId: previous.id,
        operator: 'equals',
        value: defaultConditionValue(previous),
      },
    });
  }

  return (
    <div className="border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-strong/50 px-4 py-3">
        <span
          role="button"
          tabIndex={0}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', question.id);
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              onMove(-1);
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              onMove(1);
            }
          }}
          aria-label={`Drag question ${index + 1} to reorder. Use arrow keys to move it.`}
          title="Drag to reorder"
          className={cn(
            'grid h-8 w-6 cursor-grab place-items-center rounded-[2px] text-muted transition-colors hover:text-ink focus-visible:text-ink active:cursor-grabbing',
            dragging && 'cursor-grabbing text-accent',
          )}
        >
          <GripIcon />
        </span>

        <span className="font-mono text-[11px] text-muted">
          Q{String(index + 1).padStart(2, '0')}
        </span>

        <select
          value={question.type}
          onChange={(event) => onTypeChange(event.target.value as QuestionType)}
          aria-label="Question type"
          className="border border-line-strong bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft"
        >
          {questionTypes.map((type) => (
            <option key={type} value={type}>
              {QUESTION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        <span className="hidden text-xs text-muted md:inline">
          {QUESTION_TYPE_HINTS[question.type]}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(event) => onPatch({ required: event.target.checked })}
              className="h-3.5 w-3.5 accent-[var(--color-accent)]"
            />
            Required
          </label>
          <Button type="button" variant="danger" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <label htmlFor={`label-${question.id}`} className="mono-label mb-2 block">
          Question label
        </label>
        <input
          id={`label-${question.id}`}
          type="text"
          value={question.label}
          onChange={(event) => onPatch({ label: event.target.value })}
          className="field text-[15px]"
          placeholder="Write the question"
          maxLength={300}
        />

        {isChoice ? (
          <div className="mt-5">
            <p className="mono-label mb-2">Options</p>
            <div className="space-y-2">
              {options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <span className="w-5 font-mono text-[10px] text-muted">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(event) =>
                      onPatch({
                        options: options.map((item, currentIndex) =>
                          currentIndex === optionIndex ? event.target.value : item,
                        ),
                      })
                    }
                    className="field"
                    placeholder="Option label"
                    maxLength={300}
                    aria-label={`Option ${optionIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onPatch({ options: options.filter((_, currentIndex) => currentIndex !== optionIndex) })
                    }
                    disabled={options.length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() =>
                onPatch({ options: [...options, `Option ${options.length + 1}`] })
              }
              disabled={options.length >= 50}
            >
              Add option
            </Button>
          </div>
        ) : null}

        {question.type === 'rating' ? (
          <div className="mt-5">
            <p className="mono-label mb-2">Scale preview</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <span
                  key={rating}
                  className="grid h-9 w-9 place-items-center border border-line-strong bg-surface font-mono text-xs text-muted"
                >
                  {rating}
                </span>
              ))}
              <span className="mono-label ml-2">1 low / 5 high</span>
            </div>
          </div>
        ) : null}

        {question.type === 'text' ? (
          <div className="mt-5">
            <p className="mono-label mb-2">Answer preview</p>
            <div className="border border-dashed border-line-strong bg-surface px-3 py-2 text-sm text-muted">
              Respondents write their answer here.
            </div>
          </div>
        ) : null}

        <div className="mt-5 border-t border-line pt-4">
          {earlierQuestions.length === 0 ? (
            <p className="text-xs text-muted">
              Conditional logic becomes available after the first question.
            </p>
          ) : (
            <>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={Boolean(condition)}
                  onChange={(event) => toggleCondition(event.target.checked)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Show this question conditionally
              </label>

              {condition ? (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)]">
                    <select
                      value={condition.questionId}
                      onChange={(event) => {
                        const nextSource = questions.find(
                          (item) => item.id === event.target.value,
                        );
                        if (!nextSource) return;
                        onPatch({
                          condition: {
                            questionId: nextSource.id,
                            operator: condition.operator,
                            value: defaultConditionValue(nextSource),
                          },
                        });
                      }}
                      aria-label="Condition source question"
                      className="field"
                    >
                      {earlierQuestions.map((item, itemIndex) => (
                        <option key={item.id} value={item.id}>
                          Q{String(itemIndex + 1).padStart(2, '0')} —{' '}
                          {item.label.trim() || 'Untitled question'}
                        </option>
                      ))}
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(event) =>
                        onPatch({
                          condition: {
                            ...condition,
                            operator: event.target.value as 'equals' | 'not_equals',
                          },
                        })
                      }
                      aria-label="Condition operator"
                      className="field"
                    >
                      <option value="equals">is</option>
                      <option value="not_equals">is not</option>
                    </select>

                    {valueOptions.length > 0 ? (
                      <select
                        value={condition.value}
                        onChange={(event) =>
                          onPatch({
                            condition: { ...condition, value: event.target.value },
                          })
                        }
                        aria-label="Condition value"
                        className="field"
                      >
                        {!valueOptions.includes(condition.value) ? (
                          <option value={condition.value}>Select a value</option>
                        ) : null}
                        {valueOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(event) =>
                          onPatch({
                            condition: { ...condition, value: event.target.value },
                          })
                        }
                        aria-label="Condition value"
                        className="field"
                        placeholder="Answer value"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    The question stays hidden until this condition is met. Hidden answers
                    are not submitted.
                  </p>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SurveyBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ref = usePageReveal<HTMLDivElement>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [status, setStatus] = useState<SurveyStatus>('DRAFT');
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    questionId: string;
    position: 'before' | 'after';
  } | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;

    api
      .getSurvey(id)
      .then((result) => {
        if (!active) return;
        setTitle(result.survey.title);
        setDescription(result.survey.description);
        setQuestions(result.survey.questions);
        setStatus(result.survey.status);
        setResponseCount(result.survey.responseCount);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof ApiError ? err.message : 'Could not load the survey.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  function updateQuestion(questionId: string, patch: Partial<Question>) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        const next: Question = { ...question, ...patch };
        if ('condition' in patch && patch.condition === undefined) delete next.condition;
        if ('options' in patch && patch.options === undefined) delete next.options;
        return next;
      }),
    );
    setFormError('');
    setSaveMessage('');
  }

  function changeQuestionType(questionId: string, type: QuestionType) {
    setQuestions((current) =>
      normalizeConditions(
        current.map((question) => {
          if (question.id !== questionId) return question;
          const next: Question = { ...question, type };
          if (type === 'single' || type === 'multiple') {
            next.options =
              question.options && question.options.length >= 2
                ? question.options
                : ['Option 1', 'Option 2'];
          } else {
            delete next.options;
          }
          return next;
        }),
      ),
    );
    setFormError('');
    setSaveMessage('');
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return normalizeConditions(next);
    });
    setFormError('');
    setSaveMessage('');
  }

  function startDrag(questionId: string) {
    setDraggedId(questionId);
    setDropTarget(null);
    setFormError('');
    setSaveMessage('');
  }

  function endDrag() {
    setDraggedId(null);
    setDropTarget(null);
  }

  function dragOver(event: DragEvent<HTMLDivElement>, questionId: string) {
    if (!draggedId) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (draggedId === questionId) {
      setDropTarget(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDropTarget((current) =>
      current?.questionId === questionId && current.position === position
        ? current
        : { questionId, position },
    );
  }

  function dropQuestion(event: DragEvent<HTMLDivElement>, questionId: string) {
    if (!draggedId) return;

    event.preventDefault();

    const fromIndex = questions.findIndex((question) => question.id === draggedId);
    const targetIndex = questions.findIndex((question) => question.id === questionId);

    if (fromIndex === -1 || targetIndex === -1) {
      endDrag();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    let insertAt = targetIndex + (position === 'after' ? 1 : 0);
    if (fromIndex < insertAt) insertAt -= 1;

    if (insertAt !== fromIndex) {
      setQuestions((current) => {
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(insertAt, 0, moved);
        return normalizeConditions(next);
      });
      setFormError('');
      setSaveMessage('');
    }

    endDrag();
  }

  function removeQuestion(questionId: string) {
    setQuestions((current) =>
      normalizeConditions(current.filter((question) => question.id !== questionId)),
    );
    setFormError('');
    setSaveMessage('');
  }

  function addQuestion(type: QuestionType) {
    setQuestions((current) => [...current, createQuestion(type)]);
    setFormError('');
    setSaveMessage('');
  }

  function buildPayload(normalized: Question[]): SurveyInput {
    return {
      title: title.trim(),
      description: description.trim(),
      questions: normalized.map((question) => {
        const clean: Question = {
          id: question.id,
          type: question.type,
          label: question.label.trim(),
          required: question.required,
        };
        if (question.type === 'single' || question.type === 'multiple') {
          clean.options = (question.options ?? []).map((option) => option.trim());
        }
        if (question.condition) {
          clean.condition = {
            ...question.condition,
            value: question.condition.value.trim(),
          };
        }
        return clean;
      }),
    };
  }

  async function handleSave() {
    setFormError('');
    setSaveMessage('');

    const normalized = normalizeConditions(questions);
    setQuestions(normalized);

    const draftError = validateDraft(title, normalized);
    if (draftError) {
      setFormError(draftError);
      return;
    }

    const payload = buildPayload(normalized);
    setSaving(true);

    try {
      if (id) {
        const result = await api.updateSurvey(id, payload);
        setStatus(result.survey.status);
        setSaveMessage('Changes saved.');
      } else {
        const result = await api.createSurvey(payload);
        setStatus(result.survey.status);
        setResponseCount(result.survey.responseCount ?? 0);
        setSaveMessage('Survey saved. You can publish it when it is ready.');
        navigate(`/admin/surveys/${result.survey.id}/edit`, { replace: true });
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save the survey.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!id) {
      setFormError('Save the survey before publishing it.');
      return;
    }

    setStatusBusy(true);
    setFormError('');
    setSaveMessage('');

    try {
      const publish = status !== 'PUBLISHED';
      const result = await api.setSurveyStatus(id, publish);
      setStatus(result.survey.status);
      setSaveMessage(
        publish
          ? 'Survey published. Users can now answer it.'
          : 'Survey unpublished. It is hidden from users.',
      );
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not update the status.');
    } finally {
      setStatusBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <LoadingBlock label="Loading survey" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <p className="mono-label">Survey builder</p>
        <h1 className="mt-4 text-3xl">This survey cannot be opened.</h1>
        <p className="mt-3 text-sm text-ink-soft">{loadError}</p>
        <Link to="/admin" className={cn(buttonClasses('primary', 'sm'), 'mt-6')}>
          Back to surveys
        </Link>
      </div>
    );
  }

  const requiredCount = questions.filter((question) => question.required).length;

  return (
    <div ref={ref} className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <div data-reveal>
        <Link
          to="/admin"
          className="mono-label transition-colors hover:text-ink"
        >
          Back to surveys
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono-label">Survey builder</p>
            <h1 className="mt-3 text-3xl sm:text-4xl">
              {title.trim() || (id ? 'Edit survey' : 'New survey')}
            </h1>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {formError ? (
        <div className="mt-6">
          <Notice tone="error">{formError}</Notice>
        </div>
      ) : null}
      {saveMessage ? (
        <div className="mt-6">
          <Notice tone="success">{saveMessage}</Notice>
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-6">
          <section data-reveal className="border border-line bg-surface">
            <div className="border-b border-line px-5 py-3">
              <p className="mono-label">Survey details</p>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <label htmlFor="survey-title" className="mono-label mb-2 block">
                  Title
                </label>
                <input
                  id="survey-title"
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setFormError('');
                  }}
                  className="field text-base"
                  placeholder="What is this survey about?"
                  maxLength={160}
                />
              </div>
              <div>
                <label htmlFor="survey-description" className="mono-label mb-2 block">
                  Description
                </label>
                <textarea
                  id="survey-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="field min-h-[6rem]"
                  placeholder="A short introduction for respondents. This is optional."
                  maxLength={2000}
                />
              </div>
            </div>
          </section>

          <section data-reveal>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="mono-label">Questions</p>
              </div>
              <span className="mono-label">{questions.length} total</span>
            </div>

            {questions.length === 0 ? (
              <div className="mt-4 border border-dashed border-line-strong bg-surface px-5 py-10">
                <p className="font-serif text-xl">No questions yet.</p>
                <p className="mt-1.5 text-sm text-ink-soft">
                  Choose a question type below to add the first one.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    data-reveal
                    data-question-id={question.id}
                    onDragOver={(event) => dragOver(event, question.id)}
                    onDrop={(event) => dropQuestion(event, question.id)}
                    className={cn(
                      'relative transition-opacity',
                      draggedId === question.id && 'opacity-50',
                    )}
                  >
                    {dropTarget?.questionId === question.id &&
                    dropTarget.position === 'before' ? (
                      <span className="pointer-events-none absolute -top-2 left-0 right-0 z-10 h-0.5 bg-accent" />
                    ) : null}

                    <QuestionEditor
                      question={question}
                      index={index}
                      questions={questions}
                      onPatch={(patch) => updateQuestion(question.id, patch)}
                      onTypeChange={(type) => changeQuestionType(question.id, type)}
                      onMove={(direction) => moveQuestion(index, direction)}
                      onDragStart={() => startDrag(question.id)}
                      onDragEnd={endDrag}
                      dragging={draggedId === question.id}
                      onRemove={() => removeQuestion(question.id)}
                    />

                    {dropTarget?.questionId === question.id &&
                    dropTarget.position === 'after' ? (
                      <span className="pointer-events-none absolute -bottom-2 left-0 right-0 z-10 h-0.5 bg-accent" />
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 border border-line bg-surface p-4">
              <p className="mono-label">Add a question</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {questionTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addQuestion(type)}
                    className="border border-line-strong bg-surface px-3 py-2.5 text-left transition-colors hover:border-ink hover:bg-surface-strong"
                  >
                    <span className="block text-sm font-medium text-ink">
                      {QUESTION_TYPE_LABELS[type]}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-muted">
                      {QUESTION_TYPE_HINTS[type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div data-reveal className="border border-line bg-surface">
            <div className="border-b border-line px-4 py-3">
              <p className="mono-label">Publishing</p>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Status</span>
                <StatusBadge status={status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Questions</span>
                <span className="font-mono text-xs">{questions.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Required</span>
                <span className="font-mono text-xs">{requiredCount}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-ink-soft">Responses</span>
                <span className="font-mono text-xs">{responseCount}</span>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Saving…'
                  : id
                    ? 'Save changes'
                    : 'Save survey'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleToggleStatus}
                disabled={statusBusy || !id}
              >
                {statusBusy
                  ? 'Updating…'
                  : status === 'PUBLISHED'
                    ? 'Unpublish survey'
                    : 'Publish survey'}
              </Button>

              {!id ? (
                <p className="text-xs text-muted">Save the survey before publishing it.</p>
              ) : null}

              {id && status === 'PUBLISHED' ? (
                <Link
                  to={`/s/${id}`}
                  className={cn(buttonClasses('secondary', 'sm'), 'w-full')}
                >
                  Open survey form
                </Link>
              ) : null}

              {id ? (
                <Link
                  to={`/admin/surveys/${id}/analytics`}
                  className={cn(buttonClasses('ghost', 'sm'), 'w-full')}
                >
                  View analytics
                </Link>
              ) : null}
            </div>
          </div>

          <div data-reveal className="border border-line bg-surface p-4">
            <p className="mono-label">Conditional logic</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              A conditional question is only shown when an earlier answer matches. Answers
              to hidden questions are not stored or required.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
