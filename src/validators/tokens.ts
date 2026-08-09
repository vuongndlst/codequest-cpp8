import type { ErrorCode } from '@/types/content';

/** Một chẩn đoán gửi tới học sinh. `message` LUÔN là tiếng Việt. */
export interface Diagnostic {
  code: ErrorCode;
  message: string;
  /** Dòng 1-based. 0 = không xác định được vị trí. */
  line: number;
  column?: number;
  severity: 'error' | 'warn' | 'tip';
  /** Gợi ý nên mở kèm thông báo này */
  suggestHintLevel?: 1 | 2 | 3;
}

export type TokenType =
  | 'preprocessor'
  | 'keyword'
  | 'type'
  | 'identifier'
  | 'number'
  | 'string'
  | 'char'
  | 'operator'
  | 'punct'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

/** Kiểu dữ liệu C++ được hỗ trợ trong khoá học. */
export const TYPE_KEYWORDS = ['int', 'float', 'double', 'bool', 'char', 'string', 'void'] as const;
export type TypeKeyword = (typeof TYPE_KEYWORDS)[number];

/** Từ khoá nằm TRONG phạm vi khoá học. */
export const KEYWORDS = [
  'if',
  'else',
  'for',
  'return',
  'using',
  'namespace',
  'cout',
  'cin',
  'endl',
  'true',
  'false',
  'const',
] as const;

/**
 * Từ khoá C++ NGOÀI phạm vi khoá học (mục 3 của đề bài).
 *
 * Gặp những từ này, hệ thống không crash mà trả về thông báo thân thiện
 * hướng học sinh về đúng nội dung đang học.
 */
export const OUT_OF_SCOPE_KEYWORDS: Record<string, string> = {
  while:
    '`while` là một loại vòng lặp em sẽ học sau. Trong khoá này mình dùng `for` nhé — vào Sổ tay lệnh xem cấu trúc `for`.',
  do: '`do…while` nằm ngoài nội dung khoá này. Em dùng vòng lặp `for` nhé.',
  switch:
    '`switch` nằm ngoài nội dung khoá này. Với nhiều trường hợp, em dùng `if` và `if–else` nhé.',
  class: '`class` thuộc phần lập trình hướng đối tượng, em sẽ học ở lớp trên nhé.',
  struct: '`struct` nằm ngoài nội dung khoá này.',
  vector: '`vector` thuộc thư viện STL, nằm ngoài nội dung khoá này.',
  new: 'Cấp phát bộ nhớ động nằm ngoài nội dung khoá này.',
  delete: 'Cấp phát bộ nhớ động nằm ngoài nội dung khoá này.',
  try: 'Xử lý ngoại lệ nằm ngoài nội dung khoá này.',
  catch: 'Xử lý ngoại lệ nằm ngoài nội dung khoá này.',
  template: '`template` nằm ngoài nội dung khoá này.',
  goto: '`goto` không được dùng trong khoá này — code sẽ rất khó đọc.',
  break:
    '`break` thường dùng với `while` và `switch`. Trong khoá này em điều khiển vòng lặp bằng điều kiện của `for` nhé.',
  continue: '`continue` nằm ngoài nội dung khoá này.',
};

export function isTypeKeyword(value: string): value is TypeKeyword {
  return (TYPE_KEYWORDS as readonly string[]).includes(value);
}

export function isKeyword(value: string): boolean {
  return (KEYWORDS as readonly string[]).includes(value);
}
