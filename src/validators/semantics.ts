import type { Diagnostic } from './tokens';
import type { AnyNode, Program, FunctionDeclaration } from './ast';
import { walk } from './ast';

/**
 * Bước ⑤ của pipeline: kiểm tra ngữ nghĩa.
 *
 * Bắt đúng những lỗi trong danh sách của đề bài mà cú pháp không phát hiện được:
 *   · viết sai tên biến      -> "khai báo `score` nhưng dòng 6 viết `scores`"
 *   · dùng biến chưa khai báo
 *   · khai báo hàm mà không gọi
 *   · gọi hàm sai tên
 */

export interface SemanticContext {
  /** Hàm dựng sẵn của game cho challenge này, vd. moveForward, openDoor */
  builtinFunctions: string[];
}

export interface SemanticResult {
  diagnostics: Diagnostic[];
  declaredFunctions: string[];
  calledFunctions: string[];
  declaredVariables: string[];
}

/** Khoảng cách Levenshtein — dùng để đoán tên gõ nhầm. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }

  return previous[b.length];
}

/** Tên gần giống nhất trong danh sách, nếu đủ gần để nghi là gõ nhầm. */
export function findNearestName(name: string, candidates: string[]): string | null {
  let best: { name: string; distance: number } | null = null;
  const threshold = name.length <= 4 ? 1 : 2;

  for (const candidate of candidates) {
    if (candidate === name) continue;
    const distance = editDistance(name.toLowerCase(), candidate.toLowerCase());
    if (distance <= threshold && (!best || distance < best.distance)) {
      best = { name: candidate, distance };
    }
  }

  return best?.name ?? null;
}

export function analyzeSemantics(program: Program, context: SemanticContext): SemanticResult {
  const diagnostics: Diagnostic[] = [];

  const functions = program.body.filter(
    (node): node is FunctionDeclaration => node.kind === 'FunctionDeclaration',
  );
  const declaredFunctions = functions.map((fn) => fn.name);
  const knownFunctions = [...declaredFunctions, ...context.builtinFunctions];

  const calledFunctions: string[] = [];
  const declaredVariables: string[] = [];

  for (const fn of functions) {
    // Phạm vi biến: tham số + biến khai báo trong thân hàm.
    // Cố ý KHÔNG mô phỏng phạm vi khối lồng nhau — với học sinh lớp 8, báo
    // "biến này chưa khai báo" khi nó nằm ngoài khối sẽ gây hoang mang hơn là giúp.
    const scope = new Set<string>(fn.params.map((param) => param.name));
    const localDeclarations: string[] = [];

    // Lượt 1: thu thập mọi biến được khai báo trong hàm
    walk(fn.body, (node) => {
      if (node.kind === 'VariableDeclaration') {
        for (const declarator of node.declarations) {
          scope.add(declarator.name);
          localDeclarations.push(declarator.name);
        }
      }
    });

    declaredVariables.push(...localDeclarations);
    const allKnownNames = [...scope];

    // Lượt 2: kiểm tra từng chỗ sử dụng
    walk(fn.body, (node: AnyNode) => {
      if (node.kind === 'CallExpression') {
        calledFunctions.push(node.callee);

        if (!knownFunctions.includes(node.callee)) {
          const nearest = findNearestName(node.callee, knownFunctions);
          diagnostics.push(
            nearest
              ? {
                  code: 'FUNC_NAME_MISMATCH',
                  message:
                    `Ở dòng ${node.line} em gọi hàm \`${node.callee}\`, nhưng hàm em có tên là \`${nearest}\`. ` +
                    'Hãy kiểm tra xem tên hàm khi gọi có giống hoàn toàn với tên hàm khi khai báo không nhé.',
                  line: node.line,
                  column: node.column,
                  severity: 'error',
                  suggestHintLevel: 1,
                }
              : {
                  code: 'FUNC_UNDEFINED',
                  message:
                    `Ở dòng ${node.line} em gọi hàm \`${node.callee}\` nhưng chưa thấy hàm này được khai báo ở đâu cả. ` +
                    'Em kiểm tra lại tên hàm, hoặc viết thêm hàm đó nhé.',
                  line: node.line,
                  column: node.column,
                  severity: 'error',
                  suggestHintLevel: 2,
                },
          );
        }
        return;
      }

      if (node.kind === 'Identifier' && !scope.has(node.name)) {
        const nearest = findNearestName(node.name, allKnownNames);
        diagnostics.push(
          nearest
            ? {
                code: 'VAR_TYPO',
                message:
                  `Em đã khai báo biến \`${nearest}\` nhưng ở dòng ${node.line} lại viết thành \`${node.name}\`. ` +
                  'Tên biến phải giống nhau hoàn toàn, kể cả chữ hoa chữ thường.',
                line: node.line,
                column: node.column,
                severity: 'error',
                suggestHintLevel: 1,
              }
            : {
                code: 'VAR_UNDECLARED',
                message:
                  `Biến \`${node.name}\` ở dòng ${node.line} chưa được khai báo. ` +
                  `Em cần khai báo trước khi dùng, ví dụ \`int ${node.name} = 0;\``,
                line: node.line,
                column: node.column,
                severity: 'error',
                suggestHintLevel: 1,
              },
        );
      }
    });
  }

  // Hàm viết ra mà không gọi -> nhắc nhẹ, không chặn chạy chương trình
  for (const fn of functions) {
    if (fn.name === 'main') continue;
    if (calledFunctions.includes(fn.name)) continue;

    diagnostics.push({
      code: 'FUNC_NOT_CALLED',
      message:
        `Em đã viết hàm \`${fn.name}()\` rất tốt, nhưng chưa gọi nó ở đâu cả. ` +
        `Hàm chỉ chạy khi được gọi — em thử thêm \`${fn.name}();\` vào trong \`main()\` xem sao.`,
      line: fn.line,
      column: fn.column,
      severity: 'warn',
      suggestHintLevel: 2,
    });
  }

  return {
    diagnostics,
    declaredFunctions,
    calledFunctions,
    declaredVariables,
  };
}
