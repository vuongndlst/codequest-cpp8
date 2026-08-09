import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { fetchMyClass } from '@/services/supabase/classes.repo';

/**
 * Nhắc học sinh chưa thuộc lớp nào nhập mã lớp.
 *
 * Cần thiết vì những em đăng ký TRƯỚC khi có tính năng lớp sẽ mãi mãi không
 * xuất hiện trong lớp nào nếu không có chỗ nào nhắc. Thầy cô sẽ ngồi tự hỏi vì
 * sao sĩ số trên website ít hơn sĩ số thật.
 *
 * Không hiện gì khi em đã có lớp — không thêm nhiễu vào màn hình chính.
 */
export function ClassBanner() {
  const [state, setState] = useState<'loading' | 'has-class' | 'no-class'>('loading');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const row = await fetchMyClass();
      if (!cancelled) setState(row ? 'has-class' : 'no-class');
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state !== 'no-class') return null;

  return (
    <Alert tone="warning" title="Em chưa vào lớp nào">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="leading-relaxed">
          Em nhập mã lớp để thầy cô theo dõi được tiến trình của em. Mã này thầy cô cho em.
        </p>
        <Link to="/app/join-class" className="shrink-0">
          <Button size="sm" leadingIcon={<Ticket className="size-4" aria-hidden="true" />}>
            Nhập mã lớp
          </Button>
        </Link>
      </div>
    </Alert>
  );
}
