import { describe, expect, it } from 'vitest';
import type { Challenge } from '@/types/content';
import { analyzeChallenge } from './index';
import { tokenize } from './lexer';
import { parse } from './parser';
import { interpret } from './interpreter';
import { matchPattern } from './patternMatcher';
import { analyzeCleanCode } from './cleanCodeCoach';
import { editDistance, findNearestName } from './semantics';

/** Challenge tối thiểu để chạy engine — chỉ yêu cầu chương trình chạy được. */
function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'test-challenge',
    lessonId: 'l1',
    kind: 'mission',
    title: 'Nhiệm vụ kiểm thử',
    story: 'Một tình huống thử nghiệm.',
    instructions: [],
    starterCode: '',
    requiredPatterns: [],
    testCases: [],
    commonMistakes: [],
    hints: [],
    cleanCodeRules: [],
    xpReward: 10,
    ...overrides,
  };
}

function run(code: string, overrides: Partial<Challenge> = {}) {
  return analyzeChallenge(code, makeChallenge(overrides));
}

function runProgram(code: string, stdin = '', world?: Challenge['world']) {
  const { tokens } = tokenize(code);
  return interpret(parse(tokens), { stdin, world });
}

function wrapBody(body: string) {
  return `#include <iostream>
using namespace std;
int main() {
${body}
    return 0;
}`;
}

const HELLO = `#include <iostream>
using namespace std;

int main() {
    cout << "Xin chao ByteLand" << endl;
    return 0;
}`;

// ============================================================================
// Chẩn đoán 13 lỗi thường gặp trong đề bài
// ============================================================================

describe('Chẩn đoán lỗi thường gặp', () => {
  it('thiếu dấu ; — chỉ đúng dòng và nói bằng tiếng Việt', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    cout << "Xin chao" << endl
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('MISSING_SEMICOLON');
    expect(result.diagnostics[0].message).toContain('thiếu dấu `;`');
    expect(result.diagnostics[0].message).toContain('dòng 5');
  });

  it('thiếu dấu } — nói rõ mở mấy cái, đóng mấy cái', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    cout << "Xin chao";
`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('UNBALANCED_BRACE');
    expect(result.diagnostics[0].message).toMatch(/mở 1 dấu .* đóng 0/);
  });

  it('thiếu dấu ) trong điều kiện', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    int score = 10;
    if (score > 5 {
        cout << "Cao";
    }
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('UNBALANCED_PAREN');
  });

  it('viết sai tên biến — đoán ra biến học sinh định dùng', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    int score = 10;
    cout << scores;
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('VAR_TYPO');
    expect(result.diagnostics[0].message).toContain('`score`');
    expect(result.diagnostics[0].message).toContain('`scores`');
  });

  it('dùng biến chưa khai báo', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    cout << diem;
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('VAR_UNDECLARED');
    expect(result.diagnostics[0].message).toContain('chưa được khai báo');
  });

  it('khai báo hàm nhưng không gọi — chỉ nhắc nhẹ, không chặn chạy', () => {
    const result = run(`#include <iostream>
using namespace std;

void openDoor() {
    cout << "Cua da mo";
}

int main() {
    cout << "Xong";
    return 0;
}`);

    expect(result.ok).toBe(true);
    const warning = result.diagnostics.find((d) => d.code === 'FUNC_NOT_CALLED');
    expect(warning?.severity).toBe('warn');
    expect(warning?.message).toContain('chưa gọi nó');
  });

  it('gọi sai tên hàm — chỉ ra tên đúng', () => {
    const result = run(`#include <iostream>
using namespace std;

void openDoor() {
    cout << "Cua da mo";
}

int main() {
    opendoor();
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('FUNC_NAME_MISMATCH');
    expect(result.diagnostics[0].message).toContain('giống hoàn toàn');
  });

  it('nhầm = với == trong if — C++ hợp lệ nhưng vẫn phải chặn lại', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    int score = 10;
    if (score = 5) {
        cout << "Bang 5";
    }
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('ASSIGN_IN_CONDITION');
    expect(result.diagnostics[0].message).toContain('`==` thay vì `=`');
  });

  it('cout viết một dấu < thay vì <<', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    cout < "Xin chao";
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('COUT_SYNTAX');
    expect(result.diagnostics[0].message).toContain('HAI dấu nhỏ hơn');
  });

  it('thiếu dấu nháy kép', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    cout << "Xin chao;
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].message).toContain('nháy kép');
  });

  it('thiếu #include <iostream>', () => {
    const result = run(`using namespace std;

int main() {
    cout << "Xin chao";
    return 0;
}`);

    expect(result.errorCodes).toContain('MISSING_INCLUDE');
  });

  it('thiếu hàm main', () => {
    const result = run(`#include <iostream>
using namespace std;

void greet() {
    cout << "Xin chao";
}`);

    expect(result.errorCodes).toContain('MISSING_MAIN');
    expect(result.diagnostics[0].message).toContain('int main()');
  });

  it('vòng for thiếu phần tăng biến đếm — dừng lại thay vì treo trình duyệt', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    for (int i = 0; i < 5;) {
        cout << i;
    }
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes.some((code) => code === 'FOR_MISSING_UPDATE' || code === 'TIMEOUT')).toBe(
      true,
    );
    expect(result.diagnostics[0].message).toContain('biến đếm');
  });
});

