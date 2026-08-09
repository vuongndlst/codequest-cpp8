import type { CleanCodeRule, CleanCodeRuleId } from '@/types/content';
import type { AnyNode, Expression, FunctionDeclaration, Program, Statement } from './ast';
import { walk } from './ast';
import type { Token } from './tokens';

/**
 * Bước ⑧: Clean Code Coach.
 *
 * ĐIỂM CLEAN CODE KHÔNG BAO GIỜ LÀM HỌC SINH MẤT CHỨNG CHỈ (mục 11 của đề bài).
 * Nếu chương trình đã chạy đúng, đây chỉ là lời khuyên để code dễ đọc hơn.
 * Nó chỉ ảnh hưởng tới ngôi sao thứ ba và một vài huy hiệu.
 *
 * Giọng văn của mọi thông báo: KHEN TRƯỚC, ĐỀ XUẤT SAU.
 */

export interface CleanCodeCheck {
  rule: CleanCodeRuleId;
  passed: boolean;
  weight: number;
  earned: number;
  /** Lời khuyên tiếng Việt. Chỉ có khi chưa đạt. */
  message?: string;
  /** Dòng liên quan, để highlight trong editor */
  lines?: number[];
}

export interface CleanCodeReport {
  /** 0..100 */
  score: number;
  checks: CleanCodeCheck[];
  /** Các lời khuyên đã lọc, sắp theo mức quan trọng */
  suggestions: string[];
  /** Đủ điều kiện cho ngôi sao thứ ba */
  isClean: boolean;
}

export const CLEAN_CODE_STAR_THRESHOLD = 80;

/**
 * Tên tiếng Việt của từng tiêu chí, để hiện bảng chấm cho học sinh xem.
 *
 * Trước đây màn hình chỉ hiện một con số ("65/100") kèm hai câu góp ý trôi nổi.
 * Học sinh không biết 65 điểm đó từ đâu ra, cũng không biết còn thiếu gì —
 * thầy Vương phản ánh đúng chỗ này. Có tên tiêu chí thì điểm số đọc được như
 * một bảng kiểm, không còn là con số bí ẩn.
 */
export const CLEAN_CODE_RULE_LABELS: Record<CleanCodeRuleId, string> = {
  indent: 'Thụt lề đúng cấp',
  'one-statement-per-line': 'Mỗi dòng một câu lệnh',
  'meaningful-var': 'Tên biến nói rõ nghĩa',
  'action-verb-func': 'Tên hàm bắt đầu bằng động từ',
  'unused-var': 'Không có biến thừa',
  'no-duplication': 'Không lặp code giống nhau',
  spacing: 'Có khoảng trắng quanh dấu phép tính',
  'main-length': 'Hàm main() không quá dài',
  'extract-function': 'Có tách việc thành hàm riêng',
};

/** Bộ quy tắc mặc định khi challenge không khai báo riêng. */
export const DEFAULT_CLEAN_CODE_RULES: CleanCodeRule[] = [
  { rule: 'indent', weight: 20 },
  { rule: 'one-statement-per-line', weight: 15 },
  { rule: 'meaningful-var', weight: 25 },
  { rule: 'unused-var', weight: 15 },
  { rule: 'spacing', weight: 10 },
  { rule: 'main-length', weight: 15, params: { maxMainLines: 15 } },
];

/** Tên biến quá ngắn hoặc vô nghĩa. `i`, `j`, `k` được chấp nhận làm biến đếm. */
const LOOP_COUNTER_NAMES = new Set(['i', 'j', 'k']);
const VAGUE_NAMES = new Set([
  'a', 'b', 'c', 'd', 'e', 'f', 'x', 'y', 'z', 'n', 'm', 'p', 'q',
  'aa', 'bb', 'xx', 'x1', 'x2', 'y1', 'tmp', 'temp', 'var', 'val',
  'abc', 'aaa', 'foo', 'bar', 'data1', 'thing', 'stuff',
]);

