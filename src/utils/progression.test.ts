import { describe, expect, it } from 'vitest';
import {
  calculateLessonPercent,
  getLessonLockState,
  getNextLessonId,
  getTotalStars,
  isChallengeUnlocked,
  isLessonUnlocked,
  MAX_TOTAL_STARS,
} from './progression';
import type { LessonProgressRow, LessonStatus } from '@/types/database';

function makeProgress(
  lessonId: string,
  status: LessonStatus,
  overrides: Partial<LessonProgressRow> = {},
): LessonProgressRow {
  return {
    id: `progress-${lessonId}`,
    user_id: 'user-1',
    lesson_id: lessonId,
    status,
    progress_percent: status === 'completed' ? 100 : 40,
    stars: status === 'completed' ? 3 : 0,
    xp: 0,
    completed_challenges: [],
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('isLessonUnlocked', () => {
  it('bài đầu tiên luôn mở — học sinh mới vào phải có việc làm ngay', () => {
    expect(isLessonUnlocked('l1', { progressByLesson: {} })).toBe(true);
  });

  it('bài sau bị khoá khi chưa hoàn thành bài trước', () => {
    expect(isLessonUnlocked('l2', { progressByLesson: {} })).toBe(false);
    expect(
      isLessonUnlocked('l2', { progressByLesson: { l1: makeProgress('l1', 'in_progress') } }),
    ).toBe(false);
  });

  it('hoàn thành bài trước thì mở bài sau', () => {
    expect(
      isLessonUnlocked('l2', { progressByLesson: { l1: makeProgress('l1', 'completed') } }),
    ).toBe(true);
  });

  it('không mở nhảy cóc: xong l1 vẫn không mở được l3', () => {
    expect(
      isLessonUnlocked('l3', { progressByLesson: { l1: makeProgress('l1', 'completed') } }),
    ).toBe(false);
  });

  it('giáo viên mở thêm bài thì học sinh vào được ngay', () => {
    expect(
      isLessonUnlocked('l4', {
        progressByLesson: {},
        teacherUnlockedLessons: ['l4'],
      }),
    ).toBe(true);
  });

  it('id bài học không tồn tại thì luôn khoá', () => {
    expect(isLessonUnlocked('l99', { progressByLesson: {} })).toBe(false);
  });
});

describe('getLessonLockState', () => {
  it('phân biệt được ba trạng thái', () => {
    const ctx = {
      progressByLesson: {
        l1: makeProgress('l1', 'completed'),
        l2: makeProgress('l2', 'in_progress'),
      },
    };
    expect(getLessonLockState('l1', ctx)).toBe('completed');
    expect(getLessonLockState('l2', ctx)).toBe('unlocked');
    expect(getLessonLockState('l3', ctx)).toBe('locked');
  });
});

describe('isChallengeUnlocked', () => {
  const ids = ['c1', 'c2', 'c3'];

  it('node đầu tiên luôn mở', () => {
    expect(isChallengeUnlocked(0, ids, [])).toBe(true);
  });

  it('node sau chỉ mở khi node trước đã xong', () => {
    expect(isChallengeUnlocked(1, ids, [])).toBe(false);
    expect(isChallengeUnlocked(1, ids, ['c1'])).toBe(true);
    expect(isChallengeUnlocked(2, ids, ['c1'])).toBe(false);
    expect(isChallengeUnlocked(2, ids, ['c1', 'c2'])).toBe(true);
  });

  it('node "Khám phá thêm" luôn mở và không chặn tiến trình', () => {
    expect(isChallengeUnlocked(2, ids, [], true)).toBe(true);
  });
});

describe('calculateLessonPercent', () => {
  it('trả về 0 khi bài chưa có nhiệm vụ bắt buộc nào', () => {
    expect(calculateLessonPercent([], [])).toBe(0);
  });

  it('tính đúng tỉ lệ phần trăm', () => {
    expect(calculateLessonPercent(['c1', 'c2'], ['c1', 'c2', 'c3', 'c4'])).toBe(50);
    expect(calculateLessonPercent(['c1', 'c2', 'c3'], ['c1', 'c2', 'c3'])).toBe(100);
  });

  it('bỏ qua nhiệm vụ đã làm nhưng không nằm trong danh sách bắt buộc', () => {
    expect(calculateLessonPercent(['c1', 'bonus'], ['c1', 'c2'])).toBe(50);
  });
});

describe('getNextLessonId', () => {
  it('ưu tiên bài đang học dở', () => {
    const next = getNextLessonId({
      progressByLesson: {
        l1: makeProgress('l1', 'completed'),
        l2: makeProgress('l2', 'in_progress'),
      },
    });
    expect(next).toBe('l2');
  });

  it('học sinh mới thì bắt đầu từ l1', () => {
    expect(getNextLessonId({ progressByLesson: {} })).toBe('l1');
  });

  it('xong bài trước thì chỉ sang bài kế tiếp', () => {
    const next = getNextLessonId({
      progressByLesson: { l1: makeProgress('l1', 'completed') },
    });
    expect(next).toBe('l2');
  });

  it('hoàn thành cả khoá thì quay lại bài cuối để ôn tập', () => {
    const next = getNextLessonId({
      progressByLesson: {
        l1: makeProgress('l1', 'completed'),
        l2: makeProgress('l2', 'completed'),
        l3: makeProgress('l3', 'completed'),
        l4: makeProgress('l4', 'completed'),
        l5: makeProgress('l5', 'completed'),
      },
    });
    expect(next).toBe('l5');
  });
});

describe('getTotalStars', () => {
  it('cộng dồn sao của tất cả bài học', () => {
    const total = getTotalStars({
      l1: makeProgress('l1', 'completed', { stars: 3 }),
      l2: makeProgress('l2', 'in_progress', { stars: 2 }),
    });
    expect(total).toBe(5);
  });

  it('tối đa 15 sao cho cả khoá (5 bài × 3 sao)', () => {
    expect(MAX_TOTAL_STARS).toBe(15);
  });
});
