import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  GraduationCap,
  Settings,
  Ticket,
  TriangleAlert,
  UserRoundSearch,
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
  fetchAllClassMembers,
  fetchMyClasses,
  type ClassMemberRow,
  type ClassRow,
} from '@/services/supabase/classes.repo';
import {
  ATTENTION_LABELS,
  buildCsvFileName,
  buildProgressCsv,
  buildStudentSummaries,
  computeErrorStats,
  computeLessonOverview,
  downloadCsv,
  findStudentsNeedingAttention,
  type StudentSummary,
} from '@/services/teacherAnalytics';
import { LESSONS_META } from '@/data/lessons.meta';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, StatTile } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { CertificateRow, ChallengeAttemptRow, LessonProgressRow } from '@/types/database';

/**
 * Phạm vi đang xem: một lớp cụ thể, nhóm chưa vào lớp, hay tất cả.
 *
 * `'unassigned'` là nhóm cần nhìn thấy nhất chứ không phải nhóm phụ: đó là
 * những em đăng ký trước khi có mã lớp, hoặc gõ sai mã. Không có nhóm này thì
 * các em biến mất khỏi mọi bộ lọc mà không ai để ý.
 */
type ClassScope = string | 'unassigned' | null;

/** Dashboard giáo viên — danh sách lớp, tiến trình, lỗi phổ biến, xuất CSV. */
export function TeacherDashboardPage() {
  const profile = useAuthStore((state) => state.profile);

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [progress, setProgress] = useState<LessonProgressRow[]>([]);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [attempts, setAttempts] = useState<ChallengeAttemptRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [members, setMembers] = useState<ClassMemberRow[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassScope>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [studentRows, progressRows, certificateRows, attemptRows, classRows, memberRows] =
          await Promise.all([
            fetchStudents(),
            fetchAllProgress(),
            fetchAllCertificates(),
            fetchRecentAttempts(),
            fetchMyClasses(),
            fetchAllClassMembers(),
          ]);
        if (cancelled) return;
        setStudents(studentRows);
        setProgress(progressRows);
        setCertificates(certificateRows);
        setAttempts(attemptRows);
        setClasses(classRows);
        setMembers(memberRows);
        setSelectedClass((current) => current ?? classRows[0]?.id ?? null);
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

  const classById = useMemo(
    () => new Map(classes.map((classRow) => [classRow.id, classRow])),
    [classes],
  );

  const classIdByStudent = useMemo(
    () => new Map(members.map((member) => [member.student_id, member.class_id])),
    [members],
  );

  /**
   * Lấy tên lớp THẬT thay cho ô chữ tự do trong hồ sơ.
   *
   * Trước đây `profiles.class_name` do học sinh tự gõ, nên "8A1", "8a1" và
   * "8 A1" là ba lớp khác nhau trong mọi thống kê. Nay bảng `class_members`
   * mới là nguồn sự thật; ô chữ cũ chỉ còn dùng cho em chưa vào lớp nào.
   */
  const normalizedStudents = useMemo(
    () =>
      students.map((student) => {
        const classId = classIdByStudent.get(student.id);
        const realClass = classId ? classById.get(classId) : undefined;
        return realClass ? { ...student, class_name: realClass.name } : student;
      }),
    [students, classIdByStudent, classById],
  );

  const unassignedCount = useMemo(
    () => normalizedStudents.filter((student) => !classIdByStudent.has(student.id)).length,
    [normalizedStudents, classIdByStudent],
  );

  const filteredStudents = useMemo(() => {
    if (selectedClass === null) return normalizedStudents;
    if (selectedClass === 'unassigned') {
      return normalizedStudents.filter((student) => !classIdByStudent.has(student.id));
    }
    return normalizedStudents.filter(
      (student) => classIdByStudent.get(student.id) === selectedClass,
    );
  }, [normalizedStudents, classIdByStudent, selectedClass]);

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

  const attention = useMemo(() => findStudentsNeedingAttention(summaries), [summaries]);

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

  /** Tên phạm vi đang chọn — dùng đặt tên file CSV cho khỏi lẫn khi tải nhiều lần. */
  const selectedClassName =
    selectedClass === null
      ? null
      : selectedClass === 'unassigned'
        ? 'ChuaVaoLop'
        : (classById.get(selectedClass)?.name ?? null);

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
          <Link to="/teacher/classes">
            <Button
              variant="secondary"
              leadingIcon={<Ticket className="size-4" aria-hidden="true" />}
            >
              Lớp của tôi
            </Button>
          </Link>
          <Link to={selectedClass && selectedClass !== 'unassigned' ? `/teacher/settings?class=${selectedClass}` : '/teacher/settings'}>
            <Button
              leadingIcon={<Settings className="size-4" aria-hidden="true" />}
            >
              Điều phối tiến độ
            </Button>
          </Link>
          <Button
            onClick={() =>
              downloadCsv(buildProgressCsv(summaries), buildCsvFileName(selectedClassName))
            }
            disabled={summaries.length === 0}
            variant="ghost"
            size="sm"
            leadingIcon={<Download className="size-4" aria-hidden="true" />}
          >
            Xuất CSV
          </Button>
        </div>
      </header>

      {/* --- Lọc theo lớp thật (bảng class_members), không phải ô chữ tự do --- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">Lớp:</span>
        <FilterChip
          label={`Tất cả (${students.length})`}
          active={selectedClass === null}
          onClick={() => setSelectedClass(null)}
        />
        {classes.map((classRow) => {
          const count = members.filter((member) => member.class_id === classRow.id).length;
          return (
            <FilterChip
              key={classRow.id}
              label={`${classRow.name} (${count})`}
              active={selectedClass === classRow.id}
              onClick={() => setSelectedClass(classRow.id)}
            />
          );
        })}
        {unassignedCount > 0 && (
          <FilterChip
            label={`Chưa vào lớp (${unassignedCount})`}
            active={selectedClass === 'unassigned'}
            onClick={() => setSelectedClass('unassigned')}
          />
        )}
      </div>

      {classes.length === 0 && (
        <Alert tone="tip" title="Thầy cô chưa tạo lớp nào">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="leading-relaxed">
              Tạo lớp để có mã cho học sinh nhập. Khi đó bảng theo dõi sẽ tách đúng từng lớp thay
              vì gộp chung toàn trường.
            </p>
            <Link to="/teacher/classes" className="shrink-0">
              <Button size="sm" leadingIcon={<Ticket className="size-4" aria-hidden="true" />}>
                Tạo lớp đầu tiên
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {selectedClass === 'unassigned' && (
        <Alert tone="warning">
          Những em này chưa nhập mã lớp nào. Thầy cô gửi lại mã lớp cho các em — em vào mục Hồ sơ
          rồi bấm "Nhập mã lớp" là xong.
        </Alert>
      )}

      {/* --- Chỉ số tổng quan --- */}
      <section aria-label="Tổng quan" className="grid sm:grid-cols-3 gap-3">
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
          label="Cần giáo viên chú ý"
          value={attention.length}
          icon={<UserRoundSearch className="size-5" />}
          tone="treasure"
        />
      </section>

      {/* --- Việc cần xử lý — phần khác biệt căn bản với dashboard học sinh --- */}
      <Card>
        <CardHeader
          title={`Cần chú ý (${attention.length})`}
          description="Học sinh nên hỏi thăm trước, xếp theo mức gấp"
          icon={<UserRoundSearch className="size-5 text-treasure-400" aria-hidden="true" />}
        />

        {attention.length === 0 ? (
          <EmptyState
            title="Cả lớp đang đi đều"
            description="Không em nào bỏ dở hay vướng bất thường. Thầy cô cứ dạy tiếp nhé."
          />
        ) : (
          <ul className="space-y-2 list-none">
            {attention.slice(0, 10).map((item) => (
              <li key={item.summary.student.id}>
                <Link
                  to={`/teacher/students/${item.summary.student.id}`}
                  className="flex items-center gap-3 cq-panel p-3 hover:border-quest-500/60 transition-colors"
                >
                  <AvatarIcon avatarId={item.summary.student.avatar_id} size={36} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-100 truncate">
                        {item.summary.student.full_name}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          item.reason === 'chua-bat-dau'
                            ? 'bg-alert-500/15 text-alert-400'
                            : item.reason === 'dang-vuong'
                              ? 'bg-treasure-400/15 text-treasure-300'
                              : 'bg-abyss-700 text-slate-400',
                        )}
                      >
                        {ATTENTION_LABELS[item.reason]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{item.detail}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

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