// ============================================================================
// Nội dung ngoài phạm vi khoá học
// ============================================================================

describe('Nội dung ngoài phạm vi', () => {
  it('gặp while thì hướng học sinh về for, không báo lỗi cú pháp khó hiểu', () => {
    const result = run(`#include <iostream>
using namespace std;

int main() {
    int i = 0;
    while (i < 5) {
        i++;
    }
    return 0;
}`);

    expect(result.ok).toBe(false);
    expect(result.errorCodes).toContain('UNSUPPORTED_FEATURE');
    expect(result.diagnostics[0].message).toContain('`for`');
  });

  it('gặp class thì giải thích là nội dung lớp trên', () => {
    const result = run(`#include <iostream>
using namespace std;

class Player {
};

int main() {
    return 0;
}`);

    expect(result.errorCodes).toContain('UNSUPPORTED_FEATURE');
  });
});

// ============================================================================
// Trình thông dịch — phải cho kết quả giống C++ thật
// ============================================================================

describe('Trình thông dịch', () => {
  it('in ra chuỗi và xuống dòng bằng endl', () => {
    const result = runProgram(HELLO);
    expect(result.stdout).toEqual(['Xin chao ByteLand']);
    expect(result.completed).toBe(true);
  });

  it('phép chia số nguyên CẮT phần thập phân, đúng như C++', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
int main() {
    int a = 7 / 2;
    cout << a << endl;
    cout << 7 / 2 << endl;
    cout << 7.0 / 2 << endl;
    return 0;
}`);

    expect(result.stdout).toEqual(['3', '3', '3.5']);
  });

  it('cout << true in ra 1 chứ không phải chữ "true"', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
int main() {
    cout << true << false << endl;
    return 0;
}`);

    expect(result.stdout).toEqual(['10']);
  });

  it('vòng for chạy đúng số lần', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
int main() {
    for (int i = 0; i < 5; i++) {
        cout << i;
    }
    cout << endl;
    return 0;
}`);

    expect(result.stdout).toEqual(['01234']);
    expect(result.loopIterations).toBe(5);
  });

  it('attackBug chỉ phá giáp khi Byte đứng cạnh Boss trên map', () => {
    const world = {
      kind: 'map' as const,
      cols: 5,
      rows: 3,
      startCol: 1,
      startRow: 1,
      goalCol: 4,
      goalRow: 1,
      terrain: ['FFFFF', 'F...F', 'FFFFF'],
      props: [{ id: 'boss', type: 'boss', col: 3, row: 1 }],
      initialState: { bugHp: 2 },
    };
    const far = interpret(parse(tokenize(wrapBody('    attackBug();')).tokens), { world });
    const near = interpret(parse(tokenize(wrapBody('    moveRight();\n    attackBug();')).tokens), { world });

    expect(far.finalWorld.bugHp).toBe(2);
    expect(far.finalWorld.bugHits).toBe(0);
    expect(far.worldEvents.some((event) => event.type === 'blocked')).toBe(true);
    expect(near.finalWorld.bugHp).toBe(1);
    expect(near.finalWorld.bugHits).toBe(1);
  });

  it('if–else chọn đúng nhánh', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
int main() {
    int energy = 3;
    if (energy > 5) {
        cout << "Du suc";
    } else {
        cout << "Can nghi";
    }
    return 0;
}`);

    expect(result.stdout).toEqual(['Can nghi']);
  });

  it('hàm có tham số nhận đúng giá trị', () => {
    const result = runProgram(`#include <iostream>
using namespace std;

void printScore(int score) {
    cout << "Diem: " << score << endl;
}

int main() {
    printScore(42);
    return 0;
}`);

    expect(result.stdout).toEqual(['Diem: 42']);
  });

  it('hàm trả về giá trị dùng được trong biểu thức', () => {
    const result = runProgram(`#include <iostream>
using namespace std;

int addPoints(int a, int b) {
    return a + b;
}

int main() {
    cout << addPoints(3, 4) << endl;
    return 0;
}`);

    expect(result.stdout).toEqual(['7']);
  });

  it('&& và || ngắn mạch đúng cách', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
int main() {
    int energy = 10;
    bool ready = true;
    if (energy > 5 && ready) {
        cout << "Di thoi";
    }
    if (energy < 0 || ready) {
        cout << "|San sang";
    }
    return 0;
}`);

    expect(result.stdout).toEqual(['Di thoi|San sang']);
  });

  it('chia cho 0 báo lỗi dễ hiểu thay vì cho ra Infinity', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
int main() {
    int a = 10;
    int b = 0;
    cout << a / b;
    return 0;
}`);

    expect(result.diagnostics[0].message).toContain('không chia được cho 0');
  });

  it('vòng lặp vô hạn bị chặn bởi ngân sách bước, không treo trình duyệt', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
int main() {
    for (int i = 0; i < 5; i--) {
        cout << "x";
    }
    return 0;
}`);

    expect(result.completed).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].code === 'TIMEOUT' || result.diagnostics[0].code === 'FOR_MISSING_UPDATE').toBe(
      true,
    );
  });

  it('hàm hành động của game sinh ra chuỗi sự kiện', () => {
    const { tokens } = tokenize(`#include <iostream>
using namespace std;
int main() {
    for (int i = 0; i < 3; i++) {
        moveForward();
    }
    return 0;
}`);

    const result = interpret(parse(tokens), { world: { cols: 5, startCol: 0, goalCol: 4 } });

    expect(result.worldEvents.filter((event) => event.type === 'move')).toHaveLength(3);
    expect(result.finalWorld.col).toBe(3);
  });

  it('bốn lệnh tuyệt đối di chuyển đúng hướng trên bản đồ 2D', () => {
    const { tokens } = tokenize(`int main() {
    moveRight();
    moveDown();
    moveLeft();
    moveUp();
    return 0;
}`);
    const result = interpret(parse(tokens), {
      world: { kind: 'map', cols: 3, rows: 3, startCol: 0, startRow: 0, goalCol: 2, goalRow: 2 },
    });

    expect(result.completed).toBe(true);
    expect(result.finalWorld.col).toBe(0);
    expect(result.finalWorld.row).toBe(0);
    expect(result.worldEvents.filter((event) => event.type === 'move')).toHaveLength(4);
  });

  it('mỗi viên ngọc có id chỉ được nhặt một lần và gemsCollected đọc đúng trạng thái', () => {
    const { tokens } = tokenize(`int main() {
    moveRight();
    collectGem();
    collectGem();
    cout << gemsCollected();
    return 0;
}`);
    const result = interpret(parse(tokens), {
      world: {
        kind: 'map', cols: 3, rows: 1, startCol: 0, startRow: 0, goalCol: 2, goalRow: 0,
        props: [{ id: 'gem-test', type: 'gem', col: 1, row: 0 }],
      },
    });

    expect(result.completed).toBe(true);
    expect(result.stdout).toEqual(['1']);
    expect(result.finalWorld.collectedGems).toBe(1);
    expect(result.worldEvents.filter((event) => event.type === 'collect-gem')).toHaveLength(1);
  });
});

// ============================================================================
// Bộ khớp mẫu trên AST
// ============================================================================

describe('Bộ khớp mẫu (AST, không phải regex)', () => {
  const program = parse(
    tokenize(`#include <iostream>
using namespace std;

void openDoor() {
    cout << "mo cua";
}

int main() {
    int steps = 0;
    for (int i = 0; i < 5; i++) {
        moveForward();
    }
    if (steps == 5) {
        openDoor();
    }
    return 0;
}`).tokens,
  );

  it('nhận ra vòng for, if, khai báo hàm và lời gọi hàm', () => {
    expect(matchPattern(program, 'stmt:for', '')).toBe(true);
    expect(matchPattern(program, 'stmt:if', '')).toBe(true);
    expect(matchPattern(program, 'stmt:if-else', '')).toBe(false);
    expect(matchPattern(program, 'decl:func:openDoor', '')).toBe(true);
    expect(matchPattern(program, 'call:openDoor', '')).toBe(true);
    expect(matchPattern(program, 'op:==', '')).toBe(true);
  });

  it('kiểm tra được quan hệ lồng nhau: lời gọi nằm TRONG vòng for', () => {
    expect(matchPattern(program, 'stmt:for>call:moveForward', '')).toBe(true);
    expect(matchPattern(program, 'stmt:for>call:openDoor', '')).toBe(false);
  });

  it('KHÔNG bị đánh lừa bởi chữ "for" nằm trong chuỗi — điểm regex hay sai', () => {
    const tricky = parse(
      tokenize(`#include <iostream>
using namespace std;
int main() {
    cout << "Thong tin for ban";
    return 0;
}`).tokens,
    );

    expect(matchPattern(tricky, 'stmt:for', '')).toBe(false);
  });

  it('đếm được số lần gọi hàm', () => {
    const repeated = parse(
      tokenize(`#include <iostream>
using namespace std;
int main() {
    moveForward();
    moveForward();
    moveForward();
    return 0;
}`).tokens,
    );

    expect(matchPattern(repeated, 'call:moveForward:count=3', '')).toBe(true);
    expect(matchPattern(repeated, 'call:moveForward:count=5', '')).toBe(false);
    expect(matchPattern(repeated, 'call:moveForward:count>=2', '')).toBe(true);
  });

  it('so khớp nội dung in ra', () => {
    expect(matchPattern(program, 'output:contains:Xin chao', 'Xin chao ByteLand')).toBe(true);
    expect(matchPattern(program, 'output:contains:Tam biet', 'Xin chao ByteLand')).toBe(false);
  });
});

// ============================================================================
// Clean Code Coach
// ============================================================================

describe('Clean Code Coach', () => {
  function report(code: string) {
    const { tokens } = tokenize(code);
    return analyzeCleanCode({ source: code, program: parse(tokens), tokens });
  }

  it('code sạch đạt điểm cao', () => {
    const result = report(`#include <iostream>
using namespace std;

int main() {
    int playerScore = 0;
    for (int i = 0; i < 3; i++) {
        playerScore = playerScore + 10;
    }
    cout << playerScore << endl;
    return 0;
}`);

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.isClean).toBe(true);
  });

  it('phát hiện tên biến khó hiểu và gợi ý đổi tên', () => {
    const result = report(`#include <iostream>
using namespace std;

int main() {
    int x = 10;
    cout << x << endl;
    return 0;
}`);

    const check = result.checks.find((item) => item.rule === 'meaningful-var');
    expect(check?.passed).toBe(false);
    expect(check?.message).toContain('playerScore');
  });

  it('chấp nhận i, j, k làm biến đếm vòng lặp', () => {
    const result = report(`#include <iostream>
using namespace std;

int main() {
    for (int i = 0; i < 3; i++) {
        cout << i;
    }
    return 0;
}`);

    expect(result.checks.find((item) => item.rule === 'meaningful-var')?.passed).toBe(true);
  });

  it('phát hiện nhiều câu lệnh dồn trên một dòng', () => {
    const result = report(`#include <iostream>
using namespace std;

int main() {
    int playerScore = 0; playerScore = playerScore + 1; cout << playerScore;
    return 0;
}`);

    expect(result.checks.find((item) => item.rule === 'one-statement-per-line')?.passed).toBe(false);
  });

  it('phát hiện biến khai báo mà không dùng', () => {
    const result = report(`#include <iostream>
using namespace std;

int main() {
    int unusedCounter = 5;
    cout << "Xin chao" << endl;
    return 0;
}`);

    const check = result.checks.find((item) => item.rule === 'unused-var');
    expect(check?.passed).toBe(false);
    expect(check?.message).toContain('unusedCounter');
  });

  it('phát hiện thụt lề chưa đúng', () => {
    const result = report(`#include <iostream>
using namespace std;

int main() {
cout << "Xin chao" << endl;
return 0;
}`);

    expect(result.checks.find((item) => item.rule === 'indent')?.passed).toBe(false);
  });

  it('gợi ý dùng vòng lặp khi thấy code lặp lại', () => {
    const { tokens } = tokenize(`#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    moveForward();
    moveForward();
    return 0;
}`);
    const source = `x`;
    const result = analyzeCleanCode({
      source,
      program: parse(tokens),
      tokens,
      rules: [{ rule: 'no-duplication', weight: 100 }],
    });

    expect(result.checks[0].passed).toBe(false);
    expect(result.checks[0].message).toContain('vòng lặp');
  });
});

// ============================================================================
// Kiểm tra yêu cầu của nhiệm vụ (test case + mẫu bắt buộc)
// ============================================================================

describe('Kiểm tra yêu cầu nhiệm vụ', () => {
  it('code đúng thì vượt hết test case', () => {
    const result = run(HELLO, {
      testCases: [
        {
          id: 't1',
          name: 'In đúng lời chào',
          kind: 'output',
          expectedOutput: 'Xin chao ByteLand',
          required: true,
          visible: true,
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.isCorrect).toBe(true);
    expect(result.passedRequired).toBe(1);
    expect(result.totalRequired).toBe(1);
  });

  it('output sai thì nói rõ cần gì và đang in ra gì', () => {
    const result = run(HELLO, {
      testCases: [
        {
          id: 't1',
          name: 'In đúng lời chào',
          kind: 'output',
          expectedOutput: 'Tam biet',
          required: true,
          visible: true,
        },
      ],
    });

    expect(result.isCorrect).toBe(false);
    expect(result.diagnostics[0].code).toBe('OUTPUT_MISMATCH');
    expect(result.diagnostics[0].message).toContain('Tam biet');
    expect(result.diagnostics[0].message).toContain('Xin chao ByteLand');
  });

  it('thiếu cấu trúc bắt buộc thì nhắc bằng tiếng Việt', () => {
    const result = run(`#include <iostream>
