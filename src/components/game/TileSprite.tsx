import { cn } from '@/utils/cn';

/**
 * Một ô lấy từ bộ tile pixel (Kenney.nl, giấy phép CC0).
 *
 * Cả hai bộ đều là MỘT ảnh 192×176 chứa 132 ô 16×16. Cắt ô bằng
 * `background-position` thay vì tách thành 132 file rời: một yêu cầu mạng thay
 * vì 132, đáng kể với máy phòng ICT dùng Wi-Fi chung.
 *
 * `image-rendering: pixelated` là bắt buộc — không có nó thì trình duyệt làm
 * mượt ảnh khi phóng to và tranh pixel thành ra nhoè nhoẹt.
 */

export const TILE_SIZE = 16;
export const TILE_COLS = 12;
export const TILE_ROWS = 11;
export const TILE_COUNT = TILE_COLS * TILE_ROWS;

/** `town` cho cảnh ngoài trời, `dungeon` cho nhân vật và cảnh trong hầm. */
export type TilesetName = 'town' | 'dungeon';

const TILESET_FILES: Record<TilesetName, string> = {
  town: 'tiny-town.png',
  dungeon: 'tiny-dungeon.png',
};

/** Đường dẫn tôn trọng base path của GitHub Pages. */
export function tilesetUrl(sheet: TilesetName): string {
  return `${import.meta.env.BASE_URL}game/${TILESET_FILES[sheet]}`;
}

/** Kiểu CSS để đặt một ô lên nền của phần tử bất kỳ. */
export function tileStyle(
  index: number,
  scale: number,
  sheet: TilesetName = 'town',
): React.CSSProperties {
  const col = index % TILE_COLS;
  const row = Math.floor(index / TILE_COLS);
  const size = TILE_SIZE * scale;

  return {
    width: size,
    height: size,
    backgroundImage: `url(${tilesetUrl(sheet)})`,
    backgroundPosition: `-${col * size}px -${row * size}px`,
    backgroundSize: `${TILE_COLS * size}px ${TILE_ROWS * size}px`,
    imageRendering: 'pixelated',
  };
}

interface TileSpriteProps {
  /** Chỉ số ô, 0..131 — đọc theo hàng từ trái sang phải */
  index: number;
  sheet?: TilesetName;
  /** Số lần phóng to so với 16px gốc */
  scale?: number;
  className?: string;
  title?: string;
}

export function TileSprite({
  index,
  sheet = 'town',
  scale = 3,
  className,
  title,
}: TileSpriteProps) {
  return (
    <span
      role="presentation"
      title={title}
      className={cn('inline-block shrink-0', className)}
      style={tileStyle(index, scale, sheet)}
    />
  );
}
