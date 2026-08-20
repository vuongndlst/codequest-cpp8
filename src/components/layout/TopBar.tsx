import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Gem,
  LogOut,
  Map,
  Menu,
  MessagesSquare,
  Settings2,
  Sparkles,
  Ticket,
  User,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { getLevelProgress } from '@/utils/xp';
import { cn } from '@/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Map;
  end: boolean;
  /** Hiện số tin nhắn chưa đọc bên cạnh nhãn */
  showsUnread?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Bản đồ', icon: Map, end: true },
  { to: '/app/chat', label: 'Hỏi thầy cô', icon: MessagesSquare, end: false, showsUnread: true },
  { to: '/app/handbook', label: 'Sổ tay lệnh', icon: BookOpen, end: false },
  { to: '/app/certificates', label: 'Chứng chỉ', icon: Sparkles, end: false },
];

const PROFILE_ITEM: NavItem = { to: '/app/profile', label: 'Hồ sơ', icon: User, end: false };

/**
 * Mục điều hướng chỉ hiện với giáo viên.
 *
 * Không có mục này thì tài khoản giáo viên bị kẹt hoàn toàn: đăng nhập xong
 * rơi vào dashboard học sinh, và không có chỗ nào bấm sang khu vực giáo viên.
 */
const TEACHER_NAV_ITEMS: NavItem[] = [
  { to: '/teacher', label: 'Theo dõi', icon: GraduationCap, end: true },
  { to: '/teacher/classes', label: 'Lớp của tôi', icon: Ticket, end: false },
  { to: '/teacher/chat', label: 'Hỏi đáp', icon: MessagesSquare, end: false, showsUnread: true },
];

/**
 * Chấm báo tin chưa đọc.
 *
 * Có kèm chữ đọc được cho trình đọc màn hình chứ không chỉ một con số trơ:
 * "3" đứng một mình thì người dùng không biết 3 cái gì.
 */
function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-alert-500 text-white">
      <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
      <span className="sr-only">{count} tin nhắn chưa đọc</span>
    </span>
  );
}

