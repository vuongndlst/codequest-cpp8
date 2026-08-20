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
import { cn } from '@/utils/cn';
import { tileStyle } from './TileSprite';
import { heroTile, propTile, terrainBaseTile, terrainOverlayTile } from './mapTiles';
import { zonePresentation } from '@/data/zonePresentation';
import { connectedRouteCells } from './routeGuide';

interface TileMapStageProps {
  spec: WorldSpec;
  events: WorldEvent[];
  avatarId?: string | null;
  /** Số sự kiện đã phát — trang giữ tiến độ, sân khấu chỉ vẽ đúng thời điểm đó */
  playedCount: number;
  hideTitle?: boolean;
  presentation?: 'default' | 'first-mission' | 'boss';
  isPlaying?: boolean;
  motionDurationMs?: number;
  lessonId?: string;
  equippedItem?: { id: string; level: number } | null;
}

const TILE_PX = 16;

/**
 * Giới hạn phóng to một ô.
 *
 * Không dùng một hằng số cố định: bản đồ rộng 9 cột ở mức trần sẽ TRÀN RA
 * NGOÀI khoang chứa nó trên laptop nhỏ — học sinh phải kéo ngang mới nhìn hết,
 * mà kéo ngang giữa lúc đang giải bài thì mất hẳn mạch suy nghĩ.
 *
 * Nên tỉ lệ được tính theo kích thước thật của khung: rộng thì phóng to hết
 * cỡ, hẹp thì tự co lại cho vừa. Sàn ×2 để bản đồ không bao giờ nhỏ tới mức
 * không nhìn ra nhân vật.
 *
 * Trần ×6 (chứ không phải ×4 như bản đầu) vì bản đồ nay có hẳn một khoang
 * riêng bên trái: bản đồ 5 cột ở ×4 chỉ rộng 320px, lọt thỏm giữa khoang, nhìn
 * không ra dáng một màn chơi.
 */
export const MIN_SCALE = 1;
export const MAX_SCALE = 6;
export const FIRST_MISSION_MAX_SCALE = 8;
const SCALE_STEP = 1 / 16;

/**
 * Tỉ lệ lớn nhất mà bản đồ vẫn nằm gọn trong khung.
 *
 * Kẹp theo CẢ hai chiều. Chỉ kẹp bề ngang thì bản đồ nhiều hàng ở tỉ lệ lớn sẽ
 * cao quá khung nhìn, đẩy ô viết code xuống dưới mép màn hình — mà nhìn thấy
 * bản đồ VÀ code cùng lúc mới là điều kiện để bấm Chạy rồi quan sát.
 */
export function fitScale(
  cols: number,
  availableWidth: number,
  rows = 0,
  availableHeight = 0,
  maxScale = MAX_SCALE,
): number {
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) return maxScale;

  let raw = availableWidth / (cols * TILE_PX);

  if (rows > 0 && Number.isFinite(availableHeight) && availableHeight > 0) {
    raw = Math.min(raw, availableHeight / (rows * TILE_PX));
  }

  // Bậc 1/16 lấp gần kín viewport ngang nhưng vẫn giữ cạnh tile ổn định giữa các lần đo.
  const stepped = Math.floor(raw / SCALE_STEP) * SCALE_STEP;
  return Math.max(MIN_SCALE, Math.min(maxScale, stepped));
}

/**
 * Tỉ lệ "cover" cho viewport trong stage: phủ kín cả hai chiều và chỉ cắt phần
 * phong cảnh ở hai mép. Tuyến nhiệm vụ nằm trong lõi giữa của map nên không bị che.
 */
export function coverScale(
  cols: number,
  availableWidth: number,
  rows: number,
  availableHeight: number,
  maxScale = MAX_SCALE,
): number {
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) return maxScale;

  let raw = availableWidth / (cols * TILE_PX);
  if (rows > 0 && Number.isFinite(availableHeight) && availableHeight > 0) {
    raw = Math.max(raw, availableHeight / (rows * TILE_PX));
  }

  const stepped = Math.ceil(raw / SCALE_STEP) * SCALE_STEP;
  return Math.max(MIN_SCALE, Math.min(maxScale, stepped));
}

