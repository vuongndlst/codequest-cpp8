import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Gem, ScrollText, Sparkles, Star, Target } from 'lucide-react';
import type { Challenge } from '@/types/content';
import type { RunResult } from '@/types/runner';
import { Button } from '@/components/ui/Button';
import { ByteMascot } from '@/components/game/ByteMascot';
import { playSound, playVictoryFanfare } from '@/services/audio';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { getLevelProgress } from '@/utils/xp';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface VictoryPanelProps {
  challenge: Challenge;
  result: RunResult | null;
  xpAwarded: number;
  gemsAwarded?: number;
  /** Điều hướng bằng router của ứng dụng — KHÔNG dùng thẻ `a` để khỏi tải lại cả trang */
  onNext: () => void;
  nextLabel: string;
  nextTitle?: string;
  totalXp?: number;
  gemBalance?: number;
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
  nextTitle,
  totalXp,
  gemBalance,
  secondaryAction,
}: VictoryPanelProps) {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const [showSolution, setShowSolution] = useState(false);
  const [shownXp, setShownXp] = useState(reducedMotion ? xpAwarded : 0);
  const dialogRef = useRef<HTMLElement>(null);

  const isBoss = challenge.kind === 'boss';
  const hasNewReward = xpAwarded > 0 || gemsAwarded > 0;
  const par = result?.par ?? null;
  const levelProgress = getLevelProgress(totalXp ?? xpAwarded);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
    <div className="fixed inset-0 z-[100] grid place-items-center bg-abyss-950/72 p-4 backdrop-blur-sm" data-testid="victory-modal-backdrop">
    <section
      ref={dialogRef}
      tabIndex={-1}
      className="cq-card relative max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto border-verdant-500/60 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.2),transparent_48%)] p-5 shadow-[0_30px_100px_rgba(0,0,0,.65)] outline-none sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-heading"
      aria-describedby="victory-description"
    >
      {!reducedMotion && hasNewReward && (
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

          <p id="victory-description" className="mt-0.5 text-sm text-slate-300">ByteLand đã ghi nhận chiến công của em.</p>
        </div>
      </div>

      <div
        className="relative z-10 mt-4 rounded-2xl border border-treasure-400/35 bg-gradient-to-br from-treasure-400/15 via-abyss-900/80 to-quest-500/10 p-3 shadow-[0_12px_32px_rgba(0,0,0,.22)]"
        data-testid="victory-rewards"
      >
        <p className="mb-2 text-center text-[11px] font-extrabold uppercase tracking-[.16em] text-treasure-200">
          {hasNewReward ? 'Phần thưởng vừa nhận' : 'Phần thưởng đã nhận trước đó'}
        </p>
        <div className="grid grid-cols-3 gap-2" aria-label="Phần thưởng nhiệm vụ">
          <RewardCard
            icon={<Sparkles className="size-4" aria-hidden="true" />}
            value={xpAwarded > 0 ? `+${shownXp}` : `${totalXp ?? 0}`}
            label={xpAwarded > 0 ? 'XP mới' : 'Tổng XP'}
            tone="cyan"
          />
          <RewardCard
            icon={<Gem className="size-4" aria-hidden="true" />}
            value={gemsAwarded > 0 ? `+${gemsAwarded}` : `${gemBalance ?? 0}`}
            label={gemsAwarded > 0 ? 'Gem mới' : 'Gem hiện có'}
            tone="gold"
          />
          <RewardCard
            icon={<Star className="size-4" aria-hidden="true" />}
            value="1/1"
            label="Mục tiêu"
            tone="green"
          />
        </div>
        {!hasNewReward && (
          <p className="mt-2 text-center text-xs leading-relaxed text-slate-300">
            Đây là lượt luyện tập lại. XP và Gem đã được cộng ở lần hoàn thành đầu tiên nên không cộng lặp.
          </p>
        )}
      </div>

      {typeof totalXp === 'number' && (
        <div className="relative z-10 mt-3 rounded-xl border border-quest-400/20 bg-quest-500/7 p-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <strong className="text-quest-200">Cấp {levelProgress.level} · {totalXp} XP</strong>
            <span className="text-slate-400">
              {levelProgress.isMaxLevel ? 'Đã đạt cấp tối đa' : `Còn ${levelProgress.xpToNextLevel} XP để lên cấp`}
            </span>
          </div>
          <ProgressBar
            value={levelProgress.isMaxLevel ? 1 : levelProgress.xpIntoLevel}
            max={levelProgress.isMaxLevel ? 1 : levelProgress.xpForThisLevel}
            label="Tiến trình cấp độ"
            tone="quest"
            size="sm"
          />
        </div>
      )}

      {hasNewReward && (
        <p className="relative z-10 mt-2 text-xs leading-relaxed text-treasure-200">
          Điểm kinh nghiệm giúp em lên cấp. Gem dùng tại <strong>Kho trang bị</strong> để mở hiệu ứng pixel và phản hồi học tập. Số dư mới: <strong>{gemBalance ?? gemsAwarded} Gem</strong>.
        </p>
      )}

      {challenge.whyThisMatters && (
        <div className="relative z-10 mt-3 rounded-xl border border-verdant-400/20 bg-verdant-500/7 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-verdant-300">Em vừa mở khóa kiến thức</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{challenge.whyThisMatters}</p>
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
        {nextTitle && <p className="self-center text-xs text-slate-400">Tiếp theo: <strong className="text-slate-200">{nextTitle}</strong></p>}
        {secondaryAction}
      </div>
    </section>
    </div>
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
