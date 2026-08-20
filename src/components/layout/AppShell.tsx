import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { LoadingState, OfflineBanner } from '@/components/common/StateViews';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { RouteAnnouncer } from '@/components/common/RouteAnnouncer';
import { useUiStore } from '@/stores/uiStore';
import { env } from '@/lib/env';

/** Khung giao diện cho các trang sau khi đăng nhập. */
export function AppShell() {
  const isOnline = useUiStore((state) => state.isOnline);
  const location = useLocation();
  const isGameRoute = /^\/app\/lesson\/[^/]+\/challenge\/[^/]+/.test(location.pathname);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Bỏ qua điều hướng — hiện ra khi nhấn Tab lần đầu (mục 18) */}
      <a href="#main-content" className="sr-only sr-only-focusable">
        Bỏ qua điều hướng, tới nội dung chính
      </a>

      <RouteAnnouncer />
      {!isOnline && <OfflineBanner />}
      <TopBar />

      <main
        id="main-content"
        tabIndex={-1}
        className={isGameRoute
          ? 'mx-auto w-full max-w-[118rem] flex-1 px-1 py-1 sm:px-2'
          : 'mx-auto w-full max-w-[112rem] flex-1 px-3 py-4 sm:px-4'}
      >
        <ErrorBoundary showDetail={env.isDev}>
          <Suspense fallback={<LoadingState label="Đang tải màn hình nhiệm vụ…" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      {!isGameRoute && <SiteFooter />}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-3 border-t border-abyss-800">
      <div className="mx-auto max-w-7xl px-4 py-2.5 text-center text-[11px] text-slate-500">
        {/* Yêu cầu mục 15: nói rõ vai trò của website trong tiết học */}
        <p>
          CodeQuest C++ 8 · <strong className="text-slate-400">Công cụ hỗ trợ học tập</strong> · Giáo viên phụ trách: Nguyễn Đình Vương
        </p>
      </div>
    </footer>
  );
}