export function TopBar() {
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const toggleReducedMotion = useUiStore((state) => state.toggleReducedMotion);
  const soundEnabled = useUiStore((state) => state.soundEnabled);
  const toggleSound = useUiStore((state) => state.toggleSound);
  const navigate = useNavigate();
  const unreadCount = useUnreadMessages();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const level = getLevelProgress(profile?.total_xp ?? 0);

  // Giáo viên thấy thêm khu vực quản lý; học sinh thì không
  const navItems =
    profile?.role === 'teacher' ? [...TEACHER_NAV_ITEMS, ...NAV_ITEMS] : NAV_ITEMS;
  const mobileNavItems = [...navItems, PROFILE_ITEM];
  const desktopNavItems = profile?.role === 'teacher'
    ? [...TEACHER_NAV_ITEMS, ...NAV_ITEMS]
    : NAV_ITEMS;

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!optionsRef.current?.contains(target)) setOptionsOpen(false);
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOptionsOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeMenus);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenus);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-abyss-700 bg-abyss-900/95 shadow-sm shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[96rem] items-center gap-4 px-4 lg:px-6">
        <Link
          to="/app"
          className="flex shrink-0 items-center gap-2.5 font-extrabold text-slate-100"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-quest-600 text-onaccent shadow-lg shadow-quest-600/20">
            <Zap className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">
            CodeQuest <span className="text-quest-400">C++ 8</span>
          </span>
        </Link>

        {/* Điều hướng chính — máy tính để bàn */}
        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-quest-500/15 text-quest-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-abyss-700',
                )
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
              {item.showsUnread && <UnreadBadge count={unreadCount} />}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* XP và cấp độ */}
          <div className="hidden h-10 items-center gap-2 rounded-xl border border-abyss-600 bg-abyss-800 px-3 lg:flex">
            <span className="text-xs font-bold text-treasure-400 tabular-nums">
              Lv{level.level}
            </span>
            <span className="w-px h-4 bg-abyss-600" aria-hidden="true" />
            <span className="text-xs text-slate-300 tabular-nums">
              {profile?.total_xp ?? 0} XP
            </span>
            <span className="w-px h-4 bg-abyss-600" aria-hidden="true" />
            <Link
              to="/app/shop"
              title="Mở Kho trang bị"
              className="inline-flex items-center gap-1 rounded px-1 text-xs font-bold text-treasure-300 tabular-nums hover:bg-treasure-400/10"
            >
              <Gem className="size-3" aria-hidden="true" />
              {profile?.gem_balance ?? 0}
              <span className="sr-only">Gem</span>
            </Link>
          </div>

          <div ref={optionsRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => {
                setOptionsOpen((open) => !open);
                setProfileOpen(false);
              }}
              aria-expanded={optionsOpen}
              aria-controls="topbar-options"
              aria-label="Mở tùy chọn giao diện"
              title="Âm thanh và giao diện"
              className={cn(
                'grid size-10 place-items-center rounded-xl border transition-colors',
                optionsOpen
                  ? 'border-quest-400/40 bg-quest-500/15 text-quest-300'
                  : 'border-abyss-600 bg-abyss-800 text-slate-400 hover:text-slate-100',
              )}
            >
              <Settings2 className="size-4.5" aria-hidden="true" />
            </button>
            {optionsOpen && (
              <section id="topbar-options" className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-abyss-600 bg-abyss-900 p-3 shadow-2xl shadow-black/30" aria-label="Tùy chọn giao diện">
                <p className="px-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">Tùy chọn</p>
                <button type="button" onClick={toggleSound} aria-pressed={soundEnabled} className="mt-2 flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold text-slate-300 hover:bg-abyss-700">
                  <span className="flex items-center gap-2">
                    {soundEnabled ? <Volume2 className="size-4 text-verdant-300" /> : <VolumeX className="size-4" />}
                    Âm thanh
                  </span>
                  <span className={cn('text-xs font-bold', soundEnabled ? 'text-verdant-300' : 'text-slate-500')}>{soundEnabled ? 'Bật' : 'Tắt'}</span>
                </button>
                <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3">
                  <span className="text-sm font-semibold text-slate-300">Giao diện</span>
                  <ThemeToggle />
                </div>
                <button type="button" onClick={toggleReducedMotion} aria-pressed={reducedMotion} className="flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold text-slate-300 hover:bg-abyss-700">
                  <span>Giảm chuyển động</span>
                  <span className={cn('text-xs font-bold', reducedMotion ? 'text-quest-300' : 'text-slate-500')}>{reducedMotion ? 'Bật' : 'Tắt'}</span>
                </button>
              </section>
            )}
          </div>

          <div ref={profileRef} className="relative hidden xl:block">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open);
                setOptionsOpen(false);
              }}
              aria-expanded={profileOpen}
              aria-controls="topbar-profile-menu"
              aria-label="Mở menu hồ sơ"
              className={cn(
                'flex h-11 items-center gap-2 rounded-xl border px-1.5 pr-2 transition-colors',
                profileOpen ? 'border-quest-400/40 bg-quest-500/10' : 'border-transparent hover:border-abyss-600 hover:bg-abyss-800',
              )}
            >
              <AvatarIcon avatarId={profile?.avatar_id} size={34} />
              <span className="hidden max-w-24 truncate text-xs font-bold text-slate-200 2xl:block">{profile?.full_name?.split(' ').at(-1) ?? 'Học sinh'}</span>
              <ChevronDown className={cn('size-3.5 text-slate-500 transition-transform', profileOpen && 'rotate-180')} aria-hidden="true" />
            </button>
            {profileOpen && (
              <section id="topbar-profile-menu" className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-abyss-600 bg-abyss-900 p-2 shadow-2xl shadow-black/30" aria-label="Menu hồ sơ">
                <div className="border-b border-abyss-700 px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-slate-100">{profile?.full_name ?? 'Học sinh ByteLand'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Cấp {level.level} · {profile?.total_xp ?? 0} XP</p>
                </div>
                <Link to="/app/profile" onClick={() => setProfileOpen(false)} className="mt-1 flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-300 hover:bg-abyss-700">
                  <User className="size-4" aria-hidden="true" /> Hồ sơ của em
                </Link>
                <Link to="/app/shop" onClick={() => setProfileOpen(false)} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-treasure-200 hover:bg-treasure-400/10">
                  <Gem className="size-4" aria-hidden="true" /> Kho trang bị
                </Link>
                <button type="button" onClick={handleSignOut} className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-400 hover:bg-abyss-700 hover:text-slate-100">
                  <LogOut className="size-4" aria-hidden="true" /> Đăng xuất
                </button>
              </section>
            )}
          </div>

          {/* Nút mở menu — điện thoại/máy tính bảng */}
          <button
            type="button"
            className="xl:hidden grid place-items-center size-9 rounded-lg text-slate-300 hover:bg-abyss-700"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Điều hướng trên thiết bị nhỏ"
          className="xl:hidden border-t border-abyss-700 px-4 py-3 space-y-1"
        >
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium',
                  isActive ? 'bg-quest-500/15 text-quest-400' : 'text-slate-300 hover:bg-abyss-700',
                )
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
              {item.showsUnread && <UnreadBadge count={unreadCount} />}
            </NavLink>
          ))}

          <Link
            to="/app/shop"
            onClick={() => setMobileOpen(false)}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-treasure-200 hover:bg-treasure-400/10"
          >
            <Gem className="size-4" aria-hidden="true" />
            Kho trang bị · {profile?.gem_balance ?? 0} Gem
          </Link>

          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            className="flex h-11 w-full items-center justify-between rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-abyss-700"
          >
            <span className="flex items-center gap-3">
              {soundEnabled ? <Volume2 className="size-4 text-verdant-300" /> : <VolumeX className="size-4" />}
              Âm thanh
            </span>
            <span className={cn('text-xs font-bold', soundEnabled ? 'text-verdant-300' : 'text-slate-500')}>
              {soundEnabled ? 'Bật' : 'Tắt'}
            </span>
          </button>

          <div className="flex items-center justify-between gap-3 px-3 h-11">
            <span className="text-sm text-slate-300">Giao diện</span>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={toggleReducedMotion}
            aria-pressed={reducedMotion}
            className="flex w-full items-center gap-3 px-3 h-11 rounded-lg text-sm text-slate-300 hover:bg-abyss-700"
          >
            {reducedMotion ? 'Bật lại hiệu ứng' : 'Giảm chuyển động'}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 h-11 rounded-lg text-sm text-slate-300 hover:bg-abyss-700"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Đăng xuất
          </button>
        </nav>
      )}
    </header>
  );
}
