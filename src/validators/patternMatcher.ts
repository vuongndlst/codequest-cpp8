import type { AnyNode, Program } from './ast';
import { childrenOf, walk } from './ast';

/**
 * Bước ⑦ (một phần): kiểm tra yêu cầu cấu trúc của challenge.
 *
 * `requiredPatterns` trong dữ liệu challenge là mảng chuỗi (giữ đúng interface
 * đề bài), nhưng được diễn giải bằng AST MATCHER chứ không phải regex.
 * Regex trên code là nguồn gốc của việc báo sai cho học sinh làm đúng:
 * regex /for/ khớp cả chữ "for" nằm trong chuỗi `cout << "Thông tin";`.
 *
 * Cú pháp DSL (docs/phase-1-architecture.md mục 6.6):
 *
 *   stmt:for                    có ít nhất một vòng for
 *   stmt:if                     có câu lệnh if
 *   stmt:if-else                có if kèm else
 *   stmt:cout                   có lệnh cout
 *   stmt:for>call:moveForward   có lời gọi moveForward BÊN TRONG vòng for
 *   decl:func:openDoor          khai báo hàm tên openDoor
 *   decl:func:*:params>=1       có hàm nhận ít nhất 1 tham số
 *   decl:var:int                khai báo biến kiểu int
 *   call:moveForward            có gọi moveForward
 *   call:moveForward:count=5    gọi đúng 5 lần
 *   call:moveForward:count>=5   gọi ít nhất 5 lần
 *   op:==                       có dùng toán tử ==
 *   output:contains:Xin chào    kết quả in ra có chứa chuỗi
 */

export interface PatternResult {
  pattern: string;
  matched: boolean;
  /** Mô tả tiếng Việt để ghép vào thông báo cho học sinh */
  description: string;
}

export function matchPatterns(
  program: Program,
  patterns: string[],
  output: string,
): PatternResult[] {
  return patterns.map((pattern) => ({
    pattern,
    matched: matchPattern(program, pattern, output),
    description: describePattern(pattern),
  }));
}

export function matchPattern(program: Program, pattern: string, output: string): boolean {
  const trimmed = pattern.trim();
  if (!trimmed) return true;

  if (trimmed.startsWith('output:contains:')) {
    const needle = trimmed.slice('output:contains:'.length);
    return normalize(output).includes(normalize(needle));
  }

  return matchSegments(program, splitSegments(trimmed));
}

/**
 * Tách các cấp lồng nhau theo dấu `>`.
 *
 * ⚠ Phải bỏ qua dấu `>` thuộc về `>=` — nếu không thì `call:move:count>=3`
 * bị cắt nhầm thành `['call:move:count', '=3']` và ràng buộc số lượng biến mất
 * một cách âm thầm.
 */
function splitSegments(pattern: string): string[] {
  return pattern.split(/>(?!=)/).map((segment) => segment.trim());
}

function matchSegments(root: AnyNode, segments: string[]): boolean {
  if (segments.length === 0) return true;

  const [head, ...rest] = segments;
  const matches = collectMatches(root, head);
  if (matches.length === 0) return false;
  if (rest.length === 0) return true;

  // Segment tiếp theo phải khớp bên TRONG một node đã khớp
  return matches.some((node) => descendantsMatch(node, rest));
}

function descendantsMatch(node: AnyNode, segments: string[]): boolean {
  const [head, ...rest] = segments;
  const inner: AnyNode[] = [];

  for (const child of childrenOf(node)) {
    walk(child, (candidate) => {
      if (matchesSelector(candidate, head)) inner.push(candidate);
    });
  }

  if (inner.length === 0) return false;
  if (rest.length === 0) return checkCountConstraint(node, head, inner.length);
  return inner.some((candidate) => descendantsMatch(candidate, rest));
}

function collectMatches(root: AnyNode, selector: string): AnyNode[] {
  const found: AnyNode[] = [];
  walk(root, (node) => {
    if (matchesSelector(node, selector)) found.push(node);
  });

  if (found.length === 0) return [];
  return checkCountConstraint(root, selector, found.length) ? found : [];
}

/** Ràng buộc `:count=N`, `:count>=N`, `:count<=N` */
function checkCountConstraint(_scope: AnyNode, selector: string, actual: number): boolean {
  const match = /:count(=|>=|<=)(\d+)$/.exec(selector);
  if (!match) return true;

  const [, operator, rawExpected] = match;
  const expected = Number(rawExpected);

  if (operator === '=') return actual === expected;
  if (operator === '>=') return actual >= expected;
  return actual <= expected;
}

function stripCount(selector: string): string {
  return selector.replace(/:count(=|>=|<=)\d+$/, '');
}

