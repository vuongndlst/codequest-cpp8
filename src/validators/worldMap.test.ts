import { describe, expect, it } from 'vitest';
import { analyzeChallenge } from '@/validators';
import { turnedLeft, turnedRight, type Facing } from '@/validators/world';
import type { Challenge, WorldSpec } from '@/types/content';

function run(code: string, world: WorldSpec) {
  const challenge: Challenge = {
    id: 'x',
    lessonId: 'l3',
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
    world,
  };
  return analyzeChallenge(code, challenge);
}

const wrap = (body: string) => `#include <iostream>
using namespace std;

int main() {
${body}
    return 0;
}`;

describe('Quay hướng', () => {
  it('quay phải đi vòng theo chiều kim đồng hồ', () => {
    let facing: Facing = 'east';
    const seen: Facing[] = [];
    for (let i = 0; i < 4; i += 1) {
      facing = turnedRight(facing);
      seen.push(facing);
    }
    expect(seen).toEqual(['south', 'west', 'north', 'east']);
  });

  it('quay trái là phép ngược của quay phải', () => {
    for (const facing of ['east', 'south', 'west', 'north'] as Facing[]) {
      expect(turnedLeft(turnedRight(facing))).toBe(facing);
    }
  });
});

/**
 * Điều kiện sống còn của việc mở rộng lên hai chiều: 7 nhiệm vụ đã có dùng bản
 * đồ một hàng và `moveForward()` của chúng tăng cột lên một. Hướng mặc định
 * phải là `east` thì những bài đó mới chạy y hệt như cũ.
 */
describe('Bản đồ một hàng chạy y như cũ', () => {
  const oneRow: WorldSpec = { cols: 5, startCol: 0, goalCol: 4 };

  it('moveForward vẫn là tăng cột, không cần khai báo hướng', () => {
    const result = run(wrap('    moveForward();\n    moveForward();'), oneRow);
    expect(result.finalWorld?.col).toBe(2);
    expect(result.finalWorld?.row).toBe(0);
  });

  it('đi hết đường thì tới đích', () => {
    const result = run(wrap('    for (int i = 0; i < 4; i = i + 1) { moveForward(); }'), oneRow);
    expect(result.worldEvents.some((event) => event.type === 'reach-goal')).toBe(true);
  });

  it('đi quá mép bản đồ thì bị chặn, không rơi ra ngoài', () => {
    const result = run(wrap('    for (int i = 0; i < 9; i = i + 1) { moveForward(); }'), oneRow);
    expect(result.finalWorld?.col).toBe(4);
    expect(result.worldEvents.some((event) => event.type === 'blocked')).toBe(true);
  });
});

describe('Bản đồ hai chiều', () => {
  const grid: WorldSpec = {
    kind: 'map',
    cols: 4,
    rows: 3,
    startCol: 0,
    startRow: 0,
    goalCol: 3,
    goalRow: 2,
    initialState: { energy: 30 },
  };

  it('quay xuống rồi đi thì tăng hàng chứ không tăng cột', () => {
    const result = run(wrap('    turnRight();\n    moveForward();'), grid);
    expect(result.finalWorld?.col).toBe(0);
    expect(result.finalWorld?.row).toBe(1);
  });

  it('đi được tới ô đích ở hàng khác', () => {
    const result = run(
      wrap(`    moveForward();
    moveForward();
    moveForward();
    turnRight();
    moveForward();
    moveForward();`),
      grid,
    );

    expect(result.finalWorld?.col).toBe(3);
    expect(result.finalWorld?.row).toBe(2);
    expect(result.worldEvents.some((event) => event.type === 'reach-goal')).toBe(true);
  });

  /** Đúng cột nhưng sai hàng thì CHƯA tới đích — bản đồ hai chiều cần cả hai. */
  it('đúng cột mà sai hàng thì chưa tính là tới đích', () => {
    const result = run(wrap('    moveForward();\n    moveForward();\n    moveForward();'), grid);

    expect(result.finalWorld?.col).toBe(3);
    expect(result.finalWorld?.row).toBe(0);
    expect(result.worldEvents.some((event) => event.type === 'reach-goal')).toBe(false);
  });

  it('không đi ra khỏi mép trên của bản đồ', () => {
    const result = run(wrap('    turnLeft();\n    moveForward();'), grid);

    expect(result.finalWorld?.row).toBe(0);
    expect(result.worldEvents.some((event) => event.type === 'blocked')).toBe(true);
  });

  /**
   * Đề bài cấm cơ chế trừng phạt, mà học sinh mới học thường phải quay vài lần
   * mới định hướng được. Tính năng lượng cho việc quay là phạt em đang mò mẫm.
   */
  it('quay tại chỗ không tốn năng lượng', () => {
    const result = run(
      wrap('    turnRight();\n    turnRight();\n    turnLeft();\n    turnLeft();'),
      grid,
    );
    expect(result.finalWorld?.energy).toBe(30);
  });

  it('mỗi lần quay phát một sự kiện kèm hướng mới', () => {
    const result = run(wrap('    turnRight();'), grid);
    const turn = result.worldEvents.find((event) => event.type === 'turn');

    expect(turn?.detail).toMatchObject({ facing: 'south' });
  });
});

describe('Địa hình chắn đường', () => {
  const walled: WorldSpec = {
    kind: 'map',
    cols: 4,
    rows: 2,
    startCol: 0,
    startRow: 0,
    goalCol: 3,
    goalRow: 1,
    // Hàng 0 có tường ở cột 2, buộc phải đi vòng xuống hàng dưới
    terrain: ['..#.', '....'],
    initialState: { energy: 20 },
  };

  it('đâm vào tường thì đứng lại, không xuyên qua', () => {
    const result = run(wrap('    moveForward();\n    moveForward();\n    moveForward();'), walled);

    expect(result.finalWorld?.col).toBe(1);
    expect(result.worldEvents.some((event) => event.type === 'blocked')).toBe(true);
  });

  it('đi vòng qua tường thì tới được đích', () => {
    const result = run(
      wrap(`    moveForward();
    turnRight();
    moveForward();
    turnLeft();
    moveForward();
    moveForward();`),
      walled,
    );

    expect(result.finalWorld?.col).toBe(3);
    expect(result.finalWorld?.row).toBe(1);
    expect(result.worldEvents.some((event) => event.type === 'reach-goal')).toBe(true);
  });
});

describe('Sự kiện gửi kèm toạ độ để vẽ hình', () => {
  it('mỗi sự kiện có cả cột lẫn hàng', () => {
    const result = run(
      wrap('    turnRight();\n    moveForward();'),
      { kind: 'map', cols: 3, rows: 3, initialState: { energy: 10 } },
    );

    for (const event of result.worldEvents) {
      expect(typeof event.col).toBe('number');
      expect(typeof event.row).toBe('number');
    }

    const move = result.worldEvents.find((event) => event.type === 'move');
    expect(move).toMatchObject({ col: 0, row: 1 });
  });
});