/** Động từ tiếng Anh thường gặp — dùng để kiểm tra tên hàm có thể hiện hành động không. */
const ACTION_VERBS = [
  'move', 'open', 'close', 'turn', 'draw', 'print', 'show', 'display', 'get', 'set',
  'calc', 'calculate', 'check', 'is', 'has', 'make', 'build', 'create', 'run', 'start',
  'stop', 'reset', 'update', 'add', 'remove', 'find', 'count', 'collect', 'activate',
  'attack', 'jump', 'walk', 'say', 'greet', 'light', 'unlock', 'repair', 'scan', 'fix',
];

export interface CleanCodeInput {
  source: string;
  program: Program;
  tokens: Token[];
  rules?: CleanCodeRule[];
}

export function analyzeCleanCode(input: CleanCodeInput): CleanCodeReport {
  const rules = input.rules?.length ? input.rules : DEFAULT_CLEAN_CODE_RULES;
  const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0) || 1;

  const checks = rules.map((rule) => runRule(rule, input));
  const earned = checks.reduce((sum, check) => sum + check.earned, 0);
  const score = Math.round((earned / totalWeight) * 100);

  const suggestions = checks
    .filter((check) => !check.passed && check.message)
    .sort((a, b) => b.weight - a.weight)
    .map((check) => check.message!);

  return {
    score,
    checks,
    suggestions,
    isClean: score >= CLEAN_CODE_STAR_THRESHOLD,
  };
}

function runRule(rule: CleanCodeRule, input: CleanCodeInput): CleanCodeCheck {
  const result = RULE_IMPLEMENTATIONS[rule.rule]?.(input, rule.params ?? {}) ?? {
    passed: true,
  };

  return {
    rule: rule.rule,
    passed: result.passed,
    weight: rule.weight,
    earned: result.passed ? rule.weight : 0,
    message: result.message,
    lines: result.lines,
  };
}

interface RuleOutcome {
  passed: boolean;
  message?: string;
  lines?: number[];
}

type RuleImplementation = (input: CleanCodeInput, params: Record<string, unknown>) => RuleOutcome;

// -------------------------------------------------------------- Các quy tắc

const RULE_IMPLEMENTATIONS: Partial<Record<CleanCodeRuleId, RuleImplementation>> = {
  indent: checkIndentation,
  'one-statement-per-line': checkOneStatementPerLine,
  'meaningful-var': checkMeaningfulVariableNames,
  'action-verb-func': checkActionVerbFunctionNames,
  'unused-var': checkUnusedVariables,
  'no-duplication': checkDuplication,
  spacing: checkSpacing,
  'main-length': checkMainLength,
  'extract-function': checkExtractFunction,
};

function checkIndentation(input: CleanCodeInput): RuleOutcome {
  const lines = input.source.split('\n');
  const offenders: number[] = [];

  let depth = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
      depth = adjustDepth(depth, trimmed);
      continue;
    }

    // Dòng bắt đầu bằng `}` thuộc về mức nông hơn
    const effectiveDepth = trimmed.startsWith('}') ? Math.max(0, depth - 1) : depth;
    const actualIndent = line.length - line.trimStart().length;

    if (effectiveDepth === 0) {
      if (actualIndent !== 0) offenders.push(index + 1);
    } else if (actualIndent === 0) {
      offenders.push(index + 1);
    }

    depth = adjustDepth(depth, trimmed);
  }

  if (offenders.length === 0) return { passed: true };

  return {
    passed: false,
    lines: offenders.slice(0, 5),
    message:
      offenders.length === 1
        ? `Dòng ${offenders[0]} chưa thụt lề đúng mức. Hãy thụt phần code bên trong dấu \`{ }\` vào một cấp — code sẽ dễ đọc hơn nhiều.`
        : `Có ${offenders.length} dòng chưa thụt lề đúng (ví dụ dòng ${offenders.slice(0, 3).join(', ')}). Phần code bên trong dấu \`{ }\` nên được thụt vào một cấp.`,
  };
}

