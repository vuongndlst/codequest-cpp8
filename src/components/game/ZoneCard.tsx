import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Lock } from 'lucide-react';
import type { LessonMeta } from '@/types/content';
import type { LessonLockState } from '@/utils/progression';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StarRating } from './StarRating';
import { getIcon } from '@/utils/icons';
import { cn } from '@/utils/cn';

interface ZoneCardProps {
  lesson: LessonMeta;
  lockState: LessonLockState;
  progressPercent: number;
  stars: number;
  /** true = chỉ xem, không bấm vào được (dùng ở trang xem trước công khai) */
  preview?: boolean;
  href?: string;
  dueDateLabel?: string;
  dueDatePast?: boolean;
  lockedByTeacher?: boolean;
}

const ACCENTS = {
  quest: { ring: 'border-quest-500/50', chip: 'bg-quest-500/15 text-quest-400' },
  mage: { ring: 'border-mage-400/50', chip: 'bg-mage-500/15 text-mage-300' },
  verdant: { ring: 'border-verdant-500/50', chip: 'bg-verdant-500/15 text-verdant-400' },
  treasure: { ring: 'border-treasure-400/50', chip: 'bg-treasure-400/15 text-treasure-300' },
  alert: { ring: 'border-alert-400/50', chip: 'bg-alert-500/15 text-alert-400' },
} as const;

/** Một khu vực trên bản đồ ByteLand. */
export function ZoneCard({
  lesson,
  lockState,
  progressPercent,
  stars,
  preview = false,
  href,
  dueDateLabel,
  dueDatePast = false,
  lockedByTeacher = false,
}: ZoneCardProps) {
  const Icon = getIcon(lesson.icon);
  const accent = ACCENTS[lesson.accent];
  // Ở bản đồ xem trước, học sinh đang khám phá LỘ TRÌNH chứ chưa xem trạng
  // thái tài khoản. Giữ màu và biểu tượng của khu vực để bản đồ có sức hút;
  // chỉ khoá thật khi đây là bản đồ cá nhân sau đăng nhập.
  const isLocked = lockState === 'locked' && !preview;
  const isCompleted = lockState === 'completed';

  const body = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid place-items-center size-12 rounded-2xl shrink-0',
            isLocked ? 'bg-abyss-700 text-slate-500' : accent.chip,
          )}
          aria-hidden="true"
        >
          {isLocked ? <Lock className="size-5" /> : <Icon className="size-6" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Khu vực {lesson.order}
          </p>
          <h3 className="text-base font-bold text-slate-100 truncate">{lesson.zoneName}</h3>
          <p className="text-sm text-slate-400 truncate">{lesson.title}</p>
        </div>

        {isCompleted && (
          <CheckCircle2 className="size-5 text-verdant-400 shrink-0" aria-hidden="true" />
        )}
      </div>

      <div className="mt-4 space-y-2">
        {preview ? (
          <div className="space-y-1.5">
            <p className="text-xs leading-relaxed text-slate-400 line-clamp-2">
              {lesson.subtitle}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {lesson.challengeCount} nhiệm vụ · khoảng {lesson.estimatedMinutes} phút
            </p>
          </div>
        ) : isLocked ? (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500">
              {lockedByTeacher
                ? 'Giáo viên đang tạm khóa để cả lớp học cùng nhịp'
                : `Hoàn thành Khu vực ${lesson.order - 1} để mở khoá`}
            </p>
            {dueDateLabel && <ScheduleLabel label={dueDateLabel} isPast={dueDatePast} />}
          </div>
        ) : (
          <>
            {dueDateLabel && <ScheduleLabel label={dueDateLabel} isPast={dueDatePast} />}
            <ProgressBar
              value={progressPercent}
              label={`Tiến trình ${lesson.zoneName}`}
              tone={isCompleted ? 'verdant' : 'quest'}
              size="sm"
            />
            <div className="flex items-center justify-between">
              <StarRating stars={stars} size="sm" />
              <span className="text-xs text-slate-400 tabular-nums">{progressPercent}%</span>
            </div>
          </>
        )}
      </div>
    </>
  );

  const baseClass = cn(
    'block cq-card p-4 transition-colors',
    isLocked ? 'opacity-60' : cn(!preview && 'hover:border-quest-500/60', accent.ring),
  );

  if (preview) {
    return (
      <li className={cn(baseClass, 'h-full')}>
        {body}
      </li>
    );
  }

  if (isLocked) {
    return (
      <li className={baseClass} aria-disabled="true">
        {body}
        <span className="sr-only">Khu vực này chưa mở khoá.</span>
      </li>
    );
  }

  return (
    <li>
      <Link to={href ?? `/app/lesson/${lesson.id}`} className={cn(baseClass, 'h-full')}>
        {body}
      </Link>
    </li>
  );
}

function ScheduleLabel({ label, isPast }: { label: string; isPast: boolean }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs font-medium', isPast ? 'text-alert-400' : 'text-slate-400')}>
      <CalendarDays className="size-3.5" aria-hidden="true" />
      {isPast ? `Đã quá hạn ${label}` : `Hạn ${label}`}
    </p>
  );
}
