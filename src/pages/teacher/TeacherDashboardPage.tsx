import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Download,
  GraduationCap,
  Settings,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchAllCertificates,
  fetchAllProgress,
  fetchRecentAttempts,
  fetchStudents,
  type StudentProfile,
} from '@/services/supabase/teacher.repo';
import {
  buildCsvFileName,
  buildProgressCsv,
  buildStudentSummaries,
  computeErrorStats,
  computeLessonOverview,
  downloadCsv,
  listClassNames,
  type StudentSummary,
} from '@/services/teacherAnalytics';
import { LESSONS_META } from '@/data/lessons.meta';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, StatTile } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { CertificateRow, ChallengeAttemptRow, LessonProgressRow } from '@/types/database';

/** Dashboard giáo viên — danh sách lớp, tiến trình, lỗi phổ biến, xuất CSV. */
export function TeacherDashboardPage() {
  const profile = useAuthStore((state) => state.profile);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [progress, setProgress] = useState<LessonProgressRow[]>([]);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [attempts, setAttempts] = useState<ChallengeAttemptRow[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [studentRows, progressRows, certificateRows, attemptRows] = await Promise.all([
          fetchStudents(),
          fetchAllProgress(),
          fetchAllCertificates(),
          fetchRecentAttempts(),
        ]);
        if (cancelled) return;
        setStudents(studentRows);
        setProgress(progressRows);
        setCertificates(certificateRows);
        setAttempts(attemptRows);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const classNames = useMemo(() => listClassNames(students), [students]);

  const filteredStudents = useMemo(
    () =>
      selectedClass ? students.filter((student) => student.class_name === selectedClass) : students,
    [students, selectedClass],
  );

  const studentIds = useMemo(
    () => new Set(filteredStudents.map((student) => student.id)),
    [filteredStudents],
  );

  const filteredAttempts = useMemo(
    () => attempts.filter((attempt) => studentIds.has(attempt.user_id)),
    [attempts, studentIds],
  );

  const summaries = useMemo<StudentSummary[]>(
    () =>
      buildStudentSummaries({
        students: filteredStudents,
        progress: progress.filter((row) => studentIds.has(row.user_id)),
        certificates: certificates.filter((row) => studentIds.has(row.user_id)),
        attempts: filteredAttempts,
      }),
    [filteredStudents, progress, certificates, filteredAttempts, studentIds],
  );

  const errorStats = useMemo(() => computeErrorStats(filteredAttempts), [filteredAttempts]);

  const lessonOverview = useMemo(
    () =>
      computeLessonOverview(
        filteredStudents,
        progress.filter((row) => studentIds.has(row.user_id)),
      ),
    [filteredStudents, progress, studentIds],
  );

  if (isLoading) return <LoadingState label="Đang tải dữ liệu lớp học…" />;
  if (error) return <ErrorState description={error} onRetry={() => window.location.reload()} />;

  const totalCertificates = summaries.reduce((sum, item) => sum + item.certificatesCount, 0);
  const activeToday = summaries.filter(
    (item) =>
      item.lastActiveAt && Date.now() - new Date(item.lastActiveAt).getTime() < 24 * 3600 * 1000,
  ).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Bảng theo dõi lớp học</h1>
          <p className="text-sm text-slate-400 mt-1">
            Xin chào {profile?.full_name}. Dữ liệu dưới đây chỉ gồm những gì cần cho việc dạy.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/teacher/settings">
            <Button
              variant="secondary"
              leadingIcon={<Settings className="size-4" aria-hidden="true" />}
            >
              Cài đặt lớp
            </Button>
          </Link>
          <Button
            onClick={() => downloadCsv(buildProgressCsv(summaries), buildCsvFileName(selectedClass))}
            disabled={summaries.length === 0}
            leadingIcon={<Download className="size-4" aria-hidden="true" />}
          >
            Xuất CSV
          </Button>
        </div>
      </header>

      {/* --- Lọc theo lớp --- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">Lớp:</span>
        <FilterChip
          label={`Tất cả (${students.length})`}
          active={selectedClass === null}
          onClick={() => setSelectedClass(null)}
        />
        {classNames.map((className) => (
          <FilterChip
            key={className}
            label={`${className} (${students.filter((s) => s.class_name === className).length})`}
            active={selectedClass === className}
            onClick={() => setSelectedClass(className)}
          />
        ))}
      </div>

      {/* --- Chỉ số tổng quan --- */}
      <section aria-label="Tổng quan" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Học sinh"
          value={filteredStudents.length}
          icon={<Users className="size-5" />}
        />
        <StatTile
          label="Hoạt động 24 giờ qua"
          value={activeToday}
          icon={<GraduationCap className="size-5" />}
          tone="verdant"
        />
        <StatTile
          label="Chứng chỉ đã cấp"
          value={totalCertificates}
          icon={<GraduationCap className="size-5" />}
          tone="treasure"
        />
        <StatTile
          label="Lượt chạy code"
          value={filteredAttempts.length}
          icon={<AlertTriangle className="size-5" />}
          tone="mage"
        />
      </section>

      {/* --- Tiến trình theo khu vực --- */}
      <Card>
        <CardHeader
          title="Tiến trình theo khu vực"
          description="Trung bình trên tổng số học sinh của phạm vi đang chọn"
        />
        <ul className="space-y-3 list-none">
          {lessonOverview.map((lesson) => (
            <li key={lesson.lessonId}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-300">
                  Khu vực {lesson.order} · {lesson.zoneName}
                </span>
                <span className="text-slate-400 tabular-nums">
                  {lesson.studentsCompleted} hoàn thành · {lesson.studentsStarted} đã bắt đầu
                </span>
              </div>
              <ProgressBar
                value={lesson.averagePercent}
                label={`Tiến trình trung bình ${lesson.zoneName}`}
                tone={lesson.averagePercent >= 80 ? 'verdant' : 'quest'}
                size="sm"
              />
            </li>
          ))}
        </ul>
      </Card>

      {/* --- Lỗi phổ biến --- */}
      <Card>
        <CardHeader
          title="Lỗi phổ biến của lớp"
          description="Cột số học sinh đáng tin hơn cột số lượt — một em thử 30 lần không có nghĩa cả lớp đang vướng"
          icon={<TriangleAlert className="size-5 text-treasure-400" aria-hidden="true" />}
        />

        {errorStats.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu lỗi"
            description="Khi học sinh bắt đầu chạy code, thống kê lỗi sẽ hiện ở đây."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Thống kê lỗi phổ biến của lớp</caption>
              <thead>
                <tr className="text-left text-slate-500 border-b border-abyss-700">
                  <th scope="col" className="py-2 font-medium">
                    Loại lỗi
                  </th>
                  <th scope="col" className="py-2 font-medium text-right">
                    Số học sinh
                  </th>
                  <th scope="col" className="py-2 font-medium text-right">
                    Tổng lượt
                  </th>
                </tr>
              </thead>
              <tbody>
                {errorStats.slice(0, 8).map((stat) => (
                  <tr key={stat.code} className="border-b border-abyss-800 last:border-0">
                    <td className="py-2 text-slate-200">{stat.label}</td>
                    <td className="py-2 text-right tabular-nums text-treasure-300 font-semibold">
                      {stat.studentCount}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{stat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* --- Danh sách học sinh --- */}
      <Card>
        <CardHeader
          title={`Danh sách học sinh (${summaries.length})`}
          description="Bấm vào một em để xem chi tiết"
        />

        {summaries.length === 0 ? (
          <EmptyState
            title="Chưa có học sinh nào"
            description="Khi học sinh đăng ký tài khoản, các em sẽ xuất hiện ở đây."
          />
        ) : (
          <ul className="space-y-2 list-none">
            {summaries.map((summary) => (
              <li key={summary.student.id}>
                <Link
                  to={`/teacher/students/${summary.student.id}`}
                  className="flex items-center gap-3 cq-panel p-3 hover:border-quest-500/60 transition-colors"
                >
                  <AvatarIcon avatarId={summary.student.avatar_id} size={40} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-100 truncate">
                        {summary.student.full_name}
                      </span>
                      {summary.student.class_name && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-abyss-700 text-slate-400">
                          {summary.student.class_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Lv{summary.student.level} · {summary.student.total_xp} XP ·{' '}
                      {summary.lessonsCompleted}/{LESSONS_META.length} khu vực
                      {summary.topErrors[0] && <> · hay vướng: {summary.topErrors[0].label}</>}
                    </p>
                  </div>

                  <div className="hidden sm:block w-32 shrink-0">
                    <ProgressBar
                      value={summary.overallPercent}
                      label={`Tiến trình của ${summary.student.full_name}`}
                      size="sm"
                    />
                  </div>

                  <span className="text-xs text-slate-500 shrink-0 w-24 text-right">
                    {summary.lastActiveAt ? formatRelativeTime(summary.lastActiveAt) : 'Chưa học'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-3 h-8 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-quest-500/15 text-quest-400 border border-quest-500/50'
          : 'bg-abyss-800 text-slate-400 border border-abyss-600 hover:text-slate-200',
      )}
    >
      {label}
    </button>
  );
}
