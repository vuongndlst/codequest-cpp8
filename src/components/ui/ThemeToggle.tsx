import { Monitor, Moon, Sun } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { THEME_LABELS, type ThemePreference } from '@/utils/theme';
import { cn } from '@/utils/cn';

const OPTIONS: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
];

/**
 * Chọn giao diện sáng / tối / theo máy.
 *
 * Ba nút bấm thẳng thay vì một nút bật-tắt: với nút bật-tắt, học sinh không
 * bao giờ quay lại được lựa chọn "theo máy" sau khi đã lỡ bấm một lần.
 *
 * Dùng `role="radiogroup"` vì đây đúng là chọn một trong nhiều — trình đọc màn
 * hình sẽ đọc "2 trên 3" thay vì đọc ba nút rời rạc không liên quan.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  return (
    <div
      role="radiogroup"
      aria-label="Giao diện"
      className={cn('inline-flex gap-0.5 p-0.5 rounded-lg bg-abyss-800 border border-abyss-600', className)}
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={`Giao diện: ${THEME_LABELS[value]}`}
            onClick={() => setTheme(value)}
            className={cn(
              'grid place-items-center size-7 rounded-md transition-colors',
              isActive
                ? 'bg-quest-500/20 text-quest-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-abyss-700',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="sr-only">{THEME_LABELS[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
