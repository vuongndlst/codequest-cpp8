import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  EyeOff,
  GitBranch,
  Lock,
  LockOpen,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { LESSONS_META } from '@/data/lessons.meta';
import { fetchAllClassMembers, fetchMyClasses, type ClassMemberRow, type ClassRow } from '@/services/supabase/classes.repo';
import { fetchAccessibleAreaControls, upsertAreaControl } from '@/services/supabase/areaControls.repo';
import { fetchAllClassSettings, upsertClassSettings } from '@/services/supabase/teacher.repo';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { cn } from '@/utils/cn';
import type {
  ClassAreaAccessMode,
  ClassAreaControlRow,
  ClassSettingsRow,
} from '@/types/database';

const ACCESS_OPTIONS: Array<{
  value: ClassAreaAccessMode;
  label: string;
  description: string;
  icon: typeof GitBranch;
}> = [
  {
    value: 'sequence',
    label: 'Theo lộ trình',
    description: 'Xong khu vực trước mới mở',
    icon: GitBranch,
  },
  {
    value: 'open',
    label: 'Mở ngay',
    description: 'Vào được không cần điều kiện',
    icon: LockOpen,
  },
  {
    value: 'locked',
    label: 'Tạm khóa',
    description: 'Chặn truy cập đến khi giáo viên mở',
    icon: Lock,
  },
];

