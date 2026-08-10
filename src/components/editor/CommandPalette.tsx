import { MousePointerClick } from 'lucide-react';
import type { PaletteCommand } from '@/data/commandPalette';
import { playSound } from '@/services/audio';

interface CommandPaletteProps {
  commands: PaletteCommand[];
  onInsert: (snippet: string) => void;
  /** Màn đầu tiên hiện nghĩa của lệnh ngay cạnh cú pháp để tạo cầu nối code → hành động. */
  teachingMode?: boolean;
}

/**
 * Bảng lệnh bấm-để-chèn, đặt ngay trên ô viết code.
 *
 * Lý do tồn tại: học sinh lớp 8 sai dấu `;` và sai chính tả tên lệnh nhiều hơn
 * là sai tư duy. Mỗi lần như vậy là một vòng "chạy → đọc lỗi → sửa" tiêu tốn
 * sự tập trung mà chẳng dạy được gì về thuật toán.
 *
 * Bảng CỐ Ý chỉ có từng lệnh rời. Việc ghép chúng theo thứ tự nào vẫn hoàn
 * toàn là việc của học sinh — đó mới là phần dạy tư duy, và đề bài cũng cấm
 * làm bài hộ.
 */
export function CommandPalette({ commands, onInsert, teachingMode = false }: CommandPaletteProps) {
  if (commands.length === 0) return null;

  return (
    <section aria-labelledby="palette-heading" className="rounded-xl border border-abyss-700 bg-abyss-900/70 px-3 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <h3
          id="palette-heading"
          className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-400"
        >
          <MousePointerClick className="size-3.5 text-quest-400" aria-hidden="true" />
          Lệnh cần cho nhiệm vụ
        </h3>

        <ul className="flex flex-1 flex-wrap gap-1.5 list-none sm:border-l sm:border-abyss-700 sm:pl-3">
          {commands.map((command) => (
            <li key={command.label} className={teachingMode ? 'min-w-0 flex-1 sm:flex-none' : undefined}>
              <button
                type="button"
                title={command.hint}
                onClick={() => {
                  onInsert(command.snippet);
                  playSound('click');
                }}
                className={
                  teachingMode
                    ? 'flex min-h-11 w-full items-center gap-3 rounded-lg border border-quest-500/30 bg-quest-500/5 px-3 text-left transition-colors hover:border-quest-500 hover:bg-quest-500/10'
                    : 'h-8 rounded-lg border border-abyss-600 bg-abyss-800 px-2.5 font-mono text-xs text-quest-400 transition-colors hover:border-quest-500 hover:bg-abyss-700'
                }
              >
                <code className="shrink-0 font-mono text-xs font-bold text-quest-400">{command.label}</code>
                <span className={teachingMode ? 'text-xs text-slate-400' : 'sr-only'}>— {command.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
