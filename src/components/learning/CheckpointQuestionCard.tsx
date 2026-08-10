import { ArrowDown, ArrowUp, Check, CircleDashed } from 'lucide-react';
import type { CheckpointAnswer, ExitTicketQuestion } from '@/types/content';
import { isQuestionCorrect } from '@/utils/checkpoint';
import { cn } from '@/utils/cn';

export function CheckpointQuestionCard({
  question,
  index,
  answer,
  submitted,
  onChange,
}: {
  question: ExitTicketQuestion;
  index: number;
  answer: CheckpointAnswer | undefined;
  submitted: boolean;
  onChange: (answer: CheckpointAnswer) => void;
}) {
  const isScored = question.type !== 'self-assess';
  const correct = submitted && isQuestionCorrect(question, answer);

  return (
    <fieldset className="cq-card p-4">
      <legend className="px-1 text-sm font-bold text-slate-100">
        Câu {index + 1}. {question.prompt}
        {!isScored && <span className="ml-2 text-xs font-normal text-slate-500">(không có đúng/sai)</span>}
      </legend>

      {question.code && (
        <pre className="my-3 overflow-x-auto rounded-lg bg-abyss-950 p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
          {question.code}
        </pre>
      )}

      {question.type === 'multiple-answer' ? (
        <MultipleAnswer question={question} answer={answer} onChange={onChange} />
      ) : question.type === 'ordering' ? (
        <OrderingAnswer question={question} answer={answer} onChange={onChange} />
      ) : question.type === 'matching' ? (
        <MatchingAnswer question={question} answer={answer} onChange={onChange} />
      ) : question.type === 'fill-code' ? (
        <input
          aria-label={`Đáp án câu ${index + 1}`}
          value={typeof answer === 'string' ? answer : ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Gõ phần code còn thiếu"
          spellCheck={false}
          className="mt-3 w-full rounded-xl border border-abyss-600 bg-abyss-950 p-3 font-mono text-sm text-slate-100 focus:border-quest-500"
        />
      ) : (
        <SingleAnswer question={question} answer={answer} submitted={submitted} onChange={onChange} />
      )}

      {submitted && isScored && (
        <div
          role="status"
          className={cn(
            'mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm',
            correct
              ? 'border-verdant-500/40 bg-verdant-500/10 text-verdant-300'
              : 'border-treasure-400/40 bg-treasure-400/10 text-treasure-300',
          )}
        >
          {correct ? (
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <CircleDashed className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <p>
            <strong>{correct ? 'Chính xác.' : 'Chưa chính xác.'}</strong>{' '}
            <span className="text-slate-400">
              {correct ? question.explanation : question.misconception ?? question.explanation}
            </span>
          </p>
        </div>
      )}
    </fieldset>
  );
}

function SingleAnswer({
  question,
  answer,
  submitted,
  onChange,
}: {
  question: ExitTicketQuestion;
  answer: CheckpointAnswer | undefined;
  submitted: boolean;
  onChange: (answer: CheckpointAnswer) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {question.options.map((option, optionIndex) => {
        const selected = answer === optionIndex;
        const correct = submitted && question.correctIndex === optionIndex;
        return (
          <label
            key={option}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors',
              selected ? 'border-quest-500 bg-quest-500/10' : 'border-abyss-600 hover:border-abyss-500',
              correct && 'border-verdant-500 bg-verdant-500/10',
            )}
          >
            <input
              type="radio"
              name={question.id}
              checked={selected}
              onChange={() => onChange(optionIndex)}
              className="mt-1 accent-cyan-500"
            />
            <span className="flex-1 text-slate-200">{option}</span>
          </label>
        );
      })}
    </div>
  );
}

function MultipleAnswer({ question, answer, onChange }: QuestionAnswerProps) {
  const selected = Array.isArray(answer) && answer.every((item) => typeof item === 'number')
    ? (answer as number[])
    : [];
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-slate-500">Chọn tất cả đáp án phù hợp.</p>
      {question.options.map((option, optionIndex) => (
        <label key={option} className="flex cursor-pointer gap-3 rounded-xl border border-abyss-600 p-3 text-sm text-slate-200 hover:border-abyss-500">
          <input
            type="checkbox"
            checked={selected.includes(optionIndex)}
            onChange={() =>
              onChange(
                selected.includes(optionIndex)
                  ? selected.filter((item) => item !== optionIndex)
                  : [...selected, optionIndex],
              )
            }
            className="mt-0.5 accent-cyan-500"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

function OrderingAnswer({ question, answer, onChange }: QuestionAnswerProps) {
  const items = Array.isArray(answer) && answer.every((item) => typeof item === 'string')
    ? (answer as string[])
    : question.options;
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <ol className="mt-3 space-y-2">
      {items.map((item, itemIndex) => (
        <li key={item} className="flex items-center gap-2 rounded-lg border border-abyss-600 bg-abyss-900 p-2">
          <span className="grid size-7 place-items-center rounded bg-abyss-700 text-xs text-slate-300">{itemIndex + 1}</span>
          <code className="min-w-0 flex-1 text-xs text-slate-200">{item}</code>
          <button type="button" disabled={itemIndex === 0} onClick={() => move(itemIndex, -1)} aria-label={`Đưa dòng ${itemIndex + 1} lên`} className="rounded p-1.5 text-slate-400 hover:bg-abyss-700 disabled:opacity-30">
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
          <button type="button" disabled={itemIndex === items.length - 1} onClick={() => move(itemIndex, 1)} aria-label={`Đưa dòng ${itemIndex + 1} xuống`} className="rounded p-1.5 text-slate-400 hover:bg-abyss-700 disabled:opacity-30">
            <ArrowDown className="size-4" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ol>
  );
}

function MatchingAnswer({ question, answer, onChange }: QuestionAnswerProps) {
  const selected = typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
  return (
    <div className="mt-3 space-y-2">
      {(question.matches ?? []).map((pair) => (
        <label key={pair.left} className="grid gap-2 rounded-lg border border-abyss-600 p-3 text-sm sm:grid-cols-[1fr_1fr] sm:items-center">
          <span className="text-slate-200">{pair.left}</span>
          <select
            aria-label={`Ghép với ${pair.left}`}
            value={selected[pair.left] ?? ''}
            onChange={(event) => onChange({ ...selected, [pair.left]: event.target.value })}
            className="rounded-lg border border-abyss-600 bg-abyss-950 px-3 py-2 text-slate-200"
          >
            <option value="">Chọn ý phù hợp</option>
            {question.options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

interface QuestionAnswerProps {
  question: ExitTicketQuestion;
  answer: CheckpointAnswer | undefined;
  onChange: (answer: CheckpointAnswer) => void;
}
