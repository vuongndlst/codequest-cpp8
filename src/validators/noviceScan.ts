import type { Diagnostic, Token } from './tokens';
import { OUT_OF_SCOPE_KEYWORDS } from './tokens';
import type { ParseError } from './parser';

/**
 * Bước ③ của pipeline — CHẨN ĐOÁN LỖI PHỔ THÔNG.
 *
 * Đây là phần quan trọng nhất về mặt sư phạm. Một parser thông thường gặp code
 * thiếu `;` sẽ báo lỗi ở vị trí SAU chỗ sai và bằng thuật ngữ khó hiểu. Các hàm
 * ở đây quét token theo kinh nghiệm để đoán ĐÚNG lỗi học sinh đang mắc.
 *
 * Chia làm hai nhóm, khác nhau ở mức độ an toàn:
 *
 *   · `preScan`            — chỉ những kiểm tra CHẮC CHẮN ĐÚNG (đếm ngoặc,
 *                            thiếu `main`, `=` trong `if`…). Chạy trước parser.
 *   · `explainParseFailure` — suy đoán có rủi ro (thiếu dấu `;`). CHỈ chạy khi
 *                            parser đã thất bại, nên không thể báo nhầm cho
 *                            chương trình vốn đúng.
 *
 * Cách chia này khác một chút so với bản thiết kế Giai đoạn 1 (vốn định chạy
 * toàn bộ trước parser) — sửa lại để loại hẳn nguy cơ báo sai cho học sinh
 * làm đúng, vốn là rủi ro R3 trong tài liệu kiến trúc.
 */

const STATEMENT_END_TOKENS = new Set([';', '{', '}', ':']);

/** Token có thể đứng cuối một câu lệnh hoàn chỉnh (nên phải có `;` theo sau). */
function endsCompleteExpression(token: Token): boolean {
  if (token.type === 'identifier' || token.type === 'number') return true;
  if (token.type === 'string' || token.type === 'char') return true;
  if (token.value === ')' || token.value === ']') return true;
  if (token.value === '++' || token.value === '--') return true;
  return ['endl', 'true', 'false'].includes(token.value);
}

function groupByLine(tokens: Token[]): Map<number, Token[]> {
  const lines = new Map<number, Token[]>();
  for (const token of tokens) {
    if (token.type === 'eof') continue;
    const bucket = lines.get(token.line);
    if (bucket) bucket.push(token);
    else lines.set(token.line, [token]);
  }
  return lines;
}

// ---------------------------------------------------------------- preScan

