import type { Challenge, ErrorCode } from '@/types/content';
import type { RunResult, TestResult } from '@/types/runner';
import type { Diagnostic } from './tokens';
import { tokenize } from './lexer';
import { preScan, explainParseFailure } from './noviceScan';
import { ParseError, parse } from './parser';
import { analyzeSemantics } from './semantics';
import { BUILTIN_FUNCTIONS, interpret, type InterpretResult } from './interpreter';
import { matchPattern, matchPatterns } from './patternMatcher';
import { analyzeCleanCode, type CleanCodeReport } from './cleanCodeCoach';
import { evaluatePar } from './statementCount';
import { matchesExpectedWorld } from './world';
import type { Program } from './ast';

/**
 * Bộ máy kiểm tra code — điều phối toàn bộ 8 bước của pipeline.
 *
 *   ① chuẩn hoá  ② lexer  ③ chẩn đoán lỗi phổ thông  ④ parser
 *   ⑤ ngữ nghĩa  ⑥ chạy   ⑦ kiểm tra yêu cầu         ⑧ clean code
 *
 * Hàm này thuần tuý: không đụng React, không đụng Supabase, không đụng DOM.
 * Nhờ vậy nó chạy được cả trong Web Worker lẫn trong test Vitest.
 */

const EMPTY_CLEAN_CODE: CleanCodeReport = {
  score: 0,
  checks: [],
  suggestions: [],
  isClean: false,
};

