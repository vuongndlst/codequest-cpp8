import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CloudOff,
  Compass,
  Loader2,
  Lock,
  PlugZap,
  RefreshCw,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

/**
 * Bộ trạng thái giao diện dùng chung (mục 17 của đề bài).
 * Mọi trạng thái đều có: icon + tiêu đề + lời giải thích + hành động tiếp theo.
 */

interface ShellProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: 'neutral' | 'error' | 'warning';
}

function StateShell({ icon, title, description, action, className, tone = 'neutral' }: ShellProps) {
  const iconTone = {
    neutral: 'text-slate-400 bg-abyss-800',
    error: 'text-alert-400 bg-alert-500/10',
    warning: 'text-treasure-400 bg-treasure-400/10',
  }[tone];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center gap-3 py-12 px-6',
        className,
      )}
    >
      <span className={cn('grid place-items-center size-14 rounded-2xl', iconTone)} aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-lg font-bold text-slate-100">{title}</h2>
      <p className="text-sm text-slate-400 max-w-md leading-relaxed">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Trạng thái: ĐANG TẢI */
export function LoadingState({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16"
    >
      <Loader2 className="size-8 text-quest-400 animate-spin" aria-hidden="true" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

/** Trạng thái: KHÔNG CÓ DỮ LIỆU */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <StateShell
      icon={<Compass className="size-7" />}
      title={title}
      description={description}
      action={action}
    />
  );
}

/** Trạng thái: LỖI */
export function ErrorState({
  title = 'Có lỗi xảy ra',
  description,
  onRetry,
}: {
  title?: string;
  description: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <StateShell
      tone="error"
      icon={<ShieldAlert className="size-7" />}
      title={title}
      description={description}
      action={
        onRetry && (
          <Button
            variant="secondary"
            onClick={onRetry}
            leadingIcon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Thử lại
          </Button>
        )
      }
    />
  );
}

/** Trạng thái: MẤT KẾT NỐI SUPABASE / CHƯA CẤU HÌNH */
export function SupabaseDisconnectedState({ detail }: { detail?: string }) {
  return (
    <StateShell
      tone="warning"
      icon={<PlugZap className="size-7" />}
      title="Chưa kết nối được máy chủ"
      description={
        <>
          Website vẫn xem được phần giới thiệu, bản đồ và Sổ tay lệnh, nhưng chưa lưu được tiến
          trình. Em báo thầy để kiểm tra kết nối nhé.
          {detail && <span className="block mt-2 text-xs text-slate-500">{detail}</span>}
        </>
      }
      action={
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Tải lại trang
        </Button>
      }
    />
  );
}

/** Trạng thái: CHƯA ĐĂNG NHẬP */
export function NotSignedInState() {
  return (
    <StateShell
      icon={<Lock className="size-7" />}
      title="Em cần đăng nhập"
      description="Đăng nhập để lưu tiến trình, nhận XP và mở khoá chứng chỉ của mình nhé."
      action={
        <div className="flex flex-wrap gap-2 justify-center">
          <Link to="/auth/login">
            <Button>Đăng nhập</Button>
          </Link>
          <Link to="/auth/register">
            <Button variant="secondary">Tạo tài khoản</Button>
          </Link>
        </div>
      }
    />
  );
}

/** Trạng thái: KHÔNG CÓ QUYỀN TRUY CẬP */
export function NoAccessState({
  description = 'Khu vực này dành riêng cho giáo viên. Nếu em nghĩ đây là nhầm lẫn, hãy báo thầy nhé.',
}: {
  description?: string;
}) {
  return (
    <StateShell
      tone="warning"
      icon={<ShieldAlert className="size-7" />}
      title="Em chưa có quyền vào khu vực này"
      description={description}
      action={
        <Link to="/app">
          <Button variant="secondary">Về trang chính</Button>
        </Link>
      }
    />
  );
}

/** Banner cố định: ĐANG OFFLINE */
export function OfflineBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-treasure-400/15 border-b border-treasure-400/40 px-4 py-2 text-sm text-treasure-300"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      <span>
        Em đang offline. Code vẫn được lưu trên máy này, thầy trò mình sẽ đồng bộ khi có mạng lại.
      </span>
    </div>
  );
}

/** Chỉ báo nhỏ: trạng thái lưu code (dùng ở Giai đoạn 3) */
export type SaveState = 'idle' | 'editing' | 'saving' | 'saved' | 'failed' | 'local_only';

const SAVE_LABELS: Record<SaveState, { text: string; className: string; icon: ReactNode }> = {
  idle: { text: '', className: '', icon: null },
  editing: {
    text: 'Đang chỉnh sửa',
    className: 'text-slate-400',
    icon: <span className="size-2 rounded-full bg-slate-500" aria-hidden="true" />,
  },
  saving: {
    text: 'Đang lưu…',
    className: 'text-quest-400',
    icon: <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />,
  },
  saved: {
    text: 'Đã lưu',
    className: 'text-verdant-400',
    icon: <span className="size-2 rounded-full bg-verdant-500" aria-hidden="true" />,
  },
  failed: {
    text: 'Lưu chưa được, đang thử lại',
    className: 'text-treasure-300',
    icon: <RefreshCw className="size-3.5" aria-hidden="true" />,
  },
  local_only: {
    text: 'Đã lưu trên máy này',
    className: 'text-treasure-300',
    icon: <CloudOff className="size-3.5" aria-hidden="true" />,
  },
};

export function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  const config = SAVE_LABELS[state];

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1.5 text-xs', config.className)}
    >
      {config.icon}
      {config.text}
    </span>
  );
}
