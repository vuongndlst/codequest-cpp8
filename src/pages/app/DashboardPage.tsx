import { Link } from 'react-router-dom';
import { Award, BookOpen, Brain, Flame, ScrollText, Sparkles, Star, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LESSONS_META } from '@/data/lessons.meta';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { ZoneCard } from '@/components/game/ZoneCard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, StatTile } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Alert } from '@/components/ui/Alert';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { getLevelProgress, getLevelTitle } from '@/utils/xp';
import {
  MAX_TOTAL_STARS,
  getLessonLockState,
  getNextLessonId,
  getTotalStars,
} from '@/utils/progression';
import { formatEventLabel, formatRelativeTime } from '@/utils/format';

export function DashboardPage() {
  const profile = useAuthStore((state) => state.profile);
  const profileError = useAuthStore((state) => state.profileError);
  const { data, isLoading, error, reload } = useDashboardData();

  if (isLoading) return <LoadingState label="Đang mở bản đồ ByteLand…" />;

  if (error) {
    return <ErrorState description={error} onRetry={() => void reload()} />;
  }

  const level = getLevelProgress(profile?.total_xp ?? 0);
  const unlockContext = {
    progressByLesson: data.progressByLesson,
    teacherUnlockedLessons: data.classSettings?.unlocked_lessons ?? [],
  };
  const nextLessonId = getNextLessonId(unlockContext);
  const nextLesson = LESSONS_META.find((lesson) => lesson.id === nextLessonId);
  const totalStars = getTotalStars(data.progressByLesson);
  const completedCount = LESSONS_META.filter(
    (lesson) => data.progressByLesson[lesson.id]?.status === 'completed',
  ).length;

  const firstName = profile?.full_name?.trim().split(/\s+/).pop() ?? 'bạn';

  return (
    <div className="space-y-6">
      {profileError && (
        <Alert tone="warning" title="Chưa tải được đầy đủ hồ sơ">
          {profileError}
        </Alert>
      )}

      {/* --- Lời chào --- */}
      <section className="cq-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <AvatarIcon avatarId={profile?.avatar_id} size={72} glow />

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-slate-100">
              Chào {firstName}, sẵn sàng chưa?
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {getLevelTitle(level.level)}
              {profile?.class_name && <> · Lớp {profile.class_name}</>}
            </p>

            <div className="mt-3 max-w-md">
              <ProgressBar
                value={level.isMaxLevel ? 1 : level.xpIntoLevel}
                max={level.isMaxLevel ? 1 : level.xpForThisLevel}
                label={`Tiến trình lên cấp ${level.level + 1}`}
                tone="treasure"
              />
              <p className="text-xs text-slate-400 mt-1">
                {level.isMaxLevel
                  ? 'Em đã đạt cấp cao nhất rồi!'
                  : `Còn ${level.xpToNextLevel} XP nữa là lên cấp ${level.level + 1}`}
              </p>
            </div>
          </div>

          {nextLesson && (
            <div className="sm:text-right shrink-0">
              <p className="text-xs text-slate-500 mb-1">Nhiệm vụ tiếp theo</p>
              <p className="text-sm font-semibold text-slate-200 mb-2">{nextLesson.zoneName}</p>
              <Link to={`/app/lesson/${nextLesson.id}`}>
                <Button leadingIcon={<Zap className="size-4" aria-hidden="true" />}>
                  Tiếp tục
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* --- Chỉ số --- */}
      <section aria-label="Thành tích của em" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Cấp độ"
          value={level.level}
          icon={<Zap className="size-5" />}
          tone="treasure"
          sublabel={`${profile?.total_xp ?? 0} XP`}
        />
        <StatTile
          label="Sao đã đạt"
          value={`${totalStars}/${MAX_TOTAL_STARS}`}
          icon={<Star className="size-5" />}
          tone="treasure"
        />
        <StatTile
          label="Huy hiệu"
          value={data.badges.length}
          icon={<Award className="size-5" />}
          tone="mage"
          sublabel="trên tổng 10"
        />
        <StatTile
          label="Chứng chỉ"
          value={data.certificates.length}
          icon={<ScrollText className="size-5" />}
          tone="verdant"
          sublabel="trên tổng 5"
        />
      </section>

      {/* --- Phần mở đầu: thuật toán là gì --- */}
      <section className="cq-card p-4 sm:p-5 border-mage-400/40 bg-mage-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span
            className="grid place-items-center size-11 rounded-2xl bg-mage-500/20 text-mage-300 shrink-0"
            aria-hidden="true"
          >
            <Brain className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-mage-300">
              Nên đọc đầu tiên
            </p>
            <p className="font-semibold text-slate-100">Thuật toán là gì?</p>
            <p className="text-sm text-slate-400">
              Hiểu cách nghĩ ra các bước trước đã — phần này chưa cần viết dòng code nào.
            </p>
          </div>

          <Link to="/app/prologue" className="shrink-0">
            <Button variant="secondary" size="sm">
              Đọc phần mở đầu
            </Button>
          </Link>
        </div>
      </section>

      {/* --- Bản đồ 5 khu vực --- */}
      <section aria-labelledby="map-heading">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 id="map-heading" className="text-xl font-bold text-slate-100">
              Bản đồ ByteLand
            </h2>
            <p className="text-sm text-slate-400">
              Đã giải cứu {completedCount}/{LESSONS_META.length} khu vực
            </p>
          </div>
          {(profile?.streak_days ?? 0) > 0 && (
            <p className="flex items-center gap-1.5 text-sm text-treasure-300">
              <Flame className="size-4" aria-hidden="true" />
              Em đã học {profile?.streak_days} ngày liên tiếp
            </p>
          )}
        </div>

        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 list-none">
          {LESSONS_META.map((lesson) => {
            const progress = data.progressByLesson[lesson.id];
            return (
              <ZoneCard
                key={lesson.id}
                lesson={lesson}
                lockState={getLessonLockState(lesson.id, unlockContext)}
                progressPercent={progress?.progress_percent ?? 0}
                stars={progress?.stars ?? 0}
              />
            );
          })}
        </ul>
      </section>

      {/* --- Thành tích gần đây + lối tắt --- */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Thành tích gần đây"
            description="Những gì em vừa làm được"
            icon={<Sparkles className="size-5 text-treasure-400" aria-hidden="true" />}
          />
          {data.activity.length === 0 ? (
            <EmptyState
              title="Chưa có hoạt động nào"
              description="Em hoàn thành nhiệm vụ đầu tiên ở Làng Khởi Động để bắt đầu ghi dấu nhé."
              action={
                <Link to="/app/lesson/l1">
                  <Button size="sm">Tới Làng Khởi Động</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {data.activity.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-abyss-700 last:border-0"
                >
                  <span className="text-sm text-slate-300 min-w-0 truncate">
                    {formatEventLabel(event)}
                  </span>
                  <time
                    dateTime={event.created_at}
                    className="text-xs text-slate-500 shrink-0 tabular-nums"
                  >
                    {formatRelativeTime(event.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Công cụ của em"
            icon={<BookOpen className="size-5 text-quest-400" aria-hidden="true" />}
          />
          <div className="space-y-2">
            <Link to="/app/handbook" className="block">
              <Button variant="secondary" fullWidth className="justify-start">
                <BookOpen className="size-4" aria-hidden="true" />
                Sổ tay lệnh
              </Button>
            </Link>
            <Link to="/app/certificates" className="block">
              <Button variant="secondary" fullWidth className="justify-start">
                <ScrollText className="size-4" aria-hidden="true" />
                Bộ sưu tập chứng chỉ
              </Button>
            </Link>
            <Link to="/app/profile" className="block">
              <Button variant="secondary" fullWidth className="justify-start">
                <Award className="size-4" aria-hidden="true" />
                Hồ sơ và huy hiệu
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
