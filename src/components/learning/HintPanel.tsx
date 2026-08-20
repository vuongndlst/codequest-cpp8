import { useEffect, useState } from 'react';
import { Braces, Code2, Eye, Lightbulb, Lock, MessageCircleQuestion, X } from 'lucide-react';
import type { Hint } from '@/types/content';
import { Button } from '@/components/ui/Button';
import { ByteMascot } from '@/components/game/ByteMascot';
import { CppCodeBlock } from '@/components/editor/CppCodeBlock';
import { cn } from '@/utils/cn';

interface HintPanelProps {
  hints: Hint[];
  /** Số gợi ý đã mở (0..số nấc của bài). */
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
  /** Chỉ hiện biểu tượng trong thanh điều khiển hẹp; nhãn được đưa vào tooltip. */
  iconOnly?: boolean;
}

const TYPE_META = {
  question: { icon: MessageCircleQuestion, label: 'Câu hỏi định hướng' },
  structure: { icon: Lightbulb, label: 'Nhắc cấu trúc' },
  command: { icon: Braces, label: 'Nên dùng lệnh nào?' },
  skeleton: { icon: Code2, label: 'Khung code' },
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
  iconOnly = false,
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
        aria-label="Gợi ý"
        title="Gợi ý từ Byte"
        className={cn(
          'group/hint relative inline-flex cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(168,85,247,.24)]',
          iconOnly ? 'size-10 p-0' : 'h-9 gap-2 px-3',
          isOpen
            ? 'border-mage-400/60 bg-mage-500/15 text-mage-300'
            : 'border-abyss-600 bg-abyss-800 text-slate-300 hover:border-mage-400/50 hover:text-mage-300',
        )}
      >
        <Lightbulb className="size-4" aria-hidden="true" />
        {!iconOnly && 'Gợi ý'}
        {unlockedLevel > 0 && (
          <span className={cn(
            'rounded-full bg-mage-500/20 text-[10px] tabular-nums',
            iconOnly ? 'absolute -right-1 -top-1 min-w-4 px-1 py-0.5' : 'px-1.5 py-0.5',
          )}>
            {iconOnly ? unlockedLevel : `${unlockedLevel}/${sortedHints.length}`}
          </span>
        )}
        {iconOnly && (
          <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover/hint:opacity-100 group-focus-visible/hint:opacity-100">
            Gợi ý từ Byte
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-16 right-3 z-[70] max-h-[76vh] w-[min(36rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-mage-400/40 bg-abyss-900 p-4 shadow-2xl shadow-black/40 sm:right-4">
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
                const meta = TYPE_META[hint.type];
                const Icon = meta.icon;
                return (
                  <li key={hint.level} className="rounded-xl border border-abyss-700 bg-abyss-950/55 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-mage-300" aria-hidden="true" />
                      <p className="text-xs font-bold uppercase tracking-wide text-mage-300">
                        Gợi ý {hint.level} · {meta.label}
                      </p>
                    </div>
                    <HintContent hint={hint} />
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
              {nextHint && <span className="sr-only"> — {TYPE_META[nextHint.type].label}</span>}
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
              <CppCodeBlock code={solution} label="C++ · Cách làm mẫu" />
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
function HintContent({ hint }: { hint: Hint }) {
  const { content } = hint;
  if (hint.type === 'command' && hint.commands?.length) {
    return (
      <div className="mt-2 space-y-3">
        <p className="text-sm leading-relaxed text-slate-300">{content}</p>
        <CppCodeBlock
          code={hint.commands.map((command) => command.signature).join('\n')}
          label="C++ · Lệnh có thể cần"
        />
        <ul className="space-y-1.5">
          {hint.commands.map((command) => (
            <li key={command.signature} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <span className="mt-0.5 shrink-0 rounded-md bg-mage-500/15 px-1.5 py-0.5 font-bold text-mage-300">
                {command.category}
              </span>
              <span><code className="font-mono font-semibold text-slate-200">{command.signature}</code> — {command.description}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs font-medium text-quest-300">Chọn lệnh phù hợp rồi tự gõ; gợi ý không chèn code vào editor.</p>
      </div>
    );
  }

  const match = /```(?:cpp)?\n?([\s\S]*?)```/.exec(content);

  if (!match) {
    if (hint.type === 'skeleton') return <CppCodeBlock code={content} label="C++ · Khung code" className="mt-2" />;
    return <p className="mt-1 text-sm leading-relaxed text-slate-300">{content}</p>;
  }

  const before = content.slice(0, match.index).trim();
  const after = content.slice(match.index + match[0].length).trim();

  return (
    <div className="mt-1 space-y-2">
      {before && <p className="text-sm leading-relaxed text-slate-300">{before}</p>}
      <CppCodeBlock code={match[1].replace(/\n$/, '')} label="C++" />
      {after && <p className="text-sm leading-relaxed text-slate-300">{after}</p>}
    </div>
  );
}
