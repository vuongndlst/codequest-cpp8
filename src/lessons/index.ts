import type { Challenge, Lesson } from '@/types/content';
import { lesson1 } from './lesson-1';
import { lesson2 } from './lesson-2';
import { lesson3 } from './lesson-3';
import { lesson4 } from './lesson-4';
import { lesson5 } from './lesson-5';

/**
 * Sổ đăng ký nội dung bài học.
 *
 * Nội dung nằm trong mã nguồn (không nằm trong database) để: quản lý bằng Git,
 * sửa bài không cần migration, tải tức thì, và test được bằng Vitest.
 *
 * Thêm bài mới: tạo `src/lessons/lesson-N/index.ts` rồi khai báo ở đây.
 */

export const LESSONS: Lesson[] = [lesson1, lesson2, lesson3, lesson4, lesson5];

const LESSON_BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));

export function getLesson(lessonId: string): Lesson | undefined {
  return LESSON_BY_ID.get(lessonId);
}

/** Bài học đã có nội dung đầy đủ (dùng để phân biệt với bài mới chỉ có metadata). */
export function isLessonAuthored(lessonId: string): boolean {
  return LESSON_BY_ID.has(lessonId);
}

export function getChallenge(lessonId: string, challengeId: string): Challenge | undefined {
  return getLesson(lessonId)?.challenges.find((challenge) => challenge.id === challengeId);
}

/** Id các nhiệm vụ bắt buộc — dùng để tính phần trăm tiến trình. */
export function getRequiredChallengeIds(lessonId: string): string[] {
  return (
    getLesson(lessonId)
      ?.challenges.filter((challenge) => !challenge.optional)
      .map((challenge) => challenge.id) ?? []
  );
}

export function getChallengeIds(lessonId: string): string[] {
  return getLesson(lessonId)?.challenges.map((challenge) => challenge.id) ?? [];
}

/** Nhiệm vụ Boss của một bài (điều kiện bắt buộc để nhận chứng chỉ). */
export function getBossChallenge(lessonId: string): Challenge | undefined {
  return getLesson(lessonId)?.challenges.find((challenge) => challenge.kind === 'boss');
}

export { lesson1, lesson2, lesson3, lesson4, lesson5 };
