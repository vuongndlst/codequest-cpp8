import { LESSONS } from '@/lessons';
import type { LessonProgressRow } from '@/types/database';

export interface JourneyTarget {
  lessonId: string;
  challengeId?: string;
  href: string;
  label: string;
  kind: 'challenge' | 'checkpoint' | 'complete' | 'locked';
}

/** Chọn đúng một bước tiếp theo để học sinh không phải tự đi qua nhiều trang trung gian. */
export function getJourneyTarget(
  progressByLesson: Record<string, LessonProgressRow | undefined>,
  isLessonAccessible: (lessonId: string) => boolean = () => true,
): JourneyTarget {
  for (const lesson of LESSONS) {
    const progress = progressByLesson[lesson.id];
    if (progress?.status === 'completed') continue;

    if (!isLessonAccessible(lesson.id)) {
      return {
        lessonId: lesson.id,
        href: '#map-heading',
        label: 'Xem lịch mở khu vực',
        kind: 'locked',
      };
    }

    const completed = progress?.completed_challenges ?? [];
    const challenge = lesson.challenges.find((item) => !completed.includes(item.id));
    if (challenge) {
      return {
        lessonId: lesson.id,
        challengeId: challenge.id,
        href: `/app/lesson/${lesson.id}/challenge/${challenge.id}`,
        label: progress ? 'Tiếp tục nhiệm vụ' : 'Bắt đầu hành trình',
        kind: 'challenge',
      };
    }

    return {
      lessonId: lesson.id,
      href: `/app/lesson/${lesson.id}/exit-ticket`,
      label: 'Làm checkpoint',
      kind: 'checkpoint',
    };
  }

  const last = LESSONS.at(-1)!;
  return {
    lessonId: last.id,
    href: '/app/certificates',
    label: 'Xem bộ sưu tập',
    kind: 'complete',
  };
}

export function firstChallengeHref(lessonId: string): string {
  const lesson = LESSONS.find((item) => item.id === lessonId);
  const challengeId = lesson?.challenges[0]?.id;
  return challengeId
    ? `/app/lesson/${lessonId}/challenge/${challengeId}`
    : `/app/lesson/${lessonId}`;
}
