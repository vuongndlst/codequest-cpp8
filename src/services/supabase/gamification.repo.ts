import { requireSupabase } from './client';
import { toRepositoryError } from './errors';
import type {
  ActivityEventRow,
  ActivityEventType,
  BadgeRow,
  CertificateRow,
  ClassSettingsRow,
  UserBadgeRow,
} from '@/types/database';

/** Huy hiệu, chứng chỉ, nhật ký hoạt động và cài đặt lớp. */

export async function fetchAllBadges(): Promise<BadgeRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as BadgeRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được danh sách huy hiệu.');
  }
}

export async function fetchUserBadges(userId: string): Promise<UserBadgeRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data as UserBadgeRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được huy hiệu của em.');
  }
}

export async function fetchUserCertificates(userId: string): Promise<CertificateRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return (data as CertificateRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được bộ sưu tập chứng chỉ.');
  }
}

export async function fetchRecentActivity(
  userId: string,
  limit = 8,
): Promise<ActivityEventRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('activity_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as ActivityEventRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được thành tích gần đây.');
  }
}

export interface LogEventInput {
  eventType: ActivityEventType;
  lessonId?: string | null;
  challengeId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Ghi một sự kiện hoạt động.
 * Cố ý KHÔNG ném lỗi: nhật ký hỏng không được phép chặn việc học của học sinh.
 */
export async function logActivityEvent(userId: string, input: LogEventInput): Promise<void> {
  try {
    const supabase = requireSupabase();
    await supabase.from('activity_events').insert({
      user_id: userId,
      event_type: input.eventType,
      lesson_id: input.lessonId ?? null,
      challenge_id: input.challengeId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // im lặng bỏ qua
  }
}

export async function fetchClassSettings(
  className: string | null,
): Promise<ClassSettingsRow | null> {
  if (!className) return null;
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('class_settings')
      .select('*')
      .eq('class_name', className)
      .maybeSingle();

    if (error) throw error;
    return (data as ClassSettingsRow | null) ?? null;
  } catch {
    // Không có cài đặt lớp thì dùng quy tắc mở khoá mặc định — không phải lỗi.
    return null;
  }
}
