import type { PasswordCheck } from '@/services/supabase/auth.service';
import { MIN_PASSWORD_LENGTH } from '@/services/supabase/auth.service';
import { cn } from '@/utils/cn';

/**
 * Thanh đo độ mạnh mật khẩu.
 *
 * Không chỉ dùng màu để báo mức độ (mục 18): mỗi mức đều có nhãn chữ, và
 * thanh đo mang `role="meter"` kèm nhãn đọc được cho trình đọc màn hình.
 */
const LEVELS = {
  weak: { label: 'Còn yếu', bars: 1, bar: 'bg-alert-500', text: 'text-alert-400' },
  fair: { label: 'Tạm ổn', bars: 2, bar: 'bg-treasure-400', text: 'text-treasure-300' },
  strong: { label: 'Mạnh', bars: 3, bar: 'bg-verdant-500', text: 'text-verdant-400' },
} as const;

export function PasswordStrengthMeter({
  password,
  check,
}: {
  password: string;
  check: PasswordCheck;
}) {
  if (!password) {
    return (
      <p className="text-xs text-slate-500">
        Ít nhất {MIN_PASSWORD_LENGTH} ký tự. Không bắt buộc chữ hoa, số hoặc ký tự đặc biệt.
      </p>
    );
  }

  const level = LEVELS[check.strength];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div
          className="flex gap-1 flex-1"
          role="meter"
          aria-valuenow={level.bars}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Độ mạnh mật khẩu: ${level.label}`}
        >
          {[1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                index <= level.bars ? level.bar : 'bg-abyss-700',
              )}
            />
          ))}
        </div>
        <span className={cn('text-xs font-semibold shrink-0', level.text)}>{level.label}</span>
      </div>

      {check.advice.length > 0 && (
        <ul className="space-y-0.5">
          {check.advice.map((tip, index) => (
            <li key={index} className="text-xs text-slate-500">
              · {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
