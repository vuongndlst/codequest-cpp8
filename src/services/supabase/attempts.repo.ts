import { requireSupabase } from './client';
import { toRepositoryError } from './errors';
import { runOrQueue } from '@/services/offlineQueue';
import type { ChallengeAttemptRow } from '@/types/database';
import type { RunResult } from '@/types/runner';

/**
 * Lịch sử làm bài.
 *
 * Bảng này INSERT-only với học sinh (chính sách RLS) — dữ liệu học tập phải
 * trung thực thì giáo viên mới tin được khi xem thống kê lỗi phổ biến.
 */

export interface RecordAttemptInput {
  userId: string;
  lessonId: string;
  challengeId: string;
  code: string;
  result: RunResult;
  hintLevelUsed: number;
  attemptNumber: number;
}

/**
 * Ghi một lần làm bài, có xếp hàng khi mất mạng.
 *
 * Đây là hàm mà giao diện nên gọi. Nếu mạng rớt, lần làm bài được cất vào hàng
 * đợi trong localStorage và tự ghi lại khi có mạng — nhờ vậy thống kê lỗi phổ
 * biến của giáo viên không bị thủng lỗ chỗ vì Wi-Fi phòng máy chập chờn.
 */
export async function recordAttempt(input: RecordAttemptInput): Promise<void> {
  await runOrQueue('record-attempt', input, () => recordAttemptDirect(input));
}

/** Ghi thẳng xuống database, không xếp hàng. Dùng khi chạy lại hàng đợi. */
export async function recordAttemptDirect(input: RecordAttemptInput): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('challenge_attempts').insert({
      user_id: input.userId,
      lesson_id: input.lessonId,
      challenge_id: input.challengeId,
      submitted_code: input.code.slice(0, 10_000),
      is_correct: input.result.isCorrect,
      passed_tests: input.result.passedRequired,
      total_tests: input.result.totalRequired,
      error_types: input.result.errorCodes,
      hint_level_used: input.hintLevelUsed,
      attempt_number: input.attemptNumber,
      clean_code_score: input.result.ok ? input.result.cleanCode.score : null,
    });

    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không lưu được lần làm bài này.');
  }
}

/** Số lần đã thử — dùng để quyết định khi nào mở đáp án mẫu. */
export async function countAttempts(userId: string, challengeId: string): Promise<number> {
  try {
    const supabase = requireSupabase();
    const { count, error } = await supabase
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId);

    if (error) throw error;
    return count ?? 0;
  } catch {
    // Không đếm được thì coi như chưa thử lần nào — không chặn việc học
    return 0;
  }
}

/** Toàn bộ lần làm bài của một học sinh trong một khu vực — dùng để xét chứng chỉ. */
export async function fetchAttemptsForLesson(
  userId: string,
  lessonId: string,
): Promise<ChallengeAttemptRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('challenge_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ChallengeAttemptRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được lịch sử làm bài của khu vực này.');
  }
}

export async function fetchAttemptsForChallenge(
  userId: string,
  challengeId: string,
): Promise<ChallengeAttemptRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('challenge_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ChallengeAttemptRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được lịch sử làm bài.');
  }
}
