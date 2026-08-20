import { useEffect, useRef } from 'react';
import { Check, Circle, Map, Target } from 'lucide-react';
import type { Challenge } from '@/types/content';
import { Button } from '@/components/ui/Button';
import { ByteMascot } from '@/components/game/ByteMascot';
import { cn } from '@/utils/cn';

interface MissionBriefingModalProps {
  open: boolean;
  challenge: Challenge;
  zoneName: string;
  position: number;
  total: number;
  kindLabel: string;
  passedTestIds: ReadonlySet<string>;
  acknowledged: boolean;
  actionLabel?: string;
  onClose: () => void;
}

/**
 * Briefing đầu màn: gom câu chuyện, kế hoạch và bằng chứng hoàn thành vào một nơi.
 * Sau khi học sinh xác nhận, workspace chỉ còn map + code để giảm tải thị giác.
 */
export function MissionBriefingModal({
  open,
  challenge,
  zoneName,
  position,
  total,
  kindLabel,
  passedTestIds,
  acknowledged,
  actionLabel,
  onClose,
}: MissionBriefingModalProps) {
  const actionRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => actionRef.current?.focus(), 0);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const visibleTests = challenge.testCases.filter((test) => test.visible && test.required);

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-abyss-950/82 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-briefing-title"
    >
      <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-quest-400/45 bg-abyss-900 shadow-[0_28px_90px_rgba(2,6,23,.72),0_0_42px_rgba(34,211,238,.12)]">
        <header className="relative overflow-hidden border-b border-abyss-700 bg-[radial-gradient(circle_at_82%_0%,rgba(34,211,238,.18),transparent_42%),linear-gradient(135deg,rgba(14,116,144,.16),transparent_58%)] px-5 py-5 sm:px-7">
          <div className="relative flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-quest-300/25 bg-abyss-950/75 shadow-[0_0_24px_rgba(34,211,238,.16)]">
              <ByteMascot size={42} animated />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.17em] text-quest-300">
                {zoneName} · Nhiệm vụ {position}/{total}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-quest-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-quest-300">
                  {kindLabel}
                </span>
                <h2 id="mission-briefing-title" className="text-xl font-black text-slate-50 sm:text-2xl">
                  {challenge.title}
                </h2>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-slate-100">
              <Map className="size-4 text-quest-300" aria-hidden="true" /> Nhiệm vụ
            </h3>
            <p className="mt-2 text-base leading-relaxed text-slate-300">{challenge.story}</p>

            <ol className="mt-5 space-y-2.5">
              {challenge.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3 text-sm leading-relaxed text-slate-200">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-quest-500/15 text-xs font-black text-quest-300">
                    {index + 1}
                  </span>
                  <span className="whitespace-pre-line">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <section className="rounded-2xl border border-quest-400/25 bg-quest-500/[.06] p-4" aria-labelledby="completion-heading">
            <h3 id="completion-heading" className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-quest-300">
              <Target className="size-4" aria-hidden="true" /> Điều kiện hoàn thành
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Sau khi chạy, các bằng chứng đạt yêu cầu sẽ được đánh dấu tại đây.
            </p>
            <ul className="mt-4 space-y-2.5">
              {visibleTests.map((test) => {
                const passed = passedTestIds.has(test.id);
                return (
                  <li key={test.id} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-200">
                    <span
                      className={cn(
                        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border',
                        passed
                          ? 'border-verdant-400 bg-verdant-500/20 text-verdant-300'
                          : 'border-slate-600 bg-abyss-950/55 text-slate-500',
                      )}
                      aria-hidden="true"
                    >
                      {passed ? <Check className="size-3" /> : <Circle className="size-2.5" />}
                    </span>
                    <span>{test.name}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-abyss-700 bg-abyss-950/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-slate-400">
            Em có thể mở lại nhiệm vụ bất cứ lúc nào ở dưới khung code.
          </p>
          <Button
            ref={actionRef}
            onClick={onClose}
            leadingIcon={acknowledged ? <Map className="size-4" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            className="cursor-pointer whitespace-nowrap"
          >
            {actionLabel ?? (acknowledged ? 'Quay lại làm bài' : 'Đã hiểu · Bắt đầu')}
          </Button>
        </footer>
      </section>
    </div>
  );
}