/**
 * Chiều cao tối đa dành cho bản đồ.
 *
 * Chừa lại chỗ cho thanh trên cùng, tiêu đề nhiệm vụ và thanh điều khiển chạy.
 * Trần 560px để trên màn hình rất cao bản đồ không phình ra thành một tấm ảnh
 * khổng lồ mà chẳng thêm thông tin gì.
 */
function mapHeightBudget(): number {
  if (typeof window === 'undefined') return 560;
  return Math.min(560, Math.max(220, window.innerHeight - 320));
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
  const powered = new Set<string>();
  const machineCharge = new Map<string, number>();

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

      case 'enemy-alert':
        state.blocked = true;
        state.dangerHits += 1;
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

      case 'charge-machine': {
        const id = event.detail?.id;
        const value = event.detail?.value;
        if (typeof id === 'string') {
          powered.add(id);
          if (typeof value === 'number') machineCharge.set(id, value);
        }
        break;
      }

      case 'set-switch': {
        const id = event.detail?.id;
        const active = event.detail?.active === true;
        if (typeof id === 'string') {
          if (active) powered.add(id);
          else powered.delete(id);
        }
        break;
      }

      case 'attack-bug': {
        const hp = event.detail?.hp;
        const hits = event.detail?.hits;
        state.bugHp = typeof hp === 'number' ? hp : Math.max(0, state.bugHp - 1);
        state.bugHits = typeof hits === 'number' ? hits : state.bugHits + 1;
        break;
      }

      default:
        break;
    }
  }

  return { state, collected, opened, powered, machineCharge };
}

/** Sự kiện nào kêu tiếng gì. Sự kiện không có trong bảng thì im lặng. */
const EVENT_SOUNDS: Partial<Record<WorldEvent['type'], SoundName>> = {
  move: 'step',
  blocked: 'bump',
  'enemy-alert': 'error',
  'collect-gem': 'gem',
  'collect-key': 'gem',
  'open-door': 'door',
  'activate-bridge': 'door',
  'charge-machine': 'goal',
  'set-switch': 'door',
  'attack-bug': 'bump',
  'reach-goal': 'goal',
};

