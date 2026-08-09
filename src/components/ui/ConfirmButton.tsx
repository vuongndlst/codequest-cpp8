import { useEffect, useRef, useState } from 'react';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';

interface ConfirmButtonProps {
  onConfirm: () => void | Promise<void>;
  label: string;
  /** Chữ ở bước hỏi lại — nên nói rõ điều gì sắp xảy ra */
  confirmLabel: string;
  variant?: ButtonVariant;
  confirmVariant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  title?: string;
}

/**
 * Nút hai bước cho hành động khó hoàn tác.
 *
 * Dùng thay `window.confirm` vì hộp thoại của trình duyệt khoá cả trang, không
 * theo giao diện chung, và trên vài trình duyệt còn bị chặn im lặng. Ở đây bước
 * hỏi lại tự huỷ sau 5 giây — thầy cô lỡ bấm rồi bỏ đi thì nút tự trở về trạng
 * thái an toàn chứ không nằm chờ sẵn một cú bấm nhầm.
 */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel,
  variant = 'ghost',
  confirmVariant = 'danger',
  size = 'sm',
  disabled,
  title,
}: ConfirmButtonProps) {
  const [isArmed, setIsArmed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const disarm = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsArmed(false);
  };

  const handleClick = async () => {
    if (!isArmed) {
      setIsArmed(true);
      timerRef.current = window.setTimeout(() => setIsArmed(false), 5000);
      return;
    }

    disarm();
    setIsBusy(true);
    try {
      await onConfirm();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant={isArmed ? confirmVariant : variant}
      size={size}
      disabled={disabled}
      isLoading={isBusy}
      title={title}
      onClick={() => void handleClick()}
      onBlur={disarm}
    >
      <span aria-live="polite">{isArmed ? confirmLabel : label}</span>
    </Button>
  );
}
