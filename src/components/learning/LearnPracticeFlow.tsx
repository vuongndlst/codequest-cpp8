import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Code2, Gamepad2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { getConcept, type LessonLearningPath, type MicroPractice } from '@/data/curriculum';

type PracticeAnswer = number | string | string[];

export function LearnPracticeFlow({ path }: { path: LessonLearningPath }) {
  const [answers, setAnswers] = useState<Record<string, PracticeAnswer>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const concepts = useMemo(
    () => path.conceptIds.map(getConcept).filter((item) => item !== undefined),
    [path.conceptIds],
  );
  const completed = path.practices.filter(
    (practice) => checked[practice.id] && isPracticeCorrect(practice, answers[practice.id]),
  ).length;

  return (
    <section className="space-y-4" aria-labelledby="learn-practice-heading">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-quest-400">Học C++ thật</p>
        <h2 id="learn-practice-heading" className="text-xl font-extrabold text-slate-100">
          Khái niệm → ví dụ → dự đoán → thử nhanh
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Mỗi thẻ chỉ giới thiệu một ý mới. Phần Game API được đánh dấu riêng để em không nhầm với
          thư viện chuẩn của C++.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {concepts.map((concept) => (
          <article key={concept.id} className="cq-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-100">{concept.name}</h3>
                <p className="text-xs text-slate-500">{concept.englishName}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                  concept.category === 'cpp-language'
                    ? 'bg-quest-500/15 text-quest-300'
                    : 'bg-mage-500/15 text-mage-300',
                )}
              >
                {concept.category === 'cpp-language' ? (
                  <BookOpen className="size-3" aria-hidden="true" />
                ) : (
                  <Gamepad2 className="size-3" aria-hidden="true" />
                )}
                {concept.category === 'cpp-language' ? 'C++ language' : 'Game API'}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mt-3">{concept.explanation}</p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-abyss-950 p-3 font-mono text-xs text-verdant-300 whitespace-pre-wrap">
              {concept.syntax}
            </pre>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-slate-300 hover:text-slate-100">
                Xem ví dụ và lỗi thường gặp
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-abyss-900 p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                {concept.example}
              </pre>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-400">
                {concept.commonMistakes.map((mistake) => (
                  <li key={mistake}>{mistake}</li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-mage-400/35 bg-mage-500/10 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-mage-300">Dự đoán trước khi Run</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-200">{path.predictionPrompt}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-bold text-slate-100">
            <Code2 className="size-4 text-quest-400" aria-hidden="true" />
            Thử nhanh
          </h3>
          <span className="text-xs text-slate-400" aria-live="polite">
            {completed}/{path.practices.length} hoạt động đã đúng
          </span>
        </div>
        {path.practices.map((practice, index) => (
          <PracticeCard
            key={practice.id}
            practice={practice}
            index={index}
            answer={answers[practice.id]}
            checked={checked[practice.id] === true}
            onAnswer={(answer) => {
              setAnswers((current) => ({ ...current, [practice.id]: answer }));
              setChecked((current) => ({ ...current, [practice.id]: false }));
            }}
            onCheck={() => setChecked((current) => ({ ...current, [practice.id]: true }))}
          />
        ))}
      </div>
    </section>
  );
}

function PracticeCard({
  practice,
  index,
  answer,
  checked,
  onAnswer,
  onCheck,
}: {
  practice: MicroPractice;
  index: number;
  answer: PracticeAnswer | undefined;
  checked: boolean;
  onAnswer: (answer: PracticeAnswer) => void;
  onCheck: () => void;
}) {
  const correct = checked && isPracticeCorrect(practice, answer);
  const canCheck = answer !== undefined && (typeof answer !== 'string' || answer.trim().length > 0);

  return (
    <article className="cq-card p-4">
      <p className="text-sm font-bold text-slate-100">
        Hoạt động {index + 1}. {practice.prompt}
      </p>

      {'code' in practice && practice.code && (
        <pre className="my-3 overflow-x-auto rounded-lg bg-abyss-950 p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
          {practice.code}
        </pre>
      )}

      {practice.type === 'single-choice' && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {practice.options.map((option, optionIndex) => (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer gap-2 rounded-lg border p-3 text-sm',
                answer === optionIndex
                  ? 'border-quest-500 bg-quest-500/10 text-slate-100'
                  : 'border-abyss-600 text-slate-300 hover:border-abyss-500',
              )}
            >
              <input
                type="radio"
                name={practice.id}
                checked={answer === optionIndex}
                onChange={() => onAnswer(optionIndex)}
                className="mt-0.5 accent-cyan-500"
              />
              {option}
            </label>
          ))}
        </div>
      )}

      {practice.type === 'fill-code' && (
        <input
          aria-label={`Đáp án cho ${practice.prompt}`}
          value={typeof answer === 'string' ? answer : ''}
          onChange={(event) => onAnswer(event.target.value)}
          className="mt-3 w-full rounded-lg border border-abyss-600 bg-abyss-950 px-3 py-2 font-mono text-sm text-slate-100 focus:border-quest-500"
          placeholder="Gõ phần code còn thiếu"
          spellCheck={false}
        />
      )}

      {practice.type === 'ordering' && (
        <OrderingPractice
          items={Array.isArray(answer) ? answer : practice.items}
          onChange={onAnswer}
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onCheck} disabled={!canCheck && practice.type !== 'ordering'}>
          Kiểm tra
        </Button>
        {checked && (
          <p
            className={cn('text-sm', correct ? 'text-verdant-400' : 'text-treasure-300')}
            role="status"
          >
            {correct ? 'Chính xác. ' : 'Chưa khớp. '}
            <span className="text-slate-400">{practice.explanation}</span>
          </p>
        )}
      </div>
    </article>
  );
}

function OrderingPractice({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <ol className="mt-3 space-y-2">
      {items.map((item, index) => (
        <li key={item} className="flex items-center gap-2 rounded-lg border border-abyss-600 bg-abyss-900 p-2">
          <span className="grid size-7 place-items-center rounded bg-abyss-700 text-xs font-bold text-slate-300">
            {index + 1}
          </span>
          <code className="min-w-0 flex-1 text-xs text-slate-200">{item}</code>
          <button
            type="button"
            onClick={() => move(index, -1)}
            disabled={index === 0}
            className="rounded p-1.5 text-slate-400 hover:bg-abyss-700 hover:text-slate-100 disabled:opacity-30"
            aria-label={`Đưa dòng ${index + 1} lên`}
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(index, 1)}
            disabled={index === items.length - 1}
            className="rounded p-1.5 text-slate-400 hover:bg-abyss-700 hover:text-slate-100 disabled:opacity-30"
            aria-label={`Đưa dòng ${index + 1} xuống`}
          >
            <ArrowDown className="size-4" aria-hidden="true" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() => onChange([...items].reverse())}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          Đảo thứ tự để thử lại
        </button>
      </li>
    </ol>
  );
}

export function isPracticeCorrect(practice: MicroPractice, answer: PracticeAnswer | undefined): boolean {
  if (practice.type === 'single-choice') return answer === practice.correctIndex;
  if (practice.type === 'ordering') {
    return Array.isArray(answer) && practice.correctOrder.every((item, index) => answer[index] === item);
  }
  if (typeof answer !== 'string') return false;
  const normalized = answer.trim().replace(/\s+/g, ' ');
  return practice.acceptedAnswers.some(
    (accepted) => accepted.trim().replace(/\s+/g, ' ') === normalized,
  );
}
