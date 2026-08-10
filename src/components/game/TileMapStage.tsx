import { useEffect, useMemo, useRef, useState } from 'react';
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

const TILE_PX = 16;

/**
 * Giới hạn phóng to một ô.
 *
 * Không dùng một hằng số cố định: bản đồ Boss rộng 9 cột, ở mức ×4 là 576px và
 * TRÀN RA NGOÀI cột phải của màn hình nhiệm vụ — học sinh phải kéo ngang mới
 * nhìn hết, mà kéo ngang giữa lúc đang giải bài thì mất hẳn mạch suy nghĩ.
 *
 * Nên tỉ lệ được tính theo bề ngang thật của khung: rộng thì phóng to hết cỡ,
 * hẹp thì tự co lại cho vừa. Sàn ×2 để bản đồ không bao giờ nhỏ tới mức không
 * nhìn ra nhân vật.
 */
const MIN_SCALE = 2;
const MAX_SCALE = 4;

/** Tỉ lệ lớn nhất mà bản đồ `cols` cột vẫn nằm gọn trong `available` pixel. */
export function fitScale(cols: number, available: number): number {
  if (!Number.isFinite(available) || available <= 0) return MAX_SCALE;
  const raw = Math.floor(available / (cols * TILE_PX));
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, raw));
}

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

  /*
    Đo bề ngang thật của khung rồi mới chọn tỉ lệ.

    Dùng `ResizeObserver` chứ không đọc một lần lúc gắn: cột phải của màn hình
    nhiệm vụ đổi bề ngang khi học sinh xoay máy tính bảng hoặc thu nhỏ cửa sổ,
    và bản đồ phải co theo chứ không được tràn ra.
  */
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(MAX_SCALE);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => setScale(fitScale(cols, frame.clientWidth));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [cols]);

  const cell = TILE_PX * scale;

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

  /*
    Ăn mừng ĐƯỢC ƯU TIÊN CAO NHẤT, kể cả khi bước cuối cũng là một bước đi.
    Không có nhánh này thì nhân vật tới đích chỉ nhún một cái như mọi bước
    khác — mất hẳn khoảnh khắc đáng nhớ nhất của cả nhiệm vụ.
  */
  const heroAnimation = reducedMotion
    ? undefined
    : reachedGoal
      ? 'hero-cheer 1.2s ease-out'
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

      {/*
        Khung đo bề ngang. Giữ `overflow-x-auto` làm lưới an toàn: ở màn hình
        rất hẹp thì ngay cả tỉ lệ nhỏ nhất cũng có thể tràn, lúc đó vẫn kéo
        ngang được chứ không bị cắt mất.
      */}
      <div className="overflow-x-auto" ref={frameRef}>
        <div
          className="relative mx-auto rounded-xl overflow-hidden border-2 border-abyss-700"
          style={{ width: cols * cell, height: rows * cell }}
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
                    ...tileStyle(tile.index, scale, tile.sheet),
                    left: col * cell,
                    top: row * cell,
                  }}
                />
              );
            }),
          )}

          {/*
            --- Ô ĐÍCH ---

            Ba lớp chồng nhau, vì một cái viền mờ nhấp nháy thì lẫn ngay giữa
            cỏ và bụi cây. Học sinh phải NHÌN PHÁT LÀ BIẾT phải đi tới đâu —
            đó là điều kiện để em lập được kế hoạch trước khi gõ.

            Cả ba lớp đều `pointer-events-none` để không chắn mất nhân vật.
          */}
          {!reachedGoal && (
            <GoalBeacon col={goalCol} row={goalRow} cell={cell} reducedMotion={reducedMotion} />
          )}

          {/* --- Vật thể --- */}
          {spec.props?.map((prop) => {
            const tile = propTile(prop.type);
            if (!tile) return null;

            const row = prop.row ?? 0;
            const isGone =
              collected.has(prop.id) || collected.has(`@${prop.col},${row}`) || opened.has(prop.id);
            const isGem = prop.type === 'gem';

            return (
              <span
                key={prop.id}
                className="absolute"
                style={{ left: prop.col * cell, top: row * cell, width: cell, height: cell }}
              >
                <span
                  className="block"
                  style={{
                    ...tileStyle(tile.index, scale, tile.sheet),
                    /*
                      Ngọc xoay quanh trục dọc và sáng nhấp nháy — mắt bị hút
                      vào ngay. Ngọc đứng im giữa bãi cỏ thì học sinh đi lướt
                      qua mà không nhận ra đó là thứ phải nhặt.
                    */
                    animation: isGone
                      ? reducedMotion
                        ? undefined
                        : 'prop-collect 0.5s ease-out forwards'
                      : isGem && !reducedMotion
                        ? 'gem-spin 2.6s ease-in-out infinite'
                        : undefined,
                    opacity: isGone && reducedMotion ? 0 : undefined,
                  }}
                />

                {/* Tia sáng nhỏ nhấp nháy cạnh viên ngọc */}
                {isGem && !isGone && !reducedMotion && (
                  <span
                    className="absolute size-2 rounded-full bg-treasure-300"
                    style={{
                      left: cell * 0.72,
                      top: cell * 0.16,
                      animation: 'gem-twinkle 2.6s ease-in-out infinite',
                      boxShadow: '0 0 6px 2px rgb(252 211 77 / 0.9)',
                    }}
                    aria-hidden="true"
                  />
                )}
              </span>
            );
          })}

          {/* --- Nhân vật --- */}
          <span
            className="absolute transition-[left,top] duration-300 ease-out"
            style={{ left: state.col * cell, top: state.row * cell, width: cell, height: cell }}
          >
            <span
              className="block"
              style={{
                ...tileStyle(heroTile(avatarId), scale, 'dungeon'),
                animation: heroAnimation,
                transform: flipped ? 'scaleX(-1)' : undefined,
              }}
            />
            <FacingArrow facing={state.facing} cell={cell} />
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
 * Đèn hiệu ở ô đích.
 *
 * Ba lớp chồng nhau vì một cái viền mờ nhấp nháy thì lẫn ngay giữa cỏ và bụi
 * cây — mà học sinh phải nhìn phát là biết đi tới đâu thì mới lập được kế
 * hoạch trước khi gõ.
 *
 *   ① cột ánh sáng chiếu lên  — nhìn thấy được từ xa, kể cả khi bản đồ rộng
 *   ② vòng tròn lan toả       — kéo mắt về đúng ô
 *   ③ viền vàng đậm           — chỉ chính xác ô nào
 *
 * Ở chế độ giảm chuyển động, cả ba lớp đứng yên nhưng VẪN HIỆN — người cần
 * giảm chuyển động vẫn cần biết đích ở đâu.
 */
