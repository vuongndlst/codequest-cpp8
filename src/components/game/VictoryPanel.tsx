import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowRight, Gem, ScrollText, Sparkles, Star, Target } from 'lucide-react';
import type { Challenge } from '@/types/content';
import type { RunResult } from '@/types/runner';
import { Button } from '@/components/ui/Button';
import { ByteMascot } from '@/components/game/ByteMascot';
import { playSound, playVictoryFanfare } from '@/services/audio';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

interface VictoryPanelProps {
  challenge: Challenge;
  result: RunResult | null;
  xpAwarded: number;
  gemsAwarded?: number;
  /** Điều hướng bằng router của ứng dụng — KHÔNG dùng thẻ `a` để khỏi tải lại cả trang */
  onNext: () => void;
  nextLabel: string;
  /** Nút phụ, ví dụ quay về danh sách nhiệm vụ */
  secondaryAction?: React.ReactNode;
}

/**
 * Màn ăn mừng khi hoàn thành nhiệm vụ.
 *
 * Đây là khoảnh khắc đáng nhớ nhất của cả nhiệm vụ, nên nó phải RA DÁNG một
 * phần thưởng chứ không phải một dòng thông báo. Có tiếng reo, có XP đếm lên,
 * có kết quả "số dòng vàng", và có đáp án mẫu để em đối chiếu.
 *
 * VÌ SAO LỘ ĐÁP ÁN MẪU Ở ĐÂY: em đã tự giải xong rồi mới thấy nó. Lúc này đối
 * chiếu hai cách làm là bài học giá trị nhất — "à, chỗ này mình viết dài hơn".
 * Trước khi giải xong thì đáp án vẫn khoá như cũ.
 */
