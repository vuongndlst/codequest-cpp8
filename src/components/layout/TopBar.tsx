import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  LogOut,
  Map,
  Menu,
  Sparkles,
  Ticket,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getLevelProgress } from '@/utils/xp';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { to: '/app', label: 'Bản đồ', icon: Map, end: true },
  { to: '/app/handbook', label: 'Sổ tay lệnh', icon: BookOpen, end: false },
  { to: '/app/certificates', label: 'Chứng chỉ', icon: Sparkles, end: false },
  { to: '/app/profile', label: 'Hồ sơ', icon: User, end: false },
];

/**
 * Mục điều hướng chỉ hiện với giáo viên.
 *
 * Không có mục này thì tài khoản giáo viên bị kẹt hoàn toàn: đăng nhập xong
 * rơi vào dashboard học sinh, và không có chỗ nào bấm sang khu vực giáo viên.
 */
const TEACHER_NAV_ITEMS = [
  { to: '/teacher', label: 'Theo dõi', icon: GraduationCap, end: true },
  { to: '/teacher/classes', label: 'Lớp của tôi', icon: Ticket, end: false },
];

export function TopBar() {
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const toggleReducedMotion = useUiStore((state) => state.toggleReducedMotion);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const level = getLevelProgress(profile?.total_xp ?? 0);

  // Giáo viên thấy thêm khu vực quản lý; học sinh thì không
  const navItems =
    profile?.role === 'teacher' ? [...TEACHER_NAV_ITEMS, ...NAV_ITEMS] : NAV_ITEMS;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-abyss-900/95 backdrop-blur border-b border-abyss-700">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
        <Link
          to="/app"
          className="flex items-center gap-2 font-extrabold text-slate-100 shrink-0"
        >
          <span className="grid place-items-center size-9 rounded-xl bg-quest-600 text-onaccent">
            <Zap className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">
            CodeQuest <span className="text-quest-400">C++ 8</span>
          </span>
        </Link>

        {/* Điều hướng chính — máy tính để bàn */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 h-9 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-quest-500/15 text-quest-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-abyss-700',
                )
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* XP và cấp độ */}
          <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-abyss-800 border border-abyss-600">
            <span className="text-xs font-bold text-treasure-400 tabular-nums">
              Lv{level.level}
            </span>
            <span className="w-px h-4 bg-abyss-600" aria-hidden="true" />
            <span className="text-xs text-slate-300 tabular-nums">
              {profile?.total_xp ?? 0} XP
            </span>
          </div>

          <ThemeToggle className="hidden sm:inline-flex" />

          {/*
            Nút giảm chuyển động chiếm nhiều chỗ vì là chữ. Ẩn ở màn hình vừa
            để thanh trên cùng không bị chật; ở đó học sinh vẫn bật được qua
            menu ba gạch.
          */}
          <button
            type="button"
            onClick={toggleReducedMotion}
            aria-pressed={reducedMotion}
            className="hidden lg:inline-flex items-center h-9 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-abyss-700 transition-colors"
          >
            {reducedMotion ? 'Bật hiệu ứng' : 'Giảm chuyển động'}
          </button>

          <Link to="/app/profile" className="shrink-0" aria-label="Xem hồ sơ của em">
            <AvatarIcon avatarId={profile?.avatar_id} size={36} />
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="hidden md:inline-flex"
            leadingIcon={<LogOut className="size-4" aria-hidden="true" />}
          >
            Đăng xuất
          </Button>

          {/* Nút mở menu — điện thoại/máy tính bảng */}
          <button
            type="button"
            className="md:hidden grid place-items-center size-9 rounded-lg text-slate-300 hover:bg-abyss-700"
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
          className="md:hidden border-t border-abyss-700 px-4 py-3 space-y-1"
        >
          {navItems.map((item) => (
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
            </NavLink>
          ))}

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