export function TileMapStage({
  spec,
  events,
  avatarId,
  playedCount,
  hideTitle,
  presentation = 'default',
  isPlaying = false,
  motionDurationMs = 280,
  lessonId,
  equippedItem,
}: TileMapStageProps) {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const isFirstMission = presentation === 'first-mission';
  const isBossMission = presentation === 'boss';
  const maxScale = isFirstMission ? FIRST_MISSION_MAX_SCALE : MAX_SCALE;
  const zone = zonePresentation(lessonId);

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
  const [scale, setScale] = useState(maxScale);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const availableHeight = frame.clientHeight || mapHeightBudget();
      setScale((hideTitle ? coverScale : fitScale)(
        cols,
        frame.clientWidth,
        rows,
        availableHeight,
        maxScale,
      ));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    // Thu nhỏ cửa sổ theo chiều DỌC không làm khung đổi bề ngang, nên
    // `ResizeObserver` không kêu — phải nghe thêm sự kiện của cửa sổ
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [cols, hideTitle, maxScale, rows]);

  const cell = TILE_PX * scale;

  const played = useMemo(() => events.slice(0, playedCount), [events, playedCount]);
  const { state, collected, opened, powered, machineCharge } = useMemo(() => replay(spec, played), [spec, played]);

  const lastEvent = playedCount > 0 ? events[playedCount - 1] : null;
  const lastModuleEvent = useMemo(
    () => [...played].reverse().find(
      (event: WorldEvent) => event.type === 'call-func' || event.type === 'return-func',
    ) ?? null,
    [played],
  );
  const justMoved = lastEvent?.type === 'move';
  const justBumped = lastEvent?.type === 'blocked' || lastEvent?.type === 'enemy-alert';
  const reachedGoal = played.some((event) => event.type === 'reach-goal');
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);

  useEffect(() => {
    setShowIdlePrompt(false);
    if (isPlaying || reachedGoal) return;

    const timer = window.setTimeout(
      () => setShowIdlePrompt(true),
      isFirstMission ? 20000 : 30000,
    );
    return () => window.clearTimeout(timer);
  }, [isFirstMission, isPlaying, playedCount, reachedGoal]);
  const walkedCells = useMemo(
    () => [
      { col: spec.startCol ?? 0, row: spec.startRow ?? 0 },
      ...played
        .filter((event) => event.type === 'move')
        .map((event) => ({ col: event.col, row: event.row })),
    ],
    [played, spec.startCol, spec.startRow],
  );

  const goalCol = spec.goalCol ?? cols - 1;
  const goalRow = spec.goalRow ?? 0;
  const routeCells = useMemo(() => connectedRouteCells(spec), [spec]);
  const walkedCellKeys = useMemo(
    () => new Set(walkedCells.map(({ col, row }) => `${col},${row}`)),
    [walkedCells],
  );

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
    <section
      aria-labelledby="map-heading"
      className={cn(hideTitle && 'h-full w-full min-w-0 max-w-full overflow-hidden')}
    >
      {hideTitle ? (
        <h3 id="map-heading" className="sr-only">Bản đồ ByteLand</h3>
      ) : (
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 id="map-heading" className="text-sm font-bold text-slate-200">
          Bản đồ ByteLand
        </h3>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
          <span className={cn('hidden rounded-full bg-white/5 px-2.5 py-1 font-semibold sm:inline', zone.accentClass)}>
            {zone.name}
          </span>
          {isFirstMission && (
            <span className="rounded-full bg-quest-500/10 px-2.5 py-1 font-semibold text-quest-300">
              1 lệnh = 1 bước
            </span>
          )}
          {isFirstMission && isPlaying && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-verdant-500/10 px-2.5 py-1 font-semibold text-verdant-300" role="status">
              <span className="size-1.5 rounded-full bg-verdant-300 animate-pulse" aria-hidden="true" />
              Đang thực thi từng dòng
            </span>
          )}
          <span className="text-slate-400 tabular-nums">
            Năng lượng {Math.max(0, state.energy)}
            {state.hasKey && ' · 🔑'}
          </span>
        </div>
      </div>
      )}

      <div
        className={cn('min-h-0 min-w-0 max-w-full overflow-hidden', hideTitle && 'flex h-full w-full items-center justify-center')}
        ref={frameRef}
      >
        <div
          className={cn(
            'relative mx-auto overflow-hidden rounded-xl border-2 border-abyss-700',
            zone.borderClass,
            isFirstMission && 'shadow-[0_18px_70px_rgba(6,182,212,0.16)] ring-1 ring-quest-500/20',
            isBossMission && 'shadow-[0_18px_80px_rgba(139,92,246,0.22)] ring-2 ring-mage-500/35 border-mage-500/55',
          )}
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
              const glyph = spec.terrain?.[row]?.[col] ?? '.';
              const wall = isWall(spec, col, row);
              const baseTile = terrainBaseTile(glyph, col, row, zone.ground);
              const overlayTile = terrainOverlayTile(glyph, col, row, zone.ground);
              const routeKey = `${col},${row}`;
              const isRoute = routeCells.has(routeKey);
              const isWater = glyph === '~';
              return (
                <span
                  key={`${col}-${row}`}
                  className="absolute overflow-hidden"
                  data-path-cell={isRoute ? 'true' : undefined}
                  data-terrain={glyph}
                  style={{
                    left: col * cell,
                    top: row * cell,
                    width: cell,
                    height: cell,
                  }}
                >
                  <span className="absolute inset-0" style={tileStyle(baseTile.index, scale, baseTile.sheet)} />
                  {isWater && <span className="cq-terrain-water absolute inset-0" aria-hidden="true" />}
                  {overlayTile && (
                    <span
                      className="absolute inset-0"
                      style={tileStyle(overlayTile.index, scale, overlayTile.sheet)}
                      aria-hidden="true"
                    />
                  )}
                  {isRoute && (
                    <RouteGuide
                      north={routeCells.has(`${col},${row - 1}`)}
                      east={routeCells.has(`${col + 1},${row}`)}
                      south={routeCells.has(`${col},${row + 1}`)}
                      west={routeCells.has(`${col - 1},${row}`)}
                      energized={walkedCellKeys.has(routeKey)}
                      enhanced={equippedItem?.id === 'navigator' && equippedItem.level >= 2}
                      reducedMotion={reducedMotion}
                      delayMs={(col + row * cols) * 75}
                    />
                  )}
                  {wall && glyph === '#' && (col + row * 3) % 7 === 0 && (
                    <span className="pointer-events-none absolute left-[68%] top-[18%] size-[8%] rounded-full bg-verdant-200/80 shadow-[0_0_5px_rgba(134,239,172,.75)]" aria-hidden="true" />
                  )}
                </span>
              );
            }),
          )}

          {/* Ánh sáng môi trường chỉ dành cho màn nhập môn: tạo chiều sâu nhưng không che ô đường đi. */}
          {isFirstMission && !reducedMotion && (
            <>
              <span className="pointer-events-none absolute left-[8%] top-[8%] size-2 rounded-full bg-quest-200 shadow-[0_0_12px_4px_rgba(165,243,252,0.7)] animate-[first-mission-firefly_3.2s_ease-in-out_infinite]" aria-hidden="true" />
              <span className="pointer-events-none absolute right-[11%] top-[20%] size-1.5 rounded-full bg-treasure-200 shadow-[0_0_10px_3px_rgba(253,224,71,0.7)] animate-[first-mission-firefly_3.8s_ease-in-out_infinite_0.8s]" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-[12%] left-[44%] size-1.5 rounded-full bg-verdant-200 shadow-[0_0_10px_3px_rgba(134,239,172,0.65)] animate-[first-mission-firefly_4.1s_ease-in-out_infinite_1.4s]" aria-hidden="true" />
            </>
          )}

          {isBossMission && !reducedMotion && (
            <>
              <span className="pointer-events-none absolute left-[12%] top-[16%] z-10 size-2 rounded-full bg-mage-300 shadow-[0_0_16px_6px_rgba(167,139,250,0.65)] animate-[first-mission-firefly_2.8s_ease-in-out_infinite]" aria-hidden="true" />
              <span className="pointer-events-none absolute right-[14%] bottom-[18%] z-10 size-2 rounded-full bg-treasure-300 shadow-[0_0_16px_6px_rgba(251,191,36,0.55)] animate-[first-mission-firefly_3.4s_ease-in-out_infinite_0.7s]" aria-hidden="true" />
            </>
          )}

          {lessonId === 'a6' && lastModuleEvent && (
            <span
              className="pointer-events-none absolute left-2 top-2 z-40 max-w-[70%] rounded-lg border border-quest-200/60 bg-abyss-950/90 px-2 py-1 font-mono text-[9px] font-black text-quest-100 shadow-[0_0_18px_rgba(34,211,238,.3)]"
              role="status"
              aria-label={lastModuleEvent.type === 'call-func'
                ? `Đang chạy mô-đun ${String(lastModuleEvent.detail?.name ?? '')}`
                : `Mô-đun ${String(lastModuleEvent.detail?.name ?? '')} đã hoàn tất`}
            >
              {lastModuleEvent.type === 'call-func' ? '▶ ' : '✓ '}
              {String(lastModuleEvent.detail?.name ?? 'hàm')}
              {lastModuleEvent.type === 'call-func' && Array.isArray(lastModuleEvent.detail?.args)
                ? `(${lastModuleEvent.detail.args.join(', ')})`
                : lastModuleEvent.detail?.value !== undefined
                  ? ` → ${String(lastModuleEvent.detail.value)}`
                  : ' hoàn tất'}
            </span>
          )}

          {isFirstMission && isPlaying && !reducedMotion && (
            <span className="pointer-events-none absolute inset-y-0 z-10 w-24 bg-gradient-to-r from-transparent via-quest-200/20 to-transparent blur-sm animate-[first-mission-code-scan_1.35s_linear_infinite]" aria-hidden="true" />
          )}

          {/* Dấu chân sáng nối code với chuyển động: mỗi sự kiện move để lại đúng một mốc. */}
          {isFirstMission && walkedCells.slice(0, -1).map((position, index) => (
            <span key={`trail-${position.col}-${position.row}-${index}`} aria-hidden="true">
              <span
                className="pointer-events-none absolute rounded-full bg-gradient-to-r from-quest-400/10 via-quest-200/45 to-quest-400/10 shadow-[0_0_14px_rgba(34,211,238,0.55)]"
                style={{
                  left: position.col * cell + cell * 0.18,
                  top: position.row * cell + cell * 0.51,
                  width: cell * 0.72,
                  height: Math.max(4, cell * 0.06),
                }}
              />
              <span
                className="pointer-events-none absolute rounded-full bg-quest-200/70 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
                style={{
                  left: position.col * cell + cell * 0.44,
                  top: position.row * cell + cell * 0.66,
                  width: Math.max(6, cell * 0.11),
                  height: Math.max(6, cell * 0.11),
                }}
              />
            </span>
          ))}

          {/*
            --- Ô ĐÍCH ---

            Ba lớp chồng nhau, vì một cái viền mờ nhấp nháy thì lẫn ngay giữa
            cỏ và bụi cây. Học sinh phải NHÌN PHÁT LÀ BIẾT phải đi tới đâu —
            đó là điều kiện để em lập được kế hoạch trước khi gõ.

            Cả ba lớp đều `pointer-events-none` để không chắn mất nhân vật.
          */}
          <GoalBeacon
            col={goalCol}
            row={goalRow}
            cell={cell}
            reducedMotion={reducedMotion}
            reached={reachedGoal}
          />

          {reachedGoal && !reducedMotion && (
            <span
              className="pointer-events-none absolute rounded-full border-4 border-treasure-200 animate-[first-mission-victory-burst_1.1s_ease-out_forwards]"
              style={{ left: goalCol * cell, top: goalRow * cell, width: cell, height: cell }}
              aria-hidden="true"
            />
          )}

          {/* --- Vật thể --- */}
          {spec.props?.map((prop) => {
            const tile = propTile(prop.type);
            if (!tile) return null;

            const row = prop.row ?? 0;
            const isGone =
              collected.has(prop.id) || collected.has(`@${prop.col},${row}`) || opened.has(prop.id)
              || (prop.type === 'boss' && state.bugHp <= 0);
            const isGem = prop.type === 'gem' || prop.type === 'trail-gem';
            const isEnemy = prop.type === 'bot' || prop.type === 'enemy' || prop.type === 'boss';
            const isGuard = (prop.type === 'bot' || prop.type === 'enemy') && prop.state === 'blocking';
            const isPowerDevice = prop.type === 'machine' || prop.type === 'switch';
            const isPowered = powered.has(prop.id);

            return (
              <span
                key={prop.id}
                className="absolute"
                style={{ left: prop.col * cell, top: row * cell, width: cell, height: cell }}
              >
                <span
                  className="block"
                  data-testid={isGem ? 'map-gem-sprite' : undefined}
                  style={{
                    ...tileStyle(tile.index, isGem ? scale * 0.5 : scale, tile.sheet),
                    marginLeft: isGem ? cell * 0.25 : undefined,
                    marginTop: isGem ? cell * 0.25 : undefined,
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
                        : isEnemy && !reducedMotion
                          ? 'enemy-idle 1.8s ease-in-out infinite'
                          : isPowerDevice && isPowered && !reducedMotion
                            ? 'machine-powered 1.35s ease-in-out infinite'
                        : undefined,
                    opacity: isGone && reducedMotion ? 0 : undefined,
                    filter: isGem && equippedItem?.id === 'data-satchel'
                      ? `drop-shadow(0 0 ${3 + equippedItem.level * 2}px rgba(253,224,71,.95))`
                      : undefined,
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
                {isEnemy && !isGone && (
                  <span
                    className="pointer-events-none absolute inset-[14%] -z-10 rounded-full border border-alert-400/50 bg-alert-500/10 shadow-[0_0_18px_rgba(248,113,113,.42)]"
                    style={equippedItem?.id === 'condition-shield'
                      ? { boxShadow: `0 0 ${16 + equippedItem.level * 6}px rgba(96,165,250,.55)` }
                      : equippedItem?.id === 'algorithm-sword' && prop.type === 'boss'
                        ? { boxShadow: `0 0 ${18 + equippedItem.level * 8}px rgba(248,113,113,.72)` }
                        : undefined}
                    aria-hidden="true"
                  />
                )}
                {isGuard && !isGone && (
                  <span
                    className="pointer-events-none absolute -right-1 -top-2 z-30 grid size-5 place-items-center rounded-full border-2 border-alert-100 bg-alert-600 font-mono text-[11px] font-black text-white shadow-[0_0_14px_rgba(248,113,113,.9)]"
                    style={{ animation: reducedMotion ? undefined : 'enemy-idle 1.2s ease-in-out infinite' }}
                    aria-label="Quái canh gác: không bước vào ô này"
                  >
                    !
                  </span>
                )}
                {prop.type === 'boss' && !isGone && (
                  <>
                    <span
                      className="absolute -top-3 left-[8%] z-30 h-2 w-[84%] overflow-hidden rounded-full border border-alert-200/70 bg-abyss-950/90 shadow-lg"
                      aria-label={`Giáp Boss còn ${state.bugHp}`}
                    >
                      <span
                        className="block h-full bg-gradient-to-r from-alert-500 to-treasure-300 transition-[width] duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, (state.bugHp / Math.max(1, Number(spec.initialState?.bugHp) || 3)) * 100))}%` }}
                      />
                    </span>
                    <span
                      className="absolute -right-2 -top-7 z-30 rounded-full border border-alert-200/60 bg-abyss-950/95 px-1.5 py-0.5 font-mono text-[8px] font-black text-alert-100 shadow-lg"
                      aria-label={`Đã đánh ${state.bugHits} trên ${Math.max(1, Number(spec.initialState?.bugHp) || 3)} đòn`}
                    >
                      Đòn {state.bugHits}/{Math.max(1, Number(spec.initialState?.bugHp) || 3)}
                    </span>
                  </>
                )}
                {isPowerDevice && (
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-[10%] -z-10 rounded-lg border transition-all',
                      isPowered
                        ? 'border-treasure-200/90 bg-treasure-300/20 shadow-[0_0_24px_rgba(250,204,21,.8)]'
                        : 'border-slate-500/40 bg-slate-950/30',
                    )}
                    style={equippedItem?.id === 'operator-gauntlet'
                      ? { boxShadow: `0 0 ${16 + equippedItem.level * 7}px rgba(250,204,21,.72)` }
                      : undefined}
                    aria-hidden="true"
                  />
                )}
                {prop.type === 'machine' && isPowered && (
                  <span
                    className="absolute -right-1 -top-1 z-20 rounded-full border border-treasure-200/70 bg-abyss-950/90 px-1.5 py-0.5 font-mono text-[9px] font-black text-treasure-200 shadow-lg"
                    aria-label={`Máy nhận ${machineCharge.get(prop.id) ?? 0} năng lượng`}
                  >
                    {machineCharge.get(prop.id) ?? 0}⚡
                  </span>
                )}
              </span>
            );
          })}

          {/* --- Nhân vật --- */}
          <span
            className="absolute z-20 transition-[left,top] ease-out"
            style={{
              left: state.col * cell,
              top: state.row * cell,
              width: cell,
              height: cell,
              transitionDuration: `${motionDurationMs}ms`,
            }}
          >
            {showIdlePrompt && !reachedGoal && (
              <span
                className="absolute z-40 w-max max-w-40 rounded-xl border border-quest-300/35 bg-abyss-950/95 px-2.5 py-1.5 text-center text-[10px] font-semibold leading-snug text-slate-100 shadow-xl"
                style={{
                  bottom: cell * 0.82,
                  ...(state.col <= 1
                    ? { left: 0 }
                    : state.col >= cols - 2
                      ? { right: 0 }
                      : { left: '50%', transform: 'translateX(-50%)' }),
                }}
                role="status"
              >
                {playedCount === 0
                  ? isFirstMission
                    ? 'Mình đang chờ lệnh — bạn dự đoán rồi nhấn Chạy nhé!'
                    : 'Đọc nhiệm vụ, vạch đường đi rồi nhấn Chạy nhé!'
                  : 'Nếu chưa đúng, thử chế độ Từng bước để tìm dòng đầu tiên bị lệch nhé!'}
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-abyss-950" aria-hidden="true" />
              </span>
            )}
            {isFirstMission && justMoved && !reducedMotion && (
              <span className="pointer-events-none absolute inset-[18%] rounded-full border-2 border-quest-200/80 animate-[first-mission-step-wave_0.55s_ease-out_forwards]" aria-hidden="true" />
            )}
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

      {!hideTitle && (
        <p className="mt-2 min-h-[1.25rem] text-xs text-slate-400" role="status" aria-live="polite">
          {lastEvent?.message ?? 'Nhân vật đang chờ lệnh của em.'}
        </p>
      )}
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
export function RouteGuide({
  north,
  east,
  south,
  west,
  energized,
  enhanced,
  reducedMotion,
  delayMs,
}: {
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
  energized: boolean;
  enhanced: boolean;
  reducedMotion: boolean;
  delayMs: number;
}) {
  const glow = energized || enhanced;

  return (
    <span
      className={cn(
        'cq-route-guide pointer-events-none absolute inset-[6%] z-[1] rounded-[18%]',
        glow && 'cq-route-guide--energized',
        !reducedMotion && 'cq-route-guide--animated',
      )}
      style={{ animationDelay: `${delayMs}ms` }}
      aria-hidden="true"
    >
      {north && <span className="cq-route-link cq-route-link--north" />}
      {east && <span className="cq-route-link cq-route-link--east" />}
      {south && <span className="cq-route-link cq-route-link--south" />}
      {west && <span className="cq-route-link cq-route-link--west" />}
      <span className="cq-route-node" />
    </span>
  );
}

