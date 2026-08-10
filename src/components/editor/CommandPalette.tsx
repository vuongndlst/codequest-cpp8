import { MousePointerClick } from 'lucide-react';
import type { PaletteCommand } from '@/data/commandPalette';
import { playSound } from '@/services/audio';

interface CommandPaletteProps {
  commands: PaletteCommand[];
  onInsert: (snippet: string) => void;
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
export function CommandPalette({ commands, onInsert }: CommandPaletteProps) {
  if (commands.length === 0) return null;

  return (
    <section aria-labelledby="palette-heading" className="cq-panel p-3">
      <h3
        id="palette-heading"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2"
      >
        <MousePointerClick className="size-3.5" aria-hidden="true" />
        Bấm để chèn lệnh
      </h3>

      <ul className="flex flex-wrap gap-1.5 list-none">
        {commands.map((command) => (
          <li key={command.label}>
            <button
              type="button"
              title={command.hint}
              onClick={() => {
                onInsert(command.snippet);
                playSound('click');
              }}
              className="font-mono text-xs px-2.5 h-8 rounded-lg bg-abyss-800 border border-abyss-600 text-quest-400 hover:border-quest-500 hover:bg-abyss-700 transition-colors"
            >
              {command.label}
              <span className="sr-only"> — {command.hint}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500 mt-2">
        Bấm là lệnh được chèn vào đúng chỗ con trỏ, kèm sẵn dấu <code>;</code>. Còn ghép các lệnh
        theo thứ tự nào thì vẫn là việc của em nhé.
      </p>
    </section>
  );
}
