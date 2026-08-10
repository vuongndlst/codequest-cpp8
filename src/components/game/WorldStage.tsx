import type { WorldSpec } from '@/types/content';
import type { WorldEvent } from '@/validators/world';
import { createWorldState } from '@/validators/world';
import { AvatarIcon } from './AvatarIcon';
import { cn } from '@/utils/cn';
import { zonePresentation } from '@/data/zonePresentation';
import { TileSprite } from './TileSprite';
import { propTile, TILE } from './mapTiles';

interface WorldStageProps {
  spec: WorldSpec;
  events: WorldEvent[];
  avatarId?: string | null;
  /** Số sự kiện đã phát — trang giữ tiến độ, sân khấu chỉ vẽ đúng thời điểm đó */
  playedCount: number;
  hideTitle?: boolean;
  lessonId?: string;
}

/**
 * Sân khấu game 2D.
 *
 * Chương trình của học sinh không vẽ trực tiếp — nó sinh ra chuỗi sự kiện,
 * component này vẽ lại trạng thái tại sự kiện thứ `playedCount`. Việc đếm nhịp
 * nằm ở `useStageReplay` phía trang, để thanh điều khiển ngoài sân khấu ra
 * lệnh chạy nhanh hay nhích từng bước được.
 */
export function WorldStage({ spec, events, avatarId, playedCount, hideTitle, lessonId }: WorldStageProps) {
  const state = replayEvents(spec, events.slice(0, playedCount));
  const lastEvent = playedCount > 0 ? events[playedCount - 1] : null;
  const cellWidth = 100 / spec.cols;
  const initialWorld = createWorldState(spec);
  const hasBoss = spec.props?.some((prop) => prop.type === 'bug') ?? false;
  const zone = zonePresentation(lessonId);

  return (
    <section aria-labelledby="stage-heading">
      <h3 id="stage-heading" className={hideTitle ? 'sr-only' : 'text-sm font-bold text-slate-200 mb-2'}>
        Sân khấu ByteLand
      </h3>

      {hasBoss && (
        <BossHealthBar current={state.bugHp} max={initialWorld.bugHp} className="mb-3" />
      )}

      <div className={cn('relative overflow-hidden rounded-2xl border-2 bg-slate-950 bg-gradient-to-b p-4', zone.atmosphereClass, zone.borderClass)}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_68%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-4 top-10 flex justify-around opacity-35" aria-hidden="true">
          {zone.props.map((tile, index) => (
            <TileSprite key={`${tile.sheet}-${tile.index}-${index}`} index={tile.index} sheet={tile.sheet} scale={3} />
          ))}
        </div>
        {/* Các ô đường đi */}
        <div className="relative h-40">
          <div className="absolute inset-x-0 bottom-0 flex">
            {Array.from({ length: spec.cols }, (_, index) => {
              const prop = spec.props?.find((item) => item.col === index);
              const isGoal = index === (spec.goalCol ?? spec.cols - 1);

              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-end gap-1"
                  style={{ width: `${cellWidth}%` }}
                >
                  {prop && <PropIcon type={prop.type} active={isPropActive(prop, state)} />}
                  {isGoal && !prop && (
                    <TileSprite index={TILE.gate.index} sheet={TILE.gate.sheet} scale={3} title="Cổng đích" />
                  )}
                  <div
                    className={cn(
                      'h-6 w-full border-x border-t-2 border-slate-600',
                      index <= state.col ? 'bg-cyan-500/30' : 'bg-slate-800/95',
                      isGoal && 'border-amber-300/60 bg-amber-400/25',
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* Nhân vật */}
          <div
            className="absolute bottom-6 transition-[left] duration-300 ease-out"
            style={{
              left: `${state.col * cellWidth}%`,
              width: `${cellWidth}%`,
            }}
          >
            <div className="flex justify-center">
              <AvatarIcon avatarId={avatarId} size={64} glow />
            </div>
          </div>
        </div>

        {/* Chỉ số trạng thái */}
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <div className="flex gap-1">
            <dt className="text-slate-500">Vị trí:</dt>
            <dd className="text-slate-300 tabular-nums">
              ô {state.col}/{spec.cols - 1}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-slate-500">Năng lượng:</dt>
            <dd className="text-slate-300 tabular-nums">{state.energy}</dd>
          </div>
          {state.hasKey && <dd className="text-treasure-300">Đã có chìa khoá</dd>}
        </dl>
      </div>

      <p className="text-xs text-slate-400 mt-2 min-h-[1.25rem]" role="status" aria-live="polite">
        {lastEvent?.message ?? 'Nhân vật đang chờ lệnh của em.'}
      </p>
    </section>
  );
}

/**
 * Thanh máu Boss.
 *
 * Đây là cách trực quan hoá TIẾN ĐỘ, không phải cơ chế chiến đấu: mỗi lớp giáp
 * mất đi tương ứng với một phần bài toán đã giải xong. Khi hết máu, thanh
 * chuyển sang lời chúc mừng chứ không có hiệu ứng "hạ gục" bạo lực.
 */
function BossHealthBar({
  current,
  max,
  className,
}: {
  current: number;
  max: number;
  className?: string;
}) {
  const safeMax = Math.max(1, max);
  const percent = Math.round((Math.max(0, current) / safeMax) * 100);
  const defeated = current <= 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <TileSprite index={TILE.boss.index} sheet={TILE.boss.sheet} scale={2} />
          Bug King
        </span>
        <span className="text-xs tabular-nums text-slate-400">
          {defeated ? 'Đã bị đánh bại!' : `${Math.max(0, current)}/${safeMax} lớp giáp`}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.max(0, current)}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label="Lớp giáp còn lại của Bug King"
        className="h-3 w-full rounded-full bg-abyss-700 overflow-hidden"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300',
            defeated ? 'bg-verdant-500' : 'bg-alert-500',
          )}
          style={{ width: `${defeated ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
}

function PropIcon({ type, active }: { type: string; active: boolean }) {
  const tile = propTile(type === 'bug' ? 'boss' : type === 'bridge' ? 'gate' : type);
  if (!tile) return null;

  return (
    <span
      className={cn(
        'leading-none transition-all',
        active
          ? 'opacity-100 drop-shadow-[0_0_10px_rgba(250,204,21,.65)]'
          : 'opacity-55 grayscale-[.35]',
      )}
      role="img"
      aria-label={`${describeProp(type)}${active ? ' (đã kích hoạt)' : ''}`}
    >
      <TileSprite index={tile.index} sheet={tile.sheet} scale={3} />
    </span>
  );
}

function describeProp(type: string): string {
  const labels: Record<string, string> = {
    door: 'cánh cửa',
    light: 'ngọn đèn',
    bridge: 'cây cầu',
    wall: 'bức tường',
    bug: 'con Bug',
    gem: 'viên ngọc',
  };
  return labels[type] ?? 'vật thể';
}

function isPropActive(
  prop: NonNullable<WorldSpec['props']>[number],
  state: ReturnType<typeof createWorldState>,
): boolean {
  switch (prop.type) {
    case 'door':
      return state.openedDoors.includes(prop.id);
    case 'light':
      return state.litLights.includes(prop.id);
    case 'bridge':
      return state.activatedBridges.includes(prop.id);
    case 'bug':
      return state.bugHp <= 0;
    default:
      return false;
  }
}

/** Dựng lại trạng thái thế giới từ N sự kiện đầu tiên — dùng cho việc phát lại. */
function replayEvents(spec: WorldSpec, events: WorldEvent[]) {
  const state = createWorldState(spec);

  for (const event of events) {
    switch (event.type) {
      case 'move':
        state.col = event.col;
        state.energy -= 1;
        break;
      case 'open-door':
        state.openedDoors.push(String(event.detail?.id ?? `door-${event.col}`));
        break;
      case 'turn-on-light':
        state.litLights.push(String(event.detail?.id ?? `light-${event.col}`));
        break;
      case 'activate-bridge':
        state.activatedBridges.push(String(event.detail?.id ?? `bridge-${event.col}`));
        break;
      case 'collect-key':
        state.hasKey = true;
        break;
      case 'collect-gem':
        state.collectedGems += 1;
        break;
      case 'attack-bug':
        state.bugHp = Math.max(0, state.bugHp - 1);
        break;
      default:
        break;
    }
  }

  return state;
}
