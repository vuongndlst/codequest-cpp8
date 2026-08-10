import { Cog, PackageOpen } from 'lucide-react';
import type { WorldEvent } from '@/validators/world';
import { cn } from '@/utils/cn';
import { TileSprite } from './TileSprite';
import { TILE } from './mapTiles';

interface WorkshopStageProps {
  events: WorldEvent[];
  /** Số sự kiện đã phát — trang giữ tiến độ, sân khấu chỉ vẽ đúng thời điểm đó */
  playedCount: number;
  hideTitle?: boolean;
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
export function WorkshopStage({ events, playedCount, hideTitle }: WorkshopStageProps) {
  const machines = replay(events.slice(0, playedCount));

  const hasRun = events.length > 0;
  const idleCount = machines.filter((machine) => machine.runCount === 0).length;

  return (
    <section aria-labelledby="workshop-heading" className="rounded-2xl border-2 border-treasure-400/30 bg-gradient-to-b from-amber-500/12 via-orange-500/5 to-abyss-950 p-4 shadow-[0_18px_60px_rgba(245,158,11,0.1)]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 id="workshop-heading" className={hideTitle ? 'sr-only' : 'text-sm font-bold text-slate-200'}>
          Xưởng Rèn
        </h3>
        <span className="text-xs text-slate-500">
          {hasRun ? `${machines.length} cỗ máy trên bàn` : 'Chưa chạy'}
        </span>
      </div>

      <div className="relative mb-4 h-28 overflow-hidden rounded-xl border border-abyss-700 bg-abyss-950/75" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-0 h-10 border-t border-treasure-400/20 bg-[repeating-linear-gradient(90deg,rgba(148,163,184,.16)_0_20px,rgba(15,23,42,.65)_20px_40px)]" />
        <TileSprite index={TILE.torch.index} sheet={TILE.torch.sheet} scale={3} className="absolute left-[8%] bottom-8 drop-shadow-[0_0_12px_rgba(251,191,36,.7)]" />
        <TileSprite index={TILE.sword.index} sheet={TILE.sword.sheet} scale={4} className="absolute left-[43%] bottom-8 drop-shadow-[0_8px_8px_rgba(0,0,0,.5)]" />
        <TileSprite index={TILE.chest.index} sheet={TILE.chest.sheet} scale={4} className="absolute right-[8%] bottom-8 drop-shadow-[0_8px_8px_rgba(0,0,0,.5)]" />
        <span className="absolute left-3 top-2 rounded-full bg-treasure-500/12 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-treasure-200">
          Khai báo = lắp máy · Gọi hàm = bật máy
        </span>
      </div>

      {machines.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          {hasRun
            ? 'Chưa có cỗ máy nào. Em thử khai báo một hàm ngoài main() xem sao.'
            : 'Bấm Chạy code để lắp máy lên bàn.'}
        </p>
      ) : (
        <ul className="grid gap-2 list-none sm:grid-cols-2">
          {machines.map((machine) => (
            <li
              key={machine.name}
              className={cn(
                'min-h-32 rounded-xl border p-3 transition-all',
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
                  <span className="relative grid place-items-center">
                    <TileSprite index={TILE.sword.index} sheet={TILE.sword.sheet} scale={2} className={cn(machine.isRunningNow && 'animate-pulse')} />
                    <Cog className={cn('absolute size-4 drop-shadow-md', machine.isRunningNow && 'animate-spin')} />
                  </span>
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
