import { Cog, PackageOpen } from 'lucide-react';
import type { WorldEvent } from '@/validators/world';
import { useStageReplay } from './useStageReplay';
import { cn } from '@/utils/cn';

interface WorkshopStageProps {
  events: WorldEvent[];
  playKey: number;
}

interface Machine {
  name: string;
  params: string[];
  runCount: number;
  /** Nguyên liệu của lần chạy gần nhất */
  lastArgs: string[];
  lastReturn: string | null;
  isRunningNow: boolean;
}

function detailString(event: WorldEvent, key: string): string {
  const raw = event.detail?.[key];
  return typeof raw === 'string' ? raw : '';
}

function detailStrings(event: WorldEvent, key: string): string[] {
  const raw = event.detail?.[key];
  return Array.isArray(raw) ? raw.map((item) => String(item)) : [];
}

function replay(events: WorldEvent[]): Machine[] {
  const order: string[] = [];
  const byName = new Map<string, Machine>();
  const lastEvent = events[events.length - 1];

  const ensure = (name: string): Machine => {
    let machine = byName.get(name);
    if (!machine) {
      machine = { name, params: [], runCount: 0, lastArgs: [], lastReturn: null, isRunningNow: false };
      byName.set(name, machine);
      order.push(name);
    }
    return machine;
  };

  for (const event of events) {
    if (event.type === 'declare-func') {
      const machine = ensure(detailString(event, 'name'));
      machine.params = detailStrings(event, 'params');
      continue;
    }

    if (event.type === 'call-func') {
      const machine = ensure(detailString(event, 'name'));
      machine.runCount += 1;
      machine.lastArgs = detailStrings(event, 'args');
      machine.isRunningNow = event === lastEvent;
      continue;
    }

    if (event.type === 'return-func') {
      const machine = ensure(detailString(event, 'name'));
      machine.lastReturn = detailString(event, 'value');
    }
  }

  return order.map((name) => byName.get(name)!);
}

/**
 * Sân khấu Xưởng Rèn — khu vực 2 (hàm).
 *
 * Dựng hình đúng MỘT ý: khai báo hàm không phải là chạy hàm.
 *
 * Khai báo → cỗ máy được lắp lên bàn nhưng ĐỨNG IM.
 * Gọi hàm  → đúng cỗ máy đó chạy, đếm số lần.
 * Tham số  → nguyên liệu bỏ vào phễu, hiện ngay cạnh máy.
 *
 * Đây là hiểu nhầm số một về hàm ở lứa tuổi này: rất nhiều em viết xong một
 * hàm rồi thắc mắc sao chạy chương trình không thấy gì. Nhìn cỗ máy nằm im
 * kèm dòng chữ "chưa được gọi" thì hiểu ngay, không cần giảng.
 */
export function WorkshopStage({ events, playKey }: WorkshopStageProps) {
  const playedCount = useStageReplay(events, playKey);
  const machines = replay(events.slice(0, playedCount));

  const hasRun = events.length > 0;
  const idleCount = machines.filter((machine) => machine.runCount === 0).length;

  return (
    <section className="cq-panel p-4" aria-labelledby="workshop-heading">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 id="workshop-heading" className="text-sm font-bold text-slate-200">
          Xưởng Rèn
        </h3>
        <span className="text-xs text-slate-500">
          {hasRun ? `${machines.length} cỗ máy trên bàn` : 'Chưa chạy'}
        </span>
      </div>

      {machines.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          {hasRun
            ? 'Chưa có cỗ máy nào. Em thử khai báo một hàm ngoài main() xem sao.'
            : 'Bấm Chạy code để lắp máy lên bàn.'}
        </p>
      ) : (
        <ul className="space-y-2 list-none">
          {machines.map((machine) => (
            <li
              key={machine.name}
              className={cn(
                'rounded-xl border p-3 transition-colors',
                machine.isRunningNow
                  ? 'border-quest-500 bg-quest-500/15'
                  : machine.runCount > 0
                    ? 'border-verdant-500/40 bg-verdant-500/5'
                    : 'border-abyss-600 bg-abyss-900',
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'grid place-items-center size-9 rounded-lg shrink-0',
                    machine.runCount > 0
                      ? 'bg-verdant-500/20 text-verdant-400'
                      : 'bg-abyss-700 text-slate-500',
                  )}
                  aria-hidden="true"
                >
                  <Cog className={cn('size-5', machine.isRunningNow && 'animate-spin')} />
                </span>

                <div className="min-w-0 flex-1">
                  <code className="font-mono text-sm font-semibold text-slate-100">
                    {machine.name}({machine.params.join(', ')})
                  </code>

                  {/*
                    Nhãn chữ, không chỉ dựa vào màu: máy chưa chạy phải NÓI RA
                    là chưa chạy, vì đó chính là bài học của khu vực này.
                  */}
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      machine.runCount > 0 ? 'text-verdant-400' : 'text-slate-500',
                    )}
                  >
                    {machine.runCount === 0
                      ? 'Đã lắp xong nhưng chưa được gọi — máy đang đứng im'
                      : `Đã chạy ${machine.runCount} lần`}
                  </p>
                </div>
              </div>

              {machine.lastArgs.length > 0 && (
                <p className="flex items-center gap-2 mt-2 pt-2 border-t border-abyss-700 text-xs">
                  <PackageOpen className="size-3.5 text-treasure-400 shrink-0" aria-hidden="true" />
                  <span className="text-slate-500">Nguyên liệu:</span>
                  <code className="font-mono text-treasure-300">
                    {machine.lastArgs.join(', ')}
                  </code>
                </p>
              )}

              {machine.lastReturn !== null && (
                <p className="text-xs mt-1">
                  <span className="text-slate-500">Sản phẩm trả về: </span>
                  <code className="font-mono text-quest-400">{machine.lastReturn}</code>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {idleCount > 0 && machines.length > 0 && (
        <p className="text-xs text-treasure-300 mt-3 leading-relaxed">
          Có {idleCount} cỗ máy đã lắp mà chưa chạy lần nào. Khai báo hàm chỉ là LẮP máy — muốn
          máy chạy thì trong <code className="font-mono">main()</code> phải gọi tên nó.
        </p>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {playedCount > 0 && events[playedCount - 1]?.message}
      </p>
    </section>
  );
}
