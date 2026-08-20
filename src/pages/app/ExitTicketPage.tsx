import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { getLesson, LESSONS } from '@/lessons';
import { firstChallengeHref } from '@/utils/journey';
import { getPacingOverrides } from '@/utils/classPacing';
import { isLessonUnlocked } from '@/utils/progression';
import { useAuthStore } from '@/stores/authStore';
import { useLessonAccess } from '@/hooks/useLessonAccess';
import { fetchExitTicket, submitExitTicket } from '@/services/supabase/exitTickets.repo';
import { logActivityEvent } from '@/services/supabase/gamification.repo';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ByteMascot } from '@/components/game/ByteMascot';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { NoAccessState } from '@/components/common/StateViews';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { CheckpointQuestionCard } from '@/components/learning/CheckpointQuestionCard';
import type { CheckpointAnswer } from '@/types/content';
import {
  canOpenCheckpoint,
  CHECKPOINT_PASS_SCORE,
  isQuestionAnswered,
  scoreCheckpoint,
} from '@/utils/checkpoint';
import {
  fetchAllLessonProgress,
  indexProgressByLesson,
  upsertLessonProgress,
} from '@/services/supabase/progress.repo';
import { getRequiredChallengeIds } from '@/lessons';
import type { LessonProgressRow } from '@/types/database';
import { runOrQueue } from '@/services/offlineQueue';
import { issueCertificate } from '@/services/certificateService';

/**
 * Checkpoint cuối khu vực: nhiều dạng câu hỏi + một câu tự nhìn lại.
 *
 * Câu tự đánh giá KHÔNG có đáp án đúng/sai và không tính vào điểm — mục đích
 * là để học sinh nhìn lại chính mình và để giáo viên biết ai cần hỗ trợ thêm.
 */
