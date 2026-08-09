import { cn } from '@/utils/cn';

interface ByteMascotProps {
  size?: number;
  className?: string;
  mood?: 'happy' | 'thinking' | 'cheer';
  /** Bật hiệu ứng lơ lửng (tự tắt khi bật chế độ giảm chuyển động) */
  animated?: boolean;
}

/**
 * "Byte" — nhân vật hướng dẫn của ByteLand.
 *
 * Một sinh vật dữ liệu nhỏ, thiết kế gốc bằng SVG: khối lập phương bo tròn,
 * hai mắt sáng và một vành năng lượng. Xuất hiện ở tình huống mở đầu,
 * khi đưa gợi ý và khi chúc mừng học sinh.
 */
export function ByteMascot({
  size = 64,
  className,
  mood = 'happy',
  animated = true,
}: ByteMascotProps) {
  const eyeY = mood === 'thinking' ? 30 : 29;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      role="img"
      aria-label="Byte — người bạn hướng dẫn"
      className={cn(animated && 'animate-float', className)}
    >
      {/* Vành năng lượng */}
      <ellipse cx="36" cy="58" rx="20" ry="5" fill="#22d3ee" opacity="0.18" />

      {/* Thân khối */}
      <rect x="16" y="16" width="40" height="36" rx="12" fill="#131f3d" />
      <rect
        x="16"
        y="16"
        width="40"
        height="36"
        rx="12"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="2"
      />

      {/* Mắt */}
      {mood === 'cheer' ? (
        <>
          <path d="M25 30q3.5-4 7 0" stroke="#67e8f9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M40 30q3.5-4 7 0" stroke="#67e8f9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="28.5" cy={eyeY} r="3.6" fill="#67e8f9" />
          <circle cx="43.5" cy={eyeY} r="3.6" fill="#67e8f9" />
        </>
      )}

      {/* Miệng */}
      <path
        d={mood === 'thinking' ? 'M30 41h12' : 'M29 40q7 6 14 0'}
        stroke="#a78bfa"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Ăng-ten dữ liệu */}
      <line x1="36" y1="16" x2="36" y2="8" stroke="#a78bfa" strokeWidth="2.5" />
      <circle cx="36" cy="6.5" r="3.5" fill="#a78bfa" />

      {/* Chân */}
      <rect x="24" y="52" width="7" height="6" rx="3" fill="#1c2b52" />
      <rect x="41" y="52" width="7" height="6" rx="3" fill="#1c2b52" />
    </svg>
  );
}