export function preScan(tokens: Token[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  diagnostics.push(...checkOutOfScope(tokens));
  diagnostics.push(...checkBraces(tokens));
  diagnostics.push(...checkParens(tokens));
  diagnostics.push(...checkAssignInCondition(tokens));
  diagnostics.push(...checkCoutSyntax(tokens));
  diagnostics.push(...checkProgramSkeleton(tokens));

  return diagnostics;
}

function checkOutOfScope(tokens: Token[]): Diagnostic[] {
  for (const token of tokens) {
    const explanation = OUT_OF_SCOPE_KEYWORDS[token.value];
    if (explanation && token.type === 'identifier') {
      return [
        {
          code: 'UNSUPPORTED_FEATURE',
          message: explanation,
          line: token.line,
          column: token.column,
          severity: 'error',
        },
      ];
    }
  }
  return [];
}

function checkBraces(tokens: Token[]): Diagnostic[] {
  const stack: Token[] = [];
  let opened = 0;
  let closed = 0;

  for (const token of tokens) {
    if (token.value === '{' && token.type === 'punct') {
      stack.push(token);
      opened += 1;
    } else if (token.value === '}' && token.type === 'punct') {
      closed += 1;
      if (stack.length === 0) {
        return [
          {
            code: 'UNBALANCED_BRACE',
            message: `Dòng ${token.line} có dấu \`}\` thừa — chưa có dấu \`{\` nào đang mở để đóng lại.`,
            line: token.line,
            column: token.column,
            severity: 'error',
          },
        ];
      }
      stack.pop();
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[0];
    return [
      {
        code: 'UNBALANCED_BRACE',
        message:
          `Em mở ${opened} dấu \`{\` nhưng mới đóng ${closed} dấu \`}\`. ` +
          `Dấu \`{\` ở dòng ${unclosed.line} chưa được đóng lại.`,
        line: unclosed.line,
        column: unclosed.column,
        severity: 'error',
      },
    ];
  }

  return [];
}

function checkParens(tokens: Token[]): Diagnostic[] {
  const stack: Token[] = [];

  for (const token of tokens) {
    if (token.value === '(' && token.type === 'punct') {
      stack.push(token);
    } else if (token.value === ')' && token.type === 'punct') {
      if (stack.length === 0) {
        return [
          {
            code: 'UNBALANCED_PAREN',
            message: `Dòng ${token.line} có dấu \`)\` thừa — chưa có dấu \`(\` nào đang mở.`,
            line: token.line,
            column: token.column,
            severity: 'error',
          },
        ];
      }
      stack.pop();
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[0];
    return [
      {
        code: 'UNBALANCED_PAREN',
        message: `Dấu \`(\` ở dòng ${unclosed.line} chưa được đóng lại bằng dấu \`)\`.`,
        line: unclosed.line,
        column: unclosed.column,
        severity: 'error',
      },
    ];
  }

  return [];
}

/**
 * Bắt lỗi kinh điển: `if (score = 10)` thay vì `if (score == 10)`.
 *
 * Đây là C++ HỢP LỆ nên parser không hề báo lỗi — chương trình vẫn chạy nhưng
 * cho kết quả sai. Với học sinh lớp 8 thì gần như chắc chắn là nhầm lẫn,
 * nên hệ thống chặn lại và giải thích.
 */
function checkAssignInCondition(tokens: Token[]): Diagnostic[] {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value !== 'if' || token.type !== 'keyword') continue;
    if (tokens[index + 1]?.value !== '(') continue;

    let depth = 0;
    for (let scan = index + 1; scan < tokens.length; scan += 1) {
      const inner = tokens[scan];
      if (inner.value === '(') depth += 1;
      else if (inner.value === ')') {
        depth -= 1;
        if (depth === 0) break;
      } else if (inner.value === '=' && inner.type === 'operator') {
        return [
          {
            code: 'ASSIGN_IN_CONDITION',
            message:
              `Ở dòng ${inner.line}, trong phép so sánh em cần dùng \`==\` thay vì \`=\`. ` +
              'Một dấu `=` là GÁN giá trị, hai dấu `==` mới là SO SÁNH.',
            line: inner.line,
            column: inner.column,
            severity: 'error',
            suggestHintLevel: 1,
          },
        ];
      }
    }
  }
  return [];
}

function checkCoutSyntax(tokens: Token[]): Diagnostic[] {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value !== 'cout' || token.type !== 'keyword') continue;

    const next = tokens[index + 1];
    if (!next) continue;

    if (next.value === '<') {
      return [
        {
          code: 'COUT_SYNTAX',
          message:
            `Ở dòng ${token.line}, sau \`cout\` cần HAI dấu nhỏ hơn \`<<\`, không phải một. ` +
            'Ví dụ đúng: `cout << "Xin chào";`',
          line: token.line,
          column: token.column,
          severity: 'error',
        },
      ];
    }

    if (next.value !== '<<') {
      return [
        {
          code: 'COUT_SYNTAX',
          message:
            `Ở dòng ${token.line}, sau \`cout\` em cần dùng dấu \`<<\`. ` +
            'Ví dụ đúng: `cout << "Xin chào";`',
          line: token.line,
          column: token.column,
          severity: 'error',
        },
      ];
    }
  }
  return [];
}

