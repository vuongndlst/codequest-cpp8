import { getAvatar } from '@/data/avatars';
import { cn } from '@/utils/cn';

interface AvatarIconProps {
  avatarId: string | null | undefined;
  size?: number;
  className?: string;
  /** Thêm viền phát sáng — dùng ở dashboard, hồ sơ */
  glow?: boolean;
}

/**
 * Avatar nhân vật vẽ bằng SVG gốc.
 *
 * Toàn bộ hình được dựng từ hình học cơ bản trong file này, KHÔNG dùng hình ảnh
 * hoặc nhân vật của bất kỳ sản phẩm nào khác (yêu cầu "thiết kế nguyên bản").
 */
export function AvatarIcon({ avatarId, size = 48, className, glow = false }: AvatarIconProps) {
  const avatar = getAvatar(avatarId);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Nhân vật ${avatar.name}`}
      className={cn(
        'shrink-0 rounded-2xl',
        glow && 'ring-2 ring-quest-500/40 shadow-lg shadow-quest-500/20',
        className,
      )}
    >
      {/* Nền */}
      <rect width="64" height="64" rx="16" fill="#0c1428" />
      <circle cx="32" cy="30" r="22" fill={avatar.primary} opacity="0.18" />

      {/* Thân */}
      <path
        d="M14 60c0-9.4 8.1-17 18-17s18 7.6 18 17"
        fill={avatar.primary}
        stroke={avatar.accent}
        strokeWidth="1.5"
      />

      {/* Đầu */}
      <rect x="19" y="14" width="26" height="26" rx="11" fill={avatar.primary} />
      <rect
        x="19"
        y="14"
        width="26"
        height="26"
        rx="11"
        fill="none"
        stroke={avatar.accent}
        strokeWidth="1.5"
      />

      {/* Phụ kiện theo từng kiểu nhân vật */}
      {avatar.shape === 'visor' && (
        <rect x="23" y="24" width="18" height="7" rx="3.5" fill={avatar.accent} />
      )}

      {avatar.shape === 'hood' && (
        <>
          <path d="M17 26c0-9 6.7-16 15-16s15 7 15 16" fill={avatar.accent} opacity="0.9" />
          <circle cx="27" cy="30" r="2.2" fill="#0c1428" />
          <circle cx="37" cy="30" r="2.2" fill="#0c1428" />
        </>
      )}

      {avatar.shape === 'antenna' && (
        <>
          <line x1="32" y1="14" x2="32" y2="6" stroke={avatar.accent} strokeWidth="2.5" />
          <circle cx="32" cy="5" r="3" fill={avatar.accent} />
          <circle cx="27" cy="28" r="2.4" fill="#0c1428" />
          <circle cx="37" cy="28" r="2.4" fill="#0c1428" />
          <rect x="27" y="34" width="10" height="2.5" rx="1.25" fill={avatar.accent} />
        </>
      )}

      {avatar.shape === 'crest' && (
        <>
          <path d="M24 15l8-9 8 9z" fill={avatar.accent} />
          <circle cx="27" cy="29" r="2.4" fill="#0c1428" />
          <circle cx="37" cy="29" r="2.4" fill="#0c1428" />
        </>
      )}

      {/* Chấm sáng năng lượng */}
      <circle cx="32" cy="49" r="2.5" fill={avatar.accent} opacity="0.85" />
    </svg>
  );
}
