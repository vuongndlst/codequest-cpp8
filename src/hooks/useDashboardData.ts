import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { fetchAllLessonProgress, indexProgressByLesson } from '@/services/supabase/progress.repo';
import {
  fetchClassSettings,
  fetchRecentActivity,
  fetchUserBadges,
  fetchUserCertificates,
} from '@/services/supabase/gamification.repo';
import type {
  ActivityEventRow,
  CertificateRow,
  ClassSettingsRow,
  LessonProgressRow,
  UserBadgeRow,
} from '@/types/database';

export interface DashboardData {
  progressByLesson: Record<string, LessonProgressRow | undefined>;
  badges: UserBadgeRow[];
  certificates: CertificateRow[];
  activity: ActivityEventRow[];
  classSettings: ClassSettingsRow | null;
}

const EMPTY: DashboardData = {
  progressByLesson: {},
  badges: [],
  certificates: [],
  activity: [],
  classSettings: null,
};

/**
 * Tải toàn bộ dữ liệu cho Dashboard học sinh trong một lần.
 *
 * Dùng `Promise.allSettled` thay vì `Promise.all`: nếu một phần dữ liệu phụ
 * (vd. huy hiệu) tải lỗi thì dashboard vẫn hiện được phần chính, thay vì
 * trắng cả trang giữa tiết học.
 */
export function useDashboardData() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const [data, setData] = useState<DashboardData>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setData(EMPTY);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const [progress, badges, certificates, activity, classSettings] = await Promise.allSettled([
      fetchAllLessonProgress(user.id),
      fetchUserBadges(user.id),
      fetchUserCertificates(user.id),
      fetchRecentActivity(user.id, 6),
      fetchClassSettings(profile?.class_name ?? null),
    ]);

    // Chỉ tiến trình học tập là dữ liệu bắt buộc — thiếu nó thì mới coi là lỗi.
    if (progress.status === 'rejected') {
      setError(
        progress.reason instanceof Error
          ? progress.reason.message
          : 'Không tải được tiến trình học tập.',
      );
      setIsLoading(false);
      return;
    }

    setData({
      progressByLesson: indexProgressByLesson(progress.value),
      badges: badges.status === 'fulfilled' ? badges.value : [],
      certificates: certificates.status === 'fulfilled' ? certificates.value : [],
      activity: activity.status === 'fulfilled' ? activity.value : [],
      classSettings: classSettings.status === 'fulfilled' ? classSettings.value : null,
    });
    setIsLoading(false);
  }, [user, profile?.class_name]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}
