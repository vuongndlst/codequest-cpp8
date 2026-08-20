import { describe, expect, it } from 'vitest';
import { LESSONS } from '@/lessons';
import { CONCEPTS } from './curriculum';
import { HANDBOOK_CARDS } from './handbook';

/**
 * Hoc sinh phai go dung cac ky tu ASCII cua C++. Cac glyph Toan hoc nhin gan
 * giong nhau nhung khong phai toan tu hop le trong ma nguon C++.
 */
describe('Cú pháp C++ hiển thị cho học sinh', () => {
  it('không dùng ký hiệu Unicode thay cho toán tử C++ trong bài học và sổ tay', () => {
    const studentFacingContent = JSON.stringify({
      lessons: LESSONS,
      concepts: CONCEPTS,
      handbook: HANDBOOK_CARDS,
    });

    expect(studentFacingContent).not.toMatch(/[≥≤≠≧≦]/u);
  });

  it('vẫn giữ nguyên các toán tử ASCII nhiều ký tự trong nội dung', () => {
    const studentFacingContent = JSON.stringify({
      lessons: LESSONS,
      concepts: CONCEPTS,
      handbook: HANDBOOK_CARDS,
    });

    for (const operator of ['>=', '<=', '!=', '==', '&&', '||']) {
      expect(studentFacingContent).toContain(operator);
    }
  });
});
