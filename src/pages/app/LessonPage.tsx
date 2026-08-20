import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain, Check, Lock, Play } from 'lucide-react';
import { getLesson } from '@/lessons';
import { getLessonMeta } from '@/data/lessons.meta';
import { useAuthStore } from '@/stores/authStore';
import { ensureLessonStarted } from '@/services/supabase/progress.repo';
import { isChallengeUnlocked } from '@/utils/progression';
import { useLessonAccess } from '@/hooks/useLessonAccess';
import { hasReadGuide } from '@/utils/guideProgress';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StarRating } from '@/components/game/StarRating';
import { ErrorState, LoadingState, NoAccessState } from '@/components/common/StateViews';
import { UpcomingPage, NotFoundPage } from '@/pages/UpcomingPage';
import { getIcon } from '@/utils/icons';
import { canOpenCheckpoint } from '@/utils/checkpoint';
import { cn } from '@/utils/cn';

const KIND_BADGES: Record<string, { label: string; className: string }> = {
  story: { label: 'Quan sát', className: 'bg-quest-500/15 text-quest-400' },
  concept: { label: 'Khám phá lệnh', className: 'bg-quest-500/15 text-quest-400' },
  sandbox: { label: 'Thử ngay', className: 'bg-mage-500/15 text-mage-300' },
  mission: { label: 'Nhiệm vụ', className: 'bg-mage-500/15 text-mage-300' },
  debug: { label: 'Debug', className: 'bg-treasure-400/15 text-treasure-300' },
  cleancode: { label: 'Clean Code', className: 'bg-verdant-500/15 text-verdant-400' },
  boss: { label: 'BOSS', className: 'bg-alert-500/15 text-alert-400' },
};

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const meta = getLessonMeta(lessonId);
  const lesson = getLesson(lessonId);
  const access = useLessonAccess(lessonId);

  // Đánh dấu học sinh đã bắt đầu bài này
  useEffect(() => {
    if (!user || !lesson || access.isLoading || !access.isUnlocked) return;
    void ensureLessonStarted(user.id, lesson.id).catch(() => undefined);
  }, [user, lesson, access.isLoading, access.isUnlocked]);

  if (!meta) return <NotFoundPage />;
  if (access.isLoading) return <LoadingState label="Đang mở khu vực…" />;
  if (access.error) return <ErrorState description={access.error} onRetry={() => window.location.reload()} />;

  const isTeacher = profile?.role === 'teacher';
  const guideRead = hasReadGuide(lessonId) || isTeacher;

  if (!access.isUnlocked) {
    return (
      <NoAccessState
        description={access.control?.access_mode === 'locked'
          ? 'Khu vực này đang được giáo viên tạm khóa để cả lớp học cùng nhịp. Em làm lại nhiệm vụ đã mở hoặc hỏi thầy cô nhé.'
          : `Khu vực này còn khoá. Em hoàn thành Khu vực ${meta.order - 1} trước đã nhé — mỗi khu vực đều cần kiến thức của khu vực trước.`}
      />
    );
  }

  if (!lesson) {
    return (
      <UpcomingPage
        phase="Đang soạn nội dung"
        title={`${meta.zoneName} sắp mở`}
        description={`Area ${meta.order} — ${meta.title} — đang được thầy soạn nội dung. Em quay lại Area 0 luyện thêm nhé.`}
      />
    );
  }

  const progress = access.progressByLesson[lessonId];
  const completedChallenges = progress?.completed_challenges ?? [];
  const challengeIds = lesson.challenges.map((challenge) => challenge.id);
  const requiredChallenges = lesson.challenges.filter((challenge) => !challenge.optional);
  const checkpointUnlocked = canOpenCheckpoint(
    requiredChallenges.map((challenge) => challenge.id),
    completedChallenges,
  );
  const Icon = getIcon(meta.icon);

  const firstUnfinished =
    lesson.challenges.find((challenge) => !completedChallenges.includes(challenge.id)) ??
    lesson.challenges[0];

  return (
    <div className="space-y-5">
      <Link
        to="/app"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Bản đồ ByteLand
      </Link>

      {/* --- Đầu trang khu vực --- */}
      <section className="cq-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <span
            className="grid place-items-center size-14 rounded-2xl bg-quest-500/15 text-quest-400 shrink-0"
            aria-hidden="true"
          >
            <Icon className="size-7" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Khu vực {meta.order}
            </p>
            <h1 className="text-2xl font-extrabold text-slate-100">{meta.zoneName}</h1>
            <p className="text-sm text-slate-400">{meta.title}</p>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">{meta.intro}</p>

            <div className="mt-4 max-w-md">
              <ProgressBar
                value={completedChallenges.length}
                max={challengeIds.length}
                label={`Tiến trình ${meta.zoneName}`}
                showValue
                tone={progress?.status === 'completed' ? 'verdant' : 'quest'}
              />
            </div>
          </div>

          {/*
            Khi em CHƯA đọc lý thuyết, nút vào nhiệm vụ hạ xuống hàng phụ.

            Trước đây nút "Bắt đầu" nổi bật nằm ngay đầu trang, còn phần lý
            thuyết nằm bên dưới — nên gần như em nào cũng bấm Bắt đầu rồi mò
            cú pháp bằng cách thử sai. Nay thứ tự phản ánh đúng thứ tự nên học:
            hiểu vì sao cần lệnh trước, gõ lệnh sau.

            Vẫn KHÔNG khoá nhiệm vụ: em nào nắm rồi thì vào thẳng vẫn được.
          */}
          <div className="sm:text-right shrink-0 space-y-2">
            <StarRating stars={progress?.stars ?? 0} />
            <Link
              to={`/app/lesson/${lessonId}/challenge/${firstUnfinished.id}`}
              className="block"
            >
              <Button
                variant={guideRead || completedChallenges.length > 0 ? 'primary' : 'secondary'}
                leadingIcon={<Play className="size-4" aria-hidden="true" />}
              >
                {completedChallenges.length === 0 ? 'Vào nhiệm vụ' : 'Tiếp tục'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Học kiến thức trước khi làm --- */}
      <section
        className={cn(
          'cq-card p-5',
          guideRead
            ? 'border-abyss-600'
            : // Chưa đọc thì nổi bật lên: đây mới là bước đầu tiên nên làm
              'border-mage-400/60 bg-mage-500/10 ring-1 ring-mage-400/20',
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span
            className="grid place-items-center size-12 rounded-2xl bg-mage-500/20 text-mage-300 shrink-0"
            aria-hidden="true"
          >
            <Brain className="size-6" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-mage-300">
              {guideRead ? 'Lý thuyết — em đã đọc rồi' : 'Bước 1 · Hiểu trước khi làm'}
            </p>
            <p className="text-base font-semibold text-slate-100 leading-snug mt-0.5">
              {lesson.conceptGuide.bigQuestion}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Phần này giải thích <strong className="text-slate-300">vì sao</strong> cần lệnh mới,
              chứ không chỉ dạy cú pháp. Đọc xong em sẽ biết khi nào nên dùng nó.
            </p>
          </div>

          <Link to={`/app/lesson/${lessonId}/guide`} className="shrink-0">
            <Button
              variant={guideRead ? 'secondary' : 'primary'}
              leadingIcon={<Brain className="size-4" aria-hidden="true" />}
            >
              {guideRead ? 'Đọc lại lý thuyết' : 'Đọc lý thuyết'}
            </Button>
          </Link>
        </div>

        {/* Ở khu vực đầu tiên, nhắc lại phần nền về thuật toán */}
        {meta.order === 1 && (
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-abyss-700">
            Chưa đọc phần mở đầu về thuật toán?{' '}
            <Link to="/app/prologue" className="text-mage-300 hover:underline">
              Đọc "Thuật toán là gì?" trước
            </Link>{' '}
            — phần đó giải thích vì sao máy tính lại khó tính với từng dấu chấm phẩy.
          </p>
        )}
      </section>

      {/* --- Mục tiêu KUD: biết, hiểu và làm được --- */}
      <section className="cq-panel p-4" aria-labelledby="objectives-heading">
        <h2 id="objectives-heading" className="text-sm font-bold text-slate-200 mb-3">
          Mục tiêu học tập của khu vực
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <LearningObjectiveBlock
            label="Em cần biết"
            items={lesson.learningObjectives.know}
            tone="text-quest-400"
          />
          <LearningObjectiveBlock
            label="Em cần hiểu"
            items={[lesson.learningObjectives.understand]}
            tone="text-mage-300"
          />
          <LearningObjectiveBlock
            label="Em sẽ làm được"
            items={lesson.learningObjectives.do}
            tone="text-verdant-400"
          />
        </div>
      </section>

      {/* --- Danh sách node nhiệm vụ --- */}
      <section aria-labelledby="nodes-heading">
        <h2 id="nodes-heading" className="text-lg font-bold text-slate-100 mb-3">
          Các nhiệm vụ
        </h2>

        <ol className="space-y-2 list-none">
          {lesson.challenges.map((challenge, index) => {
            const isDone = completedChallenges.includes(challenge.id);
            const isOpen = isChallengeUnlocked(
              index,
              challengeIds,
              completedChallenges,
              challenge.optional,
              isTeacher,
            );
            const badge = KIND_BADGES[challenge.kind] ?? {
              label: challenge.kind,
              className: 'bg-abyss-700 text-slate-400',
            };

            const inner = (
              <>
                <span
                  className={cn(
                    'grid place-items-center size-9 rounded-xl shrink-0 text-sm font-bold',
                    isDone
                      ? 'bg-verdant-500/20 text-verdant-400'
                      : isOpen
                        ? 'bg-abyss-700 text-slate-300'
                        : 'bg-abyss-800 text-slate-600',
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="size-5" /> : isOpen ? index + 1 : <Lock className="size-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </span>
                    <span
                      className={cn(
                        'font-semibold',
                        isOpen ? 'text-slate-100' : 'text-slate-500',
                      )}
                    >
                      {challenge.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isDone
                      ? 'Đã hoàn thành'
                      : isOpen
                        ? `${challenge.xpReward} XP`
                        : 'Hoàn thành nhiệm vụ trước để mở khoá'}
                  </p>
                </div>
              </>
            );

            if (!isOpen) {
              return (
                <li
                  key={challenge.id}
                  className="flex items-center gap-3 cq-panel p-3 opacity-60"
                  aria-disabled="true"
                >
                  {inner}
                </li>
              );
            }

            return (
              <li key={challenge.id}>
                <Link
                  to={`/app/lesson/${lessonId}/challenge/${challenge.id}`}
                  className="flex items-center gap-3 cq-panel p-3 hover:border-quest-500/60 transition-colors"
                >
                  {inner}
                </Link>
              </li>
            );
          })}

          {/* Checkpoint là node cuối, chỉ mở sau khi hoàn thành nhiệm vụ bắt buộc. */}
          <li>
            {checkpointUnlocked ? (
              <Link
                to={`/app/lesson/${lessonId}/exit-ticket`}
                className="flex items-center gap-3 cq-panel p-3 hover:border-quest-500/60 transition-colors"
              >
                <span
                  className="grid place-items-center size-9 rounded-xl shrink-0 bg-quest-500/15 text-quest-400"
                  aria-hidden="true"
                >
                  <BookOpen className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-quest-500/15 text-quest-400">
                    Checkpoint
                  </span>
                  <p className="font-semibold text-slate-100 mt-0.5">
                    Kiểm tra cuối khu vực
                  </p>
                  <p className="text-xs text-slate-500">
                    {lesson.exitTicket.questions.length} câu · đạt từ 70% · thử lại không giới hạn
                  </p>
                </div>
              </Link>
            ) : (
              <div
                className="flex items-center gap-3 cq-panel p-3 opacity-60"
                aria-disabled="true"
              >
                <span
                  className="grid place-items-center size-9 rounded-xl shrink-0 bg-abyss-800 text-slate-600"
                  aria-hidden="true"
                >
                  <Lock className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-abyss-700 text-slate-500">
                    Checkpoint
                  </span>
                  <p className="font-semibold text-slate-500 mt-0.5">Kiểm tra cuối khu vực</p>
                  <p className="text-xs text-slate-600">Hoàn thành các nhiệm vụ bắt buộc để mở</p>
                </div>
              </div>
            )}
          </li>
        </ol>
      </section>
    </div>
  );
}

function LearningObjectiveBlock({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-abyss-700 bg-abyss-900/45 p-3">
      <p className={cn('text-xs font-bold uppercase tracking-wide', tone)}>{label}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-400">
            <Check className={cn('mt-0.5 size-4 shrink-0', tone)} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
