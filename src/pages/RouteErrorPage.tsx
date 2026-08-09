import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ByteMascot } from '@/components/game/ByteMascot';

/**
 * Trang hiện ra khi việc chuyển trang thất bại.
 *
 * Nguyên nhân hay gặp nhất ở phòng máy: mạng rớt đúng lúc trình duyệt đang tải
 * phần code của trang mới (các trang đều được tách chunk và tải khi cần). Khi
 * đó ErrorBoundary bên trong không bắt được, vì lỗi xảy ra ở tầng định tuyến.
 */
export function RouteErrorPage() {
  const error = useRouteError();

  const isChunkLoadError =
    error instanceof Error &&
    /dynamically imported module|Loading chunk|Failed to fetch/i.test(error.message);

  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <div className="min-h-dvh grid place-items-center px-4 py-16">
      <div className="text-center max-w-md">
        <ByteMascot size={72} className="mx-auto" mood="thinking" />

        {isChunkLoadError ? (
          <>
            <span
              className="mt-4 inline-grid place-items-center size-12 rounded-2xl bg-treasure-400/15 text-treasure-400"
              aria-hidden="true"
            >
              <WifiOff className="size-6" />
            </span>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-100">
              Chưa tải xong trang này
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Có vẻ mạng vừa chập chờn giữa chừng. Code em viết vẫn được lưu an toàn — em bấm tải
              lại là quay về đúng chỗ đang làm.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-extrabold text-slate-100">
              {status === 404 ? 'Không tìm thấy trang này' : 'Trang này gặp trục trặc'}
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Đừng lo, tiến trình học của em vẫn được giữ nguyên. Em thử tải lại trang nhé.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Button
            onClick={() => window.location.reload()}
            leadingIcon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Tải lại trang
          </Button>
          <Link to="/">
            <Button variant="secondary">Về trang chủ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