function adjustDepth(depth: number, trimmedLine: string): number {
  const opens = (trimmedLine.match(/\{/g) ?? []).length;
  const closes = (trimmedLine.match(/\}/g) ?? []).length;
  return Math.max(0, depth + opens - closes);
}

function checkOneStatementPerLine(input: CleanCodeInput): RuleOutcome {
  const semicolonsByLine = new Map<number, number>();
  let forDepth = 0;
  let parenDepth = 0;

  for (let index = 0; index < input.tokens.length; index += 1) {
    const token = input.tokens[index];

    if (token.value === 'for') {
      forDepth = 1;
      parenDepth = 0;
    }
    if (forDepth > 0 && token.value === '(') parenDepth += 1;
    if (forDepth > 0 && token.value === ')') {
      parenDepth -= 1;
      if (parenDepth <= 0) forDepth = 0;
    }

    // Dấu ; bên trong `for (...)` là hợp lệ, không tính
    if (token.value === ';' && forDepth === 0) {
      semicolonsByLine.set(token.line, (semicolonsByLine.get(token.line) ?? 0) + 1);
    }
  }

  const offenders = [...semicolonsByLine.entries()]
    .filter(([, count]) => count > 1)
    .map(([line]) => line);

  if (offenders.length === 0) return { passed: true };

  return {
    passed: false,
    lines: offenders,
    message: `Dòng ${offenders.slice(0, 3).join(', ')} có nhiều câu lệnh viết dồn trên một dòng. Mỗi câu lệnh nên nằm trên một dòng riêng để dễ đọc và dễ tìm lỗi.`,
  };
}

function checkMeaningfulVariableNames(input: CleanCodeInput): RuleOutcome {
  const offenders: Array<{ name: string; line: number }> = [];
  const loopCounterNames = collectLoopCounterNames(input.program);

  walk(input.program, (node) => {
    if (node.kind !== 'VariableDeclaration') return;
    for (const declarator of node.declarations) {
      const name = declarator.name;
      // Biến đếm i, j, k trong for là quy ước phổ biến, chấp nhận được
      if (LOOP_COUNTER_NAMES.has(name) && loopCounterNames.has(name)) continue;
      if (VAGUE_NAMES.has(name.toLowerCase()) || name.length < 3) {
        offenders.push({ name, line: declarator.line });
      }
    }
  });

  if (offenders.length === 0) return { passed: true };

  const first = offenders[0];
  return {
    passed: false,
    lines: offenders.map((item) => item.line),
    message:
      `Code của em chạy được rồi! Em có thể làm nó dễ đọc hơn bằng cách đổi tên biến \`${first.name}\` ` +
      `(dòng ${first.line}) thành một cái tên nói rõ nó chứa gì, ví dụ \`playerScore\` hoặc \`stepCount\`.`,
  };
}

function collectLoopCounterNames(program: Program): Set<string> {
  const names = new Set<string>();
  walk(program, (node) => {
    if (node.kind === 'ForStatement' && node.init?.kind === 'VariableDeclaration') {
      for (const declarator of node.init.declarations) names.add(declarator.name);
    }
  });
  return names;
}

function checkActionVerbFunctionNames(input: CleanCodeInput): RuleOutcome {
  const offenders: Array<{ name: string; line: number }> = [];

  for (const node of input.program.body) {
    if (node.kind !== 'FunctionDeclaration' || node.name === 'main') continue;
    const lower = node.name.toLowerCase();
    const startsWithVerb = ACTION_VERBS.some((verb) => lower.startsWith(verb));
    if (!startsWithVerb) offenders.push({ name: node.name, line: node.line });
  }

  if (offenders.length === 0) return { passed: true };

  const first = offenders[0];
  return {
    passed: false,
    lines: offenders.map((item) => item.line),
    message:
      `Tên hàm nên nói rõ hàm đó LÀM GÌ, thường bắt đầu bằng một động từ. ` +
      `Em thử đổi \`${first.name}()\` thành dạng như \`open${capitalize(first.name)}()\` hoặc \`draw${capitalize(first.name)}()\` xem sao.`,
  };
}

