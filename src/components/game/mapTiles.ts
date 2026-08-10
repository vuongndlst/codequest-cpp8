import type { TilesetName } from './TileSprite';

/**
 * Chỉ số ô dùng để dựng bản đồ.
 *
 * Đặt tên hết thay vì rải số 0, 84, 92 khắp component: đọc `TILE.grass` thì
 * biết ngay là cỏ, còn đọc `index={0}` thì phải mở bảng tra mới biết. Đổi bộ
 * tile về sau cũng chỉ sửa đúng file này.
 *
 * Bảng tra chỉ số của cả hai bộ nằm ở trang `#/dev/stage-preview` (chỉ có khi
 * chạy dev).
 */

export interface TileRef {
  index: number;
  sheet: TilesetName;
}

const town = (index: number): TileRef => ({ index, sheet: 'town' });
const dungeon = (index: number): TileRef => ({ index, sheet: 'dungeon' });

export const TILE = {
  /** Nền cỏ — ba biến thể để bản đồ rộng không bị lặp thành hoa văn đều tăm tắp */
  grass: [town(0), town(1), town(2)],
  /** Đường mòn */
  path: town(3),
  /**
   * Vật cản của bản đồ ngoài trời.
   *
   * Dùng bụi cây chứ không dùng tường đá: bản đồ khu vực 1–3 là làng quê, một
   * dãy tường gạch giữa bãi cỏ nhìn như dán nhầm. Bụi cây rậm vẫn nói rõ
   * "không đi qua được" mà hợp cảnh.
   */
  wall: town(5),
  /** Cổng đích */
  gate: town(74),
  /** Cây, đặt làm vật cản trang trí */
  tree: town(17),
  /** Ngọc thu thập */
  gem: dungeon(32),
  /** Chìa khoá */
  key: dungeon(129),
  /** Cửa đóng */
  door: dungeon(45),
  /** Đuốc / đèn */
  torch: dungeon(29),
} as const;

/**
 * Chọn biến thể cỏ theo toạ độ.
 *
 * Dùng hàm băm từ toạ độ chứ KHÔNG dùng `Math.random()`: bản đồ phải vẽ ra
 * giống hệt nhau mỗi lần render, nếu không thì cứ chạy lại code là cỏ nhảy
 * lung tung, nhìn như lỗi.
 */
export function groundTile(col: number, row: number): TileRef {
  const hash = (col * 7 + row * 13) % TILE.grass.length;
  return TILE.grass[hash];
}

/** Ô tile cho từng loại vật thể trong `WorldSpec.props`. */
export function propTile(type: string): TileRef | null {
  switch (type) {
    case 'gem':
      return TILE.gem;
    case 'key':
      return TILE.key;
    case 'door':
      return TILE.door;
    case 'light':
    case 'torch':
      return TILE.torch;
    case 'gate':
      return TILE.gate;
    case 'wall':
    case 'rock':
      return TILE.wall;
    case 'tree':
      return TILE.tree;
    default:
      return null;
  }
}

/**
 * Tám nhân vật pixel, xếp đúng thứ tự 8 avatar hiện có.
 *
 * Nhân vật của bộ Tiny Dungeon nằm ở ô 84–107. Ánh xạ theo `avatarId` để học
 * sinh chọn nhân vật nào thì thấy đúng nhân vật đó trên bản đồ.
 */
export const HERO_TILES: Record<string, number> = {
  'guardian-cyan': 84,
  'guardian-violet': 85,
  'mage-emerald': 86,
  'mage-amber': 87,
  'bot-sky': 96,
  'bot-rose': 97,
  'scout-lime': 98,
  'scout-indigo': 99,
};

export const DEFAULT_HERO_TILE = 84;

export function heroTile(avatarId: string | null | undefined): number {
  // Không viết `(avatarId && HERO_TILES[avatarId]) ?? DEFAULT`: với chuỗi rỗng,
  // `&&` trả về chính chuỗi rỗng — không phải `undefined` — nên `??` không đỡ,
  // và hàm trả về '' thay vì một chỉ số ô.
  if (!avatarId) return DEFAULT_HERO_TILE;
  return HERO_TILES[avatarId] ?? DEFAULT_HERO_TILE;
}
