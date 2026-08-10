import { cn } from '@/utils/cn';

/**
 * Một ô tile lấy từ bộ Tiny Town (Kenney.nl, giấy phép CC0).
 *
 * Bộ tile là MỘT ảnh 192×176 chứa 132 ô 16×16. Cắt ô bằng `background-position`
 * thay vì tách thành 132 file: một yêu cầu mạng thay vì 132, quan trọng với
 * máy phòng ICT dùng Wi-Fi chung.
 *
 * `image-rendering: pixelated` là bắt buộc — không có nó thì trình duyệt làm
 * mượt ảnh khi phóng to và tranh pixel thành ra nhoè nhoẹt.
 */

export const TILE_SIZE = 16;
export const TILE_COLS = 12;
export const TILE_ROWS = 11;
export const TILE_COUNT = TILE_COLS * TILE_ROWS;

/** Đường dẫn tôn trọng base path của GitHub Pages. */
export const TILESET_URL = `${import.meta.env.BASE_URL}game/tiny-town.png`;

interface TileSpriteProps {
  /** Chỉ số ô, 0..131 — đọc theo hàng từ trái sang phải */
  index: number;
  /** Số lần phóng to so với 16px gốc */
  scale?: number;
  className?: string;
  title?: string;
}

export function TileSprite({ index, scale = 3, className, title }: TileSpriteProps) {
  const col = index % TILE_COLS;
  const row = Math.floor(index / TILE_COLS);
  const size = TILE_SIZE * scale;

  return (
    <span
      role="presentation"
      title={title}
      className={cn('inline-block shrink-0', className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${TILESET_URL})`,
        backgroundPosition: `-${col * size}px -${row * size}px`,
        backgroundSize: `${TILE_COLS * size}px ${TILE_ROWS * size}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}
