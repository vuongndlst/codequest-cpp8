import { useEffect, useId, useRef, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { HANDBOOK_CARDS, searchHandbook } from '@/data/handbook';
import { LESSONS_META } from '@/data/lessons.meta';
import type { HandbookCard } from '@/types/content';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

/**
 * Sổ tay lệnh (mục 10).
 *
 * Dùng được ở hai nơi: trang riêng và modal mở ngay trong màn hình nhiệm vụ.
 * Sổ tay KHÔNG bao giờ hiện lời giải của challenge đang làm — nó chỉ nhắc cú
 * pháp chung, ví dụ trong sổ tay cố ý dùng ngữ cảnh khác.
 */

interface HandbookProps {
  /** Chỉ hiện thẻ đã học tới — tránh làm học sinh choáng ngợp */
  upToLessonId?: string;
  compact?: boolean;
}

export function Handbook({ upToLessonId, compact = false }: HandbookProps) {
  const [query, setQuery] = useState('');
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const searchId = useId();

  const lessonOrder = (lessonId: string) =>
    LESSONS_META.findIndex((lesson) => lesson.id === lessonId);

  const maxOrder = upToLessonId ? lessonOrder(upToLessonId) : LESSONS_META.length;

  const cards = searchHandbook(query).filter(
    (card) => lessonOrder(card.introducedInLesson) <= maxOrder,
  );

  return (
    <div className={cn('space-y-4', compact && 'text-sm')}>
      <div>
        <label htmlFor={searchId} className="sr-only">
          Tìm lệnh trong sổ tay
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm lệnh… (ví dụ: cout, vòng lặp, if)"
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-abyss-900 border border-abyss-600 text-slate-100 placeholder:text-slate-500 focus:border-quest-500"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500" role="status" aria-live="polite">
        {cards.length === 0
          ? 'Không tìm thấy thẻ nào khớp. Em thử từ khoá khác nhé.'
          : `${cards.length} thẻ lệnh`}
        {upToLessonId && cards.length < HANDBOOK_CARDS.length && !query && (
          <> · Các thẻ khác sẽ mở dần khi em học tới</>
        )}
      </p>

      <ul className="space-y-2 list-none">
        {cards.map((card) => (
          <HandbookCardItem
            key={card.id}
            card={card}
            isOpen={openCardId === card.id}
            onToggle={() => setOpenCardId(openCardId === card.id ? null : card.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function HandbookCardItem({
  card,
  isOpen,
  onToggle,
}: {
  card: HandbookCard;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentId = useId();

  return (
    <li className="cq-panel overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-abyss-800/60 transition-colors"
      >
        <span
          className="grid place-items-center size-8 rounded-lg bg-quest-500/15 text-quest-400 shrink-0"
          aria-hidden="true"
        >
          <BookOpen className="size-4" />
        </span>
        <span className="font-semibold text-slate-100 flex-1">{card.title}</span>
        <span className="text-xs text-slate-500" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen && (
        <div id={contentId} className="px-3 pb-3 space-y-3 border-t border-abyss-700 pt-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Cú pháp
            </p>
            <pre className="font-mono text-xs bg-abyss-950 rounded-lg p-3 overflow-x-auto text-quest-400 whitespace-pre">
              {card.syntax}
            </pre>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{card.explanation}</p>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Ví dụ
            </p>
            <pre className="font-mono text-xs bg-abyss-950 rounded-lg p-3 overflow-x-auto text-slate-300 whitespace-pre">
              {card.example}
            </pre>
          </div>

          <div>
            <p className="text-xs font-semibold text-alert-400 uppercase tracking-wide mb-1">
              Lỗi thường gặp
            </p>
            <ul className="space-y-1">
              {card.commonMistakes.map((mistake, index) => (
                <li key={index} className="text-sm text-slate-400 flex gap-2">
                  <span aria-hidden="true">·</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-mage-500/10 border border-mage-400/30 p-3">
            <p className="text-xs font-semibold text-mage-300 uppercase tracking-wide mb-1">
              Mẹo ghi nhớ
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">{card.tip}</p>
          </div>
        </div>
      )}
    </li>
  );
}

/** Sổ tay mở dạng cửa sổ nổi trong màn hình nhiệm vụ. */
export function HandbookModal({
  open,
  onClose,
  upToLessonId,
}: {
  open: boolean;
  onClose: () => void;
  upToLessonId?: string;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-abyss-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handbook-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl cq-card p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="handbook-title" className="text-xl font-bold text-slate-100">
              Sổ tay lệnh
            </h2>
            <p className="text-sm text-slate-400">
              Tra cú pháp bất cứ lúc nào — không tính là dùng gợi ý đâu nhé.
            </p>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Đóng sổ tay lệnh"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <Handbook upToLessonId={upToLessonId} compact />
      </div>
    </div>
  );
}
