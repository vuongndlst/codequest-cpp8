import { describe, expect, it } from 'vitest';
import { evaluateBadges, type BadgeContext, type BadgeHistory } from './badgeService';
import { getChallenge, LESSONS } from '@/lessons';
import { emptyRunResult } from '@/types/runner';
import type { RunResult } from '@/types/runner';
import type { LessonProgressRow } from '@/types/database';

function makeHistory(overrides: Partial<BadgeHistory> = {}): BadgeHistory {
  return {
    hasRunBefore: true,
    debugChallengesCompleted: 0,
    semicolonFixCount: 0,
    bestCleanCodeByLesson: {},
    ...overrides,
  };
}

function makeResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    ...emptyRunResult(),
    ok: true,
    isCorrect: true,
    cleanCode: { score: 70, checks: [], suggestions: [], isClean: false },
    ...overrides,
  };
}

function makeProgress(lessonId: string, completedChallenges: string[]): LessonProgressRow {
  return {
    id: `p-${lessonId}`,
    user_id: 'u1',
    lesson_id: lessonId,
    status: 'in_progress',
    progress_percent: 50,
    stars: 1,
    xp: 100,
    completed_challenges: completedChallenges,
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
  };
}

function makeContext(overrides: Partial<BadgeContext> = {}): BadgeContext {
  return {
    challenge: getChallenge('a1', 'a1-c3-obstacle-route')!,
    result: makeResult(),
    attemptNumber: 1,
    hintLevelUsed: 0,
    progressByLesson: {},
    history: makeHistory(),
    earnedCodes: [],
    ...overrides,
  };
}

describe('first-run', () => {
  it('trao ngay lần chạy đầu tiên, kể cả khi code chưa đúng', () => {
    const codes = evaluateBadges(
      makeContext({
        result: makeResult({ isCorrect: false, ok: false }),
        history: makeHistory({ hasRunBefore: false }),
      }),
    );

    expect(codes).toContain('first-run');
  });

  it('không trao lại cho những lần chạy sau', () => {
    const codes = evaluateBadges(makeContext({ history: makeHistory({ hasRunBefore: true }) }));
    expect(codes).not.toContain('first-run');
  });
});

describe('persistent-coder — thưởng cho sự kiên trì', () => {
  it('trao khi làm được sau nhiều lần thử', () => {
    const codes = evaluateBadges(makeContext({ attemptNumber: 7 }));
    expect(codes).toContain('persistent-coder');
  });

  it('không trao khi chưa làm được, dù đã thử rất nhiều lần', () => {
    const codes = evaluateBadges(
      makeContext({ attemptNumber: 12, result: makeResult({ isCorrect: false }) }),
    );
    expect(codes).not.toContain('persistent-coder');
  });
});

describe('no-hint-hero', () => {
  it('chỉ trao ở Boss Challenge và khi chưa mở gợi ý nào', () => {
    const boss = getChallenge('a1', 'a1-c5-portal')!;
    const codes = evaluateBadges(makeContext({ challenge: boss, hintLevelUsed: 0 }));
    expect(codes).toContain('no-hint-hero');
  });

  it('không trao khi học sinh đã xem gợi ý', () => {
    const boss = getChallenge('a1', 'a1-c5-portal')!;
    const codes = evaluateBadges(makeContext({ challenge: boss, hintLevelUsed: 1 }));
    expect(codes).not.toContain('no-hint-hero');
  });

  it('không trao ở nhiệm vụ thường dù không dùng gợi ý', () => {
    const codes = evaluateBadges(makeContext({ hintLevelUsed: 0 }));
    expect(codes).not.toContain('no-hint-hero');
  });
});

describe('Huy hiệu theo Boss từng Area', () => {
  it('trao Algorithm Navigator khi đã hạ Boss Area 1', () => {
    const codes = evaluateBadges(
      makeContext({
        progressByLesson: { a1: makeProgress('a1', ['a1-c5-portal']) },
      }),
    );
    expect(codes).toContain('function-builder');
  });

  it('trao Data Keeper khi đã hạ Boss Area 2', () => {
    const codes = evaluateBadges(
      makeContext({
        progressByLesson: { a2: makeProgress('a2', ['a2-c5-vault']) },
      }),
    );
    expect(codes).toContain('data-keeper');
  });

  it('không trao khi mới làm các nhiệm vụ khác của khu vực đó', () => {
    const codes = evaluateBadges(
      makeContext({
        progressByLesson: { a1: makeProgress('a1', ['a1-c1-move-right', 'a1-c2-change-direction']) },
      }),
    );
    expect(codes).not.toContain('function-builder');
  });
});

describe('Huy hiệu clean code', () => {
  it('Clean Code Rookie trao khi đạt từ 80 điểm', () => {
    const codes = evaluateBadges(
      makeContext({
        result: makeResult({
          cleanCode: { score: 85, checks: [], suggestions: [], isClean: true },
        }),
      }),
    );
    expect(codes).toContain('clean-code-rookie');
  });

  it('Clean Code Guardian đòi từ 90 điểm ở cả ba khu vực', () => {
    const almostThere = Object.fromEntries(LESSONS.map((lesson) => [lesson.id, 95]));
    almostThere.a2 = 88;

    expect(
      evaluateBadges(makeContext({ history: makeHistory({ bestCleanCodeByLesson: almostThere }) })),
    ).not.toContain('clean-code-guardian');

    const allDone = Object.fromEntries(LESSONS.map((lesson) => [lesson.id, 92]));
    expect(
      evaluateBadges(makeContext({ history: makeHistory({ bestCleanCodeByLesson: allDone }) })),
    ).toContain('clean-code-guardian');
  });
});

describe('Không trao trùng', () => {
  it('bỏ qua những huy hiệu học sinh đã có', () => {
    const codes = evaluateBadges(
      makeContext({
        attemptNumber: 8,
        earnedCodes: ['persistent-coder'],
      }),
    );
    expect(codes).not.toContain('persistent-coder');
  });
});

/**
 * Guard sư phạm: đề bài nêu rõ không được làm học sinh cảm thấy dùng gợi ý là kém.
 * Test này chốt lại điều đó ở tầng code — nếu ai đó sau này thêm điều kiện
 * "không dùng gợi ý" vào một huy hiệu khác, test sẽ đỏ ngay.
 */
describe('Dùng gợi ý không bị phạt', () => {
  it('học sinh mở hết 3 gợi ý vẫn nhận được mọi huy hiệu, trừ No Hint Hero', () => {
    const withHints = evaluateBadges(
      makeContext({
        challenge: getChallenge('a1', 'a1-c5-portal')!,
        hintLevelUsed: 3,
        attemptNumber: 6,
        result: makeResult({
          cleanCode: { score: 95, checks: [], suggestions: [], isClean: true },
        }),
        progressByLesson: { a1: makeProgress('a1', ['a1-c5-portal']) },
        history: makeHistory({ debugChallengesCompleted: 5, semicolonFixCount: 3 }),
      }),
    );

    expect(withHints).toContain('function-builder');
    expect(withHints).toContain('persistent-coder');
    expect(withHints).toContain('clean-code-rookie');
    expect(withHints).toContain('bug-hunter');
    expect(withHints).toContain('semicolon-saver');
    // Chỉ đúng huy hiệu này bị ảnh hưởng, và nó chỉ là phần thưởng phụ
    expect(withHints).not.toContain('no-hint-hero');
  });
});