function checkProgramSkeleton(tokens: Token[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const usesIostream = tokens.some(
    (token) => (token.value === 'cout' || token.value === 'cin') && token.type === 'keyword',
  );
  const hasInclude = tokens.some(
    (token) => token.type === 'preprocessor' && token.value.includes('iostream'),
  );

  if (usesIostream && !hasInclude) {
    diagnostics.push({
      code: 'MISSING_INCLUDE',
      message:
        'Muốn dùng `cout` hoặc `cin`, em cần có dòng `#include <iostream>` ở đầu chương trình.',
      line: 1,
      severity: 'error',
    });
  }

  const hasMain = tokens.some(
    (token, index) =>
      token.type === 'identifier' && token.value === 'main' && tokens[index + 1]?.value === '(',
  );

  if (!hasMain && tokens.length > 1) {
    diagnostics.push({
      code: 'MISSING_MAIN',
      message:
        'Mọi chương trình C++ đều bắt đầu chạy từ hàm `int main()`. Em thêm hàm này vào nhé.',
      line: 1,
      severity: 'error',
    });
  }

  return diagnostics;
}

// -------------------------------------------------------- explainParseFailure

/**
 * Khi parser thất bại, thử tìm lời giải thích dễ hiểu hơn.
 *
 * Chỉ chấp nhận lời giải thích nằm ở dòng của lỗi hoặc TRƯỚC đó — vì nguyên nhân
 * thật sự luôn ở phía trước chỗ parser vấp phải.
 */
export function explainParseFailure(tokens: Token[], error: ParseError): Diagnostic {
  const fallback: Diagnostic = {
    code: error.code,
    message: error.message,
    line: error.line,
    column: error.column,
    severity: 'error',
  };

  // Parser đã tự nhận ra thiếu `;` thì giữ nguyên thông báo của nó
  if (error.code === 'MISSING_SEMICOLON') return fallback;

  const missingSemicolon = findMissingSemicolon(tokens, error.line);
  if (missingSemicolon) return missingSemicolon;

  return fallback;
}

function findMissingSemicolon(tokens: Token[], beforeLine: number): Diagnostic | null {
  const lines = groupByLine(tokens);
  const lineNumbers = [...lines.keys()].sort((a, b) => a - b);

  for (let index = 0; index < lineNumbers.length; index += 1) {
    const lineNumber = lineNumbers[index];
    if (lineNumber > beforeLine) break;

    const lineTokens = lines.get(lineNumber)!;
    const first = lineTokens[0];
    const last = lineTokens[lineTokens.length - 1];

    // Bỏ qua: #include, else, dòng kết thúc bằng ; { } :
    if (first.type === 'preprocessor') continue;
    if (first.value === 'else' || first.value === '}') continue;
    if (STATEMENT_END_TOKENS.has(last.value)) continue;
    if (!endsCompleteExpression(last)) continue;

    // Bỏ qua phần đầu của `if (...)`, `for (...)` — sau đó là thân lệnh, không phải dấu ;
    if ((first.value === 'if' || first.value === 'for') && last.value === ')') continue;

    // Bỏ qua khai báo hàm có `{` nằm ở dòng kế tiếp
    const nextLineNumber = lineNumbers[index + 1];
    const nextFirst = nextLineNumber ? lines.get(nextLineNumber)![0] : undefined;
    if (nextFirst?.value === '{') continue;

    // Bỏ qua dòng bị ngắt giữa chừng: kết thúc bằng toán tử, dấu phẩy, dấu mở ngoặc
    if (last.type === 'operator' || last.value === ',' || last.value === '(') continue;

    return {
      code: 'MISSING_SEMICOLON',
      message: `Có vẻ em đang thiếu dấu \`;\` ở cuối dòng ${lineNumber}.`,
      line: lineNumber,
      column: last.column + last.value.length,
      severity: 'error',
      suggestHintLevel: 1,
    };
  }

  return null;
}