/** Điều phối nhịp học của từng lớp, tập trung vào đúng một lớp tại một thời điểm. */
export function TeacherSettingsPage() {
  const profile = useAuthStore((state) => state.profile);
  const [searchParams, setSearchParams] = useSearchParams();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [members, setMembers] = useState<ClassMemberRow[]>([]);
  const [controls, setControls] = useState<ClassAreaControlRow[]>([]);
  const [legacySettings, setLegacySettings] = useState<ClassSettingsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classRows, memberRows, controlRows, settingsRows] = await Promise.all([
        fetchMyClasses(),
        fetchAllClassMembers(),
        fetchAccessibleAreaControls(),
        fetchAllClassSettings(),
      ]);
      setClasses(classRows);
      setMembers(memberRows);
      setControls(controlRows);
      setLegacySettings(settingsRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được điều phối lớp.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const requestedClassId = searchParams.get('class');
  const selectedClass = classes.find((item) => item.id === requestedClassId) ?? classes[0] ?? null;
  const selectedControls = useMemo(
    () => new Map(
      controls
        .filter((control) => control.class_id === selectedClass?.id)
        .map((control) => [control.lesson_id, control]),
    ),
    [controls, selectedClass?.id],
  );
  const selectedLegacySetting = legacySettings.find(
    (setting) => setting.class_name === selectedClass?.name,
  );

  const saveArea = async (
    lessonId: string,
    patch: { accessMode?: ClassAreaAccessMode; dueDate?: string | null },
  ) => {
    if (!profile || !selectedClass) return;
    const current = selectedControls.get(lessonId);
    const key = `${selectedClass.id}:${lessonId}`;
    setSavingKey(key);
    setError(null);
    setNotice(null);

    try {
      const updated = await upsertAreaControl({
        classId: selectedClass.id,
        lessonId,
        accessMode: patch.accessMode ?? current?.access_mode ?? 'sequence',
        dueDate: patch.dueDate !== undefined ? patch.dueDate : (current?.due_date ?? null),
        teacherId: profile.id,
      });
      setControls((rows) => [
        ...rows.filter(
          (row) => !(row.class_id === updated.class_id && row.lesson_id === updated.lesson_id),
        ),
        updated,
      ]);
      setNotice(`Đã cập nhật Khu vực ${LESSONS_META.find((item) => item.id === lessonId)?.order ?? lessonId} cho lớp ${selectedClass.name}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không lưu được thay đổi.');
    } finally {
      setSavingKey(null);
    }
  };

  const toggleSolution = async () => {
    if (!profile || !selectedClass) return;
    const key = `${selectedClass.id}:solution`;
    setSavingKey(key);
    setError(null);
    try {
      const updated = await upsertClassSettings(
        selectedClass.name,
        { allow_solution_view: !(selectedLegacySetting?.allow_solution_view ?? false) },
        profile.id,
      );
      setLegacySettings((rows) => [
        ...rows.filter((row) => row.class_name !== updated.class_name),
        updated,
      ]);
      setNotice(`Đã lưu quyền xem lời giải cho lớp ${selectedClass.name}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không lưu được quyền xem lời giải.');
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) return <LoadingState label="Đang tải tiến độ lớp…" />;
  if (error && classes.length === 0) return <ErrorState description={error} onRetry={() => void load()} />;

  const studentCount = selectedClass
    ? members.filter((member) => member.class_id === selectedClass.id).length
    : 0;
  const allowSolution = selectedLegacySetting?.allow_solution_view ?? false;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link to="/teacher" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Bảng theo dõi lớp học
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Điều phối tiến độ lớp</h1>
          <p className="mt-1 text-sm text-slate-400">
            Đặt hạn hoàn thành và quyết định khu vực nào học sinh được truy cập.
          </p>
        </div>

        {classes.length > 0 && (
          <label className="grid gap-1 text-xs font-semibold text-slate-400">
            Đang điều phối lớp
            <select
              value={selectedClass?.id ?? ''}
              onChange={(event) => setSearchParams({ class: event.target.value })}
              className="h-10 min-w-52 rounded-xl border border-abyss-600 bg-abyss-800 px-3 text-sm font-semibold text-slate-100"
            >
              {classes.map((classRow) => (
                <option key={classRow.id} value={classRow.id}>{classRow.name}</option>
              ))}
            </select>
          </label>
        )}
      </header>

      {error && <Alert tone="warning" live>{error}</Alert>}
      {notice && <Alert tone="success" live>{notice}</Alert>}

      <Alert tone="info" title="Cách dùng phù hợp trong lớp học">
        Giữ “Theo lộ trình” cho hoạt động tự luyện. Chọn “Tạm khóa” khi cần cả lớp dừng ở cùng một mốc; hạn hoàn thành chỉ nhắc lịch, không tự khóa hay trừ điểm.
      </Alert>

      {!selectedClass ? (
        <EmptyState
          title="Chưa có lớp để điều phối"
          description="Tạo lớp và gửi mã lớp cho học sinh trước, sau đó lịch học sẽ xuất hiện tại đây."
          action={<Link to="/teacher/classes"><Button>Tạo hoặc quản lý lớp</Button></Link>}
        />
      ) : (
        <>
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-abyss-700 px-4 py-4 sm:px-5">
              <CardHeader
                title={`Lớp ${selectedClass.name}`}
                description={`${studentCount} học sinh · ${selectedClass.school_year ?? 'Chưa đặt năm học'}`}
                headingLevel={2}
              />
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-slate-500 sm:ml-auto sm:max-w-xl">
                {ACCESS_OPTIONS.map((option) => (
                  <span key={option.value}>{option.label}</span>
                ))}
              </div>
            </div>

            <ul className="divide-y divide-abyss-700">
              {LESSONS_META.map((lesson) => {
                const control = selectedControls.get(lesson.id);
                const mode = control?.access_mode ?? 'sequence';
                const isSaving = savingKey === `${selectedClass.id}:${lesson.id}`;

                return (
                  <li key={lesson.id} className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(13rem,1fr)_minmax(25rem,1.6fr)_12rem] lg:items-center">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-quest-400">Khu vực {lesson.order}</p>
                      <p className="truncate font-bold text-slate-100">{lesson.zoneName}</p>
                      <p className="truncate text-xs text-slate-500">{lesson.title}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-1 rounded-xl border border-abyss-700 bg-abyss-950/60 p-1" role="group" aria-label={`Quyền truy cập ${lesson.zoneName}`}>
                      {ACCESS_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const active = mode === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            title={option.description}
                            disabled={isSaving}
                            aria-pressed={active}
                            onClick={() => void saveArea(lesson.id, { accessMode: option.value })}
                            className={cn(
                              'inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors disabled:opacity-50',
                              active
                                ? option.value === 'locked'
                                  ? 'bg-alert-500/15 text-alert-400'
                                  : option.value === 'open'
                                    ? 'bg-verdant-500/15 text-verdant-400'
                                    : 'bg-quest-500/15 text-quest-300'
                                : 'text-slate-500 hover:bg-abyss-700 hover:text-slate-200',
                            )}
                          >
                            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <label className="grid gap-1 text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> Hạn hoàn thành</span>
                      <input
                        type="date"
                        value={control?.due_date ?? ''}
                        disabled={isSaving}
                        onChange={(event) => void saveArea(lesson.id, { dueDate: event.target.value || null })}
                        className="h-10 rounded-xl border border-abyss-600 bg-abyss-800 px-3 text-sm text-slate-200 disabled:opacity-50"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="flex flex-wrap items-center gap-3">
            <span className={cn('grid size-10 place-items-center rounded-xl', allowSolution ? 'bg-treasure-400/15 text-treasure-300' : 'bg-abyss-700 text-slate-500')}>
              {allowSolution ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-100">Quyền xem lời giải mẫu</p>
              <p className="text-xs text-slate-500">Chỉ là phương án hỗ trợ cuối cùng sau các tầng gợi ý.</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              isLoading={savingKey === `${selectedClass.id}:solution`}
              onClick={() => void toggleSolution()}
            >
              {allowSolution ? 'Tắt quyền xem' : 'Cho phép xem'}
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
