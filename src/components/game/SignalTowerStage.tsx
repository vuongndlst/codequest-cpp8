import { useEffect, useMemo, useRef, useState } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import type { WorldSpec } from '@/types/content';
import type { WorldEvent } from '@/validators/world';
import { playSound } from '@/services/audio';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { tileStyle } from './TileSprite';
import { groundTile, heroTile, propTile, TILE } from './mapTiles';
import { fitScale, RouteGuide } from './TileMapStage';

interface SignalTowerStageProps {
  spec: WorldSpec;
  events: WorldEvent[];
  avatarId?: string | null;
  playedCount: number;
  hideTitle?: boolean;
  isPlaying?: boolean;
}

interface Beacon {
  index: number;
  text: string;
  accepted: boolean;
}

interface Crystal {
  name: string;
  value: string;
  previous: string | null;
  justChanged: boolean;
}

function detailString(event: WorldEvent, key: string): string {
  const raw = event.detail?.[key];
  return typeof raw === 'string' ? raw : '';
}

function replay(events: WorldEvent[], expectedSignals: string[]): { beacons: Beacon[]; crystals: Crystal[] } {
  const beacons: Beacon[] = [];
  const order: string[] = [];
  const byName = new Map<string, Crystal>();
  const lastEvent = events.at(-1);

  for (const event of events) {
    if (event.type === 'print') {
      const index = beacons.length;
      const text = detailString(event, 'text');
      const expected = expectedSignals[index];
      beacons.push({
        index,
        text,
        accepted: expected === undefined || text.trim() === expected.trim(),
      });
      continue;
    }

    if (event.type === 'declare-var') {
      const name = detailString(event, 'name');
      if (!byName.has(name)) order.push(name);
      byName.set(name, { name, value: detailString(event, 'value'), previous: null, justChanged: event === lastEvent });
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

function pathToStations(
  start: { col: number; row: number },
  stations: Array<{ col: number; row: number }>,
): Map<string, number> {
  const result = new Map<string, number>([[`${start.col},${start.row}`, 0]]);
  let cursor = { ...start };
  stations.forEach((station, stationIndex) => {
    while (cursor.col !== station.col) {
      cursor = { ...cursor, col: cursor.col + Math.sign(station.col - cursor.col) };
      result.set(`${cursor.col},${cursor.row}`, stationIndex);
    }
    while (cursor.row !== station.row) {
      cursor = { ...cursor, row: cursor.row + Math.sign(station.row - cursor.row) };
      result.set(`${cursor.col},${cursor.row}`, stationIndex);
    }
  });
  return result;
}

/**
 * Trạm 0 vẫn là một thế giới game thật: nhân vật đứng trước bàn phát tín hiệu,
 * mỗi `cout` gửi một luồng sáng theo đường dây và thắp đúng một trạm lửa.
 * Nhờ vậy học sinh thấy quan hệ nhân quả giữa statement và thay đổi trong game,
 * nhưng nhân vật không tự di chuyển khi code không hề gọi Game API.
 */
export function SignalTowerStage({
  spec,
  events,
  avatarId,
  playedCount,
  hideTitle,
  isPlaying = false,
}: SignalTowerStageProps) {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const played = useMemo(() => events.slice(0, playedCount), [events, playedCount]);
  const expectedSignals = useMemo(
    () => Array.isArray(spec.initialState?.expectedSignals)
      ? spec.initialState.expectedSignals.filter((value): value is string => typeof value === 'string')
      : [],
    [spec.initialState],
  );
  const { beacons, crystals } = useMemo(() => replay(played, expectedSignals), [expectedSignals, played]);
  const verifiedCount = beacons.filter((beacon) => beacon.accepted).length;
  const cols = Math.max(5, spec.cols);
  const rows = Math.max(4, spec.rows ?? 4);
  const start = { col: spec.startCol ?? 1, row: spec.startRow ?? rows - 2 };
  const declaredStations = (spec.props ?? []).filter((prop) => prop.type === 'light' || prop.type === 'torch');
  const stations = declaredStations.length > 0
    ? declaredStations.map((prop) => ({ id: prop.id, col: prop.col, row: prop.row ?? rows - 2 }))
    : [{ id: 'signal-1', col: cols - 2, row: rows - 2 }];
  const pathCells = useMemo(() => pathToStations(start, stations), [start.col, start.row, stations]);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(3);
  const cell = 16 * scale;
  const lastPlayedRef = useRef(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setScale(fitScale(cols, frame.clientWidth, rows, frame.clientHeight, 4.5));
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(frame);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [cols, rows]);

  useEffect(() => {
    if (playedCount === 0) {
      lastPlayedRef.current = 0;
      return;
    }
    if (playedCount <= lastPlayedRef.current) return;
    lastPlayedRef.current = playedCount;
    const currentEvent = events[playedCount - 1];
    if (currentEvent?.type !== 'print') return;
    const printIndex = events.slice(0, playedCount - 1).filter((event) => event.type === 'print').length;
    const expected = expectedSignals[printIndex];
    const accepted = expected === undefined || detailString(currentEvent, 'text').trim() === expected.trim();
    playSound(accepted ? 'door' : 'error');
  }, [events, expectedSignals, playedCount]);

  return (
    <section aria-labelledby="tower-heading" className="h-full min-h-0 w-full">
      {hideTitle ? (
        <h3 id="tower-heading" className="sr-only">Đài tín hiệu ByteLand</h3>
      ) : (
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-quest-400">Trạm khởi động</p>
          <h3 id="tower-heading" className="text-sm font-bold text-slate-100">
            Đài tín hiệu ByteLand
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-abyss-600 bg-abyss-950/80 px-2.5 py-1 text-xs font-semibold text-slate-300">
          <Radio className="size-3.5 text-quest-300" aria-hidden="true" />
          {Math.min(verifiedCount, stations.length)}/{stations.length} trạm đã sáng
        </span>
      </div>
      )}

      <div
        className={cn(
          'relative h-full min-h-[18rem] w-full overflow-hidden border-2 border-quest-500/30 bg-[radial-gradient(circle_at_55%_20%,rgba(56,189,248,.18),transparent_40%),linear-gradient(180deg,#07152c_0%,#102640_48%,#07111f_100%)] shadow-[inset_0_0_60px_rgba(14,165,233,.08)]',
          isPlaying && 'ring-2 ring-quest-400/30 shadow-[0_0_42px_rgba(34,211,238,.18)]',
        )}
        data-testid="signal-game-map"
        role="img"
        aria-label={`Bản đồ đài tín hiệu có nhân vật và ${stations.length} trạm lửa; ${Math.min(verifiedCount, stations.length)} trạm đang sáng`}
        ref={frameRef}
      >
        {hideTitle && (
          <span className="absolute right-3 top-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-abyss-600 bg-abyss-950/88 px-2.5 py-1 text-xs font-semibold text-slate-200 shadow-lg">
            <Radio className="size-3.5 text-quest-300" aria-hidden="true" />
            {Math.min(verifiedCount, stations.length)}/{stations.length} trạm sáng
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[linear-gradient(135deg,transparent_42%,rgba(103,232,249,.08)_43%,transparent_45%)]" />
        {!reducedMotion && (
          <>
            <span className="absolute left-[12%] top-[18%] size-1.5 rounded-full bg-quest-200 shadow-[0_0_12px_4px_rgba(103,232,249,.75)] animate-[first-mission-firefly_3.2s_ease-in-out_infinite]" />
            <span className="absolute right-[15%] top-[28%] size-1 rounded-full bg-treasure-200 shadow-[0_0_10px_3px_rgba(253,224,71,.7)] animate-[first-mission-firefly_4s_ease-in-out_infinite_.8s]" />
          </>
        )}

        <div className="absolute inset-0 grid place-items-center overflow-hidden">
          <div className="relative" style={{ width: cols * cell, height: rows * cell }}>
            {Array.from({ length: rows }, (_, row) =>
              Array.from({ length: cols }, (_, col) => {
                const tile = groundTile(col, row);
                const pathStage = pathCells.get(`${col},${row}`);
                const isPath = pathStage !== undefined;
                const pathLit = pathStage !== undefined && beacons[pathStage]?.accepted === true;
                return (
                  <span
                    key={`${col}-${row}`}
                    className="absolute overflow-hidden"
                    data-signal-path={isPath ? 'true' : undefined}
                    style={{
                      ...tileStyle(tile.index, scale, tile.sheet),
                      left: col * cell,
                      top: row * cell,
                      filter: row < rows - 3 ? 'brightness(.56) saturate(.7)' : 'brightness(.82)',
                      boxShadow: isPath
                        ? pathLit
                          ? 'inset 0 0 20px rgba(34,211,238,.48), inset 0 -5px 0 rgba(103,232,249,.24)'
                          : 'inset 0 0 12px rgba(34,211,238,.12)'
                        : undefined,
                    }}
                  >
                    {isPath && (
                      <RouteGuide
                        north={pathCells.has(`${col},${row - 1}`)}
                        east={pathCells.has(`${col + 1},${row}`)}
                        south={pathCells.has(`${col},${row + 1}`)}
                        west={pathCells.has(`${col - 1},${row}`)}
                        energized={pathLit}
                        enhanced={false}
                        reducedMotion={reducedMotion}
                        delayMs={(col + row * cols) * 75}
                      />
                    )}
                  </span>
                );
              }),
            )}

            {(spec.props ?? []).filter((prop) => !['light', 'torch'].includes(prop.type)).map((prop) => {
              const tile = propTile(prop.type);
              if (!tile) return null;
              const isPortal = prop.type === 'gate';
              const portalOpen = isPortal && stations.length > 0 && verifiedCount >= stations.length;
              return (
                <span
                  key={prop.id}
                  className="absolute z-10 drop-shadow-[0_7px_7px_rgba(0,0,0,.55)]"
                  style={{
                    ...tileStyle(tile.index, scale, tile.sheet),
                    left: prop.col * cell,
                    top: (prop.row ?? 0) * cell,
                    filter: isPortal
                      ? portalOpen
                        ? 'brightness(1.45) saturate(1.3) drop-shadow(0 0 14px rgba(34,211,238,.95))'
                        : 'grayscale(.8) brightness(.55)'
                      : undefined,
                    animation: portalOpen && !reducedMotion ? 'machine-powered 1.35s ease-in-out infinite' : undefined,
                  }}
                  data-testid={isPortal ? 'signal-portal' : 'signal-prop'}
                  data-active={isPortal ? (portalOpen ? 'true' : 'false') : undefined}
                  aria-label={isPortal ? (portalOpen ? 'Cổng ByteLand đã mở' : 'Cổng ByteLand đang khóa') : undefined}
                  aria-hidden={isPortal ? undefined : 'true'}
                />
              );
            })}

            {stations.map((station, stationIndex) => {
              const beacon = beacons[stationIndex];
              const active = beacon?.accepted === true;
              const rejected = Boolean(beacon) && !active;
              const text = beacons[stationIndex]?.text.replace(/\n/g, ' ↵ ');
              return (
                <span
                  key={station.id}
                  className="absolute z-20"
                  style={{ left: station.col * cell, top: station.row * cell, width: cell, height: cell }}
                  data-testid="signal-station"
                  data-active={active ? 'true' : 'false'}
                >
                  <span
                    className="absolute inset-0"
                    style={{
                      ...tileStyle(TILE.torch.index, scale, TILE.torch.sheet),
                      filter: active
                        ? 'drop-shadow(0 0 10px rgba(251,191,36,.95)) brightness(1.25)'
                        : rejected
                          ? 'grayscale(.5) sepia(1) hue-rotate(315deg) brightness(.7)'
                          : 'grayscale(1) brightness(.45)',
                    }}
                  />
                  {active && (
                    <>
                      <span
                        className={cn('absolute left-1/2 top-0 size-5 -translate-x-1/2 rounded-[55%_55%_45%_45%] bg-gradient-to-t from-alert-500 via-treasure-300 to-white shadow-[0_0_18px_7px_rgba(251,191,36,.82)]', !reducedMotion && 'animate-[pulse-glow_1.15s_ease-in-out_infinite]')}
                        aria-hidden="true"
                      />
                      <span className="absolute bottom-[82%] left-1/2 z-30 w-max max-w-48 -translate-x-1/2 rounded-xl border border-treasure-300/45 bg-abyss-950/95 px-2.5 py-1.5 text-center font-mono text-[10px] font-bold text-treasure-100 shadow-xl">
                        {text || '(dòng trống)'}
                      </span>
                    </>
                  )}
                  {rejected && (
                    <span className="absolute bottom-[82%] left-1/2 z-30 w-max max-w-48 -translate-x-1/2 rounded-xl border border-alert-300/55 bg-abyss-950/95 px-2.5 py-1.5 text-center font-mono text-[10px] font-bold text-alert-100 shadow-xl">
                      Chưa khớp: {text || '(dòng trống)'}
                    </span>
                  )}
                </span>
              );
            })}

            {verifiedCount > 0 && !reducedMotion && (
              <span
                className="absolute z-20 size-4 rounded-full bg-white shadow-[0_0_14px_7px_rgba(34,211,238,.9)] animate-[signal-orb_1.5s_ease-in-out_infinite]"
                style={{ left: start.col * cell + cell * 0.4, top: start.row * cell + cell * 0.45 }}
                aria-hidden="true"
              />
            )}

            <span
              className="absolute z-30 drop-shadow-[0_8px_7px_rgba(0,0,0,.6)]"
              style={{
                ...tileStyle(heroTile(avatarId), scale, 'dungeon'),
                left: start.col * cell,
                top: start.row * cell,
                animation: reducedMotion ? undefined : isPlaying ? 'hero-step .45s ease-in-out infinite' : 'hero-idle 2.4s ease-in-out infinite',
              }}
              aria-label="Nhân vật của em tại bàn phát tín hiệu"
            />

            <span
              className="absolute z-20 rounded-lg border border-quest-300/35 bg-abyss-950/80 shadow-[0_0_20px_rgba(34,211,238,.28)]"
              style={{ left: (start.col + 1) * cell + cell * 0.15, top: start.row * cell + cell * 0.35, width: cell * 0.9, height: cell * 0.65 }}
              aria-hidden="true"
            >
              <span className={cn('absolute left-1.5 right-1.5 top-1.5 h-2 rounded-sm bg-quest-400/45', isPlaying && !reducedMotion && 'animate-pulse')} />
              <span className="absolute bottom-1.5 left-1.5 size-1.5 rounded-full bg-verdant-300" />
            </span>
          </div>
        </div>

        {playedCount === 0 && !isPlaying && (
          <div className="absolute left-4 top-4 max-w-[18rem] rounded-xl border border-quest-300/25 bg-abyss-950/88 px-3 py-2 shadow-xl backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-xs font-bold text-quest-200">
              <Sparkles className="size-3.5" aria-hidden="true" /> Trạm đang chờ tín hiệu
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Chạy code để xem lệnh <code className="font-mono text-slate-200">cout</code> thắp lửa trên bản đồ.</p>
          </div>
        )}

        {crystals.length > 0 && (
          <ul className="absolute bottom-3 right-3 z-40 flex max-w-[55%] flex-wrap justify-end gap-1.5" aria-label="Các biến trong chương trình">
            {crystals.map((crystal) => (
              <li key={crystal.name} className={cn('rounded-lg border bg-abyss-950/92 px-2 py-1 font-mono text-[10px] shadow-lg', crystal.justChanged ? 'border-mage-300/60 text-mage-200' : 'border-abyss-600 text-slate-300')}>
                {crystal.name} = <strong>{crystal.value}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {playedCount > 0 && events[playedCount - 1]?.message}
      </p>
    </section>
  );
}
