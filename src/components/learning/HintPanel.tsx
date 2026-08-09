import { Lightbulb, Lock, MessageCircleQuestion, Code2, Eye } from 'lucide-react';
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
}

const LEVEL_META = {
  1: { icon: MessageCircleQuestion, label: 'Câu hỏi định hướng' },
  2: { icon: Lightbulb, label: 'Nhắc cấu trúc' },
  3: { icon: Code2, label: 'Khung code' },
} as const;

/**
 * Hệ thống gợi ý ba cấp (mục 9 của đề bài).
 *
 * Nguyên tắc quan trọng nhất: KHÔNG có bất kỳ chỗ nào khiến học sinh cảm thấy
 * dùng gợi ý là kém. Không đếm ngược "còn 1 gợi ý", không cảnh báo, không trừ
 * sao. Số gợi ý đã dùng có được ghi lại, nhưng chỉ để giáo viên biết lớp đang
 * vướng ở đâu.
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
}: HintPanelProps) {
  const sortedHints = [...hints].sort((a, b) => a.level - b.level);
  const hasMore = unlockedLevel < sortedHints.length;
  const nextHint = sortedHints[unlockedLevel];

  return (
    // `data-panel` để test bố cục bám được vào khối này mà không phụ thuộc
    // vào lớp CSS — lớp CSS đổi luôn, vị trí trên trang thì không được đổi
    <section className="cq-panel p-4" aria-labelledby="hints-heading" data-panel="hints">
      <div className="flex items-center gap-2 mb-3">
        <ByteMascot size={36} animated={false} mood="thinking" />
        <h3 id="hints-heading" className="text-sm font-bold text-slate-200">
          Byte gợi ý cho em
        </h3>
      </div>

      {unlockedLevel === 0 ? (
        <p className="text-sm text-slate-400 mb-3">
          Em cứ thử tự làm trước nhé. Khi nào thấy vướng, bấm nút dưới đây — dùng gợi ý là chuyện
          hoàn toàn bình thường.
        </p>
      ) : (
        <ol className="space-y-3 mb-3">
          {sortedHints.slice(0, unlockedLevel).map((hint) => {
            const meta = LEVEL_META[hint.level];
            const Icon = meta.icon;

            return (
              <li key={hint.level} className="flex gap-3">
                <span
                  className="grid place-items-center size-7 rounded-lg bg-mage-500/15 text-mage-300 shrink-0"
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-mage-300 uppercase tracking-wide">
                    Gợi ý {hint.level} · {meta.label}
                  </p>
                  <HintContent content={hint.content} />
                </div>
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
          {unlockedLevel === 0 ? 'Xem gợi ý đầu tiên' : `Xem gợi ý tiếp theo`}
          {nextHint && (
            <span className="sr-only"> — {LEVEL_META[nextHint.level].label}</span>
          )}
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
                Em đã xem hết gợi ý. Đáp án mẫu chỉ mở khi thầy bật, hoặc sau khi em thử thêm vài
                lần nữa ({attemptCount}/6 lần thử).
              </span>
            </p>
          )}
        </div>
      )}

      {solutionVisible && solution && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-treasure-300 uppercase tracking-wide mb-1">
            Một cách làm mẫu
          </p>
          <pre className="font-mono text-xs bg-abyss-950 rounded-lg p-3 overflow-x-auto text-slate-300 whitespace-pre">
            {solution}
          </pre>
          <p className="text-xs text-slate-500 mt-2">
            Em đọc hiểu rồi tự gõ lại nhé — gõ lại giúp nhớ lâu hơn nhiều so với sao chép.
          </p>
        </div>
      )}
    </section>
  );
}

/** Nội dung gợi ý có thể chứa một khối code trong ```cpp … ``` */
function HintContent({ content }: { content: string }) {
  const match = /```(?:cpp)?\n?([\s\S]*?)```/.exec(content);

  if (!match) {
    return <p className="text-sm text-slate-300 leading-relaxed mt-0.5">{content}</p>;
  }

  const before = content.slice(0, match.index).trim();
  const after = content.slice(match.index + match[0].length).trim();

  return (
    <div className="mt-0.5 space-y-2">
      {before && <p className="text-sm text-slate-300 leading-relaxed">{before}</p>}
      <pre
        className={cn(
          'font-mono text-xs bg-abyss-950 rounded-lg p-3 overflow-x-auto',
          'text-slate-300 whitespace-pre border border-abyss-700',
        )}
      >
        {match[1].replace(/\n$/, '')}
      </pre>
      {after && <p className="text-sm text-slate-300 leading-relaxed">{after}</p>}
    </div>
  );
}
