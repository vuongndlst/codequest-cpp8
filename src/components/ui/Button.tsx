import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'treasure' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Chữ đọc cho screen reader khi đang tải */
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-quest-600 text-abyss-950 font-semibold hover:bg-quest-500 active:bg-quest-700 shadow-lg shadow-quest-600/20',
  secondary:
    'bg-abyss-700 text-slate-100 font-medium hover:bg-abyss-600 border border-abyss-500',
  ghost: 'bg-transparent text-slate-300 hover:bg-abyss-700/60 hover:text-slate-100',
  treasure:
    'bg-treasure-400 text-abyss-950 font-semibold hover:bg-treasure-300 shadow-lg shadow-treasure-400/20',
  // Chỉ dùng cho hành động phá huỷ (mục 17: đỏ chỉ dành cho cảnh báo)
  danger: 'bg-alert-500 text-white font-semibold hover:bg-alert-400',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-base gap-2',
  lg: 'h-13 px-7 text-lg gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingLabel = 'Đang xử lý',
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>{loadingLabel}…</span>
        </>
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </button>
  );
});
