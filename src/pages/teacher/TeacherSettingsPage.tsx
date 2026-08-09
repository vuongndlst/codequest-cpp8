import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, LockOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchAllClassSettings,
  fetchStudents,
  upsertClassSettings,
  type StudentProfile,
} from '@/services/supabase/teacher.repo';
import { listClassNames } from '@/services/teacherAnalytics';
import { LESSONS_META } from '@/data/lessons.meta';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { cn } from '@/utils/cn';
import type { ClassSettingsRow } from '@/types/database';

/**
 * Cài đặt lớp (mục 16): mở/khoá khu vực và bật/tắt quyền xem đáp án.
 *
 * Hai cài đặt này đọc được bởi mọi học sinh (policy `class_settings_select_all`)
 * nhưng chỉ giáo viên mới sửa được (`class_settings_update_teacher`).
 */
export function TeacherSettingsPage() {
  const profile = useAuthStore((state) => state.profile);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [settings, setSettings] = useState<ClassSettingsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingClass, setSavingClass] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentRows, settingRows] = await Promise.all([
        fetchStudents(),
        fetchAllClassSettings(),
      ]);
      setStudents(studentRows);
      setSettings(settingRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được cài đặt.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (className: string, patch: Parameters<typeof upsertClassSettings>[1]) => {
    if (!profile) return;
    setSavingClass(className);
    setNotice(null);

    try {
      const updated = await upsertClassSettings(className, patch, profile.id);
      setSettings((current) => {
        const others = current.filter((row) => row.class_name !== className);
        return [...others, updated].sort((a, b) => a.class_name.localeCompare(b.class_name, 'vi'));
      });
      setNotice(`Đã lưu cài đặt cho lớp ${className}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không lưu được cài đặt.');
    } finally {
      setSavingClass(null);
    }
  };

  if (isLoading) return <LoadingState label="Đang tải cài đặt lớp…" />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  const classNames = listClassNames(students);
  const settingsByClass = new Map(settings.map((row) => [row.class_name, row]));

  return (
    <div className="space-y-5">
      <Link
        to="/teacher"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Bảng theo dõi lớp học
      </Link>

      <header>
        <h1 className="text-2xl font-extrabold text-slate-100">Cài đặt lớp</h1>
        <p className="text-sm text-slate-400 mt-1">
          Mở thêm khu vực cho lớp, hoặc cho phép học sinh xem đáp án mẫu.
        </p>
      </header>

      {notice && (
        <Alert tone="success" live>
          {notice}
        </Alert>
      )}

      <Alert tone="info" title="Quy tắc mở khoá mặc định">
        Bình thường học sinh phải hoàn thành khu vực trước mới mở được khu vực sau. Những khu vực
        thầy mở thêm ở đây sẽ vào được ngay, không cần điều kiện.
      </Alert>

      {classNames.length === 0 ? (
        <EmptyState
          title="Chưa có lớp nào"
          description="Khi học sinh đăng ký và điền tên lớp, danh sách lớp sẽ hiện ở đây."
        />
      ) : (
        <div className="space-y-4">
          {classNames.map((className) => {
            const setting = settingsByClass.get(className);
            const unlocked = setting?.unlocked_lessons ?? [];
            const allowSolution = setting?.allow_solution_view ?? false;
            const studentCount = students.filter((s) => s.class_name === className).length;
            const isSaving = savingClass === className;

            return (
              <Card key={className}>
                <CardHeader
                  title={`Lớp ${className}`}
                  description={`${studentCount} học sinh`}
                  headingLevel={2}
                />

                {/* Mở khoá khu vực */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-200 mb-2">Mở thêm khu vực</p>
                  <div className="flex flex-wrap gap-2">
                    {LESSONS_META.map((lesson) => {
                      const isUnlocked = unlocked.includes(lesson.id);
                      // Khu vực 1 luôn mở cho mọi học sinh, không cần cài đặt
                      const isAlwaysOpen = lesson.order === 1;

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          disabled={isSaving || isAlwaysOpen}
                          aria-pressed={isUnlocked || isAlwaysOpen}
                          onClick={() =>
                            void save(className, {
                              unlocked_lessons: isUnlocked
                                ? unlocked.filter((id) => id !== lesson.id)
                                : [...unlocked, lesson.id],
                            })
                          }
                          className={cn(
                            'flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium border transition-colors',
                            'disabled:opacity-60 disabled:cursor-not-allowed',
                            isAlwaysOpen
                              ? 'bg-abyss-700 text-slate-400 border-abyss-600'
                              : isUnlocked
                                ? 'bg-verdant-500/15 text-verdant-400 border-verdant-500/50'
                                : 'bg-abyss-800 text-slate-400 border-abyss-600 hover:text-slate-200',
                          )}
                        >
                          {isUnlocked || isAlwaysOpen ? (
                            <LockOpen className="size-3.5" aria-hidden="true" />
                          ) : (
                            <Lock className="size-3.5" aria-hidden="true" />
                          )}
                          KV{lesson.order} · {lesson.zoneName}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Khu vực 1 luôn mở nên không cần cài đặt.
                  </p>
                </div>

                {/* Quyền xem đáp án */}
                <div className="cq-panel p-3 flex items-center gap-3 flex-wrap">
                  <span
                    className={cn(
                      'grid place-items-center size-9 rounded-xl shrink-0',
                      allowSolution
                        ? 'bg-treasure-400/15 text-treasure-400'
                        : 'bg-abyss-700 text-slate-500',
                    )}
                    aria-hidden="true"
                  >
                    {allowSolution ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200">
                      Cho phép xem đáp án mẫu
                    </p>
                    <p className="text-xs text-slate-500">
                      {allowSolution
                        ? 'Học sinh xem được đáp án sau khi đã mở hết 3 gợi ý.'
                        : 'Đáp án chỉ mở sau khi học sinh dùng hết gợi ý VÀ thử ít nhất 6 lần.'}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={allowSolution ? 'secondary' : 'primary'}
                    isLoading={isSaving}
                    loadingLabel="Đang lưu"
                    onClick={() =>
                      void save(className, { allow_solution_view: !allowSolution })
                    }
                  >
                    {allowSolution ? 'Tắt' : 'Bật'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
