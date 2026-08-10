import { describe, expect, it } from 'vitest';
import { parse } from './parser';
import { tokenize } from './lexer';
import { countProgramStatements, evaluatePar } from './statementCount';

function count(code: string): number {
  return countProgramStatements(parse(tokenize(code).tokens));
}

const wrap = (body: string) => `#include <iostream>
using namespace std;

int main() {
${body}
    return 0;
}`;

describe('Đếm câu lệnh', () => {
  it('mỗi câu lệnh đơn tính một', () => {
    expect(count(wrap('    moveForward();\n    moveForward();'))).toBe(2);
  });

  /**
   * `return 0;` là phần khung bắt buộc của mọi chương trình C++, không phải
   * lựa chọn của học sinh. Tính nó vào thì mọi mức chuẩn đều phải cộng thêm 1
   * một cách vô nghĩa.
   */
  it('không tính return 0 của khung chương trình', () => {
    expect(count(wrap('    moveForward();'))).toBe(1);
  });

  it('dòng trống và dấu chấm phẩy thừa không tính', () => {
    expect(count(wrap('    moveForward();\n\n    ;\n'))).toBe(1);
  });

  /**
   * ĐÂY LÀ QUY ƯỚC QUAN TRỌNG NHẤT: thân vòng lặp đếm MỘT LẦN, không nhân với
   * số vòng chạy. Nếu nhân thì viết vòng lặp còn tốn hơn viết tay, và cả cơ
   * chế "số dòng vàng" mất sạch ý nghĩa — trong khi mục đích của nó chính là
   * làm cho vòng lặp trở nên đáng dùng.
   */
  it('vòng lặp tính một cho chính nó cộng thân đếm một lần', () => {
    const loop = count(wrap('    for (int i = 0; i < 8; i = i + 1) {\n        moveForward();\n    }'));
    const manual = count(wrap('    moveForward();\n'.repeat(8)));

    expect(loop).toBe(2);
    expect(manual).toBe(8);
    expect(loop).toBeLessThan(manual);
  });

  it('if tính một cộng thân, if-else cộng cả hai nhánh', () => {
    expect(count(wrap('    if (isBlocked()) {\n        turnRight();\n    }'))).toBe(2);
    expect(
      count(wrap('    if (isBlocked()) {\n        turnRight();\n    } else {\n        moveForward();\n    }')),
    ).toBe(3);
  });

  /** Tách hàm là một quyết định thiết kế có chi phí thật, nên phải tính. */
  it('hàm phụ tính cả phần khai báo lẫn phần thân', () => {
    const code = `#include <iostream>
using namespace std;

void buocMotO() {
    moveForward();
}

int main() {
    buocMotO();
    return 0;
}`;
    // 1 (khai báo hàm) + 1 (thân hàm) + 1 (lời gọi trong main)
    expect(count(code)).toBe(3);
  });
});

describe('So với số dòng vàng', () => {
  it('nhiệm vụ không đặt mức chuẩn thì không chấm', () => {
    const result = evaluatePar(parse(tokenize(wrap('    moveForward();')).tokens), undefined);
    expect(result.meetsPar).toBeNull();
    expect(result.par).toBeNull();
  });

  it('bằng đúng mức chuẩn vẫn tính là đạt', () => {
    const program = parse(tokenize(wrap('    moveForward();\n    moveForward();')).tokens);
    expect(evaluatePar(program, 2).meetsPar).toBe(true);
  });

  it('ít hơn mức chuẩn thì càng đạt', () => {
    const program = parse(tokenize(wrap('    moveForward();')).tokens);
    expect(evaluatePar(program, 3).meetsPar).toBe(true);
  });

  it('nhiều hơn mức chuẩn thì chưa đạt, nhưng vẫn đếm được bao nhiêu', () => {
    const program = parse(tokenize(wrap('    moveForward();\n'.repeat(8))).tokens);
    const result = evaluatePar(program, 3);

    expect(result.meetsPar).toBe(false);
    expect(result.count).toBe(8);
    expect(result.par).toBe(3);
  });

  /**
   * Kịch bản trung tâm của cả cơ chế: cùng một bản đồ, giải tay thì trượt mức
   * chuẩn, giải bằng vòng lặp thì đạt. Đây là lúc học sinh tự nhận ra vòng lặp
   * có ích, thay vì được dạy rằng vòng lặp có ích.
   */
  it('cùng một bài: viết tay thì trượt, dùng vòng lặp thì đạt', () => {
    const par = 3;
    const manual = parse(tokenize(wrap('    moveForward();\n'.repeat(6))).tokens);
    const withLoop = parse(
      tokenize(wrap('    for (int i = 0; i < 6; i = i + 1) {\n        moveForward();\n    }')).tokens,
    );

    expect(evaluatePar(manual, par).meetsPar).toBe(false);
    expect(evaluatePar(withLoop, par).meetsPar).toBe(true);
  });
});
