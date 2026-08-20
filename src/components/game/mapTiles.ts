import type { TilesetName } from './TileSprite';
import { AVATARS } from '@/data/avatars';

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
  /** Đường đất mặc định và các biến thể để tuyến chính không thành một dải lặp. */
  path: town(25),
  pathVariants: [town(25), town(37), town(39), town(41), town(42), town(73)],
  /**
   * Vật cản của bản đồ ngoài trời.
   *
   * Dùng bụi cây chứ không dùng tường đá: bản đồ khu vực 1–3 là làng quê, một
   * dãy tường gạch giữa bãi cỏ nhìn như dán nhầm. Bụi cây rậm vẫn nói rõ
   * "không đi qua được" mà hợp cảnh.
   */
  wall: town(5),
  /** Biến thể rừng bao quanh đường đi, tránh cả map lặp đúng một cây. */
  forestWall: [town(3), town(4), town(5), town(6), town(7), town(8), town(9), town(10), town(11), town(16), town(17), town(27), town(28), town(30), town(31), town(32)],
  /** Đá, hàng rào và phế tích tạo silhouette khác cây rừng. */
  rock: [town(43), town(92)],
  fence: [town(44), town(45), town(46), town(47), town(80), town(81), town(82)],
  ruin: [dungeon(14), dungeon(28), dungeon(40), dungeon(126)],
  dungeonFloor: [dungeon(0), dungeon(12), dungeon(24)],
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
  /** Rương phần thưởng */
  chest: dungeon(41),
  /** Bot cản đường */
  bot: dungeon(108),
  /** Boss pixel */
  boss: dungeon(120),
  /** Vũ khí và khiên dùng thống nhất với kho trang bị */
  sword: dungeon(116),
  shield: dungeon(118),
  potion: dungeon(114),
  sign: town(83),
  well: town(104),
  log: town(106),
  mushroom: town(29),
  flowers: town(2),
  target: town(95),
  /** Máy năng lượng và công tắc của Lò Toán Tử, đều dùng pixel tile có sẵn. */
  machine: dungeon(56),
  powerSwitch: dungeon(101),
} as const;

/** Chọn cây chắn đường theo tọa độ để rừng đa dạng nhưng không nhảy hình khi chạy lại. */
export function wallTile(col: number, row: number): TileRef {
  return TILE.forestWall[(col * 5 + row * 3) % TILE.forestWall.length];
}

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

/** Ký hiệu địa hình mở rộng: `=` đường đất; `~`, `^`, `F` là nước, đá và hàng rào chắn. */
export function terrainBaseTile(
  glyph: string | undefined,
  col: number,
  row: number,
  ground: 'town' | 'dungeon' = 'town',
): TileRef {
  if (ground === 'dungeon') {
    return TILE.dungeonFloor[(col * 7 + row * 11) % TILE.dungeonFloor.length];
  }
  if (glyph === '=') return TILE.pathVariants[(col * 5 + row * 3) % TILE.pathVariants.length];
  return groundTile(col, row);
}

/** Lớp vật cản vẽ trên nền. Tách hai lớp giúp vùng trong suốt quanh cây/đá vẫn là cỏ. */
export function terrainOverlayTile(
  glyph: string | undefined,
  col: number,
  row: number,
  ground: 'town' | 'dungeon' = 'town',
): TileRef | null {
  if (glyph === '#') {
    return ground === 'dungeon'
      ? TILE.ruin[(col * 5 + row * 3) % TILE.ruin.length]
      : wallTile(col, row);
  }
  if (glyph === '^') {
    const collection = ground === 'dungeon' ? TILE.ruin : TILE.rock;
    return collection[(col * 3 + row * 5) % collection.length];
  }
  if (glyph === 'F') return TILE.fence[(col + row * 2) % TILE.fence.length];
  return null;
}

/** Ô tile cho từng loại vật thể trong `WorldSpec.props`. */
export function propTile(type: string): TileRef | null {
  switch (type) {
    case 'gem':
    case 'trail-gem':
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
    case 'chest':
      return TILE.chest;
    case 'bot':
    case 'enemy':
      return TILE.bot;
    case 'boss':
      return TILE.boss;
    case 'statue':
      return TILE.ruin[1];
    case 'sword':
      return TILE.sword;
    case 'shield':
      return TILE.shield;
    case 'potion':
      return TILE.potion;
    case 'sign':
      return TILE.sign;
    case 'well':
      return TILE.well;
    case 'log':
      return TILE.log;
    case 'mushroom':
      return TILE.mushroom;
    case 'flowers':
      return TILE.flowers;
    case 'target':
      return TILE.target;
    case 'machine':
      return TILE.machine;
    case 'switch':
      return TILE.powerSwitch;
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
export const HERO_TILES: Record<string, number> = Object.fromEntries(
  AVATARS.map((avatar) => [avatar.id, avatar.tileIndex]),
);

export const DEFAULT_HERO_TILE = 84;

export function heroTile(avatarId: string | null | undefined): number {
  // Không viết `(avatarId && HERO_TILES[avatarId]) ?? DEFAULT`: với chuỗi rỗng,
  // `&&` trả về chính chuỗi rỗng — không phải `undefined` — nên `??` không đỡ,
  // và hàm trả về '' thay vì một chỉ số ô.
  if (!avatarId) return DEFAULT_HERO_TILE;
  return HERO_TILES[avatarId] ?? DEFAULT_HERO_TILE;
}
