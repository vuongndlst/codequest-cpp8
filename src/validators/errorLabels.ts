import type { ErrorCode } from '@/types/content';

/**
 * Tên gọi tiếng Việt ngắn gọn cho từng mã lỗi.
 *
 * Dùng ở dashboard giáo viên để đọc bảng "lỗi phổ biến của lớp". Khác với
 * thông báo gửi cho học sinh (dài, có ngữ cảnh, có gợi ý), ở đây cần ngắn để
 * xếp thành bảng thống kê.
 */
export const ERROR_LABELS: Record<ErrorCode, string> = {
  MISSING_SEMICOLON: 'Thiếu dấu chấm phẩy',
  UNBALANCED_BRACE: 'Lệch ngoặc nhọn { }',
  UNBALANCED_PAREN: 'Lệch ngoặc tròn ( )',
  VAR_TYPO: 'Viết sai tên biến',
  VAR_UNDECLARED: 'Dùng biến chưa khai báo',
  FUNC_NOT_CALLED: 'Khai báo hàm nhưng không gọi',
  FUNC_NAME_MISMATCH: 'Gọi sai tên hàm',
  FUNC_UNDEFINED: 'Gọi hàm chưa tồn tại',
  ASSIGN_IN_CONDITION: 'Nhầm = với == trong điều kiện',
  COUT_SYNTAX: 'Sai cú pháp cout',
  COUT_MISSING_QUOTE: 'Thiếu dấu nháy kép',
  FOR_MISSING_UPDATE: 'Vòng for thiếu tăng biến đếm',
  FOR_WRONG_COUNT: 'Vòng for lặp sai số lần',
  MISSING_MAIN: 'Thiếu hàm main',
  MISSING_INCLUDE: 'Thiếu #include <iostream>',
  TIMEOUT: 'Chương trình chạy quá lâu',
  UNSUPPORTED_FEATURE: 'Dùng cú pháp ngoài chương trình',
  OUTPUT_MISMATCH: 'Kết quả in ra chưa khớp',
  PATTERN_MISSING: 'Thiếu cấu trúc bắt buộc',
  PATTERN_FORBIDDEN: 'Dùng cách làm tắt bị hạn chế',
  UNKNOWN: 'Lỗi khác',
};

export function labelForErrorCode(code: string): string {
  return ERROR_LABELS[code as ErrorCode] ?? code;
}
