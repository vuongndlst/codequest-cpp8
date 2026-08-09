import { useEffect, useState } from 'react';
import type { WorldSpec } from '@/types/content';
import type { WorldEvent } from '@/validators/world';
import { createWorldState } from '@/validators/world';
import { useUiStore } from '@/stores/uiStore';
import { AvatarIcon } from './AvatarIcon';
import { cn } from '@/utils/cn';

interface WorldStageProps {
  spec: WorldSpec;
  events: WorldEvent[];
  avatarId?: string | null;
  /** Khoá phát lại — đổi giá trị này để chạy lại animation từ đầu */
  playKey: number;
}

const STEP_MS = 320;

/**
 * Sân khấu game 2D.
 *
 * Chương trình của học sinh không vẽ trực tiếp — nó sinh ra chuỗi sự kiện,
 * component này phát lại thành animation. Khi bật chế độ giảm chuyển động,
 * kết quả cuối cùng hiện ra ngay lập tức thay vì chạy từng bước.
 */
export function WorldStage({ spec, events, avatarId, playKey }: WorldStageProps) {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const [playedCount, setPlayedCount] = useState(0);

  useEffect(() => {
    if (events.length === 0) {
      setPlayedCount(0);
      return;
    }

    if (reducedMotion) {
      setPlayedCount(events.length);
      return;
    }

    setPlayedCount(0);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setPlayedCount(current);
      if (current >= events.length) clearInterval(timer);
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [events, playKey, reducedMotion]);

  const state = replayEvents(spec, events.slice(0, playedCount));
  const lastEvent = playedCount > 0 ? events[playedCount - 1] : null;
  const cellWidth = 100 / spec.cols;
  const initialWorld = createWorldState(spec);
  const hasBoss = spec.props?.some((prop) => prop.type === 'bug') ?? false;

  return (
    <section className="cq-panel p-4" aria-labelledby="stage-heading">
      <h3 id="stage-heading" className="text-sm font-bold text-slate-200 mb-3">
        Sân khấu ByteLand
      </h3>

      {hasBoss && (
        <BossHealthBar current={state.bugHp} max={initialWorld.bugHp} className="mb-3" />
      )}

      <div className="relative rounded-xl bg-abyss-950 border border-abyss-700 p-3 overflow-hidden">
        {/* Các ô đường đi */}
        <div className="relative h-24">
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
                    <span className="text-lg" aria-hidden="true">
                      🚩
                    </span>
                  )}
                  <div
                    className={cn(
                      'w-full h-6 border-t-2 border-x border-abyss-600',
                      index <= state.col ? 'bg-quest-500/15' : 'bg-abyss-800',
                      isGoal && 'bg-treasure-400/15 border-treasure-400/40',
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
              <AvatarIcon avatarId={avatarId} size={40} />
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
          {state.hasKey && <dd className="text-treasure-300">🔑 Có chìa khoá</dd>}
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
          <span aria-hidden="true">{defeated ? '💀' : '🐛'}</span>
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
  const icons: Record<string, [string, string]> = {
    door: ['🚪', '🚪'],
    light: ['💡', '💡'],
    bridge: ['🌉', '🌉'],
    wall: ['🧱', '🧱'],
    bug: ['🐛', '💀'],
    gem: ['💎', '✨'],
  };

  const [inactive, activeIcon] = icons[type] ?? ['⬜', '⬜'];

  return (
    <span
      className={cn('text-lg leading-none transition-opacity', active ? 'opacity-100' : 'opacity-40')}
      role="img"
      aria-label={`${describeProp(type)}${active ? ' (đã kích hoạt)' : ''}`}
    >
      {active ? activeIcon : inactive}
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
