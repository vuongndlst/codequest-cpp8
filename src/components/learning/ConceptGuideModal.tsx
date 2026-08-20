import { useEffect, useRef } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { ConceptGuide } from '@/types/content';
import { ConceptGuidePanel } from './ConceptGuidePanel';

interface ConceptGuideModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  guide: ConceptGuide;
}

/** Kiến thức mở tại chỗ để học sinh tra cứu mà không rời code đang viết. */
export function ConceptGuideModal({ open, onClose, title, guide }: ConceptGuideModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
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
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-abyss-950/85 p-3 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="concept-guide-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-mage-400/35 bg-abyss-900 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-abyss-700 bg-abyss-900/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-mage-300">
              <BookOpen className="size-3.5" aria-hidden="true" /> Kiến thức khu vực
            </p>
            <h2 id="concept-guide-modal-title" className="truncate text-lg font-bold text-slate-100">
              {title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-abyss-700 hover:text-white"
            aria-label="Đóng phần kiến thức"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="p-3 sm:p-5">
          <ConceptGuidePanel guide={guide} />
        </div>
      </div>
    </div>
  );
}