function GoalBeacon({
  col,
  row,
  cell,
  reducedMotion,
  reached,
}: {
  col: number;
  row: number;
  cell: number;
  reducedMotion: boolean;
  reached: boolean;
}) {
  return (
    <span
      className="absolute pointer-events-none"
      style={{ left: col * cell, top: row * cell, width: cell, height: cell }}
      aria-hidden="true"
    >
      {/* Portal năng lượng: lõi tối, vòng xoáy và quầng sáng tách hẳn khỏi ô nền. */}
      <span
        className="absolute rounded-full border-2 border-quest-200/90 bg-[radial-gradient(circle,rgba(12,20,40,0.2)_0%,rgba(34,211,238,0.55)_42%,rgba(124,58,237,0.76)_68%,rgba(12,20,40,0)_72%)]"
        style={{
          inset: cell * 0.08,
          animation: reducedMotion
            ? undefined
            : reached
              ? 'first-mission-victory-burst 1.1s ease-out forwards'
              : 'portal-breathe 2.4s ease-in-out infinite',
          boxShadow: reached
            ? '0 0 28px 12px rgb(103 232 249 / 0.9)'
            : '0 0 18px 5px rgb(34 211 238 / 0.62), inset 0 0 14px rgb(196 181 253 / 0.72)',
        }}
      />
      {!reducedMotion && !reached && (
        <span
          className="absolute rounded-full border-2 border-dashed border-treasure-200/90"
          style={{ inset: cell * 0.18, animation: 'portal-spin 4.5s linear infinite' }}
        />
      )}

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
      {!reducedMotion && !reached && (
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
          border: reached ? '3px solid rgb(165 243 252)' : '3px solid rgb(251 191 36)',
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
