import { useState } from 'react';
import { Check, ListOrdered, RotateCcw, Search, X } from 'lucide-react';
import type { AmbiguityActivity, OrderingActivity } from '@/data/prologue';
import { Button } from '@/components/ui/Button';
import { RichText } from '@/components/common/RichText';
import { cn } from '@/utils/cn';

/**
 * Hai hoạt động tương tác của phần mở đầu.
 *
 * Cố ý KHÔNG có dòng C++ nào, KHÔNG tính điểm, KHÔNG ghi database. Mục đích
 * duy nhất là để học sinh tự trải nghiệm hai tính chất khó nhất của thuật toán:
 * thứ tự các bước, và sự rõ ràng của từng bước.
 *
 * Làm sai thì chỉ hiện lời giải thích rồi cho làm lại — giống mọi nơi khác
 * trong website, không có chữ "Sai" hay "Thất bại".
 */

// ────────────────────────────────────── Hoạt động 1: sắp xếp các bước

export function StepOrderingActivity({ activity }: { activity: OrderingActivity }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const isComplete = picked.length === activity.steps.length;
  const isCorrect =
    isComplete && picked.every((id, index) => id === activity.correctOrder[index]);

  const togglePick = (id: string) => {
    if (checked) return;
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const reset = () => {
    setPicked([]);
    setChecked(false);
  };

  return (
    <section className="cq-card p-5" aria-labelledby="ordering-heading">
      <h3
        id="ordering-heading"
        className="flex items-center gap-2 text-base font-bold text-slate-100 mb-1"
      >
        <ListOrdered className="size-5 text-quest-400" aria-hidden="true" />
        Thử sức: sắp xếp các bước
      </h3>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">{activity.prompt}</p>

      <ul className="space-y-2 list-none">
        {activity.steps.map((step) => {
          const position = picked.indexOf(step.id);
          const isPicked = position !== -1;
          const isRightSpot = checked && activity.correctOrder[position] === step.id;
          const isWrongSpot = checked && isPicked && !isRightSpot;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => togglePick(step.id)}
                aria-pressed={isPicked}
                disabled={checked}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                  'disabled:cursor-default',
                  isWrongSpot
                    ? 'border-treasure-400/60 bg-treasure-400/10'
                    : isRightSpot
                      ? 'border-verdant-500/60 bg-verdant-500/10'
                      : isPicked
                        ? 'border-quest-500 bg-quest-500/10'
                        : 'border-abyss-600 hover:border-abyss-500',
                )}
              >
                <span
                  className={cn(
                    'grid place-items-center size-8 rounded-lg shrink-0 text-sm font-bold',
                    isPicked ? 'bg-quest-500/20 text-quest-400' : 'bg-abyss-700 text-slate-500',
                  )}
                  aria-hidden="true"
                >
                  {isPicked ? position + 1 : '·'}
                </span>

                <span className="text-sm text-slate-200 flex-1">{step.text}</span>

                {isPicked && (
                  <span className="sr-only">Đang ở vị trí thứ {position + 1}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-2 mt-4">
        {!checked ? (
          <Button size="sm" disabled={!isComplete} onClick={() => setChecked(true)}>
            Kiểm tra thứ tự
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={reset}
            leadingIcon={<RotateCcw className="size-4" aria-hidden="true" />}
          >
            Thử lại
          </Button>
        )}

        {!checked && picked.length > 0 && (
          <Button size="sm" variant="ghost" onClick={reset}>
            Xoá lựa chọn
          </Button>
        )}
      </div>

      {!checked && !isComplete && (
        <p className="text-xs text-slate-500 mt-2">
          Đã chọn {picked.length}/{activity.steps.length} bước. Bấm vào một bước đã chọn để bỏ nó ra.
        </p>
      )}

      {checked && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'mt-4 rounded-xl border p-4',
            isCorrect
              ? 'border-verdant-500/50 bg-verdant-500/10'
              : 'border-treasure-400/50 bg-treasure-400/10',
          )}
        >
          <p
            className={cn(
              'font-bold mb-1',
              isCorrect ? 'text-verdant-400' : 'text-treasure-300',
            )}
          >
            {isCorrect ? 'Chuẩn rồi!' : 'Chưa đúng thứ tự — em thử lại nhé'}
          </p>

          {!isCorrect && (
            <p className="text-sm text-slate-300 mb-2">
              Thứ tự đúng là:{' '}
              {activity.correctOrder
                .map(
                  (id, index) =>
                    `${index + 1}. ${activity.steps.find((step) => step.id === id)?.text}`,
                )
                .join(' → ')}
            </p>
          )}

          <p className="text-sm text-slate-300 leading-relaxed">
            <RichText text={activity.explanation} />
          </p>
        </div>
      )}
    </section>
  );
}

