import { describe, expect, it } from 'vitest';
import { analyzeChallenge } from '@/validators';
import { MAX_WORLD_EVENTS } from '@/validators/world';
import type { Challenge } from '@/types/content';

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'x',
    lessonId: 'l1',
    kind: 'mission',
    title: '',
    story: '',
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

function run(code: string) {
  return analyzeChallenge(code, makeChallenge({ world: { kind: 'signal-tower', cols: 0 } }));
}

const wrap = (body: string) => `#include <iostream>
using namespace std;

int main() {
${body}
    return 0;
}`;

/**
 * Sân khấu Tháp Tín Hiệu và Xưởng Rèn dựng hình từ chuỗi sự kiện này. Sự kiện
 * sai thứ tự hoặc thiếu dữ liệu thì hình vẽ ra dạy SAI kiến thức — nguy hiểm
 * hơn là không có hình.
 */
describe('Sự kiện cho Tháp Tín Hiệu', () => {
  it('mỗi lệnh cout phát đúng MỘT sự kiện, dù có nhiều dấu <<', () => {
    const result = run(wrap('    cout << "Diem: " << 5 << endl;'));
    const prints = result.worldEvents.filter((event) => event.type === 'print');

    expect(prints).toHaveLength(1);
    expect(prints[0].detail?.text).toBe('Diem: 5\n');
  });

  it('sự kiện giữ đúng thứ tự chạy của chương trình', () => {
    const result = run(
      wrap(`    int diem = 5;
    cout << "A" << endl;
    diem = 3;
    cout << "B" << endl;`),
    );

    expect(result.worldEvents.map((event) => event.type)).toEqual([
      'declare-var',
      'print',
      'assign-var',
      'print',
    ]);
  });

  /**
   * `from` là thứ cho phép sân khấu hiện giá trị cũ bị gạch bỏ. Không có nó
   * thì mất luôn bài học "gán là THAY THẾ, không phải cộng thêm".
   */
  it('gán lại biến thì gửi kèm cả giá trị cũ lẫn giá trị mới', () => {
    const result = run(wrap('    int diem = 5;\n    diem = 3;'));
    const assign = result.worldEvents.find((event) => event.type === 'assign-var');

    expect(assign?.detail).toMatchObject({ name: 'diem', from: '5', value: '3' });
  });

  it('khai báo biến gửi kèm tên, kiểu và giá trị ban đầu', () => {
    const result = run(wrap('    int nangLuong = 100;'));
    const declare = result.worldEvents.find((event) => event.type === 'declare-var');

    expect(declare?.detail).toMatchObject({ name: 'nangLuong', varType: 'int', value: '100' });
  });
});

describe('Sự kiện cho Xưởng Rèn', () => {
  const workshop = (code: string) =>
    analyzeChallenge(code, makeChallenge({ world: { kind: 'workshop', cols: 0 } }));

  /**
   * Đây là bài học trung tâm của khu vực 2: khai báo hàm KHÔNG phải là chạy
   * hàm. Sân khấu dựa vào việc mọi `declare-func` đều đến trước `call-func`
   * đầu tiên để vẽ cỗ máy nằm im trên bàn.
   */
  it('mọi hàm được lắp lên bàn TRƯỚC khi có lệnh gọi nào chạy', () => {
    const result = workshop(`#include <iostream>
using namespace std;

void chay() { cout << "x" << endl; }
void chay2() { cout << "y" << endl; }

int main() {
    chay();
    return 0;
}`);

    const types = result.worldEvents.map((event) => event.type);
    const lastDeclare = types.lastIndexOf('declare-func');
    const firstCall = types.indexOf('call-func');

    expect(lastDeclare).toBeGreaterThanOrEqual(0);
    expect(firstCall).toBeGreaterThan(lastDeclare);
  });

  it('hàm khai báo mà không gọi vẫn được lắp lên bàn', () => {
    const result = workshop(`#include <iostream>
using namespace std;

void chuaGoi() { cout << "x" << endl; }

int main() {
    return 0;
}`);

    expect(result.worldEvents.filter((event) => event.type === 'declare-func')).toHaveLength(1);
    expect(result.worldEvents.filter((event) => event.type === 'call-func')).toHaveLength(0);
  });

  it('gọi hàm có tham số thì gửi kèm nguyên liệu', () => {
    const result = workshop(`#include <iostream>
using namespace std;

void show(int suc) { cout << suc << endl; }

int main() {
    show(7);
    return 0;
}`);

    const call = result.worldEvents.find((event) => event.type === 'call-func');
    expect(call?.detail).toMatchObject({ name: 'show', args: ['7'] });
  });

  it('hàm có trả về thì gửi kèm sản phẩm', () => {
    const result = workshop(`#include <iostream>
using namespace std;

int cong(int a) { return a + 1; }

int main() {
    cout << cong(4) << endl;
    return 0;
}`);

    const returned = result.worldEvents.find((event) => event.type === 'return-func');
    expect(returned?.detail).toMatchObject({ name: 'cong', value: '5' });
  });

  it('hàm void cũng báo đã hoàn tất để học sinh thấy luồng quay về main', () => {
    const result = workshop(`#include <iostream>
using namespace std;

void batDen() { turnOnLight(); }

int main() {
    batDen();
    return 0;
}`);

    expect(result.worldEvents.map((event) => event.type)).toEqual(expect.arrayContaining([
      'declare-func',
      'call-func',
      'turn-on-light',
      'return-func',
    ]));
    expect(result.worldEvents.find((event) => event.type === 'return-func')?.detail)
      .toMatchObject({ name: 'batDen', completed: true });
  });

  it('main() không hiện thành một cỗ máy', () => {
    const result = workshop(`#include <iostream>
using namespace std;

int main() {
    return 0;
}`);

    const names = result.worldEvents.map((event) => event.detail?.name);
    expect(names).not.toContain('main');
  });
});

/**
 * Vòng lặp 100 000 lần mà mỗi lần in một dòng sẽ đẻ ra 100 000 sự kiện. Chuỗi
 * đó vừa nặng khi truyền từ Web Worker về, vừa đủ để treo trình duyệt lúc dựng
 * hình.
 */
describe('Trần số sự kiện', () => {
  const heavy = wrap(`    for (int i = 0; i < 2000; i = i + 1) {
        cout << i << endl;
    }`);

  it('không gửi về quá trần dù chương trình in rất nhiều', () => {
    const result = run(heavy);
    expect(result.worldEvents.length).toBeLessThanOrEqual(MAX_WORLD_EVENTS);
  });

  /** Cắt bớt sự kiện là việc của phần VẼ HÌNH, không được đụng tới chấm bài. */
  it('cắt sự kiện KHÔNG làm đổi kết quả chạy chương trình', () => {
    const result = run(heavy);

    expect(result.ok).toBe(true);
    // Chương trình vẫn in đủ, chỉ có chuỗi sự kiện bị cắt
    expect(result.stdout.length).toBeGreaterThan(MAX_WORLD_EVENTS);
  });
});
