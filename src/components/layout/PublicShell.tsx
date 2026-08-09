import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { SiteFooter } from './AppShell';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { RouteAnnouncer } from '@/components/common/RouteAnnouncer';
import { LoadingState, OfflineBanner } from '@/components/common/StateViews';
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

      <header className="border-b border-abyss-800">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-100">
            <span className="grid place-items-center size-9 rounded-xl bg-quest-600 text-abyss-950">
              <Zap className="size-5" aria-hidden="true" />
            </span>
            CodeQuest <span className="text-quest-400">C++ 8</span>
          </Link>

          <nav aria-label="Điều hướng phụ" className="flex items-center gap-1 text-sm">
            <Link
              to="/handbook"
              className="px-3 h-9 inline-flex items-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-abyss-800"
            >
              Sổ tay lệnh
            </Link>
            <Link
              to="/auth/login"
              className="px-3 h-9 inline-flex items-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-abyss-800"
            >
              Đăng nhập
            </Link>
          </nav>
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
