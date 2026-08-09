import { requireSupabase } from './client';
import { toRepositoryError } from './errors';
import type { LessonProgressRow, LessonStatus } from '@/types/database';

/** Truy cập bảng `lesson_progress`. */

export async function fetchAllLessonProgress(userId: string): Promise<LessonProgressRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .order('lesson_id', { ascending: true });

    if (error) throw error;
    return (data as LessonProgressRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được tiến trình học tập.');
  }
}

/** Chuyển mảng tiến trình thành object tra cứu nhanh theo lesson_id. */
export function indexProgressByLesson(
  rows: LessonProgressRow[],
): Record<string, LessonProgressRow | undefined> {
  return Object.fromEntries(rows.map((row) => [row.lesson_id, row]));
}

export interface LessonProgressPatch {
  status?: LessonStatus;
  progress_percent?: number;
  stars?: number;
  xp?: number;
  completed_challenges?: string[];
  completed_at?: string | null;
}

/**
 * Tạo mới hoặc cập nhật tiến trình một bài học.
 * Dựa vào ràng buộc UNIQUE(user_id, lesson_id) để `upsert` an toàn.
 */
export async function upsertLessonProgress(
  userId: string,
  lessonId: string,
  patch: LessonProgressPatch,
): Promise<LessonProgressRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        { user_id: userId, lesson_id: lessonId, ...patch },
        { onConflict: 'user_id,lesson_id' },
      )
      .select('*')
      .single();

    if (error) throw error;
    return data as LessonProgressRow;
  } catch (error) {
    throw toRepositoryError(error, 'Không lưu được tiến trình.');
  }
}

/** Đánh dấu học sinh bắt đầu một bài học (chỉ tạo bản ghi nếu chưa có). */
export async function ensureLessonStarted(
  userId: string,
  lessonId: string,
): Promise<LessonProgressRow | null> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          status: 'in_progress' satisfies LessonStatus,
          started_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id', ignoreDuplicates: true },
      )
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return (data as LessonProgressRow | null) ?? null;
  } catch (error) {
    throw toRepositoryError(error, 'Không mở được bài học.');
  }
}
