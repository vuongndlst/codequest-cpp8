import { Keyboard, Sparkles } from 'lucide-react';
import type { PaletteCommand } from '@/data/commandPalette';

interface CommandPaletteProps {
  commands: PaletteCommand[];
  /** Từ khóa ngay trước con trỏ. Rỗng nghĩa là học sinh chưa chủ động gõ lệnh. */
  activeToken: string;
}

/**
 * Nhắc lệnh theo điều học sinh đang gõ — tuyệt đối không chèn code hộ.
 *
 * Chỉ khi em bắt đầu gõ ít nhất 2 ký tự, coach mới đối chiếu các lệnh thật sự
 * cần cho nhiệm vụ. Kết quả là văn bản đọc-only, không có button/click-to-insert.
 */
export function CommandPalette({ commands, activeToken }: CommandPaletteProps) {
  if (commands.length === 0) return null;

  const query = activeToken.trim().toLowerCase();
  const matches = query.length < 2
    ? []
    : commands.filter((command) => commandTrigger(command).startsWith(query)).slice(0, 2);

  return (
    <section
      aria-labelledby="palette-heading"
      className="min-h-16 rounded-xl border border-abyss-700 bg-abyss-950/55 px-3 py-2.5"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-quest-500/12 text-quest-300">
          <Keyboard className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
        <h3
          id="palette-heading"
          className="text-xs font-bold text-slate-300"
        >
          Nhắc lệnh khi em gõ
        </h3>

          {query.length < 2 && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Em hãy tự bắt đầu gõ. Byte chỉ nhắc cú pháp sau 2 ký tự và không chèn code hộ.
            </p>
          )}

          {query.length >= 2 && matches.length === 0 && (
            <p className="mt-1 text-[11px] leading-relaxed text-treasure-300" role="status">
              Chưa có lệnh phù hợp với <code className="font-mono">{activeToken}</code>. Em kiểm tra lại chính tả nhé.
            </p>
          )}

          {matches.length > 0 && (
            <ul className="mt-2 space-y-1.5" aria-live="polite">
              {matches.map((command) => (
                <li
                  key={command.label}
                  className="flex flex-col gap-0.5 rounded-lg border border-quest-500/20 bg-quest-500/6 px-2.5 py-2 sm:flex-row sm:items-center sm:gap-2"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3 text-quest-300" aria-hidden="true" />
                    <code className="font-mono text-xs font-bold text-quest-300">{command.label}</code>
                  </span>
                  <span className="text-[11px] text-slate-400 sm:border-l sm:border-abyss-600 sm:pl-2">
                    {command.hint}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function commandTrigger(command: PaletteCommand): string {
  return command.label.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0]?.toLowerCase() ?? '';
}