function GoalBeacon({
  col,
  row,
  cell,
  reducedMotion,
}: {
  col: number;
  row: number;
  cell: number;
  reducedMotion: boolean;
}) {
  return (
    <span
      className="absolute pointer-events-none"
      style={{ left: col * cell, top: row * cell, width: cell, height: cell }}
      aria-hidden="true"
    >
      {/*
        ① Mốc chỉ đích nhún nhảy, kiểu dấu chấm than trên đầu NPC trong game.

        Đặt HẲN BÊN TRONG ô, không nhô lên trên: khung bản đồ có `overflow-hidden`
        nên bất cứ thứ gì vượt ra ngoài đều bị cắt mất khi đích nằm ở hàng trên
        cùng. Đây chính là lý do bản trước dùng cột ánh sáng nhìn không ra gì.
      */}
      <span
        className="absolute grid place-items-center"
        style={{
          left: cell * 0.3,
          top: 4,
          width: cell * 0.4,
          height: cell * 0.4,
          animation: reducedMotion ? undefined : 'goal-marker 1.4s ease-in-out infinite',
        }}
      >
        <span
          className="block"
          style={{
            width: 0,
            height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '11px solid rgb(251 191 36)',
            filter: 'drop-shadow(0 0 4px rgb(251 191 36 / 0.9))',
          }}
        />
      </span>

      {/* ② Vòng tròn lan toả — chỉ chạy khi cho phép chuyển động */}
      {!reducedMotion && (
        <>
          <span
            className="absolute rounded-full border-2 border-treasure-300"
            style={{
              inset: cell * 0.1,
              animation: 'goal-ring 2.2s ease-out infinite',
            }}
          />
          <span
            className="absolute rounded-full border-2 border-treasure-300"
            style={{
              inset: cell * 0.1,
              animation: 'goal-ring 2.2s ease-out infinite 1.1s',
            }}
          />
        </>
      )}

      {/* ③ Viền vàng dày chỉ chính xác ô đích, có quầng sáng cả trong lẫn ngoài */}
      <span
        className="absolute rounded-md"
        style={{
          inset: 2,
          border: '3px solid rgb(251 191 36)',
          animation: reducedMotion ? undefined : 'goal-pulse 2.2s ease-in-out infinite',
          boxShadow: reducedMotion
            ? '0 0 12px 3px rgb(251 191 36 / 0.8), inset 0 0 12px 3px rgb(251 191 36 / 0.4)'
            : undefined,
        }}
      />
    </span>
  );
}

/**
 * Mũi tên chỉ hướng dưới chân nhân vật.
 *
 * Cần thiết vì bộ tile không có nhân vật quay bốn hướng: chỉ nhìn hình thì
 * không phân biệt được đang quay lên hay quay xuống, mà `turnRight()` lại là
 * lệnh trung tâm của bản đồ hai chiều.
 */
function FacingArrow({ facing, cell }: { facing: Facing; cell: number }) {
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
          left: cell / 2 - 4 + delta.dCol * (cell / 2 - 5),
          top: cell / 2 - 4 + delta.dRow * (cell / 2 - 5),
        }}
        aria-hidden="true"
      />
      <span className="sr-only">Đang quay sang {LABELS[facing]}</span>
    </>
  );
}
