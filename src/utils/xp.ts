/**
 * Hệ thống XP và cấp độ.
 *
 * Công thức (docs/phase-1-architecture.md mục 5.3):
 *   XP tích luỹ cần để đạt cấp L = 50 × (L−1) × L
 *   → Lv2 = 100 · Lv3 = 300 · Lv4 = 600 · Lv5 = 1000 · Lv6 = 1500 · Lv7 = 2100
 *
 * Học sinh hoàn thành trọn khoá (~1400–1550 XP) sẽ đạt khoảng cấp 6.
 *
 * ⚠ Công thức này phải khớp chính xác với hàm SQL `public.calculate_level`
 *   trong supabase/migrations/0001_init_schema.sql — nếu sửa một bên thì
 *   phải sửa cả bên kia.
 */

export const MAX_LEVEL = 20;

/** Tổng XP tích luỹ cần có để đạt được cấp `level`. */
export function xpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return 50 * (safeLevel - 1) * safeLevel;
}

/** Cấp độ hiện tại ứng với tổng XP. Luôn ≥ 1. */
export function calculateLevel(totalXp: number): number {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  const level = Math.floor((50 + Math.sqrt(2500 + 200 * xp)) / 100);
  return Math.min(MAX_LEVEL, Math.max(1, level));
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  /** XP đã tích được trong cấp hiện tại */
  xpIntoLevel: number;
  /** Tổng XP cần cho cả cấp hiện tại */
  xpForThisLevel: number;
  /** Còn thiếu bao nhiêu XP nữa thì lên cấp */
  xpToNextLevel: number;
  /** 0..100, dùng cho thanh tiến trình */
  percent: number;
  isMaxLevel: boolean;
}

/** Tính đầy đủ thông tin cấp độ để hiển thị thanh tiến trình. */
export function getLevelProgress(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  const level = calculateLevel(xp);
  const isMaxLevel = level >= MAX_LEVEL;

  const currentFloor = xpRequiredForLevel(level);
  const nextFloor = xpRequiredForLevel(level + 1);

  if (isMaxLevel) {
    return {
      level,
      totalXp: xp,
      xpIntoLevel: 0,
      xpForThisLevel: 0,
      xpToNextLevel: 0,
      percent: 100,
      isMaxLevel: true,
    };
  }

  const xpForThisLevel = nextFloor - currentFloor;
  const xpIntoLevel = xp - currentFloor;

  return {
    level,
    totalXp: xp,
    xpIntoLevel,
    xpForThisLevel,
    xpToNextLevel: nextFloor - xp,
    percent: Math.round((xpIntoLevel / xpForThisLevel) * 100),
    isMaxLevel: false,
  };
}

/**
 * Danh hiệu theo cấp độ — chỉ để động viên, không dùng để so sánh học sinh
 * với nhau (mục 30: không xây leaderboard công khai).
 */
export function getLevelTitle(level: number): string {
  if (level >= 10) return 'Huyền thoại ByteLand';
  if (level >= 8) return 'Code Guardian';
  if (level >= 6) return 'Người canh giữ mã nguồn';
  if (level >= 4) return 'Thợ rèn thuật toán';
  if (level >= 2) return 'Học viên dũng cảm';
  return 'Tân binh ByteLand';
}
