import { Link2, Ticket } from 'lucide-react';
import { CopyButton } from '@/components/ui/CopyButton';
import { buildJoinLink } from '@/services/supabase/classes.repo';
import { cn } from '@/utils/cn';

interface JoinCodePanelProps {
  joinCode: string;
  /** `full` cho trang chi tiết, `compact` cho thẻ trong danh sách */
  size?: 'full' | 'compact';
  className?: string;
}

/**
 * Bảng mã lớp — thứ giáo viên đọc to cho cả lớp chép, hoặc gửi qua Zalo.
 *
 * Mã hiển thị bằng font đẳng khoảng và giãn chữ rộng vì mục đích chính của nó
 * là được CHÉP TAY chính xác từ màn hình máy chiếu. Mã lớp đã cố ý bỏ các ký tự
 * dễ nhìn nhầm (0/O, 1/I/L) từ phía database — phần còn lại là việc của cách
 * trình bày.
 */
export function JoinCodePanel({ joinCode, size = 'full', className }: JoinCodePanelProps) {
  const joinLink = buildJoinLink(joinCode);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
          <Ticket className="size-4" aria-hidden="true" />
          Mã lớp
        </span>

        <code
          className={cn(
            'font-mono font-extrabold tracking-[0.2em] text-quest-300 bg-abyss-900',
            'rounded-xl border border-quest-500/40 px-4 py-2 select-all',
            size === 'full' ? 'text-2xl sm:text-3xl' : 'text-lg',
          )}
        >
          {joinCode}
        </code>
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton value={joinCode} label="Chép mã" copiedLabel="Đã chép mã" />
        <CopyButton value={joinLink} label="Chép link mời" copiedLabel="Đã chép link" />
      </div>

      {size === 'full' && (
        <p className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
          <Link2 className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Học sinh mở link mời thì mã đã điền sẵn, chỉ cần đăng ký là vào đúng lớp. Em nào đã có
            tài khoản rồi thì vào mục Hồ sơ, nhập mã lớp này.
          </span>
        </p>
      )}
    </div>
  );
}
