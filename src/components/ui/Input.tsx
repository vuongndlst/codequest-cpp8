import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Thông báo lỗi — hiển thị kèm icon, không chỉ dựa vào màu (mục 18) */
  error?: string | null;
  hint?: string;
  leadingIcon?: ReactNode;
  /** Nút hiện/ẩn mật khẩu, nút xoá… */
  trailingSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leadingIcon, trailingSlot, className, required, ...rest },
  ref,
) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-200">
        {label}
        {required && (
          <span className="text-quest-400 ml-1" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (bắt buộc)</span>}
      </label>

      <div className="relative">
        {leadingIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'w-full h-11 rounded-xl bg-abyss-900 border text-slate-100 placeholder:text-slate-500',
            'px-3.5 transition-colors',
            leadingIcon && 'pl-10',
            trailingSlot && 'pr-11',
            error
              ? 'border-alert-400 focus:border-alert-400'
              : 'border-abyss-600 focus:border-quest-500',
            className,
          )}
          {...rest}
        />

        {trailingSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailingSlot}</span>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-400">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-sm text-alert-400"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});
