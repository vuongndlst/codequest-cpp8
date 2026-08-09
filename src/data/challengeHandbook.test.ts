import { describe, expect, it } from 'vitest';
import { relevantHandbookCards } from './challengeHandbook';
import { HANDBOOK_CARDS } from './handbook';
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

describe('Chọn thẻ sổ tay theo nhiệm vụ', () => {
  it('nhiệm vụ dùng vòng lặp thì chỉ ra thẻ vòng lặp', () => {
    const cards = relevantHandbookCards(makeChallenge({ requiredPatterns: ['stmt:for'] }));
    expect(cards.map((card) => card.id)).toContain('for-loop');
  });

  /**
   * `stmt:if-else` chứa cả chuỗi `stmt:if`. Nếu so khớp cẩu thả thì nhiệm vụ
   * if-else sẽ chỉ sang thẻ `if` trước, và học sinh đọc nhầm thẻ.
   */
  it('phân biệt được if với if-else', () => {
    const ifElse = relevantHandbookCards(makeChallenge({ requiredPatterns: ['stmt:if-else'] }));
    expect(ifElse.map((card) => card.id)).toContain('if-else');
    expect(ifElse.map((card) => card.id)).not.toContain('if');

    const plainIf = relevantHandbookCards(makeChallenge({ requiredPatterns: ['stmt:if'] }));
    expect(plainIf.map((card) => card.id)).toContain('if');
  });

  it('hàm có tham số thì chỉ sang thẻ tham số, không phải thẻ khai báo hàm', () => {
    const cards = relevantHandbookCards(
      makeChallenge({ requiredPatterns: ['decl:func:showPower:params>=1'] }),
    );
    expect(cards[0].id).toBe('function-params');
  });

  it('bài debug luôn kèm thẻ lỗi thường gặp', () => {
    const cards = relevantHandbookCards(
      makeChallenge({ kind: 'debug', requiredPatterns: ['stmt:cout'] }),
    );
    expect(cards.map((card) => card.id)).toContain('common-errors');
  });

  it('người soạn bài chỉ định tay thì thẻ đó lên đầu', () => {
    const cards = relevantHandbookCards(
      makeChallenge({ requiredPatterns: ['stmt:for'], handbookCards: ['variables'] }),
    );
    expect(cards[0].id).toBe('variables');
    expect(cards.map((card) => card.id)).toContain('for-loop');
  });

  it('nhiệm vụ chưa gợi ra thẻ nào thì vẫn có thẻ dự phòng, không trả về rỗng', () => {
    const cards = relevantHandbookCards(makeChallenge({ requiredPatterns: [] }));
    expect(cards.length).toBeGreaterThan(0);
  });

  it('không trả về thẻ trùng nhau', () => {
    const cards = relevantHandbookCards(
      makeChallenge({ requiredPatterns: ['stmt:for', 'stmt:for>call:moveForward', 'stmt:for'] }),
    );
    const ids = cards.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/**
 * Bảng ánh xạ được suy ra tự động, nên rủi ro lớn nhất là nó âm thầm trỏ sai
 * hoặc trỏ vào một thẻ không tồn tại. Chạy thử trên TOÀN BỘ nhiệm vụ thật.
 */
describe('Chạy trên toàn bộ nhiệm vụ thật', () => {
  const allChallenges = LESSONS.flatMap((lesson) => lesson.challenges);
  const validIds = new Set(HANDBOOK_CARDS.map((card) => card.id));

  it('nhiệm vụ nào cũng chỉ ra được ít nhất một thẻ', () => {
    for (const challenge of allChallenges) {
      const cards = relevantHandbookCards(challenge);
      expect(cards.length, `${challenge.id} không có thẻ nào`).toBeGreaterThan(0);
    }
  });

  it('mọi thẻ được chỉ ra đều có thật trong sổ tay', () => {
    for (const challenge of allChallenges) {
      for (const card of relevantHandbookCards(challenge)) {
        expect(validIds.has(card.id), `${challenge.id} trỏ tới thẻ lạ: ${card.id}`).toBe(true);
      }
    }
  });

  /** Quá nhiều thẻ thì lại thành nguyên cuốn sổ, mất luôn ý nghĩa của việc lọc. */
  it('không nhiệm vụ nào chỉ ra quá 5 thẻ', () => {
    for (const challenge of allChallenges) {
      const cards = relevantHandbookCards(challenge);
      expect(cards.length, `${challenge.id} có tới ${cards.length} thẻ`).toBeLessThanOrEqual(5);
    }
  });
});
