import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { fetchAllLessonProgress, indexProgressByLesson } from '@/services/supabase/progress.repo';
import { fetchClassSettings } from '@/services/supabase/gamification.repo';
import { fetchAccessibleAreaControls } from '@/services/supabase/areaControls.repo';
import { getPacingOverrides } from '@/utils/classPacing';
import { isLessonUnlocked } from '@/utils/progression';
import type { ClassAreaControlRow, LessonProgressRow } from '@/types/database';

interface LessonAccessState {
  progressByLesson: Record<string, LessonProgressRow | undefined>;
  control: ClassAreaControlRow | null;
  controls: ClassAreaControlRow[];
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_PROGRESS: Record<string, LessonProgressRow | undefined> = {};

/** Một nguồn kiểm tra quyền dùng chung cho trang khu vực, nhiệm vụ và checkpoint. */
export function useLessonAccess(lessonId: string, options?: { disabled?: boolean }): LessonAccessState {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const disabled = options?.disabled ?? false;
  const isTeacher = profile?.role === 'teacher';

  const [progressByLesson, setProgressByLesson] = useState(EMPTY_PROGRESS);
  const [controls, setControls] = useState<ClassAreaControlRow[]>([]);
  const [legacyUnlocked, setLegacyUnlocked] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(!disabled && !isTeacher);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (disabled || isTeacher) {
      setIsLoading(false);
      return;
    }
    if (!user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void Promise.all([
      fetchAllLessonProgress(user.id),
      fetchClassSettings(profile?.class_name ?? null),
      fetchAccessibleAreaControls(),
    ])
      .then(([progressRows, settings, areaControls]) => {
        if (cancelled) return;
        setProgressByLesson(indexProgressByLesson(progressRows));
        setLegacyUnlocked(settings?.unlocked_lessons ?? []);
        setControls(areaControls);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Không kiểm tra được quyền truy cập khu vực.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [disabled, isTeacher, profile?.class_name, user]);

  const control = controls.find((item) => item.lesson_id === lessonId) ?? null;
  const overrides = useMemo(() => getPacingOverrides(controls), [controls]);
  // Router bảo vệ toàn bộ /app. Khi component được render độc lập trong test/
  // Storybook không có user, không biến lớp bảo vệ dữ liệu thành màn khóa giả.
  const isUnlocked = disabled || isTeacher || !user || isLessonUnlocked(lessonId, {
    progressByLesson,
    teacherUnlockedLessons: [...legacyUnlocked, ...overrides.teacherUnlockedLessons],
    teacherLockedLessons: overrides.teacherLockedLessons,
    isTeacher,
  });

  return { progressByLesson, control, controls, isUnlocked, isLoading, error };
}
