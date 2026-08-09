import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lightbulb, RotateCcw, ScrollText } from 'lucide-react';
import {
  fetchAllCertificates,
  fetchAllProgress,
  fetchRecentAttempts,
  fetchStudents,
  resetChallengeForStudent,
  type StudentProfile,
} from '@/services/supabase/teacher.repo';
import { buildStudentSummaries, computeErrorStats } from '@/services/teacherAnalytics';
import { LESSONS_META, CERTIFICATE_NAMES } from '@/data/lessons.meta';
import { getLesson } from '@/lessons';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, StatTile } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StarRating } from '@/components/game/StarRating';
import { Alert } from '@/components/ui/Alert';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { formatDate, formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { CertificateRow, ChallengeAttemptRow, LessonProgressRow } from '@/types/database';

/**
 * Chi tiết một học sinh.
 *
 * Chỉ hiển thị dữ liệu phục vụ việc dạy: tiến trình, số lần thử, lỗi hay gặp,
 * mức gợi ý đã dùng, chứng chỉ. Cố ý KHÔNG hiển thị code nháp giữa chừng —
 * đó là chuyện riêng của học sinh (mục 16: không hiển thị dữ liệu không cần thiết).
 */
export function TeacherStudentDetailPage() {
  const { userId = '' } = useParams();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [progress, setProgress] = useState<LessonProgressRow[]>([]);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [attempts, setAttempts] = useState<ChallengeAttemptRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [students, progressRows, certificateRows, attemptRows] = await Promise.all([
        fetchStudents(),
        fetchAllProgress(),
        fetchAllCertificates(),
        fetchRecentAttempts(),
      ]);

      setStudent(students.find((item) => item.id === userId) ?? null);
      setProgress(progressRows.filter((row) => row.user_id === userId));
      setCertificates(certificateRows.filter((row) => row.user_id === userId));
      setAttempts(attemptRows.filter((row) => row.user_id === userId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(
    () =>
      student
        ? buildStudentSummaries({ students: [student], progress, certificates, attempts })[0]
        : null,
    [student, progress, certificates, attempts],
  );

  const errorStats = useMemo(() => computeErrorStats(attempts), [attempts]);

  const attemptsByChallenge = useMemo(() => {
    const map = new Map<string, ChallengeAttemptRow[]>();
    for (const attempt of attempts) {
      const bucket = map.get(attempt.challenge_id);
      if (bucket) bucket.push(attempt);
      else map.set(attempt.challenge_id, [attempt]);
    }
    return map;
  }, [attempts]);

  const handleReset = async (lessonId: string, challengeId: string, title: string) => {
    setResettingId(challengeId);
    setNotice(null);

    try {
      await resetChallengeForStudent(userId, lessonId, challengeId);
      setNotice(
        `Đã đặt lại nhiệm vụ "${title}". Em ấy có thể làm lại từ đầu; điểm XP đã nhận vẫn được giữ nguyên.`,
      );
      await load();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Không đặt lại được.');
    } finally {
      setResettingId(null);
    }
  };

  if (isLoading) return <LoadingState label="Đang tải hồ sơ học sinh…" />;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (!student || !summary) return <NotFoundPage />;

  const progressByLesson = new Map(progress.map((row) => [row.lesson_id, row]));
  const certificateByLesson = new Map(certificates.map((row) => [row.lesson_id, row]));

  return (
    <div className="space-y-5">
      <Link
        to="/teacher"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Bảng theo dõi lớp học
      </Link>

      {notice && (
        <Alert tone="success" live>
          {notice}
        </Alert>
      )}

      {/* --- Thông tin học sinh --- */}
      <section className="cq-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <AvatarIcon avatarId={student.avatar_id} size={64} glow />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-slate-100">{student.full_name}</h1>
            <p className="text-sm text-slate-400">
              {student.class_name && <>Lớp {student.class_name}</>}
              {student.student_code && <> · Mã {student.student_code}</>}
              {' · '}
              {summary.lastActiveAt
                ? `Hoạt động ${formatRelativeTime(summary.lastActiveAt)}`
                : 'Chưa bắt đầu học'}
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Chỉ số học tập" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Tiến trình toàn khoá"
          value={`${summary.overallPercent}%`}
          icon={<ScrollText className="size-5" />}
        />
        <StatTile
          label="Số lần thử TB / nhiệm vụ"
          value={summary.averageAttemptsPerSolved || '—'}
          icon={<RotateCcw className="size-5" />}
          tone="mage"
          sublabel="cao thì em ấy đang vất vả"
        />
        <StatTile
          label="Mức gợi ý cao nhất"
          value={`${summary.maxHintLevel}/3`}
          icon={<Lightbulb className="size-5" />}
          tone="treasure"
          sublabel="dùng gợi ý là bình thường"
        />
        <StatTile
          label="Clean code trung bình"
          value={summary.averageCleanCode ?? '—'}
          icon={<ScrollText className="size-5" />}
          tone="verdant"
        />
      </section>

      {/* --- Tiến trình từng khu vực + nút đặt lại --- */}
      <Card>
        <CardHeader
          title="Tiến trình từng khu vực"
          description="Bấm Đặt lại để cho em ấy làm lại một nhiệm vụ. XP đã nhận vẫn được giữ."
        />

        <div className="space-y-4">
          {LESSONS_META.map((meta) => {
            const lessonProgress = progressByLesson.get(meta.id);
            const certificate = certificateByLesson.get(meta.id);
            const lesson = getLesson(meta.id);
            const completed = lessonProgress?.completed_challenges ?? [];

            return (
              <div key={meta.id} className="cq-panel p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <div>
                    <p className="font-semibold text-slate-100">
                      Khu vực {meta.order} · {meta.zoneName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {completed.length}/{meta.challengeCount} nhiệm vụ
                      {certificate && (
                        <> · Chứng chỉ {CERTIFICATE_NAMES[meta.certificateCode]} cấp ngày {formatDate(certificate.issued_at)}</>
                      )}
                    </p>
                  </div>
                  <StarRating stars={lessonProgress?.stars ?? 0} size="sm" />
                </div>

                <ProgressBar
                  value={lessonProgress?.progress_percent ?? 0}
                  label={`Tiến trình ${meta.zoneName}`}
                  size="sm"
                  tone={lessonProgress?.status === 'completed' ? 'verdant' : 'quest'}
                />

                {lesson && completed.length > 0 && (
                  <ul className="mt-3 space-y-1 list-none">
                    {lesson.challenges
                      .filter((challenge) => completed.includes(challenge.id))
                      .map((challenge) => {
                        const challengeAttempts = attemptsByChallenge.get(challenge.id) ?? [];
                        const maxHint = challengeAttempts.reduce(
                          (max, attempt) => Math.max(max, attempt.hint_level_used),
                          0,
                        );

                        return (
                          <li
                            key={challenge.id}
                            className="flex items-center gap-2 text-xs py-1"
                          >
                            <span className="text-slate-300 flex-1 truncate">
                              {challenge.title}
                            </span>
                            <span className="text-slate-500 tabular-nums shrink-0">
                              {challengeAttempts.length} lần thử
                              {maxHint > 0 && ` · gợi ý ${maxHint}/3`}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              isLoading={resettingId === challenge.id}
                              loadingLabel="Đang đặt lại"
                              onClick={() =>
                                void handleReset(meta.id, challenge.id, challenge.title)
                              }
                            >
                              Đặt lại
                            </Button>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* --- Lỗi hay gặp --- */}
      <Card>
        <CardHeader
          title="Lỗi em ấy hay gặp"
          description="Dùng để biết nên nhắc lại kiến thức nào cho riêng em này"
        />

        {errorStats.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu"
            description="Khi em ấy bắt đầu chạy code, thống kê lỗi sẽ hiện ở đây."
          />
        ) : (
          <ul className="space-y-2 list-none">
            {errorStats.slice(0, 6).map((stat) => (
              <li key={stat.code} className="flex items-center gap-3">
                <span className="text-sm text-slate-200 flex-1">{stat.label}</span>
                <div className="w-32">
                  <ProgressBar
                    value={stat.count}
                    max={errorStats[0].count}
                    label={`Số lượt gặp lỗi ${stat.label}`}
                    size="sm"
                    tone="treasure"
                  />
                </div>
                <span className="text-xs text-slate-400 tabular-nums w-10 text-right">
                  {stat.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* --- Chứng chỉ --- */}
      <Card>
        <CardHeader title={`Chứng chỉ đã cấp (${certificates.length}/${LESSONS_META.length})`} />

        {certificates.length === 0 ? (
          <EmptyState
            title="Chưa có chứng chỉ nào"
            description="Chứng chỉ được cấp khi em ấy hoàn thành đủ năm điều kiện của một khu vực."
          />
        ) : (
          <ul className="space-y-2 list-none">
            {certificates.map((certificate) => (
              <li
                key={certificate.id}
                className={cn('flex items-center gap-3 cq-panel p-3')}
              >
                <ScrollText className="size-5 text-treasure-400 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-100">
                    {certificate.metadata.certificateName}
                  </p>
                  <p className="text-xs font-mono text-slate-500 truncate">
                    {certificate.certificate_code}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {formatDate(certificate.issued_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
