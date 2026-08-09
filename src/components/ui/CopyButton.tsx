import { useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { copyText } from '@/utils/clipboard';

interface CopyButtonProps {
  value: string;
  label: string;
  /** Chữ hiện sau khi chép xong — mặc định "Đã chép" */
  copiedLabel?: string;
  variant?: ButtonVariant;
  className?: string;
}

/**
 * Nút chép nội dung, có phản hồi nhìn thấy được.
 *
 * Phản hồi không chỉ đổi icon mà đổi CẢ CHỮ (mục 18: không dựa vào riêng hình
 * hay màu). `aria-live` để trình đọc màn hình đọc lên "Đã chép" — nếu không,
 * người dùng bàn phím bấm xong sẽ không biết có chuyện gì xảy ra.
 */
export function CopyButton({
  value,
  label,
  copiedLabel = 'Đã chép',
  variant = 'secondary',
  className,
}: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timerRef = useRef<number | null>(null);

  // Dọn timer khi component bị gỡ, tránh setState trên component đã unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    const ok = await copyText(value);
    setState(ok ? 'copied' : 'failed');

    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setState('idle'), 2500);
  };

  const icon =
    state === 'copied' ? (
      <Check className="size-4" aria-hidden="true" />
    ) : state === 'failed' ? (
      <X className="size-4" aria-hidden="true" />
    ) : (
      <Copy className="size-4" aria-hidden="true" />
    );

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => void handleCopy()}
      leadingIcon={icon}
      className={className}
    >
      <span aria-live="polite">
        {state === 'copied' ? copiedLabel : state === 'failed' ? 'Chưa chép được' : label}
      </span>
    </Button>
  );
}
