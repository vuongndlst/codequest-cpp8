import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { SiteFooter } from './AppShell';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { RouteAnnouncer } from '@/components/common/RouteAnnouncer';
import { LoadingState, OfflineBanner } from '@/components/common/StateViews';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useUiStore } from '@/stores/uiStore';
import { env } from '@/lib/env';

/** Khung giao diện cho trang công khai: giới thiệu, đăng nhập, demo. */
export function PublicShell() {
  const isOnline = useUiStore((state) => state.isOnline);

  return (
    <div className="min-h-dvh flex flex-col">
      <a href="#main-content" className="sr-only sr-only-focusable">
        Bỏ qua điều hướng, tới nội dung chính
      </a>

      <RouteAnnouncer />
      {!isOnline && <OfflineBanner />}

      <header className="sticky top-0 z-40 border-b border-abyss-800 bg-abyss-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
          {/*
            Chữ thương hiệu ẩn ở màn hình hẹp, giống thanh điều hướng của app.

            Không ẩn thì hàng ngang bị tràn: logo 178px + nút đổi giao diện +
            hai đường dẫn vượt quá 375px của điện thoại, và cả TRANG bị kéo
            ngang được — lỗi khó chịu nhất trên di động.
          */}
          <Link
            to="/"
            className="flex items-center gap-2 font-extrabold text-slate-100"
            aria-label="CodeQuest C++ 8 — về trang chủ"
          >
            <span className="grid place-items-center size-9 rounded-xl bg-quest-600 text-onaccent shrink-0">
              <Zap className="size-5" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">
              CodeQuest <span className="text-quest-400">C++ 8</span>
            </span>
          </Link>

          <nav
            aria-label="Khám phá CodeQuest"
            className="hidden lg:flex items-center justify-center gap-1 text-sm"
          >
            <Link
              to="/demo"
              className="px-3 h-9 inline-flex items-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-abyss-800"
            >
              Chơi thử
            </Link>
            <Link
              to="/map-preview"
              className="px-3 h-9 inline-flex items-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-abyss-800"
            >
              Bản đồ khóa học
            </Link>
            <Link
              to="/handbook"
              className="px-3 h-9 inline-flex items-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-abyss-800"
            >
              Sổ tay lệnh
            </Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link
              to="/auth/login"
              className="px-2 sm:px-3 h-9 inline-flex items-center rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-abyss-800"
            >
              Đăng nhập
            </Link>
            <Link
              to="/auth/register"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg bg-quest-600 px-3 text-sm font-bold text-onaccent shadow-md shadow-quest-600/20 transition hover:bg-quest-500"
            >
              Bắt đầu
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        <ErrorBoundary showDetail={env.isDev}>
          <Suspense fallback={<LoadingState label="Đang tải…" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <SiteFooter />
    </div>
  );
}