function matchesSelector(node: AnyNode, rawSelector: string): boolean {
  const selector = stripCount(rawSelector);
  const parts = selector.split(':');
  const [category, ...args] = parts;

  switch (category) {
    case 'stmt':
      return matchStatementSelector(node, args[0]);

    case 'call': {
      if (node.kind !== 'CallExpression') return false;
      const name = args[0];
      return name === '*' || node.callee === name;
    }

    case 'decl': {
      if (args[0] === 'func') {
        if (node.kind !== 'FunctionDeclaration') return false;
        const name = args[1];
        if (name && name !== '*' && node.name !== name) return false;
        return matchParamConstraint(node.params.length, args[2]);
      }
      if (args[0] === 'var') {
        if (node.kind !== 'VariableDeclaration') return false;
        const type = args[1];
        return !type || type === '*' || node.varType === type;
      }
      if (args[0] === 'array') {
        if (node.kind !== 'VariableDeclaration') return false;
        const type = args[1];
        return (!type || type === '*' || node.varType === type)
          && node.declarations.some((declaration) => declaration.arraySize !== null || declaration.arrayInit !== null);
      }
      if (args[0] === 'ref') {
        if (node.kind !== 'FunctionDeclaration') return false;
        return node.params.some((param) => param.isReference);
      }
      return false;
    }

    case 'access':
      return args[0] === 'array' && node.kind === 'ArrayAccessExpression';

    case 'op': {
      const operator = args.join(':');
      if (node.kind === 'BinaryExpression') return node.operator === operator;
      if (node.kind === 'UnaryExpression') return node.operator === operator;
      if (node.kind === 'AssignmentExpression') return node.operator === operator;
      if (node.kind === 'UpdateExpression') return node.operator === operator;
      return false;
    }

    default:
      return false;
  }
}

function matchStatementSelector(node: AnyNode, kind: string | undefined): boolean {
  switch (kind) {
    case 'for':
      return node.kind === 'ForStatement';
    case 'if':
      return node.kind === 'IfStatement';
    case 'if-else':
      return node.kind === 'IfStatement' && node.alternate !== null;
    case 'cout':
      return node.kind === 'CoutStatement';
    case 'cin':
      return node.kind === 'CinStatement';
    case 'return':
      return node.kind === 'ReturnStatement';
    default:
      return false;
  }
}

/** `params>=1`, `params=2`, `params<=3` */
function matchParamConstraint(actual: number, constraint: string | undefined): boolean {
  if (!constraint) return true;
  const match = /^params(=|>=|<=)(\d+)$/.exec(constraint);
  if (!match) return true;

  const expected = Number(match[2]);
  if (match[1] === '=') return actual === expected;
  if (match[1] === '>=') return actual >= expected;
  return actual <= expected;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

// ------------------------------------------------------- Mô tả bằng tiếng Việt

const STATEMENT_LABELS: Record<string, string> = {
  for: 'vòng lặp `for`',
  if: 'câu lệnh `if`',
  'if-else': 'cấu trúc `if–else`',
  cout: 'lệnh `cout`',
  cin: 'lệnh `cin`',
  return: 'câu lệnh `return`',
};

export function describePattern(pattern: string): string {
  const trimmed = pattern.trim();

  if (trimmed.startsWith('output:contains:')) {
    return `in ra dòng chữ "${trimmed.slice('output:contains:'.length)}"`;
  }

  const segments = splitSegments(trimmed).map((segment) => describeSegment(segment));
  if (segments.length === 1) return segments[0];
  return `${segments[segments.length - 1]} nằm bên trong ${segments.slice(0, -1).join(', bên trong ')}`;
}

function describeSegment(rawSelector: string): string {
  const countMatch = /:count(=|>=|<=)(\d+)$/.exec(rawSelector);
  const countSuffix = countMatch
    ? countMatch[1] === '='
      ? ` đúng ${countMatch[2]} lần`
      : countMatch[1] === '>='
        ? ` ít nhất ${countMatch[2]} lần`
        : ` nhiều nhất ${countMatch[2]} lần`
    : '';

  const parts = stripCount(rawSelector).split(':');
  const [category, ...args] = parts;

  switch (category) {
    case 'stmt':
      return `${STATEMENT_LABELS[args[0]] ?? 'câu lệnh'}${countSuffix}`;

    case 'call':
      return args[0] === '*'
        ? `lời gọi hàm${countSuffix}`
        : `lời gọi \`${args[0]}()\`${countSuffix}`;

    case 'decl':
      if (args[0] === 'func') {
        const paramNote = args[2]?.startsWith('params')
          ? ` có ${args[2].replace('params>=', 'ít nhất ').replace('params=', 'đúng ').replace('params<=', 'nhiều nhất ')} tham số`
          : '';
        return args[1] === '*' || !args[1]
          ? `một hàm do em tự viết${paramNote}`
          : `hàm \`${args[1]}()\`${paramNote}`;
      }
      if (args[0] === 'var') {
        return args[1] === '*' || !args[1]
          ? 'một biến'
          : `một biến kiểu \`${args[1]}\``;
      }
      if (args[0] === 'array') {
        return args[1] && args[1] !== '*'
          ? `một mảng kiểu \`${args[1]}\``
          : 'một mảng một chiều';
      }
      if (args[0] === 'ref') return 'một hàm có tham số tham chiếu';
      return 'phần khai báo';

    case 'access':
      return 'một phép truy cập phần tử bằng `[]`';

    case 'op':
      return `toán tử \`${args.join(':')}\``;

    default:
      return rawSelector;
  }
}