export function analyzeChallenge(code: string, challenge: Challenge): RunResult {
  const startedAt = Date.now();

  /*
    `par` mặc định null: những lần thoát sớm (lỗi lexer, lỗi parser) chưa có
    AST nên không đếm được câu lệnh. Chỉ những nhánh đã dựng xong AST mới
    truyền giá trị thật vào.
  */
  const finish = (
    result: Omit<RunResult, 'durationMs' | 'errorCodes' | 'par'> & {
      par?: RunResult['par'];
    },
  ): RunResult => ({
    par: null,
    ...result,
    errorCodes: dedupe(result.diagnostics.filter((d) => d.severity !== 'tip').map((d) => d.code)),
    durationMs: Date.now() - startedAt,
  });

  // --- ① + ② Chuẩn hoá và tách token ---
  const { tokens, errors: lexErrors } = tokenize(code);

  if (lexErrors.length > 0) {
    const first = lexErrors[0];
    return finish({
      ok: false,
      isCorrect: false,
      stdout: [],
      worldEvents: [],
      finalWorld: null,
      diagnostics: [
        {
          code: first.kind === 'unterminated-string' ? 'COUT_MISSING_QUOTE' : 'UNKNOWN',
          message:
            first.kind === 'unterminated-string'
              ? `${first.message} Chuỗi chữ cần đặt trong dấu nháy kép, ví dụ: \`cout << "Xin chào";\``
              : first.message,
          line: first.line,
          column: first.column,
          severity: 'error',
        },
      ],
      testResults: emptyTestResults(challenge),
      cleanCode: EMPTY_CLEAN_CODE,
      passedRequired: 0,
      totalRequired: countRequired(challenge),
    });
  }

  // --- ③ Chẩn đoán lỗi phổ thông (những kiểm tra chắc chắn đúng) ---
  const preDiagnostics = preScan(tokens);
  const blockingPre = preDiagnostics.filter((d) => d.severity === 'error');

  if (blockingPre.length > 0) {
    return finish({
      ok: false,
      isCorrect: false,
      stdout: [],
      worldEvents: [],
      finalWorld: null,
      diagnostics: sortDiagnostics(blockingPre),
      testResults: emptyTestResults(challenge),
      cleanCode: EMPTY_CLEAN_CODE,
      passedRequired: 0,
      totalRequired: countRequired(challenge),
    });
  }

  // --- ④ Phân tích cú pháp ---
  let program: Program;
  try {
    program = parse(tokens);
  } catch (error) {
    const diagnostic =
      error instanceof ParseError
        ? explainParseFailure(tokens, error)
        : {
            code: 'UNKNOWN' as ErrorCode,
            message: 'Chương trình có lỗi cú pháp mà thầy trò mình chưa xác định được chính xác.',
            line: 0,
            severity: 'error' as const,
          };

    return finish({
      ok: false,
      isCorrect: false,
      stdout: [],
      worldEvents: [],
      finalWorld: null,
      diagnostics: [applyCommonMistakes(diagnostic, challenge)],
      testResults: emptyTestResults(challenge),
      cleanCode: EMPTY_CLEAN_CODE,
      passedRequired: 0,
      totalRequired: countRequired(challenge),
    });
  }

  // Clean code chấm được ngay khi đã có AST, kể cả khi chương trình chưa chạy đúng
  const cleanCode = analyzeCleanCode({
    source: code,
    program,
    tokens,
    rules: challenge.cleanCodeRules,
  });

  // Đếm số câu lệnh để so với "số dòng vàng" của nhiệm vụ
  const par = evaluatePar(program, challenge.parStatements);

  // --- ⑤ Ngữ nghĩa ---
  const semantics = analyzeSemantics(program, { builtinFunctions: BUILTIN_FUNCTIONS });
  const semanticErrors = semantics.diagnostics.filter((d) => d.severity === 'error');

  if (semanticErrors.length > 0) {
    return finish({
      ok: false,
      isCorrect: false,
      stdout: [],
      worldEvents: [],
      finalWorld: null,
      diagnostics: sortDiagnostics(semanticErrors).map((d) => applyCommonMistakes(d, challenge)),
      testResults: emptyTestResults(challenge),
      cleanCode,
      par,
      passedRequired: 0,
      totalRequired: countRequired(challenge),
    });
  }

  // --- ⑥ Chạy chương trình ---
  const runCache = new Map<string, InterpretResult>();
  const runWith = (stdin: string): InterpretResult => {
    const cached = runCache.get(stdin);
    if (cached) return cached;
    const result = interpret(program, { stdin, world: challenge.world });
    runCache.set(stdin, result);
    return result;
  };

  const primaryStdin = challenge.testCases.find((test) => test.input)?.input ?? '';
  const primaryRun = runWith(primaryStdin);

  const runtimeErrors = primaryRun.diagnostics.filter((d) => d.severity === 'error');
  if (runtimeErrors.length > 0) {
    return finish({
      ok: false,
      isCorrect: false,
      stdout: primaryRun.stdout,
      worldEvents: primaryRun.worldEvents,
      finalWorld: primaryRun.finalWorld,
      diagnostics: sortDiagnostics(runtimeErrors).map((d) => applyCommonMistakes(d, challenge)),
      testResults: emptyTestResults(challenge),
      cleanCode,
      par,
      passedRequired: 0,
      totalRequired: countRequired(challenge),
    });
  }

  // --- ⑦ Kiểm tra yêu cầu của nhiệm vụ ---
  const testResults = challenge.testCases.map((test) =>
    evaluateTestCase(test, program, runWith),
  );

  const diagnostics: Diagnostic[] = [
    ...semantics.diagnostics.filter((d) => d.severity !== 'error'),
    ...primaryRun.diagnostics.filter((d) => d.severity !== 'error'),
  ];

  // Mẫu bắt buộc
  const requiredPatterns = matchPatterns(
    program,
    challenge.requiredPatterns,
    primaryRun.rawOutput,
  );
  const missingPatterns = requiredPatterns.filter((result) => !result.matched);

  for (const missing of missingPatterns) {
    diagnostics.push({
      code: 'PATTERN_MISSING',
      message: `Nhiệm vụ này cần em dùng ${missing.description}. Em xem lại phần "Yêu cầu" bên trái nhé.`,
      line: 0,
      severity: 'error',
      suggestHintLevel: 2,
    });
  }

  // Mẫu bị cấm — giọng văn vẫn khuyến khích, không phải chê bai
  const forbiddenHits = (challenge.forbiddenPatterns ?? []).filter((pattern) =>
    matchPattern(program, pattern, primaryRun.rawOutput),
  );

  for (const pattern of forbiddenHits) {
    const custom = challenge.commonMistakes.find(
      (mistake) => mistake.errorCode === 'PATTERN_FORBIDDEN' && mistake.detect === pattern,
    );
    diagnostics.push({
      code: 'PATTERN_FORBIDDEN',
      message:
        custom?.message ??
        'Cách này chạy đúng rồi, nhưng nhiệm vụ muốn em luyện một cách khác. Em xem lại phần "Yêu cầu" nhé.',
      line: 0,
      severity: 'error',
      suggestHintLevel: 2,
    });
  }

  // Lỗi thường gặp riêng của challenge (phát hiện bằng cùng DSL)
  for (const mistake of challenge.commonMistakes) {
    if (!mistake.detect) continue;
    if (mistake.errorCode === 'PATTERN_FORBIDDEN') continue;
    if (!matchPattern(program, mistake.detect, primaryRun.rawOutput)) continue;

    diagnostics.push({
      code: mistake.errorCode,
      message: mistake.message,
      line: 0,
      severity: 'error',
      suggestHintLevel: mistake.hintLevel,
    });
  }

  // Node Clean Code Check: dọn code CHÍNH LÀ nhiệm vụ, nên có ngưỡng điểm riêng.
  // Các node khác không bao giờ đặt `minCleanCodeScore` — mục 11 của đề bài
  // quy định điểm clean code không được làm học sinh trượt khi code đã đúng.
  if (challenge.minCleanCodeScore && cleanCode.score < challenge.minCleanCodeScore) {
    diagnostics.push({
      code: 'PATTERN_MISSING',
      message:
        `Chương trình của em chạy đúng rồi! Nhiệm vụ này còn cần code gọn gàng hơn một chút ` +
        `(hiện ${cleanCode.score}/100, cần từ ${challenge.minCleanCodeScore}). ` +
        (cleanCode.suggestions[0] ?? 'Em xem lại phần Yêu cầu bên trái nhé.'),
      line: 0,
      severity: 'error',
      suggestHintLevel: 1,
    });
  }

  const requiredTests = testResults.filter((test) => test.required);
  const passedRequired = requiredTests.filter((test) => test.passed).length;

  const hasBlockingIssue = diagnostics.some((d) => d.severity === 'error');
  const isCorrect =
    !hasBlockingIssue && requiredTests.length > 0 && passedRequired === requiredTests.length;

  // Chưa đúng mà chưa có thông báo nào -> nói cho học sinh biết vì sao
  if (!isCorrect && !hasBlockingIssue) {
    const firstFailing = requiredTests.find((test) => !test.passed);
    if (firstFailing) {
      diagnostics.unshift({
        code: 'OUTPUT_MISMATCH',
        message: buildTestFailureMessage(firstFailing, primaryRun),
        line: 0,
        severity: 'error',
        suggestHintLevel: 1,
      });
    }
  }

  return finish({
    ok: true,
    isCorrect,
    stdout: primaryRun.stdout,
    worldEvents: primaryRun.worldEvents,
    finalWorld: primaryRun.finalWorld,
    diagnostics: sortDiagnostics(diagnostics),
    testResults,
    cleanCode,
    par,
    passedRequired,
    totalRequired: requiredTests.length,
  });
}

