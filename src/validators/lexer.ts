import type { Token } from './tokens';
import { isKeyword, isTypeKeyword } from './tokens';

/**
 * Bước ② của pipeline: chuyển mã nguồn thành danh sách token.
 *
 * Lexer KHÔNG bao giờ ném lỗi. Gặp ký tự lạ hoặc chuỗi chưa đóng nháy, nó
 * ghi nhận vào `errors` rồi đi tiếp — để bước chẩn đoán phía sau còn nhìn được
 * toàn cảnh chương trình và đoán đúng lỗi học sinh đang mắc.
 */

export interface LexResult {
  tokens: Token[];
  errors: Array<{ message: string; line: number; column: number; kind: LexErrorKind }>;
  /** Vùng comment (dùng cho Clean Code Coach, không tính vào phân tích cú pháp) */
  commentLines: Set<number>;
}

export type LexErrorKind = 'unterminated-string' | 'unterminated-comment' | 'unknown-char';

const TWO_CHAR_OPERATORS = [
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '<<',
  '>>',
  '++',
  '--',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
];

const ONE_CHAR_OPERATORS = ['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|'];
const PUNCTUATION = ['(', ')', '{', '}', '[', ']', ';', ',', ':', '.', '?'];

export function tokenize(source: string): LexResult {
  const tokens: Token[] = [];
  const errors: LexResult['errors'] = [];
  const commentLines = new Set<number>();

  let index = 0;
  let line = 1;
  let column = 1;

  const peek = (offset = 0) => source[index + offset] ?? '';

  const advance = (count = 1) => {
    for (let step = 0; step < count; step += 1) {
      if (source[index] === '\n') {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
      index += 1;
    }
  };

  const push = (type: Token['type'], value: string, startLine: number, startColumn: number) => {
    tokens.push({ type, value, line: startLine, column: startColumn });
  };

  while (index < source.length) {
    const char = peek();

    // --- Khoảng trắng ---
    if (/\s/.test(char)) {
      advance();
      continue;
    }

    const startLine = line;
    const startColumn = column;

    // --- Comment một dòng ---
    if (char === '/' && peek(1) === '/') {
      commentLines.add(line);
      while (index < source.length && peek() !== '\n') advance();
      continue;
    }

    // --- Comment nhiều dòng ---
    if (char === '/' && peek(1) === '*') {
      advance(2);
      let closed = false;
      while (index < source.length) {
        commentLines.add(line);
        if (peek() === '*' && peek(1) === '/') {
          advance(2);
          closed = true;
          break;
        }
        advance();
      }
      if (!closed) {
        errors.push({
          message: 'Có một chú thích /* … */ chưa được đóng lại bằng */.',
          line: startLine,
          column: startColumn,
          kind: 'unterminated-comment',
        });
      }
      continue;
    }

    // --- Chỉ thị tiền xử lý: #include, #define… ---
    if (char === '#') {
      let raw = '';
      while (index < source.length && peek() !== '\n') {
        raw += peek();
        advance();
      }
      push('preprocessor', raw.trim(), startLine, startColumn);
      continue;
    }

    // --- Chuỗi ký tự "..." ---
    if (char === '"') {
      advance();
      let value = '';
      let closed = false;
      while (index < source.length) {
        const current = peek();
        if (current === '\n') break; // C++ không cho chuỗi xuống dòng
        if (current === '\\') {
          value += unescapeChar(peek(1));
          advance(2);
          continue;
        }
        if (current === '"') {
          advance();
          closed = true;
          break;
        }
        value += current;
        advance();
      }
      if (!closed) {
        errors.push({
          message: 'Có một chuỗi chữ chưa được đóng bằng dấu nháy kép.',
          line: startLine,
          column: startColumn,
          kind: 'unterminated-string',
        });
      }
      push('string', value, startLine, startColumn);
      continue;
    }

    // --- Ký tự 'a' ---
    if (char === "'") {
      advance();
      let value = '';
      let closed = false;
      while (index < source.length) {
        const current = peek();
        if (current === '\n') break;
        if (current === '\\') {
          value += unescapeChar(peek(1));
          advance(2);
          continue;
        }
        if (current === "'") {
          advance();
          closed = true;
          break;
        }
        value += current;
        advance();
      }
      if (!closed) {
        errors.push({
          message: 'Có một ký tự chưa được đóng bằng dấu nháy đơn.',
          line: startLine,
          column: startColumn,
          kind: 'unterminated-string',
        });
      }
      push('char', value, startLine, startColumn);
      continue;
    }

    // --- Số ---
    if (/[0-9]/.test(char)) {
      let raw = '';
      while (index < source.length && /[0-9]/.test(peek())) {
        raw += peek();
        advance();
      }
      // Phần thập phân: chỉ nhận khi sau dấu chấm là chữ số
      if (peek() === '.' && /[0-9]/.test(peek(1))) {
        raw += peek();
        advance();
        while (index < source.length && /[0-9]/.test(peek())) {
          raw += peek();
          advance();
        }
      }
      push('number', raw, startLine, startColumn);
      continue;
    }

    // --- Định danh và từ khoá ---
    if (/[A-Za-z_]/.test(char)) {
      let raw = '';
      while (index < source.length && /[A-Za-z0-9_]/.test(peek())) {
        raw += peek();
        advance();
      }
      // `std::cout` -> bỏ qua tiền tố std:: cho đơn giản với học sinh
      if (raw === 'std' && peek() === ':' && peek(1) === ':') {
        advance(2);
        continue;
      }
      if (isTypeKeyword(raw)) push('type', raw, startLine, startColumn);
      else if (isKeyword(raw)) push('keyword', raw, startLine, startColumn);
      else push('identifier', raw, startLine, startColumn);
      continue;
    }

    // --- Toán tử hai ký tự ---
    const twoChar = char + peek(1);
    if (TWO_CHAR_OPERATORS.includes(twoChar)) {
      advance(2);
      push('operator', twoChar, startLine, startColumn);
      continue;
    }

    // --- Toán tử một ký tự ---
    if (ONE_CHAR_OPERATORS.includes(char)) {
      advance();
      push('operator', char, startLine, startColumn);
      continue;
    }

    // --- Dấu câu ---
    if (PUNCTUATION.includes(char)) {
      advance();
      push('punct', char, startLine, startColumn);
      continue;
    }

    // --- Ký tự không nhận ra ---
    errors.push({
      message: `Ký tự \`${char}\` không dùng được trong C++.`,
      line: startLine,
      column: startColumn,
      kind: 'unknown-char',
    });
    advance();
  }

  tokens.push({ type: 'eof', value: '', line, column });
  return { tokens, errors, commentLines };
}

function unescapeChar(char: string): string {
  switch (char) {
    case 'n':
      return '\n';
    case 't':
      return '\t';
    case 'r':
      return '\r';
    case '0':
      return '\0';
    case '\\':
      return '\\';
    case '"':
      return '"';
    case "'":
      return "'";
    default:
      return char;
  }
}
