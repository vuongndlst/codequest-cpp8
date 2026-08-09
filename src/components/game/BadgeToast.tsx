import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { BadgeRow } from '@/types/database';
import { getIcon } from '@/utils/icons';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

interface BadgeToastProps {
  badges: BadgeRow[];
  onDismiss: () => void;
}

/**
 * Thông báo nhận huy hiệu.
 *
 * Tự đóng sau 8 giây — đủ lâu để đọc hết mô tả, nhưng không chắn màn hình mãi.
 * Khi bật chế độ giảm chuyển động thì bỏ hiệu ứng trượt.
 */
export function BadgeToast({ badges, onDismiss }: BadgeToastProps) {
  const reducedMotion = useUiStore((state) => state.reducedMotion);

  useEffect(() => {
    if (badges.length === 0) return;
    const timer = setTimeout(onDismiss, 8_000);
    return () => clearTimeout(timer);
  }, [badges, onDismiss]);

  if (badges.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-2"
      role="status"
      aria-live="polite"
    >
      {badges.map((badge) => {
        const Icon = getIcon(badge.icon);

        return (
          <div
            key={badge.id}
            className={cn(
              'cq-card p-4 border-treasure-400/60 bg-abyss-800 shadow-xl shadow-treasure-400/10',
              !reducedMotion && 'animate-slide-up',
            )}
          >
            <div className="flex gap-3">
              <span
                className="grid place-items-center size-12 rounded-2xl bg-treasure-400/20 text-treasure-400 shrink-0"
                aria-hidden="true"
              >
                <Icon className="size-6" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-treasure-400">
                  Huy hiệu mới!
                </p>
                <p className="font-bold text-slate-100">{badge.name}</p>
                <p className="text-sm text-slate-400 leading-snug mt-0.5">{badge.description}</p>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Đóng thông báo huy hiệu"
                className="grid place-items-center size-7 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-abyss-700 shrink-0"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