function checkUnusedVariables(input: CleanCodeInput): RuleOutcome {
  const declared = new Map<string, number>();
  const read = new Set<string>();

  walk(input.program, (node) => {
    if (node.kind === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        declared.set(declarator.name, declarator.line);
      }
    }
  });

  collectReads(input.program, read);

  const offenders = [...declared.entries()].filter(([name]) => !read.has(name));
  if (offenders.length === 0) return { passed: true };

  const [name, line] = offenders[0];
  return {
    passed: false,
    lines: offenders.map(([, offenderLine]) => offenderLine),
    message:
      `Biến \`${name}\` ở dòng ${line} được khai báo nhưng chưa dùng tới lần nào. ` +
      'Nếu chưa cần, em xoá đi cho code gọn nhé.',
  };
}

/** Thu thập các lần ĐỌC biến. Vế trái của phép gán là ghi, không tính là đọc. */
function collectReads(node: AnyNode | null | undefined, read: Set<string>): void {
  if (!node) return;

  switch (node.kind) {
    case 'AssignmentExpression':
      // Chỉ vế phải mới là đọc; riêng `x += 1` thì x vừa đọc vừa ghi
      if (node.operator !== '=') read.add(node.target.name);
      collectReads(node.value, read);
      return;

    case 'UpdateExpression':
      // `i++` chỉ tính là ghi — nếu i chỉ được tăng mà không dùng thì vẫn là biến thừa
      return;

    case 'Identifier':
      read.add(node.name);
      return;

    default:
      break;
  }

  for (const child of childrenOfForReads(node)) {
    collectReads(child, read);
  }
}

function childrenOfForReads(node: AnyNode): AnyNode[] {
  switch (node.kind) {
    case 'Program':
      return node.body;
    case 'FunctionDeclaration':
      return [node.body];
    case 'BlockStatement':
      return node.body;
    case 'VariableDeclaration':
      return node.declarations.map((d) => d.init).filter((e): e is Expression => e !== null);
    case 'ExpressionStatement':
      return [node.expression];
    case 'IfStatement':
      return [node.test, node.consequent, node.alternate].filter(Boolean) as AnyNode[];
    case 'ForStatement':
      return [node.init, node.test, node.update, node.body].filter(Boolean) as AnyNode[];
    case 'ReturnStatement':
      return node.argument ? [node.argument] : [];
    case 'CoutStatement':
      return node.parts;
    case 'CinStatement':
      return node.targets;
    case 'BinaryExpression':
      return [node.left, node.right];
    case 'UnaryExpression':
      return [node.argument];
    case 'CallExpression':
      return node.args;
    default:
      return [];
  }
}

/** Ba câu lệnh giống hệt nhau liên tiếp -> gợi ý dùng vòng lặp. */
function checkDuplication(input: CleanCodeInput): RuleOutcome {
  let worst: { signature: string; count: number; line: number } | null = null;

  walk(input.program, (node) => {
    if (node.kind !== 'BlockStatement' && node.kind !== 'Program') return;
    const body = (node.kind === 'Program' ? [] : node.body) as Statement[];

    let runLength = 1;
    for (let index = 1; index <= body.length; index += 1) {
      const previous = body[index - 1];
      const current = body[index];
      const same = current && signatureOf(current) === signatureOf(previous);

      if (same) {
        runLength += 1;
      } else {
        if (runLength >= 3 && (!worst || runLength > worst.count)) {
          worst = {
            signature: signatureOf(previous),
            count: runLength,
            line: body[index - runLength].line,
          };
        }
        runLength = 1;
      }
    }
  });

  if (!worst) return { passed: true };

  const found = worst as { signature: string; count: number; line: number };
  return {
    passed: false,
    lines: [found.line],
    message:
      `Từ dòng ${found.line}, em lặp lại cùng một câu lệnh ${found.count} lần. ` +
      'Em có thể dùng vòng lặp `for` để code gọn hơn nhiều đó — thử xem nhé!',
  };
}

