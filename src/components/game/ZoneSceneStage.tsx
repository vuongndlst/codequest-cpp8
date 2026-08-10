import { useEffect, useMemo, useState } from 'react';
import type { ChallengeKind } from '@/types/content';
import type { WorldEvent } from '@/validators/world';
import { useUiStore } from '@/stores/uiStore';
import { challengePhaseLabel, zonePresentation } from '@/data/zonePresentation';
import { cn } from '@/utils/cn';
import { tileStyle } from './TileSprite';
import { groundTile, heroTile, TILE } from './mapTiles';

interface ZoneSceneStageProps {
  lessonId: string;
  challengeKind: ChallengeKind;
  challengeTitle: string;
  events: WorldEvent[];
  playedCount: number;
  avatarId?: string | null;
  isPlaying?: boolean;
}

const COLS = 10;
const ROWS = 4;
const CELL = 64;

/**
 * Sân khấu cho các node thiên về quan sát/khái niệm.
 *
 * Những node này không giả vờ có một bài toán di chuyển. Thay vào đó, chúng đặt kiến thức
 * vào đúng bối cảnh của khu vực và biến từng sự kiện code thành một nhịp tiến trên hành trình.
 */
export function ZoneSceneStage({
  lessonId,
  challengeKind,
  challengeTitle,
  events,
  playedCount,
  avatarId,
  isPlaying = false,
}: ZoneSceneStageProps) {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const zone = zonePresentation(lessonId);
  const played = useMemo(() => events.slice(0, playedCount), [events, playedCount]);
  const meaningfulEvents = played.filter((event) => event.type !== 'declare-func');
  const total = Math.max(1, events.filter((event) => event.type !== 'declare-func').length);
  const progress = Math.min(1, meaningfulEvents.length / total);
  const heroLeft = 8 + progress * 70;
  const latest = played.at(-1);
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    setShowNudge(false);
    if (isPlaying || playedCount > 0) return;
    const timer = window.setTimeout(() => setShowNudge(true), 16000);
    return () => window.clearTimeout(timer);
  }, [isPlaying, playedCount]);

  return (
    <section aria-labelledby="zone-scene-heading">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className={cn('text-[10px] font-bold uppercase tracking-[0.16em]', zone.accentClass)}>{zone.name}</p>
          <h3 id="zone-scene-heading" className="text-sm font-bold text-slate-100">{zone.sceneName}</h3>
        </div>
        <p className="text-xs text-slate-400">{challengePhaseLabel(challengeKind)} · {zone.objective}</p>
      </div>

      <div className={cn('relative min-h-[21rem] overflow-hidden rounded-2xl border-2 bg-gradient-to-b', zone.atmosphereClass, zone.borderClass)}>
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_65%)]" />

        <div className="absolute inset-x-0 bottom-0 mx-auto h-64 w-[640px] max-w-full overflow-hidden">
          {Array.from({ length: ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, col) => {
              const tile = zone.ground === 'town' ? groundTile(col, row) : TILE.path;
              return (
                <span
                  key={`${col}-${row}`}
                  className="absolute opacity-90"
                  style={{
                    ...tileStyle(tile.index, 4, tile.sheet),
                    left: col * CELL,
                    top: row * CELL,
                    filter: zone.ground === 'dungeon' ? 'saturate(.65) brightness(.6)' : undefined,
                  }}
                />
              );
            }),
          )}

          <span className="absolute inset-x-10 bottom-20 h-3 rounded-full bg-black/30 blur-sm" />
          {zone.props.map((tile, index) => (
            <span
              key={`${tile.sheet}-${tile.index}-${index}`}
              className={cn('absolute z-10 drop-shadow-[0_8px_8px_rgba(0,0,0,0.45)]', !reducedMotion && 'animate-[hero-idle_2.8s_ease-in-out_infinite]')}
              style={{
                ...tileStyle(tile.index, index === 2 ? 5 : 4, tile.sheet),
                left: `${35 + index * 24}%`,
                bottom: index === 1 ? 92 : 76,
                animationDelay: `${index * 0.45}s`,
                opacity: progress >= (index + 1) / 3 ? 1 : 0.48,
                filter: progress >= (index + 1) / 3 ? 'drop-shadow(0 0 10px rgba(250,204,21,.55))' : 'grayscale(.45)',
              }}
              aria-hidden="true"
            />
          ))}

          <span
            className="absolute z-20 transition-[left] ease-out"
            style={{
              ...tileStyle(heroTile(avatarId), 5, 'dungeon'),
              left: `${heroLeft}%`,
              bottom: 70,
              transitionDuration: reducedMotion ? '0ms' : '320ms',
              animation: reducedMotion ? undefined : isPlaying ? 'hero-step .45s ease-in-out infinite' : 'hero-idle 2.4s ease-in-out infinite',
              filter: 'drop-shadow(0 8px 8px rgba(0,0,0,.5))',
            }}
            aria-label="Nhân vật của em trong khu vực"
          />
        </div>

        <div className="absolute left-4 top-4 max-w-[70%] rounded-xl border border-white/15 bg-abyss-950/85 px-3 py-2 shadow-xl backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Mục tiêu đang học</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-100">{challengeTitle}</p>
        </div>

        {(latest || showNudge) && (
          <div className="absolute bottom-3 left-1/2 z-30 w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-quest-300/25 bg-abyss-950/92 px-3 py-2 text-center shadow-xl backdrop-blur-sm" role="status" aria-live="polite">
            <p className="text-xs text-slate-200">
              {latest?.message ?? 'Byte nhắc nhỏ: đọc mục tiêu, dự đoán kết quả rồi hãy bấm Chạy code nhé.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