using namespace std;
int main() {
    moveForward();
    moveForward();
    return 0;
}`, {
      requiredPatterns: ['stmt:for'],
      testCases: [
        { id: 't1', name: 'Chạy được', kind: 'world', expectedWorld: { col: 2 }, required: true, visible: false },
      ],
    });

    expect(result.isCorrect).toBe(false);
    const diagnostic = result.diagnostics.find((d) => d.code === 'PATTERN_MISSING');
    expect(diagnostic?.message).toContain('vòng lặp `for`');
  });

  it('mẫu bị cấm dùng giọng khuyến khích, không chê bai', () => {
    const result = run(`#include <iostream>
using namespace std;
int main() {
    moveForward();
    moveForward();
    moveForward();
    return 0;
}`, {
      forbiddenPatterns: ['call:moveForward:count>=3'],
      commonMistakes: [
        {
          errorCode: 'PATTERN_FORBIDDEN',
          detect: 'call:moveForward:count>=3',
          message: 'Cách này chạy đúng, nhưng nhiệm vụ này muốn em dùng vòng lặp `for` để code gọn hơn nhé.',
        },
      ],
      testCases: [
        { id: 't1', name: 'Đi đủ 3 ô', kind: 'world', expectedWorld: { col: 3 }, required: true, visible: false },
      ],
    });

    expect(result.isCorrect).toBe(false);
    const diagnostic = result.diagnostics.find((d) => d.code === 'PATTERN_FORBIDDEN');
    expect(diagnostic?.message).toContain('vòng lặp `for`');
    expect(diagnostic?.message).not.toContain('Sai');
  });

  it('challenge có thể ghi đè thông báo lỗi chung bằng lời giải thích riêng', () => {
    const result = run(`#include <iostream>
