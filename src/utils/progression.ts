import type { LessonProgressRow } from '@/types/database';
import { LESSONS_META } from '@/data/lessons.meta';

/**
 * Quy tắc mở khoá bài học và node nhiệm vụ.
 * docs/phase-1-architecture.md mục 5.2
 *
 * Nguyên tắc: học sinh phải hoàn thành bài trước mới mở bài sau, NHƯNG
 * giáo viên luôn có quyền mở thêm bài bất kỳ cho lớp (class_settings).
 */

export type LessonLockState = 'locked' | 'unlocked' | 'completed';

export interface LessonUnlockContext {
  /** Tiến trình của học sinh, khoá theo lesson_id */
  progressByLesson: Record<string, LessonProgressRow | undefined>;
  /** Bài học được giáo viên mở thêm cho lớp */
  teacherUnlockedLessons?: string[];
  /** Bài học giáo viên chủ động tạm khóa để giữ nhịp học chung của lớp. */
  teacherLockedLessons?: string[];
  /**
   * Người đang xem là giáo viên.
   *
   * Giáo viên KHÔNG phải học để xem được nội dung. Trước đây tài khoản giáo
   * viên bị khoá y hệt học sinh: muốn xem khu vực 4 dạy gì thì phải ngồi làm
   * xong khu vực 1, 2, 3 — vô lý với người soạn bài và chấm bài.
   */
  isTeacher?: boolean;
}

/** Bài học đầu tiên luôn mở — học sinh mới vào phải có việc để làm ngay. */
export const FIRST_LESSON_ID = 'a0';

export function isLessonUnlocked(lessonId: string, ctx: LessonUnlockContext): boolean {
  if (ctx.isTeacher) return true;
  if (ctx.teacherLockedLessons?.includes(lessonId)) return false;
  if (lessonId === FIRST_LESSON_ID) return true;
  if (ctx.teacherUnlockedLessons?.includes(lessonId)) return true;

  const index = LESSONS_META.findIndex((lesson) => lesson.id === lessonId);
  if (index <= 0) return false;

  const previousLessonId = LESSONS_META[index - 1].id;
  return ctx.progressByLesson[previousLessonId]?.status === 'completed';
}

export function getLessonLockState(lessonId: string, ctx: LessonUnlockContext): LessonLockState {
  if (ctx.progressByLesson[lessonId]?.status === 'completed') return 'completed';
  return isLessonUnlocked(lessonId, ctx) ? 'unlocked' : 'locked';
}

/**
 * Node nhiệm vụ trong một bài mở khoá tuần tự: phải xong node trước mới mở node sau.
 * Node "Khám phá thêm" (optional) luôn mở và không chặn tiến trình.
 */
export function isChallengeUnlocked(
  challengeIndex: number,
  challengeIds: string[],
  completedChallenges: string[],
  isOptional = false,
  isTeacher = false,
): boolean {
  // Giáo viên xem được mọi nhiệm vụ để soạn bài và kiểm tra đề
  if (isTeacher) return true;
  if (challengeIndex === 0) return true;
  if (isOptional) return true;

  const previousId = challengeIds[challengeIndex - 1];
  return previousId !== undefined && completedChallenges.includes(previousId);
}

/** Phần trăm hoàn thành một bài học, làm tròn tới số nguyên. */
export function calculateLessonPercent(
  completedChallenges: string[],
  requiredChallengeIds: string[],
): number {
  if (requiredChallengeIds.length === 0) return 0;
  const done = requiredChallengeIds.filter((id) => completedChallenges.includes(id)).length;
  return Math.round((done / requiredChallengeIds.length) * 100);
}

/**
 * Bài học học sinh nên làm tiếp theo — dùng cho nút "Tiếp tục" ở Dashboard.
 * Ưu tiên bài đang học dở, sau đó tới bài mở khoá đầu tiên chưa hoàn thành.
 */
export function getNextLessonId(ctx: LessonUnlockContext): string {
  const inProgress = LESSONS_META.find(
    (lesson) =>
      ctx.progressByLesson[lesson.id]?.status === 'in_progress' && isLessonUnlocked(lesson.id, ctx),
  );
  if (inProgress) return inProgress.id;

  const nextUnlocked = LESSONS_META.find(
    (lesson) =>
      isLessonUnlocked(lesson.id, ctx) && ctx.progressByLesson[lesson.id]?.status !== 'completed',
  );
  if (nextUnlocked) return nextUnlocked.id;

  // Đã hoàn thành tất cả -> quay lại bài cuối để ôn tập
  return LESSONS_META[LESSONS_META.length - 1].id;
}

/** Tổng số sao đã đạt trên toàn bộ curriculum đang phát hành. */
export function getTotalStars(progressByLesson: Record<string, LessonProgressRow | undefined>): number {
  return LESSONS_META.reduce(
    (sum, lesson) => sum + (progressByLesson[lesson.id]?.stars ?? 0),
    0,
  );
}

export const MAX_TOTAL_STARS = LESSONS_META.length * 3;
