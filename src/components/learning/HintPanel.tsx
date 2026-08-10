import { useEffect, useState } from 'react';
import { Code2, Eye, Lightbulb, Lock, MessageCircleQuestion, X } from 'lucide-react';
import type { Hint } from '@/types/content';
import { Button } from '@/components/ui/Button';
import { ByteMascot } from '@/components/game/ByteMascot';
import { cn } from '@/utils/cn';

interface HintPanelProps {
  hints: Hint[];
  /** Số gợi ý đã mở (0..3) */
  unlockedLevel: number;
  onUnlock: () => void;
  /** Đáp án đầy đủ — chỉ truyền vào khi đủ điều kiện hiển thị */
  solution?: string;
  canViewSolution: boolean;
  onViewSolution: () => void;
  solutionVisible: boolean;
  attemptCount: number;
  /** Cho phép trang mở popover ngay khi lỗi vừa đề nghị một gợi ý. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const LEVEL_META = {
  1: { icon: MessageCircleQuestion, label: 'Câu hỏi định hướng' },
  2: { icon: Lightbulb, label: 'Nhắc cấu trúc' },
  3: { icon: Code2, label: 'Khung code' },
} as const;

/**
 * Gợi ý dạng popover.
 *
 * Trạng thái đóng chỉ còn một nút nhỏ cạnh công cụ editor. Nội dung chỉ nổi
 * lên khi học sinh chủ động yêu cầu, nên không cạnh tranh thị giác với bản đồ
 * và code. Dùng click thay cho hover thuần để học sinh dùng tablet và bàn phím
 * vẫn đọc được nội dung dài hoặc khối code.
 */
export function HintPanel({
  hints,
  unlockedLevel,
  onUnlock,
  solution,
  canViewSolution,
  onViewSolution,
  solutionVisible,
  attemptCount,
  open,
  onOpenChange,
}: HintPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const sortedHints = [...hints].sort((a, b) => a.level - b.level);
  const hasMore = unlockedLevel < sortedHints.length;
  const nextHint = sortedHints[unlockedLevel];

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  return (
    <section className="relative" aria-label="Gợi ý của Byte" data-panel="hints">
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors',
          isOpen
            ? 'border-mage-400/60 bg-mage-500/15 text-mage-300'
            : 'border-abyss-600 bg-abyss-800 text-slate-300 hover:border-mage-400/50 hover:text-mage-300',
        )}
      >
        <Lightbulb className="size-4" aria-hidden="true" />
        Gợi ý
        {unlockedLevel > 0 && (
          <span className="rounded-full bg-mage-500/20 px-1.5 py-0.5 text-[10px] tabular-nums">
            {unlockedLevel}/{sortedHints.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-[min(31rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-2xl border border-mage-400/40 bg-abyss-900 p-4 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 border-b border-abyss-700 pb-3">
            <ByteMascot size={34} animated={false} mood="thinking" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-100">Byte gợi ý</p>
              <p className="text-xs text-slate-500">Không trừ XP hay số lần thử</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-abyss-700 hover:text-slate-200"
              aria-label="Đóng gợi ý"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {unlockedLevel === 0 ? (
            <p className="my-4 text-sm leading-relaxed text-slate-400">
              Em thử nói thành lời bước tiếp theo trước nhé. Nếu vẫn vướng, mở gợi ý đầu tiên —
              Byte chỉ đặt câu hỏi định hướng, chưa đưa đáp án.
            </p>
          ) : (
            <ol className="my-4 space-y-3">
              {sortedHints.slice(0, unlockedLevel).map((hint) => {
                const meta = LEVEL_META[hint.level];
                const Icon = meta.icon;
                return (
                  <li key={hint.level} className="rounded-xl border border-abyss-700 bg-abyss-950/55 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-mage-300" aria-hidden="true" />
                      <p className="text-xs font-bold uppercase tracking-wide text-mage-300">
                        Gợi ý {hint.level} · {meta.label}
                      </p>
                    </div>
                    <HintContent content={hint.content} />
                  </li>
                );
              })}
            </ol>
          )}

          {hasMore && (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={onUnlock}
              leadingIcon={<Lightbulb className="size-4" aria-hidden="true" />}
            >
              {unlockedLevel === 0 ? 'Mở gợi ý đầu tiên' : 'Mở gợi ý tiếp theo'}
              {nextHint && <span className="sr-only"> — {LEVEL_META[nextHint.level].label}</span>}
            </Button>
          )}

          {!hasMore && !solutionVisible && (
            <div className="mt-2">
              {canViewSolution && solution ? (
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={onViewSolution}
                  leadingIcon={<Eye className="size-4" aria-hidden="true" />}
                >
                  Xem một cách làm mẫu
                </Button>
              ) : (
                <p className="flex items-start gap-2 text-xs text-slate-500">
                  <Lock className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Đáp án mẫu mở khi thầy cho phép, hoặc sau 6 lần thử ({attemptCount}/6).
                  </span>
                </p>
              )}
            </div>
          )}

          {solutionVisible && solution && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-treasure-300">
                Một cách làm mẫu
              </p>
              <pre className="overflow-x-auto rounded-lg bg-abyss-950 p-3 font-mono text-xs text-slate-300 whitespace-pre">
                {solution}
              </pre>
              <p className="mt-2 text-xs text-slate-500">
                Em đọc hiểu rồi tự gõ lại nhé — như vậy sẽ nhớ lâu hơn sao chép.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Nội dung gợi ý có thể chứa một khối code trong ```cpp … ``` */
function HintContent({ content }: { content: string }) {
  const match = /```(?:cpp)?\n?([\s\S]*?)```/.exec(content);

  if (!match) {
    return <p className="mt-1 text-sm leading-relaxed text-slate-300">{content}</p>;
  }

  const before = content.slice(0, match.index).trim();
  const after = content.slice(match.index + match[0].length).trim();

  return (
    <div className="mt-1 space-y-2">
      {before && <p className="text-sm leading-relaxed text-slate-300">{before}</p>}
      <pre className="overflow-x-auto rounded-lg border border-abyss-700 bg-abyss-950 p-3 font-mono text-xs text-slate-300 whitespace-pre">
        {match[1].replace(/\n$/, '')}
      </pre>
      {after && <p className="text-sm leading-relaxed text-slate-300">{after}</p>}
    </div>
  );
}
