import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UpcomingPageProps {
  title: string;
  /** Giai đoạn triển khai theo kế hoạch trong docs/phase-1-architecture.md */
  phase: string;
  description: string;
  backTo?: string;
  backLabel?: string;
}

/**
 * Trang cho các tính năng đã có route nhưng theo kế hoạch được xây ở giai đoạn sau.
 *
 * Đây KHÔNG phải placeholder giả cho tính năng đã hoàn thành — mỗi trang nói rõ
 * mình thuộc giai đoạn nào, để không ai nhầm là đã xong.
 */
export function UpcomingPage({
  title,
  phase,
  description,
  backTo = '/app',
  backLabel = 'Về bản đồ',
}: UpcomingPageProps) {
  return (
    <div className="min-h-[50vh] grid place-items-center px-4 py-16">
      <div className="text-center max-w-md">
        <span
          className="grid place-items-center size-14 rounded-2xl bg-mage-500/15 text-mage-300 mx-auto"
          aria-hidden="true"
        >
          <Hammer className="size-7" />
        </span>

        <p className="mt-4 inline-block px-3 py-1 rounded-full bg-abyss-800 border border-abyss-600 text-xs font-semibold text-slate-400">
          {phase}
        </p>

        <h1 className="mt-3 text-2xl font-extrabold text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">{description}</p>

        <Link to={backTo} className="inline-block mt-6">
          <Button variant="secondary">{backLabel}</Button>
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-quest-400">404</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-100">Khu vực này không tồn tại</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-sm">
          Có vẻ em đi lạc khỏi bản đồ ByteLand rồi. Không sao, mình quay về chỗ quen thuộc nhé.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button>Về trang chủ</Button>
        </Link>
      </div>
    </div>
  );
}