// ────────────────────────────── Hoạt động 2: tìm bước chưa rõ ràng

export function AmbiguitySpotActivity({ activity }: { activity: AmbiguityActivity }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = activity.steps.find((step) => step.id === selectedId);
  const ambiguousStep = activity.steps.find((step) => step.isAmbiguous)!;

  return (
    <section className="cq-card p-5" aria-labelledby="ambiguity-heading">
      <h3
        id="ambiguity-heading"
        className="flex items-center gap-2 text-base font-bold text-slate-100 mb-1"
      >
        <Search className="size-5 text-mage-300" aria-hidden="true" />
        Thử sức: tìm bước robot không hiểu nổi
      </h3>
      <p className="text-sm text-slate-400 mb-1 leading-relaxed">{activity.prompt}</p>
      <p className="text-sm font-medium text-mage-300 mb-4">{activity.scenario}</p>

      <ol className="space-y-2 list-none">
        {activity.steps.map((step, index) => {
          const isSelected = step.id === selectedId;
          const revealed = isSelected;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => setSelectedId(isSelected ? null : step.id)}
                aria-pressed={isSelected}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors',
                  revealed && step.isAmbiguous
                    ? 'border-verdant-500/60 bg-verdant-500/10'
                    : revealed
                      ? 'border-treasure-400/50 bg-treasure-400/10'
                      : 'border-abyss-600 hover:border-abyss-500',
                )}
              >
                <span
                  className="grid place-items-center size-7 rounded-lg bg-abyss-700 text-slate-400 text-sm font-bold shrink-0"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{step.text}</p>

                  {revealed && (
                    <p className="text-sm text-slate-400 leading-relaxed mt-1.5">
                      <RichText text={step.why} />
                    </p>
                  )}
                </div>

                {revealed && (
                  <span className="shrink-0 mt-0.5" aria-hidden="true">
                    {step.isAmbiguous ? (
                      <Check className="size-5 text-verdant-400" />
                    ) : (
                      <X className="size-5 text-treasure-300" />
                    )}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div role="status" aria-live="polite" className="mt-4">
        {!selected && (
          <p className="text-sm text-slate-500">
            Bấm vào bước em nghi ngờ để xem giải thích. Chọn sai cũng không sao — mỗi lần chọn đều
            có lời giải thích riêng.
          </p>
        )}

        {selected && selected.isAmbiguous && (
          <div className="rounded-xl border border-verdant-500/50 bg-verdant-500/10 p-4">
            <p className="font-bold text-verdant-400 mb-1">Đúng rồi, chính là bước đó!</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Con người đọc "{ambiguousStep.text.toLowerCase()}" là hiểu ngay, vì mình có kinh
              nghiệm. Máy tính không có kinh nghiệm nào cả — nên mọi bước đều phải ghi rõ tới mức
              không còn chỗ để đoán.
            </p>
          </div>
        )}

        {selected && !selected.isAmbiguous && (
          <div className="rounded-xl border border-treasure-400/50 bg-treasure-400/10 p-4">
            <p className="font-bold text-treasure-300 mb-1">Bước này robot làm được đấy</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Em thử tìm bước nào có từ ngữ mà mỗi người hiểu một kiểu — kiểu như "vừa đủ", "một
              lát", "cho đẹp".
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
