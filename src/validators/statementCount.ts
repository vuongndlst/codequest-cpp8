import type { Program, Statement } from './ast';
import { walk } from './ast';

/**
 * Đếm số câu lệnh học sinh thực sự viết trong `main()`.
 *
 * Đây là con số so với "số dòng vàng" — cơ chế sư phạm trung tâm của khoá học
 * theo hướng CodeCombat: giải được thì qua bài, nhưng giải GỌN mới được sao
 * thứ hai. Nó biến câu hỏi từ "làm sao cho chạy" thành "làm sao cho gọn hơn",
 * và đó chính là lúc học sinh bắt đầu nghĩ về thuật toán.
 *
 * QUY ƯỚC ĐẾM — chọn sao cho vòng lặp thật sự có lợi:
 *
 *   · Mỗi câu lệnh đơn tính 1
 *   · `for` tính 1 cho chính nó, CỘNG thân vòng lặp đếm MỘT LẦN
 *     (không nhân với số vòng chạy — nếu nhân thì vòng lặp chẳng lợi gì)
 *   · `if` tính tương tự
 *   · `return 0;` KHÔNG tính — nó là phần khung bắt buộc, không phải lựa chọn
 *     của học sinh
 *   · Khai báo hàm ngoài `main` tính cả phần thân, vì tách hàm là một quyết
 *     định thiết kế có chi phí thật
 */

export interface StatementCountResult {
  /** Số câu lệnh đếm được */
  count: number;
  /** Đạt hay chưa đạt số dòng vàng. `null` khi nhiệm vụ không đặt mức chuẩn. */
  meetsPar: boolean | null;
  par: number | null;
}

function countStatements(statements: Statement[]): number {
  let total = 0;

  for (const statement of statements) {
    switch (statement.kind) {
      case 'EmptyStatement':
        break;

      // Khung bắt buộc của mọi chương trình C++, không phải lựa chọn của em
      case 'ReturnStatement':
        break;

      case 'BlockStatement':
        total += countStatements(statement.body);
        break;

      case 'ForStatement':
        total += 1;
        total += countStatements(
          statement.body.kind === 'BlockStatement' ? statement.body.body : [statement.body],
        );
        break;

      case 'IfStatement': {
        total += 1;
        const consequent =
          statement.consequent.kind === 'BlockStatement'
            ? statement.consequent.body
            : [statement.consequent];
        total += countStatements(consequent);

        if (statement.alternate) {
          const alternate =
            statement.alternate.kind === 'BlockStatement'
              ? statement.alternate.body
              : [statement.alternate];
          total += countStatements(alternate);
        }
        break;
      }

      default:
        total += 1;
        break;
    }
  }

  return total;
}

export function countProgramStatements(program: Program): number {
  let total = 0;

  for (const node of program.body) {
    if (node.kind !== 'FunctionDeclaration') continue;
    total += countStatements(node.body.body);
    // Bản thân việc khai báo một hàm phụ cũng là một dòng học sinh phải viết
    if (node.name !== 'main') total += 1;
  }

  return total;
}

export function evaluatePar(program: Program, par: number | undefined): StatementCountResult {
  const count = countProgramStatements(program);
  if (par === undefined) return { count, meetsPar: null, par: null };
  return { count, meetsPar: count <= par, par };
}

/** Chỉ dùng cho test và công cụ nội bộ. */
export function countCallsTo(program: Program, callee: string): number {
  let total = 0;
  walk(program, (node) => {
    if (node.kind === 'CallExpression' && node.callee === callee) total += 1;
  });
  return total;
}
