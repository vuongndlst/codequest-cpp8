import { getAvatar } from '@/data/avatars';
import { cn } from '@/utils/cn';
import { tileStyle } from './TileSprite';

interface AvatarIconProps {
  avatarId: string | null | undefined;
  size?: number;
  className?: string;
  /** Thêm viền phát sáng — dùng ở dashboard, hồ sơ. */
  glow?: boolean;
}

/**
 * Cùng một sprite pixel được dùng ở mọi nơi để lựa chọn trên form luôn khớp
 * chính xác với nhân vật xuất hiện trong game.
 */
export function AvatarIcon({ avatarId, size = 48, className, glow = false }: AvatarIconProps) {
  const avatar = getAvatar(avatarId);

  return (
    <span
      role="img"
      aria-label={`Nhân vật ${avatar.name}`}
      title={`${avatar.name} · ${avatar.role}`}
      className={cn(
        'inline-block shrink-0 overflow-hidden rounded-xl border border-white/10 bg-abyss-950',
        glow && 'ring-2 ring-quest-500/40 shadow-lg shadow-quest-500/20',
        className,
      )}
      style={{
        ...tileStyle(avatar.tileIndex, size / 16, 'dungeon'),
        width: size,
        height: size,
      }}
    />
  );
}
