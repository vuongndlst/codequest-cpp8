import { useEffect, useMemo, useRef } from 'react';
import { playSound, type SoundName } from '@/services/audio';
import type { WorldSpec } from '@/types/content';
import {
  FACING_DELTA,
  createWorldState,
  isWall,
  type Facing,
  type WorldEvent,
  type WorldState,
} from '@/validators/world';
import { useUiStore } from '@/stores/uiStore';
import { tileStyle } from './TileSprite';
import { TILE, groundTile, heroTile, propTile } from './mapTiles';
import { useStageReplay } from './useStageReplay';

interface TileMapStageProps {
  spec: WorldSpec;
  events: WorldEvent[];
  avatarId?: string | null;
  playKey: number;
}

/** Số pixel một ô sau khi phóng to. 16px gốc × 3 = 48px, vừa mắt trên laptop. */
const SCALE = 3;
const CELL = 16 * SCALE;

/**
 * Phát lại chuỗi sự kiện thành trạng thái thế giới tại một thời điểm.
 *
 * Tính lại từ đầu mỗi nhịp thay vì cộng dồn vào state của React: chuỗi tối đa
 * 300 sự kiện nên chi phí không đáng kể, đổi lại tua đi tua lại luôn ra đúng
 * một kết quả. Cộng dồn thì chạy lại animation phải nhớ dọn state — đó là chỗ
 * sinh lỗi "chạy lần hai vẫn thấy ngọc của lần một".
 */
function replay(spec: WorldSpec, events: WorldEvent[]) {
  const state: WorldState = createWorldState(spec);
  const collected = new Set<string>();
  const opened = new Set<string>();

  for (const event of events) {
    switch (event.type) {
      case 'move':
        state.col = event.col;
        state.row = event.row;
        state.energy -= 1;
        state.blocked = false;
        break;

      case 'turn': {
        const next = event.detail?.facing;
        if (typeof next === 'string') state.facing = next as Facing;
        break;
      }

      case 'blocked':
        state.blocked = true;
        break;

      case 'collect-gem':
      case 'collect-key': {
        const id = event.detail?.id;
        // Không có id thì đánh dấu theo ô, đủ để ẩn đúng vật vừa nhặt
        collected.add(typeof id === 'string' ? id : `@${event.col},${event.row}`);
        if (event.type === 'collect-key') state.hasKey = true;
        break;
      }

      case 'open-door':
      case 'activate-bridge':
      case 'turn-on-light': {
        const id = event.detail?.id;
        if (typeof id === 'string') opened.add(id);
        break;
      }

      default:
        break;
    }
  }

  return { state, collected, opened };
}

/** Sự kiện nào kêu tiếng gì. Sự kiện không có trong bảng thì im lặng. */
const EVENT_SOUNDS: Partial<Record<WorldEvent['type'], SoundName>> = {
  move: 'step',
  blocked: 'bump',
  'collect-gem': 'gem',
  'collect-key': 'gem',
  'open-door': 'door',
  'activate-bridge': 'door',
  'reach-goal': 'goal',
};