export function ExitTicketPage() {
  const { lessonId = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const lesson = getLesson(lessonId);
  const access = useLessonAccess(lessonId);

  const [answers, setAnswers] = useState<Record<string, CheckpointAnswer>>({});
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [progress, setProgress] = useState<LessonProgressRow | null>(null);

  useEffect(() => {
    if (!user || !lesson) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const [existing, progressRows] = await Promise.all([
          fetchExitTicket(user.id, lesson.id),
          fetchAllLessonProgress(user.id),
        ]);
        if (cancelled) return;
        setProgress(indexProgressByLesson(progressRows)[lesson.id] ?? null);
        if (!existing) return;

        const restored: Record<string, CheckpointAnswer> = {};
        for (const [key, value] of Object.entries(existing.answers)) {
          if (isCheckpointAnswer(value)) restored[key] = value;
        }
        setAnswers(restored);
        setReflection(existing.reflection ?? '');
        setSubmittedScore(existing.score);
      } catch {
        // Chưa làm lần nào -> để trống, không phải lỗi
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, lesson]);

  if (!lesson) return <NotFoundPage />;
  if (isLoading || access.isLoading) return <LoadingState label="Đang mở Exit Ticket…" />;
  if (access.error) return <ErrorState description={access.error} onRetry={() => window.location.reload()} />;
  if (!access.isUnlocked) {
    return (
      <NoAccessState description={access.control?.access_mode === 'locked'
        ? 'Giáo viên đang tạm khóa khu vực này để cả lớp học cùng nhịp.'
        : 'Em cần hoàn thành khu vực trước để mở checkpoint này.'}
      />
    );
  }

  const requiredIds = getRequiredChallengeIds(lesson.id);
  const checkpointUnlocked = canOpenCheckpoint(requiredIds, progress?.completed_challenges ?? []);
  if (!checkpointUnlocked && profile?.role !== 'teacher') {
    return (
      <NoAccessState description="Checkpoint sẽ mở sau khi em hoàn thành các nhiệm vụ bắt buộc trong khu vực. Em quay lại bản đồ nhiệm vụ và tiếp tục từ node đang mở nhé." />
    );
  }

  const { questions, reflectionPrompt } = lesson.exitTicket;
  const scoredQuestions = questions.filter((question) => question.type !== 'self-assess');
  const allAnswered = questions.every((question) =>
    isQuestionAnswered(question, answers[question.id]),
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setError(null);
    setSavedOffline(false);
    setIsSubmitting(true);

    const outcome = scoreCheckpoint(questions, answers);
    const score = outcome.percent;
    const ticketPayload = {
      userId: user.id,
      lessonId: lesson.id,
      answers,
      score,
      reflection,
    };

    try {
      const ticketWrite = await runOrQueue('submit-exit-ticket', ticketPayload, async () => {
        await submitExitTicket(ticketPayload);
      });
      if (!ticketWrite.ok && !ticketWrite.queued) throw ticketWrite.error;
      setSavedOffline(ticketWrite.queued);

      let certificateProgress = progress;
      let certificateCanSyncNow = !ticketWrite.queued;
      if (outcome.passed && progress && progress.status !== 'completed') {
        const progressPatch = {
          status: 'completed',
          progress_percent: 100,
          stars: 3,
          completed_at: new Date().toISOString(),
        } as const;
        let completedProgress: LessonProgressRow | null = null;
        const progressWrite = await runOrQueue(
          'upsert-lesson-progress',
          { userId: user.id, lessonId: lesson.id, patch: progressPatch },
          async () => {
            completedProgress = await upsertLessonProgress(user.id, lesson.id, progressPatch);
          },
        );
        if (!progressWrite.ok && !progressWrite.queued) throw progressWrite.error;
        if (progressWrite.queued) certificateCanSyncNow = false;
        setSavedOffline((current) => current || progressWrite.queued);
        setProgress(
          completedProgress ?? {
            ...progress,
            ...progressPatch,
            updated_at: new Date().toISOString(),
          },
        );
        certificateProgress = completedProgress ?? {
          ...progress,
          ...progressPatch,
          updated_at: new Date().toISOString(),
        };
        void logActivityEvent(user.id, {
          eventType: 'lesson_completed',
          lessonId: lesson.id,
          metadata: { checkpointScore: score },
        });
      }
      // Chứng chỉ là kết quả mặc định của checkpoint, không bắt học sinh phải
      // tìm thêm một trang và bấm “Nhận”. Khi offline, trigger database sẽ cấp
      // ngay lúc hàng đợi đồng bộ trạng thái completed.
      if (outcome.passed && profile?.role === 'student' && certificateCanSyncNow) {
        await issueCertificate(profile, lesson.id, certificateProgress);
      }
      setSubmittedScore(score);
      void logActivityEvent(user.id, {
        eventType: 'challenge_passed',
        lessonId: lesson.id,
        metadata: { kind: 'exit-ticket', score },
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Không lưu được Exit Ticket.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        to={`/app/lesson/${lessonId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {lesson.zoneName}
      </Link>

      <div className="flex items-center gap-3">
        <ByteMascot size={48} animated={false} />
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Checkpoint khu vực</h1>
          <p className="text-sm text-slate-400">
            Kiểm tra đọc code, dự đoán, debug và vận dụng. Đạt từ {CHECKPOINT_PASS_SCORE}% để
            xác nhận em đã sẵn sàng sang khu vực tiếp theo.
          </p>
        </div>
      </div>

      {submittedScore !== null && (
        <Alert
          tone={submittedScore >= CHECKPOINT_PASS_SCORE ? 'success' : 'warning'}
          title={submittedScore >= CHECKPOINT_PASS_SCORE ? 'Checkpoint đã đạt' : 'Mình ôn một chút rồi thử lại nhé'}
          live
        >
          Em đạt {submittedScore}% ({Math.round((submittedScore / 100) * scoredQuestions.length)}/
          {scoredQuestions.length} câu). Debug và thử lại không bị trừ điểm; hệ thống luôn giữ lần
          nộp mới nhất.
        </Alert>
      )}

      {submittedScore !== null && submittedScore >= CHECKPOINT_PASS_SCORE && (
        <section className="cq-card border-verdant-400/45 bg-verdant-500/8 p-4" aria-label="Bước tiếp theo">
          {(() => {
            const nextLesson = LESSONS.find((item) => item.order === lesson.order + 1);
            const nextControl = access.controls.find((item) => item.lesson_id === nextLesson?.id);
            const pacing = getPacingOverrides(access.controls);
            const nextUnlocked = nextLesson ? isLessonUnlocked(nextLesson.id, {
              progressByLesson: {
                ...access.progressByLesson,
                [lesson.id]: progress ?? access.progressByLesson[lesson.id],
              },
              teacherUnlockedLessons: pacing.teacherUnlockedLessons,
              teacherLockedLessons: pacing.teacherLockedLessons,
              isTeacher: profile?.role === 'teacher',
            }) : false;
            return nextLesson ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-verdant-300">
                    {nextUnlocked ? 'Đường mới đã mở' : 'Đã ghi nhận hoàn thành'}
                  </p>
                  <h2 className="font-bold text-slate-100">Khu vực {nextLesson.order}: {nextLesson.zoneName}</h2>
                  <p className="text-xs text-slate-400">
                    {nextUnlocked
                      ? 'Vào thẳng nhiệm vụ đầu tiên; kiến thức mới sẽ xuất hiện ngay trong tình huống chơi.'
                      : nextControl?.access_mode === 'locked'
                        ? 'Giáo viên đang giữ khu vực này để cả lớp học cùng nhịp. Em có thể xem chứng chỉ hoặc luyện lại bài cũ.'
                        : 'Khu vực tiếp theo sẽ mở theo tiến độ của lớp.'}
                  </p>
                  <Link
                    to={`/app/certificates/${lesson.id}`}
                    className="mt-1 inline-flex text-xs font-semibold text-treasure-300 hover:text-treasure-200"
                  >
                    ✓ Chứng chỉ khu vực đã được cấp tự động · Xem ngay
                  </Link>
                </div>
                <Link to={nextUnlocked ? firstChallengeHref(nextLesson.id) : '/app'}>
                  <Button trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}>
                    {nextUnlocked ? 'Tiếp tục hành trình' : 'Về bản đồ'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-bold text-slate-100">Em đã hoàn thành toàn bộ hành trình hiện tại!</p><p className="text-xs text-slate-400">Chứng chỉ và thành tích đã sẵn sàng.</p></div>
                <Link to="/app/certificates"><Button>Xem chứng chỉ</Button></Link>
              </div>
            );
          })()}
        </section>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {savedOffline && (
        <Alert tone="info" live>
          Bài làm đã được giữ an toàn trên máy này và sẽ tự đồng bộ khi có mạng trở lại.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((question, index) => (
          <CheckpointQuestionCard
            key={question.id}
            question={question}
            index={index}
            answer={answers[question.id]}
            submitted={submittedScore !== null}
            onChange={(answer) =>
              setAnswers((current) => ({ ...current, [question.id]: answer }))
            }
          />
        ))}

        <div className="cq-card p-4">
          <label htmlFor="reflection" className="block text-sm font-bold text-slate-100 mb-2">
            {reflectionPrompt}
          </label>
          <textarea
            id="reflection"
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Em viết vài câu thôi cũng được…"
            className="w-full rounded-xl bg-abyss-900 border border-abyss-600 text-slate-100 placeholder:text-slate-500 p-3 focus:border-quest-500"
          />
          <p className="text-xs text-slate-500 mt-1">{reflection.length}/1000 ký tự</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingLabel="Đang nộp"
            disabled={!allAnswered}
            leadingIcon={<Send className="size-4" aria-hidden="true" />}
          >
            {submittedScore === null ? 'Nộp checkpoint' : 'Kiểm tra lại'}
          </Button>
          <Link to="/app">
            <Button variant="secondary">Bản đồ ByteLand</Button>
          </Link>
        </div>

        {!allAnswered && (
          <p className="text-xs text-slate-500">
            Em trả lời hết {questions.length} câu rồi mới nộp được nhé.
          </p>
        )}
      </form>
    </div>
  );
}

function isCheckpointAnswer(value: unknown): value is CheckpointAnswer {
  if (typeof value === 'string' || typeof value === 'number') return true;
  if (Array.isArray(value)) {
    return value.every((item) => typeof item === 'string' || typeof item === 'number');
  }
  return Boolean(
    value &&
      typeof value === 'object' &&
      Object.values(value).every((item) => typeof item === 'string'),
  );
}