function signatureOf(statement: Statement): string {
  switch (statement.kind) {
    case 'ExpressionStatement':
      return `expr:${expressionSignature(statement.expression)}`;
    case 'CoutStatement':
      return `cout:${statement.parts.map(expressionSignature).join('|')}`;
    default:
      return statement.kind;
  }
}

function expressionSignature(expression: Expression): string {
  switch (expression.kind) {
    case 'CallExpression':
      return `call(${expression.callee},${expression.args.map(expressionSignature).join(',')})`;
    case 'Identifier':
      return `id(${expression.name})`;
    case 'NumberLiteral':
      return `num(${expression.value})`;
    case 'StringLiteral':
      return `str(${expression.value})`;
    case 'BinaryExpression':
      return `bin(${expression.operator},${expressionSignature(expression.left)},${expressionSignature(expression.right)})`;
    default:
      return expression.kind;
  }
}

/** Khoảng trắng quanh toán tử hai ngôi. Dùng token nên không nhầm với nội dung chuỗi. */
function checkSpacing(input: CleanCodeInput): RuleOutcome {
  const lines = input.source.split('\n');
  const binaryOperators = new Set([
    '=', '==', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/', '%',
    '&&', '||', '<<', '>>', '+=', '-=', '*=', '/=',
  ]);
  const offenders: number[] = [];

  for (const token of input.tokens) {
    if (token.type !== 'operator' || !binaryOperators.has(token.value)) continue;

    const line = lines[token.line - 1];
    if (!line) continue;

    const before = line[token.column - 2];
    const after = line[token.column - 1 + token.value.length];

    // Bỏ qua dấu trừ đứng một mình (số âm) và cuối dòng
    if (token.value === '-' && (before === '(' || before === '=' || before === ',')) continue;

    const tightBefore = before !== undefined && before !== ' ' && before !== '\t';
    const tightAfter = after !== undefined && after !== ' ' && after !== '\t';

    if (tightBefore || tightAfter) {
      if (!offenders.includes(token.line)) offenders.push(token.line);
    }
  }

  if (offenders.length === 0) return { passed: true };

  return {
    passed: false,
    lines: offenders.slice(0, 5),
    message:
      `Ở dòng ${offenders.slice(0, 3).join(', ')}, em thử thêm khoảng trắng hai bên các dấu phép tính nhé. ` +
      'Viết `score = score + 1` dễ đọc hơn `score=score+1` nhiều.',
  };
}

function checkMainLength(input: CleanCodeInput, params: Record<string, unknown>): RuleOutcome {
  const maxLines = typeof params.maxMainLines === 'number' ? params.maxMainLines : 15;
  const main = input.program.body.find(
    (node): node is FunctionDeclaration => node.kind === 'FunctionDeclaration' && node.name === 'main',
  );
  if (!main) return { passed: true };

  const statementCount = main.body.body.filter(
    (statement) => statement.kind !== 'EmptyStatement' && statement.kind !== 'ReturnStatement',
  ).length;

  if (statementCount <= maxLines) return { passed: true };

  return {
    passed: false,
    lines: [main.line],
    message:
      `Hàm \`main()\` của em đang có ${statementCount} câu lệnh — hơi dài. ` +
      'Em thử tách bớt một nhóm việc ra thành hàm riêng, đặt tên rõ nghĩa xem code có gọn hơn không nhé.',
  };
}

function checkExtractFunction(input: CleanCodeInput): RuleOutcome {
  const hasHelper = input.program.body.some(
    (node) => node.kind === 'FunctionDeclaration' && node.name !== 'main',
  );
  if (hasHelper) return { passed: true };

  return {
    passed: false,
    message:
      'Nhiệm vụ này muốn em luyện tách việc thành hàm. Em thử đưa một nhóm câu lệnh ra thành hàm riêng, ' +
      'đặt tên nói rõ nó làm gì nhé.',
  };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
