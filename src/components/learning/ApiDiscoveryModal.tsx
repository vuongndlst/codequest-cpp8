import { useEffect, useRef } from 'react';
import { ArrowRight, Braces, Eye, Gamepad2, Keyboard } from 'lucide-react';
import type { ApiIntroduction } from '@/data/challengeScaffolding';
import { Button } from '@/components/ui/Button';
import { ByteMascot } from '@/components/game/ByteMascot';
import { CppCodeBlock } from '@/components/editor/CppCodeBlock';

interface ApiDiscoveryModalProps {
  open: boolean;
  commands: ApiIntroduction[];
  onClose: () => void;
}

/** Giới thiệu đúng các Game API lần đầu xuất hiện, trước khi học sinh chạm vào editor. */
export function ApiDiscoveryModal({ open, commands, onClose }: ApiDiscoveryModalProps) {
  const actionRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => actionRef.current?.focus(), 0);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open || commands.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-abyss-950/86 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-discovery-title"
    >
      <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-mage-400/45 bg-abyss-900 shadow-[0_28px_90px_rgba(2,6,23,.78),0_0_45px_rgba(168,85,247,.15)]">
        <header className="border-b border-abyss-700 bg-[radial-gradient(circle_at_82%_0%,rgba(168,85,247,.2),transparent_42%),linear-gradient(135deg,rgba(126,34,206,.14),transparent_58%)] px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-mage-300/30 bg-abyss-950/75 shadow-[0_0_24px_rgba(168,85,247,.2)]">
              <ByteMascot size={42} animated mood="thinking" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.17em] text-mage-300">
                <Gamepad2 className="size-4" aria-hidden="true" /> Kỹ năng mới mở khóa
              </p>
              <h2 id="api-discovery-title" className="mt-1 text-xl font-black text-slate-50 sm:text-2xl">
                Làm quen {commands.length === 1 ? 'với một Game API mới' : `với ${commands.length} Game API mới`}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                Đây là hàm do CodeQuest cung cấp để code C++ điều khiển thế giới game. Em đọc cách dùng trước, rồi tự gõ khi làm nhiệm vụ.
              </p>
            </div>
          </div>
        </header>

        <div className="max-h-[58vh] space-y-3 overflow-y-auto p-5 sm:p-7">
          {commands.map((command) => (
            <article key={command.signature} className="grid gap-3 rounded-2xl border border-mage-400/25 bg-mage-500/[.06] p-4 sm:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] sm:items-center">
              <CppCodeBlock code={command.signature} label="Game API · C++" />
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <Braces className="size-4 text-mage-300" aria-hidden="true" /> Hàm này dùng để làm gì?
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{command.description}.</p>
                <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                  <Eye className="mt-0.5 size-3.5 shrink-0 text-quest-300" aria-hidden="true" />
                  {command.insertKind === 'expression'
                    ? 'Hàm trả về dữ liệu: đặt nó trong phép gán, biểu thức hoặc điều kiện phù hợp.'
                    : 'Mỗi lần gọi hàm tạo một hành động trên bản đồ; thứ tự các lời gọi rất quan trọng.'}
                </p>
              </div>
            </article>
          ))}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-abyss-700 bg-abyss-950/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Keyboard className="size-4 shrink-0 text-mage-300" aria-hidden="true" />
            Không có nút chèn code — em sẽ tự gõ để nhớ cú pháp.
          </p>
          <Button
            ref={actionRef}
            onClick={onClose}
            trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            className="cursor-pointer whitespace-nowrap"
          >
            Đã hiểu · Vào bản đồ
          </Button>
        </footer>
      </section>
    </div>
  );
}
