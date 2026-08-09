import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import { cn } from '@/utils/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'error' | 'tip';

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Với thông báo xuất hiện động, để screen reader đọc lên */
  live?: boolean;
}

/**
 * Hộp thông báo.
 *
 * Mục 18: KHÔNG chỉ dùng màu để biểu thị đúng/sai — mỗi tone đều có icon riêng
 * và nhãn chữ cho screen reader.
 */
const TONES: Record<
  AlertTone,
  { wrapper: string; icon: typeof Info; iconClass: string; srLabel: string }
> = {
  info: {
    wrapper: 'bg-abyss-800/80 border-abyss-500 text-slate-200',
    icon: Info,
    iconClass: 'text-quest-400',
    srLabel: 'Thông tin:',
  },
  success: {
    wrapper: 'bg-verdant-500/10 border-verdant-500/50 text-verdant-400',
    icon: CheckCircle2,
    iconClass: 'text-verdant-400',
    srLabel: 'Thành công:',
  },
  warning: {
    wrapper: 'bg-treasure-400/10 border-treasure-400/50 text-treasure-300',
    icon: AlertCircle,
    iconClass: 'text-treasure-400',
    srLabel: 'Lưu ý:',
  },
  error: {
    wrapper: 'bg-alert-500/10 border-alert-400/50 text-alert-400',
    icon: AlertCircle,
    iconClass: 'text-alert-400',
    srLabel: 'Lỗi:',
  },
  tip: {
    wrapper: 'bg-mage-500/10 border-mage-400/50 text-mage-300',
    icon: Lightbulb,
    iconClass: 'text-mage-300',
    srLabel: 'Mẹo:',
  },
};

export function Alert({ tone = 'info', title, children, className, live = false }: AlertProps) {
  const config = TONES[tone];
  const Icon = config.icon;

  return (
    <div
      role={tone === 'error' ? 'alert' : live ? 'status' : undefined}
      aria-live={live && tone !== 'error' ? 'polite' : undefined}
      className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', config.wrapper, className)}
    >
      <Icon className={cn('size-5 shrink-0 mt-0.5', config.iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <span className="sr-only">{config.srLabel} </span>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
