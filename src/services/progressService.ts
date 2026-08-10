import type { Challenge } from '@/types/content';
import type { LessonProgressRow, ProfileRow } from '@/types/database';
import { getRequiredChallengeIds } from '@/lessons';
import {
  upsertLessonProgress,
  type LessonProgressPatch,
} from '@/services/supabase/progress.repo';
import { runOrQueue } from '@/services/offlineQueue';
import { logActivityEvent } from '@/services/supabase/gamification.repo';
import { requireSupabase } from '@/services/supabase/client';
import { toRepositoryError } from '@/services/supabase/errors';
import { calculateLessonPercent } from '@/utils/progression';
import { calculateLevel } from '@/utils/xp';

/**
 * Cập nhật tiến trình khi học sinh hoàn thành một nhiệm vụ.
 *
 * Tách khỏi component để test được và để mọi nơi cùng dùng một luật:
 *   · XP chỉ cộng LẦN ĐẦU hoàn thành, làm lại không cộng thêm
 *   · XP không bao giờ bị trừ (mục 6: không dùng cơ chế trừ điểm nặng)
 *   · Sao KHÔNG phụ thuộc số lần thử hay số gợi ý đã dùng
 */

export interface CompleteChallengeInput {
  userId: string;
  profile: ProfileRow;
  lessonId: string;
  challenge: Challenge;
  currentProgress: LessonProgressRow | null;
}

export interface CompleteChallengeResult {
  progress: LessonProgressRow;
  xpAwarded: number;
  isFirstTime: boolean;
  lessonJustCompleted: boolean;
  newStars: number;
}

/**
 * Số sao của một bài học.
 *
 * ⭐   vượt ≥ 70% nhiệm vụ bắt buộc
 * ⭐⭐  hoàn thành 100%
 * ⭐⭐⭐ hoàn thành 100% VÀ vượt checkpoint (được cập nhật ở ExitTicketPage)
 *
 * Cố ý không tính số lần thử hay số gợi ý: đề bài yêu cầu không khiến học sinh
 * sợ sai và không làm các em thấy dùng gợi ý là kém.
 */
export function calculateLessonStars(lessonId: string, completedChallenges: string[]): number {
  const requiredIds = getRequiredChallengeIds(lessonId);
  if (requiredIds.length === 0) return 0;

  const percent = calculateLessonPercent(completedChallenges, requiredIds);
  if (percent < 70) return 0;
  if (percent < 100) return 1;

  return 2;
}

export async function completeChallenge(
  input: CompleteChallengeInput,
): Promise<CompleteChallengeResult> {
  const { userId, profile, lessonId, challenge, currentProgress } = input;

  const alreadyDone = currentProgress?.completed_challenges.includes(challenge.id) ?? false;
  const completedChallenges = alreadyDone
    ? (currentProgress?.completed_challenges ?? [])
    : [...(currentProgress?.completed_challenges ?? []), challenge.id];

  const requiredIds = getRequiredChallengeIds(lessonId);
  const percent = calculateLessonPercent(completedChallenges, requiredIds);
  const stars = calculateLessonStars(lessonId, completedChallenges);
  const wasCompleted = currentProgress?.status === 'completed';
  // Hoàn thành toàn bộ challenge mới chỉ mở Checkpoint. Khu vực chỉ hoàn tất
  // sau khi Checkpoint đạt ngưỡng; việc đó được ghi ở ExitTicketPage.
  const lessonJustCompleted = false;

  const xpAwarded = alreadyDone ? 0 : challenge.xpReward;
  const lessonXp = (currentProgress?.xp ?? 0) + xpAwarded;

  const patch: LessonProgressPatch = {
    status: wasCompleted ? 'completed' : 'in_progress',
    progress_percent: percent,
    stars,
    xp: lessonXp,
    completed_challenges: completedChallenges,
    completed_at: wasCompleted ? currentProgress?.completed_at ?? new Date().toISOString() : null,
  };

  /*
    Mất mạng thì xếp hàng ghi lại sau, và trả về một bản ghi "tạm" dựng tại chỗ.
    Học sinh vẫn thấy nhiệm vụ hoàn thành ngay lập tức — điều quan trọng nhất là
    công sức của các em không biến mất chỉ vì Wi-Fi phòng máy chập chờn.
  */
  let progressFromServer: LessonProgressRow | null = null;

  const writeResult = await runOrQueue(
    'upsert-lesson-progress',
    { userId, lessonId, patch },
    async () => {
      progressFromServer = await upsertLessonProgress(userId, lessonId, patch);
    },
  );

  // Ghi hỏng vì lý do KHÁC mạng (vd. RLS chặn) thì phải báo lên, không nuốt lỗi
  if (!writeResult.ok && !writeResult.queued) {
    throw writeResult.error;
  }

  const progress: LessonProgressRow =
    progressFromServer ?? buildOptimisticProgress(userId, lessonId, currentProgress, patch);

  if (xpAwarded > 0) {
    const newTotalXp = profile.total_xp + xpAwarded;
    await runOrQueue('add-experience', { userId, totalXp: newTotalXp }, () =>
      setExperienceDirect(userId, newTotalXp),
    );
  }

  // Ghi nhật ký — cố ý không await chặn, hỏng cũng không ảnh hưởng việc học
  void logActivityEvent(userId, {
    eventType: challenge.kind === 'boss' ? 'boss_defeated' : 'challenge_passed',
    lessonId,
    challengeId: challenge.id,
    metadata: { xp: xpAwarded, kind: challenge.kind },
  });

  if (lessonJustCompleted) {
    void logActivityEvent(userId, {
      eventType: 'lesson_completed',
      lessonId,
      metadata: { stars },
    });
  }

  return {
    progress,
    xpAwarded,
    isFirstTime: !alreadyDone,
    lessonJustCompleted,
    newStars: stars,
  };
}

/**
 * Dựng một bản ghi tiến trình "tạm" khi chưa ghi được lên máy chủ.
 *
 * Giao diện dùng ngay bản này để hiển thị, còn bản thật sẽ được ghi khi có mạng.
 * Lần sau học sinh mở lại trang, dữ liệu từ máy chủ sẽ thay thế bản tạm.
 */
function buildOptimisticProgress(
  userId: string,
  lessonId: string,
  current: LessonProgressRow | null,
  patch: LessonProgressPatch,
): LessonProgressRow {
  return {
    id: current?.id ?? `local-${lessonId}`,
    user_id: userId,
    lesson_id: lessonId,
    status: patch.status ?? current?.status ?? 'in_progress',
    progress_percent: patch.progress_percent ?? current?.progress_percent ?? 0,
    stars: patch.stars ?? current?.stars ?? 0,
    xp: patch.xp ?? current?.xp ?? 0,
    completed_challenges: patch.completed_challenges ?? current?.completed_challenges ?? [],
    started_at: current?.started_at ?? new Date().toISOString(),
    completed_at: patch.completed_at ?? current?.completed_at ?? null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Cộng XP vào hồ sơ.
 *
 * `level` được trigger `profiles_guard_update` trong database tính lại từ
 * `total_xp`, nên giá trị gửi lên đây chỉ để giao diện hiển thị ngay lập tức.
 *
 * Đặt tên có hậu tố `Direct` vì hàm này ghi thẳng, không xếp hàng — hàng đợi
 * offline gọi lại chính nó khi có mạng.
 */
export async function setExperienceDirect(userId: string, newTotalXp: number): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('profiles')
      .update({ total_xp: newTotalXp, level: calculateLevel(newTotalXp) })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không cộng được điểm kinh nghiệm.');
  }
}
