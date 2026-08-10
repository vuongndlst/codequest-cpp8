import { Box, Lightbulb } from 'lucide-react';
import type { WorldEvent } from '@/validators/world';
import { cn } from '@/utils/cn';

interface SignalTowerStageProps {
  events: WorldEvent[];
  /** Số sự kiện đã phát — trang giữ tiến độ, sân khấu chỉ vẽ đúng thời điểm đó */
  playedCount: number;
  hideTitle?: boolean;
}

interface Beacon {
  index: number;
  text: string;
}

interface Crystal {
  name: string;
  value: string;
  /** Giá trị ngay trước lần gán gần nhất — null nếu vừa mới tạo */
  previous: string | null;
  justChanged: boolean;
}

function detailString(event: WorldEvent, key: string): string {
  const raw = event.detail?.[key];
  return typeof raw === 'string' ? raw : '';
}

/**
 * Dựng lại tháp tín hiệu từ chuỗi sự kiện đã phát tới thời điểm hiện tại.
 *
 * Tính lại từ đầu mỗi nhịp thay vì cộng dồn vào state: chuỗi tối đa 300 sự
 * kiện nên chi phí không đáng kể, đổi lại tua đi tua lại luôn ra đúng một kết
 * quả. Cộng dồn thì chạy lại animation phải nhớ dọn state, và đó là chỗ sinh
 * lỗi "chạy lần hai thấy dữ liệu lần một".
 */
function replay(events: WorldEvent[]): { beacons: Beacon[]; crystals: Crystal[] } {
  const beacons: Beacon[] = [];
  const order: string[] = [];
  const byName = new Map<string, Crystal>();

  const lastEvent = events[events.length - 1];

  for (const event of events) {
    if (event.type === 'print') {
      beacons.push({ index: beacons.length, text: detailString(event, 'text') });
      continue;
    }

    if (event.type === 'declare-var') {
      const name = detailString(event, 'name');
      if (!byName.has(name)) order.push(name);
      byName.set(name, {
        name,
        value: detailString(event, 'value'),
        previous: null,
        justChanged: event === lastEvent,
      });
      continue;
    }

    if (event.type === 'assign-var') {
      const name = detailString(event, 'name');
      if (!byName.has(name)) order.push(name);
      byName.set(name, {
        name,
        value: detailString(event, 'value'),
        previous: detailString(event, 'from'),
        justChanged: event === lastEvent,
      });
    }
  }

  return { beacons, crystals: order.map((name) => byName.get(name)!) };
}

/**
 * Sân khấu Tháp Tín Hiệu — khu vực 1 (`cout` và biến).
 *
 * Hai thứ được dựng hình vì chúng đúng là hai hiểu nhầm phổ biến nhất ở mức
 * này:
 *
 *   · Đèn sáng LẦN LƯỢT → code chạy theo thứ tự trên xuống, không phải cùng lúc
 *   · Tinh thể đổi số    → gán là THAY THẾ giá trị cũ, không phải cộng thêm
 *
 * Học sinh viết `x = 5;` rồi `x = 3;` sẽ thấy số 5 biến mất trước mắt. Giải
 * thích bằng lời không bao giờ vào bằng nhìn thấy.
 */
export function SignalTowerStage({ events, playedCount, hideTitle }: SignalTowerStageProps) {
  const { beacons, crystals } = replay(events.slice(0, playedCount));

  const hasRun = events.length > 0;

  return (
    <section aria-labelledby="tower-heading">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 id="tower-heading" className={hideTitle ? 'sr-only' : 'text-sm font-bold text-slate-200'}>
          Tháp Tín Hiệu
        </h3>
        <span className="text-xs text-slate-500">
          {hasRun ? `${beacons.length} tín hiệu đã phát` : 'Chưa chạy'}
        </span>
      </div>

      {/* --- Dãy đèn tín hiệu: mỗi lệnh cout thắp một ngọn --- */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Tín hiệu phát đi
        </p>

        {beacons.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            {hasRun
              ? 'Chương trình chưa phát tín hiệu nào. Em thử dùng lệnh cout xem sao.'
              : 'Bấm Chạy code để thắp đèn tín hiệu.'}
          </p>
        ) : (
          <ol className="space-y-1.5 list-none">
            {beacons.map((beacon) => (
              <li key={beacon.index} className="flex items-center gap-2.5">
                <span
                  className="grid place-items-center size-7 rounded-lg bg-treasure-400/20 text-treasure-300 shrink-0"
                  aria-hidden="true"
                >
                  <Lightbulb className="size-4" />
                </span>
                <span className="text-xs text-slate-500 tabular-nums shrink-0">
                  {beacon.index + 1}
                </span>
                {/* Nội dung do học sinh viết ra: để React tự escape, không dùng HTML */}
                <code className="font-mono text-sm text-verdant-400 truncate">
                  {beacon.text.replace(/\n/g, '⏎') || '(dòng trống)'}
                </code>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* --- Kệ tinh thể: mỗi biến một viên, gán lại thì số đổi --- */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Tinh thể chứa giá trị
        </p>

        {crystals.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            Nhiệm vụ này chưa tạo biến nào.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2 list-none">
            {crystals.map((crystal) => (
              <li
                key={crystal.name}
                className={cn(
                  'rounded-xl border px-3 py-2 transition-colors',
                  crystal.justChanged
                    ? 'border-quest-500 bg-quest-500/15'
                    : 'border-abyss-600 bg-abyss-900',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Box className="size-3.5 text-mage-300" aria-hidden="true" />
                  <code className="font-mono text-xs text-slate-400">{crystal.name}</code>
                </div>

                <div className="flex items-baseline gap-2 mt-0.5">
                  {/*
                    Giá trị cũ hiện gạch ngang bên cạnh giá trị mới — cho thấy
                    nó BỊ THAY THẾ chứ không cộng dồn.
                  */}
                  {crystal.previous !== null && crystal.previous !== crystal.value && (
                    <span className="font-mono text-xs text-slate-500 line-through">
                      {crystal.previous}
                    </span>
                  )}
                  <span className="font-mono text-base font-bold text-quest-400">
                    {crystal.value}
                  </span>
                </div>

                {crystal.previous !== null && crystal.previous !== crystal.value && (
                  <span className="sr-only">
                    Biến {crystal.name} đổi từ {crystal.previous} thành {crystal.value}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Trình đọc màn hình cần biết chuyện gì vừa xảy ra mà không nhìn được hình */}
      <p className="sr-only" role="status" aria-live="polite">
        {playedCount > 0 && events[playedCount - 1]?.message}
      </p>
    </section>
  );
}