// ------------------------------------------------------------------ Trợ giúp

function evaluateTestCase(
  test: Challenge['testCases'][number],
  program: Program,
  runWith: (stdin: string) => InterpretResult,
): TestResult {
  const base = {
    id: test.id,
    name: test.name,
    required: test.required,
    visible: test.visible,
  };

  if (test.kind === 'structure') {
    const patterns = test.patterns ?? [];
    const results = matchPatterns(program, patterns, '');
    const missing = results.filter((result) => !result.matched);
    return {
      ...base,
      passed: missing.length === 0,
      message: missing.length > 0 ? `Còn thiếu: ${missing[0].description}` : undefined,
    };
  }

  const run = runWith(test.input ?? '');

  if (test.kind === 'world') {
    const passed = test.expectedWorld
      ? matchesExpectedWorld(run.finalWorld, test.expectedWorld)
      : false;
    return { ...base, passed };
  }

  const actual = normalizeOutput(run.rawOutput);
  const expected = normalizeOutput(test.expectedOutput ?? '');
  const passed = actual === expected;

  return {
    ...base,
    passed,
    expected: test.visible ? test.expectedOutput : undefined,
    actual: test.visible ? run.stdout.join('\n') : undefined,
  };
}

function buildTestFailureMessage(test: TestResult, run: InterpretResult): string {
  if (test.visible && test.expected !== undefined) {
    const actual = run.stdout.length > 0 ? run.stdout.join(' ⏎ ') : '(chưa in ra gì cả)';
    return (
      `Chưa hoàn tất — kết quả in ra chưa khớp với mong đợi. ` +
      `Cần: "${test.expected.replace(/\n/g, ' ⏎ ')}" · Em đang in ra: "${actual}"`
    );
  }
  return `Bug vẫn còn — nhiệm vụ "${test.name}" chưa đạt. Em thử đọc lại phần Yêu cầu xem còn thiếu gì nhé.`;
}

/** So sánh output: bỏ khoảng trắng thừa cuối dòng và dòng trống cuối cùng. */
export function normalizeOutput(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
    .trim();
}

/**
 * Nếu challenge có thông báo riêng cho mã lỗi này thì ưu tiên dùng —
 * lời giải thích gắn với ngữ cảnh bài học luôn dễ hiểu hơn thông báo chung.
 */
function applyCommonMistakes(diagnostic: Diagnostic, challenge: Challenge): Diagnostic {
  const custom = challenge.commonMistakes.find(
    (mistake) => mistake.errorCode === diagnostic.code && !mistake.detect,
  );
  if (!custom) return diagnostic;

  return {
    ...diagnostic,
    message: custom.message,
    suggestHintLevel: custom.hintLevel ?? diagnostic.suggestHintLevel,
  };
}

/** Lỗi chặn trước, cảnh báo sau, mẹo cuối cùng; trong cùng mức thì theo số dòng. */
function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const order = { error: 0, warn: 1, tip: 2 };
  return [...diagnostics].sort((a, b) => {
    const bySeverity = order[a.severity] - order[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.line - b.line;
  });
}

function emptyTestResults(challenge: Challenge): TestResult[] {
  return challenge.testCases.map((test) => ({
    id: test.id,
    name: test.name,
    passed: false,
    required: test.required,
    visible: test.visible,
  }));
}

function countRequired(challenge: Challenge): number {
  return challenge.testCases.filter((test) => test.required).length;
}

function dedupe(values: ErrorCode[]): ErrorCode[] {
  return [...new Set(values)];
}

export { tokenize } from './lexer';
export { parse, ParseError } from './parser';
export { interpret } from './interpreter';
export { analyzeCleanCode } from './cleanCodeCoach';
export { matchPattern, matchPatterns, describePattern } from './patternMatcher';
export type { Diagnostic } from './tokens';
