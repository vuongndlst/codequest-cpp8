import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { LoadingState, OfflineBanner } from '@/components/common/StateViews';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { RouteAnnouncer } from '@/components/common/RouteAnnouncer';
import { useUiStore } from '@/stores/uiStore';
import { env } from '@/lib/env';

/** Khung giao diện cho các trang sau khi đăng nhập. */
export function AppShell() {
  const isOnline = useUiStore((state) => state.isOnline);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Bỏ qua điều hướng — hiện ra khi nhấn Tab lần đầu (mục 18) */}
      <a href="#main-content" className="sr-only sr-only-focusable">
        Bỏ qua điều hướng, tới nội dung chính
      </a>

      <RouteAnnouncer />
      {!isOnline && <OfflineBanner />}
      <TopBar />

      <main id="main-content" tabIndex={-1} className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        <ErrorBoundary showDetail={env.isDev}>
          <Suspense fallback={<LoadingState label="Đang tải màn hình nhiệm vụ…" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-abyss-800 mt-8">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-500 space-y-1">
        {/* Yêu cầu mục 15: nói rõ vai trò của website trong tiết học */}
        <p>
          CodeQuest C++ 8 là <strong className="text-slate-400">công cụ hỗ trợ</strong> trong một
          số thời điểm của tiết học, không thay thế toàn bộ hoạt động học trên lớp.
        </p>
        <p>Giáo viên phụ trách: Nguyễn Đình Vương</p>
      </div>
    </footer>
  );
}