export function TileMapStage({ spec, events, avatarId, playKey }: TileMapStageProps) {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const playedCount = useStageReplay(events, playKey);

  /*
    Kêu tiếng theo ĐÚNG NHỊP animation, không phải kêu hết một lượt lúc chạy
    xong. Tiếng bước chân phải trùng với lúc nhân vật nhấc chân thì mới ra cảm
    giác trò chơi; kêu dồn một cục thì chỉ là tiếng ồn.
  */
  const lastPlayedRef = useRef(-1);
  useEffect(() => {
    if (playedCount === 0) {
      lastPlayedRef.current = -1;
      return;
    }
    if (playedCount - 1 <= lastPlayedRef.current) return;

    lastPlayedRef.current = playedCount - 1;
    const sound = EVENT_SOUNDS[events[playedCount - 1]?.type];
    if (sound) playSound(sound);
  }, [playedCount, events]);

  const cols = spec.cols;
  const rows = spec.rows ?? 1;

  const played = useMemo(() => events.slice(0, playedCount), [events, playedCount]);
  const { state, collected, opened } = useMemo(() => replay(spec, played), [spec, played]);

  const lastEvent = playedCount > 0 ? events[playedCount - 1] : null;
  const justMoved = lastEvent?.type === 'move';
  const justBumped = lastEvent?.type === 'blocked';
  const reachedGoal = played.some((event) => event.type === 'reach-goal');

  const goalCol = spec.goalCol ?? cols - 1;
  const goalRow = spec.goalRow ?? 0;

  /*
    Bộ tile chỉ có nhân vật nhìn thẳng, không có bộ quay bốn hướng. Lật ngang
    khi đi sang trái là đủ để mắt đọc được hướng; đi lên/xuống thì giữ nguyên.
    Mũi tên nhỏ dưới chân cho biết hướng chính xác — không dựa vào riêng hình.
  */
  const flipped = state.facing === 'west';

  const heroAnimation = reducedMotion
    ? undefined
    : justBumped
      ? 'hero-bump 0.3s ease-out'
      : justMoved
        ? 'hero-step 0.3s ease-out'
        : 'hero-idle 2.4s ease-in-out infinite';

  return (
    <section className="cq-panel p-4" aria-labelledby="map-heading">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 id="map-heading" className="text-sm font-bold text-slate-200">
          Bản đồ ByteLand
        </h3>
        <span className="text-xs text-slate-500 tabular-nums">
          Năng lượng {Math.max(0, state.energy)}
          {state.hasKey && ' · 🔑'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div
          className="relative mx-auto rounded-xl overflow-hidden border-2 border-abyss-700"
          style={{ width: cols * CELL, height: rows * CELL }}
          role="img"
          aria-label={
            reachedGoal
              ? 'Bản đồ: nhân vật đã tới đích'
              : `Bản đồ ${cols} cột ${rows} hàng, nhân vật ở cột ${state.col} hàng ${state.row}`
          }
        >
          {/* --- Lớp nền --- */}
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
              const wall = isWall(spec, col, row);
              const tile = wall ? TILE.wall : groundTile(col, row);
              return (
                <span
                  key={`${col}-${row}`}
                  className="absolute"
                  style={{
                    ...tileStyle(tile.index, SCALE, tile.sheet),
                    left: col * CELL,
                    top: row * CELL,
                  }}
                />
              );
            }),
          )}

          {/* --- Ô đích: nhấp nháy để nhìn phát là biết phải tới đâu --- */}
          <span
            className="absolute pointer-events-none border-2 border-treasure-400 rounded-sm"
            style={{
              left: goalCol * CELL + 2,
              top: goalRow * CELL + 2,
              width: CELL - 4,
              height: CELL - 4,
              animation: reducedMotion ? undefined : 'goal-pulse 1.8s ease-in-out infinite',
              opacity: reducedMotion ? 0.6 : undefined,
            }}
            aria-hidden="true"
          />

          {/* --- Vật thể --- */}
          {spec.props?.map((prop) => {
            const tile = propTile(prop.type);
            if (!tile) return null;

            const row = prop.row ?? 0;
            const isGone =
              collected.has(prop.id) || collected.has(`@${prop.col},${row}`) || opened.has(prop.id);

            return (
              <span
                key={prop.id}
                className="absolute"
                style={{
                  ...tileStyle(tile.index, SCALE, tile.sheet),
                  left: prop.col * CELL,
                  top: row * CELL,
                  animation:
                    isGone && !reducedMotion ? 'prop-collect 0.4s ease-out forwards' : undefined,
                  opacity: isGone && reducedMotion ? 0 : undefined,
                }}
              />
            );
          })}

          {/* --- Nhân vật --- */}
          <span
            className="absolute transition-[left,top] duration-300 ease-out"
            style={{ left: state.col * CELL, top: state.row * CELL, width: CELL, height: CELL }}
          >
            <span
              className="block"
              style={{
                ...tileStyle(heroTile(avatarId), SCALE, 'dungeon'),
                animation: heroAnimation,
                transform: flipped ? 'scaleX(-1)' : undefined,
              }}
            />
            <FacingArrow facing={state.facing} />
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-2 min-h-[1.25rem]" role="status" aria-live="polite">
        {lastEvent?.message ?? 'Nhân vật đang chờ lệnh của em.'}
      </p>
    </section>
  );
}

/**
 * Mũi tên chỉ hướng dưới chân nhân vật.
 *
 * Cần thiết vì bộ tile không có nhân vật quay bốn hướng: chỉ nhìn hình thì
 * không phân biệt được đang quay lên hay quay xuống, mà `turnRight()` lại là
 * lệnh trung tâm của bản đồ hai chiều.
 */
function FacingArrow({ facing }: { facing: Facing }) {
  const delta = FACING_DELTA[facing];
  const LABELS: Record<Facing, string> = {
    east: 'phải',
    south: 'xuống',
    west: 'trái',
    north: 'lên',
  };

  return (
    <>
      <span
        className="absolute size-2 rounded-full bg-quest-400 shadow"
        style={{
          left: CELL / 2 - 4 + delta.dCol * (CELL / 2 - 5),
          top: CELL / 2 - 4 + delta.dRow * (CELL / 2 - 5),
        }}
        aria-hidden="true"
      />
      <span className="sr-only">Đang quay sang {LABELS[facing]}</span>
    </>
  );
}
