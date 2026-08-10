import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, ScrollText, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { LESSONS_META, CERTIFICATE_NAMES } from '@/data/lessons.meta';
import { fetchUserCertificates } from '@/services/supabase/gamification.repo';
import { fetchAllLessonProgress, indexProgressByLesson } from '@/services/supabase/progress.repo';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StarRating } from '@/components/game/StarRating';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { formatDate } from '@/utils/format';
import { getIcon } from '@/utils/icons';
import { cn } from '@/utils/cn';
import type { CertificateRow, LessonProgressRow } from '@/types/database';

/** Bộ sưu tập chứng chỉ — 5 ô, ô nào chưa mở thì hiện điều kiện còn thiếu. */
export function CertificatesPage() {
  const user = useAuthStore((state) => state.user);

  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [progressByLesson, setProgressByLesson] = useState<
    Record<string, LessonProgressRow | undefined>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [certs, progress] = await Promise.all([
          fetchUserCertificates(user.id),
          fetchAllLessonProgress(user.id),
        ]);
        if (cancelled) return;
        setCertificates(certs);
        setProgressByLesson(indexProgressByLesson(progress));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Không tải được chứng chỉ.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) return <LoadingState label="Đang mở tủ chứng chỉ…" />;
  if (error) return <ErrorState description={error} onRetry={() => window.location.reload()} />;

  const certificateByLesson = new Map(certificates.map((cert) => [cert.lesson_id, cert]));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-100">Bộ sưu tập chứng chỉ</h1>
        <p className="text-sm text-slate-400 mt-1">
          Mỗi khu vực giải cứu xong là một chứng chỉ. Đã nhận rồi thì tải lại bao nhiêu lần cũng
          được.
        </p>
      </header>

      <Card>
        <CardHeader
          title={`Đã nhận ${certificates.length}/${LESSONS_META.length} chứng chỉ`}
          icon={<ScrollText className="size-5 text-treasure-400" aria-hidden="true" />}
        />
        <ProgressBar
          value={certificates.length}
          max={LESSONS_META.length}
          label="Tiến trình bộ sưu tập chứng chỉ"
          tone="treasure"
          showValue
        />
      </Card>

      <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 list-none">
        {LESSONS_META.map((lesson) => {
          const certificate = certificateByLesson.get(lesson.id);
          const progress = progressByLesson[lesson.id];
          const Icon = getIcon(lesson.icon);
          const isEarned = Boolean(certificate);

          return (
            <li key={lesson.id}>
              <Link
                to={`/app/certificates/${lesson.id}`}
                className={cn(
                  'block h-full cq-card p-4 transition-colors',
                  isEarned
                    ? 'border-treasure-400/50 hover:border-treasure-400/80'
                    : 'opacity-75 hover:opacity-100 hover:border-abyss-500',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'grid place-items-center size-12 rounded-2xl shrink-0',
                      isEarned
                        ? 'bg-treasure-400/20 text-treasure-400'
                        : 'bg-abyss-700 text-slate-500',
                    )}
                    aria-hidden="true"
                  >
                    {isEarned ? <Icon className="size-6" /> : <Lock className="size-5" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Khu vực {lesson.order}
                    </p>
                    <h2
                      className={cn(
                        'font-bold truncate',
                        isEarned ? 'text-treasure-300' : 'text-slate-300',
                      )}
                    >
                      {CERTIFICATE_NAMES[lesson.certificateCode]}
                    </h2>
                    <p className="text-sm text-slate-400 truncate">{lesson.zoneName}</p>
                  </div>

                  {isEarned && (
                    <Check className="size-5 text-verdant-400 shrink-0" aria-hidden="true" />
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-abyss-700">
                  {isEarned && certificate ? (
                    <div className="flex items-center justify-between gap-2">
                      <StarRating stars={certificate.stars_at_issue} size="sm" />
                      <span className="text-xs text-slate-400">
                        {formatDate(certificate.issued_at)}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <ProgressBar
                        value={progress?.progress_percent ?? 0}
                        label={`Tiến trình ${lesson.zoneName}`}
                        size="sm"
                      />
                      <p className="text-xs text-slate-500">
                        {progress?.status === 'completed'
                          ? 'Bấm để nhận chứng chỉ'
                          : `Hoàn thành khu vực để mở khoá · ${progress?.progress_percent ?? 0}%`}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {certificates.length === LESSONS_META.length && (
        <div className="cq-card p-5 text-center border-treasure-400/50 bg-treasure-400/5">
          <Sparkles className="size-8 text-treasure-400 mx-auto" aria-hidden="true" />
          <p className="mt-2 font-bold text-treasure-300">
            Em đã sưu tập đủ cả 3 chứng chỉ của vertical slice!
          </p>
          <p className="text-sm text-slate-300 mt-1">
            Từ chương trình `cout` đầu tiên, em đã điều khiển Byte bằng thuật toán và dùng biến để
            theo dõi trạng thái. Nền móng C++ của em đã rất chắc rồi.
          </p>
        </div>
      )}
    </div>
  );
}
