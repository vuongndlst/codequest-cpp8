import { requireSupabase } from './client';
import { toRepositoryError } from './errors';
import type { ProfileRow, ProfileUpdate } from '@/types/database';

/**
 * Truy cập bảng `profiles`.
 *
 * Lưu ý: cột `role`, `total_xp`, `level` KHÔNG nằm trong `ProfileUpdate`.
 * Kể cả khi client cố gửi lên, trigger `profiles_guard_update` trong database
 * cũng sẽ khôi phục lại giá trị cũ (mục 22: không tin dữ liệu role từ client).
 */

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data as ProfileRow | null) ?? null;
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được hồ sơ của em.');
  }
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<ProfileRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data as ProfileRow;
  } catch (error) {
    throw toRepositoryError(error, 'Không lưu được hồ sơ.');
  }
}

/**
 * Ghi nhận học sinh có hoạt động hôm nay và cập nhật chuỗi ngày học.
 *
 * Chuỗi ngày học CHỈ để động viên (mục 6: không tạo áp lực) — đứt chuỗi
 * không mất XP, không mất huy hiệu, không có đồng hồ đếm ngược.
 */
export async function touchActivity(profile: ProfileRow): Promise<ProfileRow | null> {
  const today = new Date().toISOString().slice(0, 10);
  if (profile.last_active_date === today) return null;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const nextStreak = profile.last_active_date === yesterday ? profile.streak_days + 1 : 1;

  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update({ last_active_date: today, streak_days: nextStreak })
      .eq('id', profile.id)
      .select('*')
      .single();

    if (error) throw error;
    return data as ProfileRow;
  } catch {
    // Streak chỉ là tính năng phụ — hỏng thì bỏ qua, không làm phiền học sinh.
    return null;
  }
}