using namespace std;
int main() {
    cout << "Xin chao"
    return 0;
}`, {
      commonMistakes: [
        {
          errorCode: 'MISSING_SEMICOLON',
          message: 'Ở Làng Khởi Động, mỗi câu lệnh đều cần dấu `;` để cổng làng hiểu được nhé!',
        },
      ],
    });

    expect(result.diagnostics[0].message).toContain('cổng làng');
  });

  it('test ẩn không lộ đáp án cho học sinh', () => {
    const result = run(HELLO, {
      testCases: [
        {
          id: 't1',
          name: 'Kiểm tra ẩn',
          kind: 'output',
          expectedOutput: 'Xin chao ByteLand',
          required: true,
          visible: false,
        },
      ],
    });

    expect(result.testResults[0].expected).toBeUndefined();
    expect(result.testResults[0].actual).toBeUndefined();
  });

  it('ghi lại mã lỗi để dashboard giáo viên thống kê', () => {
    const result = run(`#include <iostream>
using namespace std;
int main() {
    cout << "Xin chao"
    return 0;
}`);

    expect(result.errorCodes).toEqual(['MISSING_SEMICOLON']);
  });
});

// ============================================================================
// Đoán tên gõ nhầm
// ============================================================================

describe('Đoán tên gõ nhầm', () => {
  it('tính đúng khoảng cách Levenshtein', () => {
    expect(editDistance('score', 'score')).toBe(0);
    expect(editDistance('score', 'scores')).toBe(1);
    // Chỉ khác nhau ở chữ D hoa/thường -> khoảng cách 1
    expect(editDistance('openDoor', 'opendoor')).toBe(1);
    expect(editDistance('openDoor', 'openDor')).toBe(1);
  });

  it('tìm được tên gần nhất trong tầm nghi ngờ', () => {
    expect(findNearestName('scores', ['score', 'energy'])).toBe('score');
    expect(findNearestName('completelyDifferent', ['score', 'energy'])).toBeNull();
  });

  it('với tên ngắn thì khắt khe hơn để tránh đoán bừa', () => {
    // 'sum' và 'num' cách nhau 1 -> vẫn nghi là gõ nhầm
    expect(findNearestName('sum', ['num'])).toBe('num');
    // cách nhau 2 với tên 3 ký tự -> quá xa, không đoán
    expect(findNearestName('sum', ['bar'])).toBeNull();
  });
});

// ============================================================================
// C++ nâng cao — tham trị, tham chiếu và mảng một chiều
// ============================================================================

describe('Ngữ nghĩa C++ nâng cao', () => {
  it('tham trị tạo bản sao, không thay đổi biến ở hàm gọi', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
void charge(int energy) { energy += 5; }
int main() {
  int energy = 3;
  charge(energy);
  cout << energy;
  return 0;
}`);

    expect(result.completed).toBe(true);
    expect(result.rawOutput).toBe('3');
  });

  it('tham chiếu liên kết đúng ô nhớ và thay đổi biến ở hàm gọi', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
void charge(int &energy) { energy += 5; }
int main() {
  int energy = 3;
  charge(energy);
  cout << energy;
  return 0;
}`);

    expect(result.completed).toBe(true);
    expect(result.rawOutput).toBe('8');
  });

  it('khởi tạo, đọc, gán và duyệt mảng một chiều', () => {
    const result = runProgram(`#include <iostream>
using namespace std;
int main() {
  int gems[5] = {2, 4, 1, 3, 5};
  gems[2] = 6;
  int total = 0;
  for (int i = 0; i < 5; i++) total += gems[i];
  cout << total;
  return 0;
}`);

    expect(result.completed).toBe(true);
    expect(result.rawOutput).toBe('20');
  });

  it('truyền mảng vào hàm và kiểm tra biên chỉ số bằng thông báo sư phạm', () => {
    const passed = runProgram(`#include <iostream>
using namespace std;
int sum(int values[], int size) {
  int total = 0;
  for (int i = 0; i < size; i++) total += values[i];
  return total;
}
int main() {
  int values[3] = {4, 5, 6};
  cout << sum(values, 3);
  return 0;
}`);
    expect(passed.rawOutput).toBe('15');

    const failed = runProgram(wrapBody('int values[2] = {1, 2};\ncout << values[2];'));
    expect(failed.completed).toBe(false);
    expect(failed.diagnostics[0]?.message).toContain('ngoài mảng');
  });
});

describe('Cơ chế né quái từ Area 4', () => {
  it('chặn bước vào ô quái, phát cảnh báo và ghi một lần bị phát hiện', () => {
    const result = runProgram(wrapBody('moveRight();'), '', {
      kind: 'map', cols: 3, rows: 1, startCol: 0, startRow: 0, goalCol: 2, goalRow: 0,
      terrain: ['==='],
      props: [{ id: 'guard-1', type: 'enemy', col: 1, row: 0, state: 'blocking' }],
    });

    expect(result.finalWorld.col).toBe(0);
    expect(result.finalWorld.dangerHits).toBe(1);
    expect(result.worldEvents.at(-1)?.type).toBe('enemy-alert');
    expect(result.worldEvents.at(-1)?.message).toContain('phát hiện');
  });
});
