import { BookOpen } from 'lucide-react';
import { Handbook } from '@/components/learning/Handbook';

interface HandbookPageProps {
  /** Giới hạn thẻ theo bài đã học. Bỏ trống ở trang công khai để xem toàn bộ. */
  upToLessonId?: string;
}

export function HandbookPage({ upToLessonId }: HandbookPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <span
          className="grid place-items-center size-12 rounded-2xl bg-quest-500/15 text-quest-400"
          aria-hidden="true"
        >
          <BookOpen className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Sổ tay lệnh</h1>
          <p className="text-sm text-slate-400">
            Tra cú pháp bất cứ lúc nào — tra sổ tay không tính là dùng gợi ý đâu nhé.
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        Sổ tay chỉ nhắc lại cú pháp chung, không chứa lời giải cho nhiệm vụ nào. Ví dụ trong sổ tay
        cố ý dùng bối cảnh khác với bài tập, để em vẫn phải tự nghĩ cách áp dụng.
      </p>

      <Handbook upToLessonId={upToLessonId} />
    </div>
  );
}
