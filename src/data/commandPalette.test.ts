import { describe, expect, it } from 'vitest';
import { paletteForChallenge } from './commandPalette';
import { LESSONS } from '@/lessons';
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

const labels = (challenge: Challenge) =>
  paletteForChallenge(challenge).map((command) => command.label);

describe('Bảng lệnh bấm để chèn', () => {
  /**
   * Đây là lời hứa của cả tính năng: bấm nút thì không thể thiếu dấu `;`.
   * Mảnh biểu thức (`isBlocked()`) được loại trừ có chủ ý — thêm `;` vào đó
   * mới là sai cú pháp.
   */
  it('mọi câu lệnh chèn vào đều có sẵn dấu chấm phẩy', () => {
    for (const lessonId of ['l1', 'l2', 'l3', 'l4', 'l5']) {
      for (const command of paletteForChallenge(makeChallenge({ lessonId }))) {
        if (command.insertKind === 'expression') continue;

        // Khối `for`/`if` kết thúc bằng `}`, còn lại đều phải có `;`
        const ok = command.snippet.includes(';') || command.snippet.trim().endsWith('}');
        expect(ok, `${command.label} thiếu dấu chấm phẩy`).toBe(true);
      }
    }
  });

  it('mảnh biểu thức KHÔNG được kèm dấu chấm phẩy', () => {
    for (const lessonId of ['l4', 'l5']) {
      for (const command of paletteForChallenge(makeChallenge({ lessonId }))) {
        if (command.insertKind !== 'expression') continue;
        expect(command.snippet).not.toContain(';');
      }
    }
  });

  /**
   * Đây là lý do bảng lệnh tồn tại: học sinh lớp 8 sai dấu `;` và sai chính tả
   * tên lệnh nhiều hơn là sai tư duy. Bấm nút thì không thể sai hai thứ đó.
   */
  it('khu vực 1 có sẵn ba lệnh di chuyển', () => {
    const found = labels(makeChallenge({ lessonId: 'l1' }));
    expect(found).toContain('moveForward();');
    expect(found).toContain('turnRight();');
    expect(found).toContain('turnLeft();');
  });

  /**
   * Cái hay của khu vực 3 là học sinh TỰ THẤY mình đang viết lặp rồi mới được
   * trao vòng lặp. Hiện sẵn nút `for` từ khu vực 1 là nói trước đáp án và hỏng
   * cả thiết kế của flow mới.
   */
  it('vòng lặp CHƯA xuất hiện ở khu vực 1 và 2', () => {
    expect(labels(makeChallenge({ lessonId: 'l1' }))).not.toContain('for (...) { }');
    expect(labels(makeChallenge({ lessonId: 'l2' }))).not.toContain('for (...) { }');
  });

  it('vòng lặp xuất hiện từ khu vực 3, điều kiện từ khu vực 4', () => {
    expect(labels(makeChallenge({ lessonId: 'l3' }))).toContain('for (...) { }');
    expect(labels(makeChallenge({ lessonId: 'l3' }))).not.toContain('if (...) { }');
    expect(labels(makeChallenge({ lessonId: 'l4' }))).toContain('if (...) { }');
  });

  /** Bài dọn code: việc của em là sửa code có sẵn, không phải thêm lệnh mới. */
  it('bài dọn code không hiện bảng lệnh', () => {
    expect(paletteForChallenge(makeChallenge({ kind: 'cleancode' }))).toHaveLength(0);
  });

  it('không có hai nút trùng nhãn', () => {
    for (const lessonId of ['l1', 'l2', 'l3', 'l4', 'l5']) {
      const found = labels(makeChallenge({ lessonId }));
      expect(new Set(found).size).toBe(found.length);
    }
  });

  it('nhiệm vụ nào cũng có bảng lệnh, trừ bài dọn code', () => {
    for (const lesson of LESSONS) {
      for (const challenge of lesson.challenges) {
        if (challenge.kind === 'cleancode') continue;
        expect(
          paletteForChallenge(challenge).length,
          `${challenge.id} không có lệnh nào`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('mỗi lệnh đều có lời giải thích ngắn cho học sinh rê chuột', () => {
    for (const command of paletteForChallenge(makeChallenge({ lessonId: 'l5' }))) {
      expect(command.hint.length).toBeGreaterThan(10);
    }
  });
});
