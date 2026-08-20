import { describe, expect, it } from 'vitest';
import { AVATARS } from '@/data/avatars';
import { DEFAULT_HERO_TILE, HERO_TILES, groundTile, heroTile, propTile, terrainBaseTile, terrainOverlayTile } from './mapTiles';
import { TILE_COUNT } from './TileSprite';

describe('Nhân vật pixel trên bản đồ', () => {
  /**
   * Thiếu một ánh xạ thì em chọn nhân vật đó sẽ thấy nhân vật của bạn khác
   * trên bản đồ — lỗi âm thầm, không ai báo, mà học sinh thì để ý ngay.
   */
  it('cả 8 nhân vật trong danh sách đều có ô tile riêng', () => {
    for (const avatar of AVATARS) {
      expect(HERO_TILES[avatar.id], `thiếu ánh xạ cho ${avatar.id}`).toBeDefined();
    }
  });

  it('không có hai nhân vật dùng chung một ô', () => {
    const used = Object.values(HERO_TILES);
    expect(new Set(used).size).toBe(used.length);
  });

  it('mọi ô nhân vật đều nằm trong bộ tile', () => {
    for (const index of Object.values(HERO_TILES)) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(TILE_COUNT);
    }
  });

  /**
   * `heroTile('')` từng trả về chuỗi rỗng thay vì một chỉ số: viết
   * `(avatarId && HERO_TILES[avatarId]) ?? DEFAULT` thì với chuỗi rỗng, `&&`
   * trả về chính chuỗi rỗng — không phải `undefined` — nên `??` không đỡ.
   * Bản build bắt được, `tsc --noEmit` thì không.
   */
  it('giá trị rỗng hoặc lạ đều lùi về nhân vật mặc định', () => {
    for (const value of ['', null, undefined, 'khong-co-that']) {
      expect(heroTile(value)).toBe(DEFAULT_HERO_TILE);
    }
  });

  it('chọn đúng nhân vật khi id hợp lệ', () => {
    expect(heroTile('scout-indigo')).toBe(HERO_TILES['scout-indigo']);
  });
});

describe('Ô nền của bản đồ', () => {
  /**
   * Dùng hàm băm từ toạ độ chứ không dùng `Math.random()`: bản đồ phải vẽ ra
   * giống hệt nhau mỗi lần render, nếu không thì cứ chạy lại code là cỏ nhảy
   * lung tung, nhìn như lỗi hiển thị.
   */
  it('cùng một ô luôn cho cùng một hình cỏ', () => {
    for (let col = 0; col < 8; col += 1) {
      for (let row = 0; row < 5; row += 1) {
        expect(groundTile(col, row)).toEqual(groundTile(col, row));
      }
    }
  });

  it('phân biệt đường, nước, đá, hàng rào và phế tích theo biome', () => {
    expect(terrainBaseTile('=', 1, 1, 'town')).not.toEqual(groundTile(1, 1));
    expect(terrainOverlayTile('^', 1, 1, 'town')).not.toBeNull();
    expect(terrainOverlayTile('F', 1, 1, 'town')).not.toBeNull();
    expect(terrainOverlayTile('#', 1, 1, 'dungeon')?.sheet).toBe('dungeon');
    expect(terrainOverlayTile('~', 1, 1, 'town')).toBeNull();
  });

  it('cỏ có nhiều hơn một biến thể để bản đồ rộng không thành hoa văn đều tăm tắp', () => {
    const seen = new Set<number>();
    for (let col = 0; col < 6; col += 1) {
      for (let row = 0; row < 6; row += 1) seen.add(groundTile(col, row).index);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('Ô của vật thể', () => {
  it('nhận các loại vật thể đang dùng trong nội dung', () => {
    for (const type of [
      'gem',
      'trail-gem',
      'key',
      'door',
      'light',
      'wall',
      'chest',
      'bot',
      'boss',
      'sword',
      'shield',
      'potion',
      'sign',
      'well',
      'log',
      'mushroom',
      'flowers',
      'target',
      'machine',
      'switch',
    ]) {
      expect(propTile(type), `thiếu tile cho ${type}`).not.toBeNull();
    }
  });

  it('loại lạ thì trả về null chứ không vẽ bừa một ô', () => {
    expect(propTile('con-rong-lua')).toBeNull();
  });
});
