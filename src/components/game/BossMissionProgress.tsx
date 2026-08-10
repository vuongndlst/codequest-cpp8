import { Check, LockKeyhole, Swords } from 'lucide-react';
import { zonePresentation } from '@/data/zonePresentation';
import { cn } from '@/utils/cn';

interface BossMissionProgressProps {
  lessonId?: string;
  playedCount: number;
  totalEvents: number;
}

/** Ba chặng ngắn giúp học sinh nhìn Boss như một bài toán có thể chia nhỏ. */
export function BossMissionProgress({ lessonId, playedCount, totalEvents }: BossMissionProgressProps) {
  const zone = zonePresentation(lessonId);
  const progress = totalEvents > 0 ? playedCount / totalEvents : 0;
  const activeIndex = Math.min(2, Math.floor(progress * 3));

  return (
    <div className="mb-3 rounded-xl border border-mage-400/25 bg-mage-500/8 p-2.5 sm:mr-44" aria-label="Tiến độ thử thách Boss">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold text-mage-100">
          <Swords className="size-3.5" aria-hidden="true" />
          Kế hoạch 3 chặng
        </p>
        <span className="text-[10px] text-slate-400">Chia nhỏ bài toán trước khi chiến đấu</span>
      </div>
      <ol className="grid grid-cols-3 gap-1.5 list-none">
        {zone.bossPhases.map((label, index) => {
          const completed = totalEvents > 0 && progress >= (index + 1) / 3;
          const active = totalEvents > 0 && !completed && index === activeIndex;
          return (
            <li
              key={label}
              className={cn(
                'flex min-h-10 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-colors',
                completed
                  ? 'border-verdant-400/30 bg-verdant-500/12 text-verdant-200'
                  : active
                    ? 'border-mage-300/40 bg-mage-500/18 text-mage-100'
                    : 'border-abyss-700 bg-abyss-900/70 text-slate-500',
              )}
            >
              {completed ? <Check className="size-3 shrink-0" /> : <LockKeyhole className="size-3 shrink-0" />}
              <span>{index + 1}. {label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
