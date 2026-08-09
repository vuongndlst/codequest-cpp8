import { Fragment } from 'react';
import { cn } from '@/utils/cn';

interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * Hiển thị đoạn chữ có `code` trong dấu backtick thành thẻ code.
 *
 * QUAN TRỌNG VỀ BẢO MẬT: hàm này tách chuỗi rồi trả về các phần tử React —
 * TUYỆT ĐỐI không dùng `dangerouslySetInnerHTML`. Nhờ vậy dù nội dung có chứa
 * thẻ HTML (ví dụ tên biến của học sinh lọt vào thông báo lỗi) thì cũng chỉ
 * được hiển thị dưới dạng chữ, không bao giờ chạy như HTML (mục 22).
 */
export function RichText({ text, className }: RichTextProps) {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) => {
        const isCode = part.startsWith('`') && part.endsWith('`') && part.length > 2;

        return isCode ? (
          <code
            key={index}
            className={cn(
              'px-1 py-0.5 rounded bg-abyss-950 text-quest-400 font-mono text-[0.9em]',
              className,
            )}
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        );
      })}
    </>
  );
}
