import { describe, expect, it } from 'vitest';
import { getJourneyTarget } from './journey';
import type { LessonProgressRow } from '@/types/database';
import { LESSONS } from '@/lessons';

const progress = (lessonId: string, completed: string[], status: LessonProgressRow['status'] = 'in_progress'): LessonProgressRow => ({
  id: `p-${lessonId}`, user_id: 'u', lesson_id: lessonId, status,
  progress_percent: 0, stars: 0, xp: 0, completed_challenges: completed,
  started_at: null, completed_at: null, updated_at: new Date().toISOString(),
});

describe('Tuyến hành trình một nút', () => {
  it('tài khoản mới đi thẳng vào nhiệm vụ đầu tiên', () => {
    expect(getJourneyTarget({}).href).toBe('/app/lesson/a0/challenge/a0-c1-first-program');
  });

  it('tiếp tục đúng nhiệm vụ chưa hoàn thành, không bắt quay lại trang khu vực', () => {
    const first = LESSONS[0].challenges[0].id;
    const target = getJourneyTarget({ a0: progress('a0', [first]) });
    expect(target.challengeId).toBe(LESSONS[0].challenges[1].id);
    expect(target.href).toContain('/challenge/');
  });

  it('xong các nhiệm vụ thì đi thẳng tới checkpoint', () => {
    const ids = LESSONS[0].challenges.map((item) => item.id);
    expect(getJourneyTarget({ a0: progress('a0', ids) })).toMatchObject({
      href: '/app/lesson/a0/exit-ticket', kind: 'checkpoint',
    });
  });

  it('xong checkpoint thì bắt đầu nhiệm vụ đầu khu vực sau', () => {
    const target = getJourneyTarget({
      a0: progress('a0', LESSONS[0].challenges.map((item) => item.id), 'completed'),
    });
    expect(target.href).toBe(`/app/lesson/a1/challenge/${LESSONS[1].challenges[0].id}`);
  });

  it('không đưa học sinh đi xuyên qua khu vực giáo viên đang khóa', () => {
    const target = getJourneyTarget(
      { a0: progress('a0', LESSONS[0].challenges.map((item) => item.id), 'completed') },
      (lessonId) => lessonId !== 'a1',
    );
    expect(target).toMatchObject({ lessonId: 'a1', kind: 'locked', href: '#map-heading' });
  });
});
