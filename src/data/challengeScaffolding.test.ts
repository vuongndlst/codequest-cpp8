import { describe, expect, it } from 'vitest';
import { getChallenge } from '@/lessons';
import { guidedHintsForChallenge, newGameApiForChallenge } from './challengeScaffolding';

describe('Giàn giáo nhiệm vụ theo Game API', () => {
  it('chỉ giới thiệu API ở lần đầu xuất hiện trong tiến trình', () => {
    const firstMove = newGameApiForChallenge(getChallenge('a1', 'a1-c1-move-right')!);
    expect(firstMove.map((command) => command.signature)).toContain('moveRight();');

    const laterRoute = newGameApiForChallenge(getChallenge('a1', 'a1-c3-obstacle-route')!);
    expect(laterRoute.map((command) => command.signature)).not.toContain('moveRight();');
    expect(laterRoute.map((command) => command.signature)).toEqual(['moveUp();']);
  });

  it('đặt gợi ý lệnh ngay trước khung code và giữ dữ liệu có cấu trúc', () => {
    const challenge = getChallenge('a5', 'a5-c5-armor-loop')!;
    const hints = guidedHintsForChallenge(challenge);
    const commandIndex = hints.findIndex((hint) => hint.type === 'command');
    const skeletonIndex = hints.findIndex((hint) => hint.type === 'skeleton');

    expect(commandIndex).toBeGreaterThanOrEqual(0);
    expect(commandIndex).toBe(skeletonIndex - 1);
    expect(hints.map((hint) => hint.level)).toEqual([1, 2, 3, 4]);
    expect(hints[commandIndex].commands?.map((command) => command.signature)).toEqual(expect.arrayContaining([
      'for (int i = 0; i < count; i++) { ... }',
      'attackBug();',
      'getBugHp()',
    ]));
  });
});
