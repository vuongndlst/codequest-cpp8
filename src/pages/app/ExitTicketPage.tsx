import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { getLesson } from '@/lessons';
import { useAuthStore } from '@/stores/authStore';
import { fetchExitTicket, submitExitTicket } from '@/services/supabase/exitTickets.repo';
import { logActivityEvent } from '@/services/supabase/gamification.repo';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ByteMascot } from '@/components/game/ByteMascot';
import { LoadingState } from '@/components/common/StateViews';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { cn } from '@/utils/cn';

/**
 * Exit Ticket (mục 5.8 của đề bài): 3 câu ngắn + một câu tự viết.
 *
 * Câu tự đánh giá KHÔNG có đáp án đúng/sai và không tính vào điểm — mục đích
 * là để học sinh nhìn lại chính mình và để giáo viên biết ai cần hỗ trợ thêm.
 */
export function ExitTicketPage() {
  const { lessonId = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const lesson = getLesson(lessonId);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !lesson) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const existing = await fetchExitTicket(user.id, lesson.id);
        if (cancelled || !existing) return;

        const restored: Record<string, number> = {};
        for (const [key, value] of Object.entries(existing.answers)) {
          if (typeof value === 'number') restored[key] = value;
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
  if (isLoading) return <LoadingState label="Đang mở Exit Ticket…" />;

  const { questions, reflectionPrompt } = lesson.exitTicket;
  const scoredQuestions = questions.filter((question) => question.type !== 'self-assess');
  const allAnswered = questions.every((question) => answers[question.id] !== undefined);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setError(null);
    setIsSubmitting(true);

    const correctCount = scoredQuestions.filter(
      (question) => answers[question.id] === question.correctIndex,
    ).length;
    const score = Math.round((correctCount / Math.max(1, scoredQuestions.length)) * 100);

    try {
      await submitExitTicket({
        userId: user.id,
        lessonId: lesson.id,
        answers,
        score,
        reflection,
      });
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
          <h1 className="text-2xl font-extrabold text-slate-100">Exit Ticket</h1>
          <p className="text-sm text-slate-400">
            Ba câu ngắn để em tự kiểm tra xem mình nắm được tới đâu.
          </p>
        </div>
      </div>

      {submittedScore !== null && (
        <Alert tone="success" title="Đã nộp rồi nhé" live>
          Em trả lời đúng {Math.round((submittedScore / 100) * scoredQuestions.length)}/
          {scoredQuestions.length} câu kiến thức. Em vẫn sửa và nộp lại được bất cứ lúc nào.
        </Alert>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((question, index) => {
          const selected = answers[question.id];
          const isScored = question.type !== 'self-assess';
          const showFeedback = submittedScore !== null && isScored && selected !== undefined;

          return (
            <fieldset key={question.id} className="cq-card p-4">
              <legend className="text-sm font-bold text-slate-100 px-1">
                Câu {index + 1}. {question.prompt}
                {!isScored && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    (không có đúng/sai)
                  </span>
                )}
              </legend>

              {question.code && (
                <pre className="font-mono text-xs bg-abyss-950 rounded-lg p-3 my-3 overflow-x-auto text-slate-300 whitespace-pre">
                  {question.code}
                </pre>
              )}

              <div className="space-y-2 mt-3">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const isCorrect = question.correctIndex === optionIndex;

                  return (
                    <label
                      key={optionIndex}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                        isSelected
                          ? 'border-quest-500 bg-quest-500/10'
                          : 'border-abyss-600 hover:border-abyss-500',
                        showFeedback && isCorrect && 'border-verdant-500 bg-verdant-500/10',
                      )}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={optionIndex}
                        checked={isSelected}
                        onChange={() =>
                          setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
                        }
                        className="mt-1 accent-cyan-500"
                      />
                      <span className="text-sm text-slate-200 flex-1">{option}</span>
                      {showFeedback && isCorrect && (
                        <Check className="size-4 text-verdant-400 shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                    </label>
                  );
                })}
              </div>

              {showFeedback && question.explanation && (
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  {question.explanation}
                </p>
              )}
            </fieldset>
          );
        })}

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
            {submittedScore === null ? 'Nộp Exit Ticket' : 'Nộp lại'}
          </Button>
          <Link to={`/app/lesson/${lessonId}`}>
            <Button variant="secondary">Về trang khu vực</Button>
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