export function VictoryPanel({
  challenge,
  result,
  xpAwarded,
  gemsAwarded = 0,
  onNext,
  nextLabel,
  secondaryAction,
}: VictoryPanelProps) {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const [showSolution, setShowSolution] = useState(false);
  const [shownXp, setShownXp] = useState(reducedMotion ? xpAwarded : 0);

  const isBoss = challenge.kind === 'boss';
  const par = result?.par ?? null;

  // Tiếng reo mừng, kêu đúng một lần khi bảng hiện ra
  useEffect(() => {
    playVictoryFanfare(isBoss);
    const gemTimer = window.setTimeout(() => {
      if (gemsAwarded > 0) playSound('gem');
    }, 620);
    return () => window.clearTimeout(gemTimer);
  }, [gemsAwarded, isBoss]);

  /*
    XP đếm dần lên thay vì hiện phắt con số cuối.

    Con số nhảy lên từng nấc kéo mắt học sinh nhìn vào phần thưởng — hiệu ứng
    nhỏ nhưng là thứ khiến em thấy mình vừa ĐẠT ĐƯỢC cái gì đó. Bật chế độ giảm
    chuyển động thì hiện thẳng con số cuối.
  */
  useEffect(() => {
    if (reducedMotion || xpAwarded <= 0) {
      setShownXp(xpAwarded);
      return;
    }

    setShownXp(0);
    const steps = Math.min(xpAwarded, 20);
    const stepSize = xpAwarded / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      setShownXp(Math.round(Math.min(xpAwarded, stepSize * current)));
      if (current >= steps) clearInterval(timer);
    }, 45);

    return () => clearInterval(timer);
  }, [xpAwarded, reducedMotion]);

  return (
    <section
      className="cq-card relative overflow-hidden p-5 border-verdant-500/60 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.18),transparent_48%)]"
      role="status"
      aria-live="polite"
      aria-labelledby="victory-heading"
    >
      {!reducedMotion && xpAwarded > 0 && (
        <div className="cq-fireworks" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index} style={{ '--spark': index } as CSSProperties} />
          ))}
        </div>
      )}

      <div className="relative z-10 flex items-center gap-4">
        <span
          className="shrink-0"
          style={{ animation: reducedMotion ? undefined : 'hero-cheer 1.2s ease-out' }}
        >
          <ByteMascot size={56} mood="cheer" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 id="victory-heading" className="text-lg font-extrabold text-verdant-400">
            {isBoss ? 'Em đã đánh bại Boss của khu vực này!' : 'Nhiệm vụ hoàn thành!'}
          </h3>

          <p className="mt-0.5 text-sm text-slate-300">ByteLand đã ghi nhận chiến công của em.</p>
        </div>
      </div>

      {xpAwarded > 0 && (
        <div className="relative z-10 mt-4 grid grid-cols-3 gap-2" aria-label="Phần thưởng nhiệm vụ">
          <RewardCard
            icon={<Sparkles className="size-4" aria-hidden="true" />}
            value={`+${shownXp}`}
            label="XP"
            tone="cyan"
          />
          <RewardCard
            icon={<Gem className="size-4" aria-hidden="true" />}
            value={`+${gemsAwarded}`}
            label="Gem"
            tone="gold"
          />
          <RewardCard
            icon={<Star className="size-4" aria-hidden="true" />}
            value="1/1"
            label="Mục tiêu"
            tone="green"
          />
        </div>
      )}

      {/* --- Kết quả số dòng vàng --- */}
      {par?.par != null && (
        <div
          className={cn(
            'flex items-center gap-2.5 mt-4 rounded-xl border p-3',
            par.meetsPar
              ? 'border-treasure-400/60 bg-treasure-400/10'
              : 'border-abyss-600 bg-abyss-800/60',
          )}
        >
          <Target
            className={cn('size-5 shrink-0', par.meetsPar ? 'text-treasure-400' : 'text-slate-400')}
            aria-hidden="true"
          />
          <p className="text-sm text-slate-300 leading-relaxed">
            {par.meetsPar ? (
              <>
                <strong className="text-treasure-300">Đạt số dòng vàng!</strong> Em giải bằng{' '}
                {par.count} câu lệnh — gọn đúng mức.
              </>
            ) : (
              <>
                Em giải bằng <strong className="text-slate-100">{par.count}</strong> câu lệnh. Có
                cách chỉ cần <strong className="text-treasure-300">{par.par}</strong> — em thử quay
                lại rút gọn xem sao nhé.
              </>
            )}
          </p>
        </div>
      )}

      {/* --- Đáp án mẫu để đối chiếu --- */}
      {challenge.solution && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSolution((open) => !open)}
            aria-expanded={showSolution}
            leadingIcon={<ScrollText className="size-4" aria-hidden="true" />}
          >
            {showSolution ? 'Ẩn đáp án mẫu' : 'Xem đáp án mẫu để đối chiếu'}
          </Button>

          {showSolution && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1.5">
                Không có nghĩa cách của em sai — nhiều bài có nhiều lời giải đúng. Em so xem hai
                cách khác nhau ở chỗ nào.
              </p>
              <pre className="font-mono text-xs bg-abyss-950 rounded-lg p-3 overflow-x-auto text-slate-300 whitespace-pre">
                {challenge.solution}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <Button
          onClick={onNext}
          trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
        >
          {nextLabel}
        </Button>
        {secondaryAction}
      </div>
    </section>
  );
}

function RewardCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: 'cyan' | 'gold' | 'green';
}) {
  const tones = {
    cyan: 'border-quest-400/25 bg-quest-500/10 text-quest-200',
    gold: 'border-treasure-400/30 bg-treasure-500/10 text-treasure-200',
    green: 'border-verdant-400/25 bg-verdant-500/10 text-verdant-200',
  };

  return (
    <div className={cn('rounded-xl border px-2 py-2.5 text-center shadow-lg', tones[tone])}>
      <span className="mx-auto flex w-fit items-center justify-center gap-2 font-extrabold tabular-nums">
        <span className="grid shrink-0 place-items-center" aria-hidden="true">{icon}</span>
        <span>{value}</span>
      </span>
      <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider opacity-75">{label}</span>
    </div>
  );
}
