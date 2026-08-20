import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Hash, Save, Ticket, UserRound } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { updateProfile } from '@/services/supabase/profiles.repo';
import { fetchAllBadges, fetchUserBadges } from '@/services/supabase/gamification.repo';
import { AVATARS } from '@/data/avatars';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingState } from '@/components/common/StateViews';
import { validateFullName } from '@/services/supabase/auth.service';
import { getLevelProgress, getLevelTitle } from '@/utils/xp';
import { getIcon } from '@/utils/icons';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { BadgeRow, UserBadgeRow } from '@/types/database';

export function ProfilePage() {
  const location = useLocation();
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);

  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [avatarId, setAvatarId] = useState('guardian-cyan');

  useEffect(() => {
    if (location.hash !== '#badges') return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('badges')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string }>({});
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [allBadges, setAllBadges] = useState<BadgeRow[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadgeRow[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setStudentCode(profile.student_code ?? '');
    setAvatarId(profile.avatar_id);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    void (async () => {
      const [badges, earned] = await Promise.allSettled([
        fetchAllBadges(),
        fetchUserBadges(profile.id),
      ]);
      if (cancelled) return;
      if (badges.status === 'fulfilled') setAllBadges(badges.value);
      if (earned.status === 'fulfilled') setEarnedBadges(earned.value);
      setIsLoadingBadges(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!profile) return <LoadingState label="Đang tải hồ sơ…" />;

  const level = getLevelProgress(profile.total_xp);
  const earnedIds = new Set(earnedBadges.map((badge) => badge.badge_id));
  const earnedAtById = new Map(earnedBadges.map((badge) => [badge.badge_id, badge.earned_at]));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    const fullNameError = validateFullName(fullName);
    if (fullNameError) {
      setFieldErrors({ fullName: fullNameError });
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      // KHÔNG gửi `class_name`: cột đó nay do `join_class_by_code()` quản lý.
      const updated = await updateProfile(profile.id, {
        full_name: fullName.trim(),
        avatar_id: avatarId,
      });
      setProfile(updated);
      setStatus({ tone: 'success', message: 'Đã lưu hồ sơ của em rồi nhé.' });
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Không lưu được hồ sơ.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-100">Hồ sơ của em</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* --- Thẻ nhân vật --- */}
        <Card className="text-center">
          <AvatarIcon avatarId={profile.avatar_id} size={96} glow className="mx-auto" />
          <h2 className="mt-3 text-lg font-bold text-slate-100">{profile.full_name}</h2>
          <p className="text-sm text-slate-400">{getLevelTitle(level.level)}</p>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-left">
            <div className="cq-panel p-3">
              <dt className="text-xs text-slate-500">Cấp độ</dt>
              <dd className="text-lg font-bold text-treasure-400">{level.level}</dd>
            </div>
            <div className="cq-panel p-3">
              <dt className="text-xs text-slate-500">Tổng XP</dt>
              <dd className="text-lg font-bold text-quest-400 tabular-nums">{profile.total_xp}</dd>
            </div>
            <div className="cq-panel p-3">
              <dt className="text-xs text-slate-500">Lớp</dt>
              <dd className="text-sm font-semibold text-slate-200">{profile.class_name ?? '—'}</dd>
            </div>
            <div className="cq-panel p-3">
              <dt className="text-xs text-slate-500">Tham gia từ</dt>
              <dd className="text-sm font-semibold text-slate-200">
                {formatDate(profile.created_at)}
              </dd>
            </div>
          </dl>
        </Card>

        {/* --- Sửa hồ sơ --- */}
        <Card className="lg:col-span-2">
          <CardHeader title="Thông tin cá nhân" description="Em có thể sửa bất cứ lúc nào" />

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {status && <Alert tone={status.tone} live>{status.message}</Alert>}

            <Input
              label="Họ và tên"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={fieldErrors.fullName}
              leadingIcon={<UserRound className="size-4" />}
            />

            <Input
              label="Mã học sinh"
              value={studentCode}
              readOnly
              hint="Mã đăng nhập cố định; liên hệ thầy cô nếu em cần thay đổi"
              leadingIcon={<Hash className="size-4" />}
            />

            {/*
              Lớp CỐ Ý không còn là ô chữ tự do.

              Trước đây em tự gõ tên lớp, nên "8A1", "8a1" và "8 A1" thành ba
              lớp khác nhau trong bảng theo dõi của thầy cô — và em gõ nhầm thì
              biến mất khỏi lớp của mình mà không ai biết. Nay lớp chỉ đổi được
              bằng mã lớp do thầy cô cấp.
            */}
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-slate-200">Lớp của em</span>
              <div className="flex flex-wrap items-center justify-between gap-3 cq-panel p-3">
                <span className="flex items-center gap-2 text-sm">
                  <GraduationCap className="size-4 text-slate-400" aria-hidden="true" />
                  {profile.class_name ? (
                    <strong className="text-slate-100">{profile.class_name}</strong>
                  ) : (
                    <span className="text-slate-400">Em chưa vào lớp nào</span>
                  )}
                </span>
                <Link to="/app/join-class">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leadingIcon={<Ticket className="size-4" aria-hidden="true" />}
                  >
                    {profile.class_name ? 'Đổi lớp bằng mã' : 'Nhập mã lớp'}
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                Lớp chỉ đổi được bằng mã lớp thầy cô cho em, để tránh vào nhầm lớp.
              </p>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-slate-200 mb-2">
                Nhân vật của em
              </legend>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setAvatarId(avatar.id)}
                    aria-pressed={avatar.id === avatarId}
                    title={avatar.name}
                    className={cn(
                      'p-1.5 rounded-xl border transition-colors',
                      avatar.id === avatarId
                        ? 'border-quest-500 bg-quest-500/10'
                        : 'border-abyss-600 hover:border-abyss-500',
                    )}
                  >
                    <AvatarIcon avatarId={avatar.id} size={40} />
                    <span className="sr-only">{avatar.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <Button
              type="submit"
              isLoading={isSaving}
              loadingLabel="Đang lưu"
              leadingIcon={<Save className="size-4" aria-hidden="true" />}
            >
              Lưu thay đổi
            </Button>
          </form>
        </Card>
      </div>

      {/* --- Huy hiệu --- */}
      <Card className="scroll-mt-24" as="section" id="badges">
        <CardHeader
          title="Bộ sưu tập huy hiệu"
          description={`Đã nhận ${earnedBadges.length}/${allBadges.length || 10} huy hiệu`}
        />

        {isLoadingBadges ? (
          <LoadingState label="Đang tải huy hiệu…" />
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 list-none">
            {allBadges.map((badge) => {
              const Icon = getIcon(badge.icon);
              const isEarned = earnedIds.has(badge.id);
              const earnedAt = earnedAtById.get(badge.id);

              return (
                <li
                  key={badge.id}
                  className={cn(
                    'cq-panel p-4 text-center transition-opacity',
                    !isEarned && 'opacity-45',
                  )}
                >
                  <span
                    className={cn(
                      'grid place-items-center size-12 rounded-2xl mx-auto',
                      isEarned
                        ? 'bg-treasure-400/15 text-treasure-400'
                        : 'bg-abyss-700 text-slate-500',
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-6" />
                  </span>
                  <p className="mt-2 text-sm font-bold text-slate-100">{badge.name}</p>
                  <p className="mt-1 text-xs text-slate-400 leading-snug">{badge.description}</p>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {isEarned && earnedAt ? `Nhận ngày ${formatDate(earnedAt)}` : 'Chưa nhận'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
