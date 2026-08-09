import type { CleanCodeRule } from '@/types/content';

/**
 * Bộ quy tắc Clean Code dùng chung cho hầu hết nhiệm vụ.
 *
 * Cố ý CHỈ chọn bốn tiêu chí dễ nhìn thấy nhất với học sinh lớp 8. Các tiêu chí
 * khó hơn (không lặp code, tách hàm, độ dài main) chỉ bật ở đúng nhiệm vụ dạy
 * về chúng — bật sớm quá thì học sinh nhận toàn lời khuyên chưa học tới.
 */
export const STANDARD_CLEAN_CODE: CleanCodeRule[] = [
  { rule: 'indent', weight: 30 },
  { rule: 'one-statement-per-line', weight: 25 },
  { rule: 'meaningful-var', weight: 25 },
  { rule: 'spacing', weight: 20 },
];

/** Từ Khu vực 2 trở đi, tên hàm cũng được tính vào điểm clean code. */
export const CLEAN_CODE_WITH_FUNCTIONS: CleanCodeRule[] = [
  { rule: 'indent', weight: 25 },
  { rule: 'one-statement-per-line', weight: 20 },
  { rule: 'meaningful-var', weight: 20 },
  { rule: 'action-verb-func', weight: 15 },
  { rule: 'spacing', weight: 20 },
];
