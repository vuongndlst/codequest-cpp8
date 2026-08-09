import { describe, expect, it } from 'vitest';
import { calculateLevel, getLevelProgress, getLevelTitle, xpRequiredForLevel, MAX_LEVEL } from './xp';

describe('xpRequiredForLevel', () => {
  it('trả về đúng các mốc XP đã thiết kế', () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(xpRequiredForLevel(2)).toBe(100);
    expect(xpRequiredForLevel(3)).toBe(300);
    expect(xpRequiredForLevel(4)).toBe(600);
    expect(xpRequiredForLevel(5)).toBe(1000);
    expect(xpRequiredForLevel(6)).toBe(1500);
  });
});

describe('calculateLevel', () => {
  it('học sinh mới bắt đầu ở cấp 1', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
  });

  it('lên cấp đúng tại mốc XP', () => {
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(299)).toBe(2);
    expect(calculateLevel(300)).toBe(3);
    expect(calculateLevel(599)).toBe(3);
    expect(calculateLevel(600)).toBe(4);
    expect(calculateLevel(1000)).toBe(5);
    expect(calculateLevel(1500)).toBe(6);
  });

  it('hoàn thành cả khoá (~1400-1550 XP) đạt khoảng cấp 5-6', () => {
    expect(calculateLevel(1400)).toBe(5);
    expect(calculateLevel(1550)).toBe(6);
  });

  it('luôn khớp với hàm nghịch đảo xpRequiredForLevel', () => {
    for (let level = 1; level <= 10; level += 1) {
      const floor = xpRequiredForLevel(level);
      expect(calculateLevel(floor)).toBe(level);
      if (level > 1) {
        expect(calculateLevel(floor - 1)).toBe(level - 1);
      }
    }
  });

  it('không bao giờ trả về cấp nhỏ hơn 1 dù XP âm hoặc không hợp lệ', () => {
    expect(calculateLevel(-500)).toBe(1);
    expect(calculateLevel(Number.NaN)).toBe(1);
  });

  it('giới hạn ở cấp tối đa', () => {
    expect(calculateLevel(9_999_999)).toBe(MAX_LEVEL);
  });
});

describe('getLevelProgress', () => {
  it('tính đúng phần XP trong cấp hiện tại', () => {
    const progress = getLevelProgress(150);
    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(50); // 150 - 100
    expect(progress.xpForThisLevel).toBe(200); // 300 - 100
    expect(progress.xpToNextLevel).toBe(150); // 300 - 150
    expect(progress.percent).toBe(25);
    expect(progress.isMaxLevel).toBe(false);
  });

  it('ngay tại mốc lên cấp thì phần trăm về 0', () => {
    const progress = getLevelProgress(300);
    expect(progress.level).toBe(3);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.percent).toBe(0);
  });

  it('đạt cấp tối đa thì báo 100% và không còn XP cần thêm', () => {
    const progress = getLevelProgress(9_999_999);
    expect(progress.isMaxLevel).toBe(true);
    expect(progress.percent).toBe(100);
    expect(progress.xpToNextLevel).toBe(0);
  });
});

describe('getLevelTitle', () => {
  it('mỗi mốc cấp độ có một danh hiệu riêng', () => {
    expect(getLevelTitle(1)).toBe('Tân binh ByteLand');
    expect(getLevelTitle(3)).toBe('Học viên dũng cảm');
    expect(getLevelTitle(5)).toBe('Thợ rèn thuật toán');
    expect(getLevelTitle(7)).toBe('Người canh giữ mã nguồn');
    expect(getLevelTitle(9)).toBe('Code Guardian');
    expect(getLevelTitle(12)).toBe('Huyền thoại ByteLand');
  });
});
