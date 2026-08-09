import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  /** Nhãn cho screen reader — bắt buộc, thanh tiến trình không được "câm" */
  label: string;
  /** Hiển thị "3/10" bên phải */
  showValue?: boolean;
  tone?: 'quest' | 'treasure' | 'verdant' | 'mage';
  size?: 'sm' | 'md';
  className?: string;
}

const TONES = {
  quest: 'bg-quest-500',
  treasure: 'bg-treasure-400',
  verdant: 'bg-verdant-500',
  mage: 'bg-mage-500',
} as const;

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  tone = 'quest',
  size = 'md',
  className,
}: ProgressBarProps) {
  const safeMax = Math.max(1, max);
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <div className={cn('space-y-1', className)}>
      {showValue && (
        <div className="flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span className="font-medium text-slate-300 tabular-nums">
            {clamped}/{safeMax}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label}
        className={cn(
          'w-full rounded-full bg-abyss-700 overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', TONES[tone])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
