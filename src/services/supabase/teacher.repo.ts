import { requireSupabase } from './client';
import { toRepositoryError } from './errors';
import type {
  CertificateRow,
  ChallengeAttemptRow,
  ClassSettingsRow,
  LessonProgressRow,
  ProfileRow,
} from '@/types/database';

/**
 * Truy vấn dành cho giáo viên.
 *
 * ⚠ Mọi hàm ở đây đều dựa vào policy RLS `..._select_teacher` để lọc. Nếu tài
 * khoản không phải giáo viên, database trả về mảng rỗng chứ KHÔNG phải lỗi —
 * nghĩa là dữ liệu học sinh không bao giờ rò rỉ qua đường này, kể cả khi ai đó
 * vượt được guard ở tầng giao diện.
 *
 * Nguyên tắc riêng tư (mục 16): chỉ lấy những cột thật sự cần cho việc dạy.
 * Cố ý KHÔNG đọc bảng `code_drafts` — code nháp giữa chừng là chuyện riêng của
 * học sinh.
 */

/** Hồ sơ học sinh ở góc nhìn giáo viên — không có cột nào thừa. */
export type StudentProfile = Pick<
  ProfileRow,
  'id' | 'full_name' | 'class_name' | 'student_code' | 'avatar_id' | 'total_xp' | 'level'
> & { last_active_date: string | null };

export async function fetchStudents(): Promise<StudentProfile[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, class_name, student_code, avatar_id, total_xp, level, last_active_date')
      .eq('role', 'student')
      .order('class_name', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data as StudentProfile[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được danh sách học sinh.');
  }
}

export async function fetchAllProgress(): Promise<LessonProgressRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.from('lesson_progress').select('*');
    if (error) throw error;
    return (data as LessonProgressRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được tiến trình của lớp.');
  }
}

export async function fetchAllCertificates(): Promise<CertificateRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return (data as CertificateRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được danh sách chứng chỉ.');
  }
}

/**
 * Lần làm bài gần đây của cả lớp.
 *
 * Giới hạn số dòng vì bảng này lớn nhanh nhất. 2000 dòng đủ cho vài tuần dạy
 * của một lớp, và thống kê lỗi phổ biến chỉ cần dữ liệu gần đây mới có ý nghĩa.
 */
export async function fetchRecentAttempts(limit = 2000): Promise<ChallengeAttemptRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('challenge_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as ChallengeAttemptRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được dữ liệu làm bài.');
  }
}

export async function fetchAllClassSettings(): Promise<ClassSettingsRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('class_settings')
      .select('*')
      .order('class_name', { ascending: true });

    if (error) throw error;
    return (data as ClassSettingsRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được cài đặt lớp.');
  }
}

export interface ClassSettingsPatch {
  unlocked_lessons?: string[];
  allow_solution_view?: boolean;
}

export async function upsertClassSettings(
  className: string,
  patch: ClassSettingsPatch,
  teacherId: string,
): Promise<ClassSettingsRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('class_settings')
      .upsert(
        { class_name: className, ...patch, updated_by: teacherId },
        { onConflict: 'class_name' },
      )
      .select('*')
      .single();

    if (error) throw error;
    return data as ClassSettingsRow;
  } catch (error) {
    throw toRepositoryError(error, 'Không lưu được cài đặt lớp.');
  }
}

/**
 * Đặt lại tiến trình MỘT nhiệm vụ của một học sinh (mục 16).
 *
 * Xoá các lần làm bài của nhiệm vụ đó và gỡ nó khỏi danh sách đã hoàn thành,
 * để học sinh làm lại từ đầu. XP đã cộng thì GIỮ NGUYÊN — đề bài quy định không
 * dùng cơ chế trừ điểm nặng, và việc học sinh đã bỏ công làm là có thật.
 */
export async function resetChallengeForStudent(
  userId: string,
  lessonId: string,
  challengeId: string,
): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.rpc('teacher_reset_challenge', {
      p_student_id: userId,
      p_lesson_id: lessonId,
      p_challenge_id: challengeId,
    });
    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không đặt lại được nhiệm vụ này.');
  }
}
