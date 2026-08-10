import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronsRight,
  Footprints,
  Gauge,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import type { Challenge } from '@/types/content';
import type { useChallengeSession } from '@/hooks/useChallengeSession';
import type { ReplaySpeed, StageReplay } from '@/components/game/useStageReplay';
import type { MapAccountSummary } from '@/components/game/MapSettingsMenu';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { HintPanel } from '@/components/learning/HintPanel';
import { GameStage } from '@/components/game/GameStage';
import { MapSettingsMenu } from '@/components/game/MapSettingsMenu';
import { ByteMascot } from '@/components/game/ByteMascot';
import { Button } from '@/components/ui/Button';
import { SaveIndicator } from '@/components/common/StateViews';
import { playSound } from '@/services/audio';
import { cn } from '@/utils/cn';
import { paletteForChallenge } from '@/data/commandPalette';

type ChallengeSession = ReturnType<typeof useChallengeSession>;
type RunPurpose = 'observe' | 'experiment' | 'finish';
interface PendingRun {
  purpose: RunPurpose;
  startPlayKey: number;
}

interface FirstMissionWorkspaceProps {
  challenge: Challenge;
  session: ChallengeSession;
  replay: StageReplay;
  replaySpeed: ReplaySpeed;
  onReplaySpeedChange: (speed: ReplaySpeed) => void;
  avatarId: string;
  account: MapAccountSummary;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled?: boolean;
  onToggleMusic?: () => void;
  onAvatarChange: (avatarId: string) => void | Promise<void>;
  accountHref: string;
  accountActionLabel: string;
  successPanel?: ReactNode;
  demoAllAccess?: boolean;
}

const PREDICTIONS = [1, 2, 3] as const;

/**
 * Màn 1 là một game workspace duy nhất, không phải bốn card dọc.
 *
 * Chu trình học bắt buộc:
 *   dự đoán → chạy ví dụ → thay đổi một dòng → quan sát → khôi phục → hoàn thành.
 */
export function FirstMissionWorkspace({
  challenge,
  session,
  replay,
  replaySpeed,
  onReplaySpeedChange,
  avatarId,
  account,
  soundEnabled,
  onToggleSound,
  musicEnabled = false,
  onToggleMusic = () => undefined,
  onAvatarChange,
  accountHref,
  accountActionLabel,
  successPanel,
  demoAllAccess = false,
}: FirstMissionWorkspaceProps) {
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [activeCommandToken, setActiveCommandToken] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [hasObserved, setHasObserved] = useState(false);
  const [hasExperimented, setHasExperimented] = useState(false);
  const [pendingRun, setPendingRun] = useState<PendingRun | null>(null);
  const briefingButtonRef = useRef<HTMLButtonElement>(null);
  const relevantCommands = useMemo(() => paletteForChallenge(challenge), [challenge]);

  const movementLines = useMemo(
    () => session.code
      .split('\n')
      .map((line, index) => (line.includes('moveForward();') ? index + 1 : null))
      .filter((line): line is number => line !== null),
    [session.code],
  );
  const starterMovementCount = useMemo(
    () => challenge.starterCode.split('\n').filter((line) => line.includes('moveForward();')).length,
    [challenge.starterCode],
  );
  const codeChanged = session.code !== challenge.starterCode;
  const hasRemovedCommand = movementLines.length < starterMovementCount;
  const readyToFinish = hasExperimented && !codeChanged;
  const pedagogyComplete = readyToFinish && Boolean(session.result?.isCorrect) && replay.isDone;
  const workspaceLocked = briefingOpen || pedagogyComplete;

  const executingLine = replay.total > 0 && !replay.isDone
    ? movementLines[Math.min(replay.playedCount, Math.max(0, movementLines.length - 1))]
    : undefined;

  useEffect(() => {
    if (!pendingRun || session.playKey <= pendingRun.startPlayKey || !replay.isDone) return;
    if (pendingRun.purpose === 'observe') setHasObserved(true);
    if (pendingRun.purpose === 'experiment') setHasExperimented(true);
    setPendingRun(null);
  }, [pendingRun, replay.isDone, session.playKey]);

  useEffect(() => {
    if (briefingOpen) briefingButtonRef.current?.focus();
  }, [briefingOpen]);

  const runCode = () => {
    playSound('click');
    setHintOpen(false);
    const purpose: RunPurpose = !hasObserved ? 'observe' : !hasExperimented ? 'experiment' : 'finish';
    setPendingRun({ purpose, startPlayKey: session.playKey });
    void session.run();
  };

  const restoreStarter = () => {
    playSound('click');
    session.reset();
  };

  const runDisabled =
    session.isRunning ||
    replay.isPlaying ||
    pendingRun !== null ||
    (!hasObserved && prediction === null) ||
    (hasObserved && !hasExperimented && !hasRemovedCommand) ||
    (hasExperimented && codeChanged);

  const runLabel = !hasObserved
    ? 'Chạy và quan sát'
    : !hasExperimented
      ? 'Chạy thử thay đổi'
      : 'Chạy tới đích';

  return (
    <section
      className="relative mx-auto min-h-[calc(100dvh-9rem)] max-w-[96rem] overflow-hidden rounded-2xl border border-quest-500/35 bg-abyss-900 shadow-2xl shadow-black/20"
      aria-label="Không gian nhiệm vụ đầu tiên"
    >
      <header
        className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-abyss-700 bg-abyss-800/95 px-3 py-2 sm:px-4"
        inert={workspaceLocked ? true : undefined}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-quest-500/15 text-quest-300">
            <Target className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-quest-400">Nhiệm vụ 1</p>
            <h1 className="truncate text-sm font-extrabold text-slate-100 sm:text-base">Đưa Byte tới ô đích</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold',
            pedagogyComplete
              ? 'border-verdant-500/35 bg-verdant-500/12 text-verdant-300'
              : 'border-abyss-600 bg-abyss-950 text-slate-400',
          )} aria-live="polite">
            {pedagogyComplete && <CheckCircle2 className="size-3.5" aria-hidden="true" />}
            Mục tiêu {pedagogyComplete ? '1/1' : '0/1'}
          </span>
        </div>
      </header>

      <div
        className="grid min-h-[calc(100dvh-12.5rem)] lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.85fr)]"
        inert={workspaceLocked ? true : undefined}
      >
        {/* Map luôn chiếm phần lớn workspace. */}
        <div className="relative flex min-h-[30rem] items-center overflow-hidden border-b border-abyss-700 bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,0.1),transparent_60%)] p-3 sm:p-5 lg:min-h-0 lg:border-b-0 lg:border-r lg:p-6">
          <div className="absolute left-3 top-3 z-30 max-w-[min(20rem,calc(100%-5rem))] rounded-xl border border-white/12 bg-abyss-950/88 px-3 py-2 shadow-lg backdrop-blur-md sm:left-4 sm:top-4">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-treasure-300">
              <Target className="size-3" aria-hidden="true" /> Mục tiêu
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-100">Dùng 3 lệnh để Byte tới ô phát sáng.</p>
          </div>

          <MapSettingsMenu
            compact
            showEquipment={demoAllAccess}
            allEquipmentUnlocked={demoAllAccess}
            avatarId={avatarId}
            account={account}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            musicEnabled={musicEnabled}
            onToggleMusic={onToggleMusic}
            onAvatarChange={onAvatarChange}
            accountHref={accountHref}
            accountActionLabel={accountActionLabel}
          />

          <div className="w-full pt-12 sm:pt-10">
            {challenge.world && (
              <GameStage
                spec={challenge.world}
                events={session.result?.worldEvents ?? []}
                avatarId={avatarId}
                playedCount={replay.playedCount}
                hideTitle
                presentation="first-mission"
                isPlaying={replay.isPlaying}
                motionDurationMs={replaySpeed === 'fast' ? 100 : replaySpeed === 'step' ? 220 : 280}
              />
            )}
          </div>

          <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-abyss-950/88 px-3 py-2 text-[11px] shadow-lg backdrop-blur-md sm:inset-x-4 sm:bottom-4">
            <span className="min-w-0 truncate text-slate-300" aria-live="polite">
              {replay.isPlaying
                ? 'Byte đang làm theo từng dòng code…'
                : replay.total > 0 && !replay.isDone
                  ? 'Đang tạm dừng — bấm Bước tiếp để debug.'
                : replay.total > 0 && replay.isDone
                  ? 'Đã quan sát xong chương trình.'
                  : 'Byte đang chờ lệnh của em.'}
            </span>
            {replay.total > 0 && (
              <span className="shrink-0 font-mono text-quest-300">{replay.playedCount}/{replay.total}</span>
            )}
          </div>
        </div>

        {/* Code nằm cạnh map để mắt không phải cuộn qua nhiều màn hình. */}
        <div className="flex min-h-[34rem] min-w-0 flex-col bg-abyss-900 lg:min-h-0">
          <div className="relative border-b border-abyss-700 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Code điều khiển Byte</p>
                <h2 className="text-sm font-bold text-slate-100">Chương trình của em</h2>
              </div>
              <SaveIndicator state={session.saveState} />
            </div>

          </div>

          <div className="border-b border-abyss-700 bg-abyss-800/55 px-3 py-2.5 sm:px-4">
            {!hasObserved ? (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <Sparkles className="size-3.5 text-treasure-300" aria-hidden="true" />
                  Dự đoán trước khi chạy
                </p>
                <p className="mt-1 text-[11px] text-slate-400">3 dòng lệnh sẽ đưa Byte đi bao nhiêu ô?</p>
                <div className="mt-2 flex gap-1.5" role="group" aria-label="Dự đoán số ô Byte sẽ đi">
                  {PREDICTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setPrediction(value);
                      }}
                      aria-pressed={prediction === value}
                      className={cn(
                        'h-8 flex-1 rounded-lg border text-xs font-bold transition-colors',
                        prediction === value
                          ? 'border-treasure-300 bg-treasure-400/12 text-treasure-200'
                          : 'border-abyss-600 bg-abyss-900 text-slate-400 hover:border-quest-500/50',
                      )}
                    >
                      {value} ô
                    </button>
                  ))}
                </div>
                {prediction !== null && (
                  <p className="mt-1.5 text-[10px] text-treasure-200" role="status">Đã ghi dự đoán. Chạy để tự kiểm chứng.</p>
                )}
              </div>
            ) : !hasExperimented ? (
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-treasure-300" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-slate-100">Em vừa thấy: 1 lệnh tạo 1 bước.</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Bây giờ xóa một dòng <code className="text-quest-300">moveForward();</code> rồi chạy lại.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-verdant-300" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-slate-100">Byte dừng sớm vì thiếu một lệnh.</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Khôi phục 3 lệnh rồi chạy lần cuối để tới đích.</p>
                </div>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 p-3 sm:p-4">
            <div className={cn(!hasObserved && 'relative')}>
              <CodeEditor
                value={session.code}
                onChange={session.setCode}
                onActiveTokenChange={setActiveCommandToken}
                highlightedLines={session.highlightedLines}
                executingLine={executingLine}
                focusLines={movementLines}
                readOnly={!hasObserved}
                minHeight="260px"
                ariaLabel="Vùng code điều khiển Byte"
              />
              {!hasObserved && (
                <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg border border-quest-500/25 bg-abyss-950/90 px-2.5 py-1.5 text-center text-[10px] text-slate-400 backdrop-blur-sm">
                  Lần đầu, em chỉ cần đọc và quan sát code chạy.
                </div>
              )}
            </div>
            {hasObserved && (
              <div className="mt-2">
                <CommandPalette commands={relevantCommands} activeToken={activeCommandToken} />
              </div>
            )}
          </div>

          <div className="border-t border-abyss-700 bg-abyss-800/70 p-3 sm:p-4">
            {hasObserved && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-lg border border-abyss-600 bg-abyss-950 p-1" role="group" aria-label="Chế độ chạy">
                  {([
                    ['normal', 'Thường', Gauge],
                    ['fast', 'Nhanh', ChevronsRight],
                    ['step', 'Từng bước', Footprints],
                  ] as const).map(([value, label, Icon]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        onReplaySpeedChange(value);
                      }}
                      aria-pressed={replaySpeed === value}
                      className={cn(
                        'inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[10px] font-semibold',
                        replaySpeed === value ? 'bg-quest-500/18 text-quest-300' : 'text-slate-500 hover:text-slate-300',
                      )}
                    >
                      <Icon className="size-3" aria-hidden="true" /> {label}
                    </button>
                  ))}
                </div>
                {replaySpeed === 'step' && replay.total > 0 && !replay.isDone && (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      replay.stepForward();
                    }}
                    className="h-8 rounded-lg bg-mage-500/15 px-2 text-[10px] font-bold text-mage-200"
                  >
                    Bước tiếp
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {hasExperimented && codeChanged ? (
                  <Button size="sm" variant="secondary" onClick={restoreStarter} leadingIcon={<RotateCcw className="size-3.5" />}>
                    Khôi phục 3 lệnh
                  </Button>
                ) : (
                  <HintPanel
                    hints={challenge.hints}
                    unlockedLevel={session.hintLevel}
                    onUnlock={session.unlockNextHint}
                    canViewSolution={false}
                    onViewSolution={() => undefined}
                    solutionVisible={false}
                    attemptCount={session.attemptCount}
                    open={hintOpen}
                    onOpenChange={setHintOpen}
                  />
                )}
              </div>

              <Button
                onClick={runCode}
                disabled={runDisabled}
                isLoading={session.isRunning || replay.isPlaying}
                loadingLabel={replay.isPlaying ? 'Byte đang chạy' : 'Đang chạy'}
                leadingIcon={<Play className="size-4" aria-hidden="true" />}
                className="min-w-36"
              >
                {runLabel}
              </Button>
            </div>

            {!hasObserved && prediction === null && (
              <p className="mt-1.5 text-right text-[10px] text-slate-500">Chọn dự đoán để mở nút Chạy.</p>
            )}
            {hasObserved && !hasExperimented && !hasRemovedCommand && (
              <p className="mt-1.5 text-right text-[10px] text-slate-500">Xóa một dòng lệnh để tiếp tục thử nghiệm.</p>
            )}
          </div>
        </div>
      </div>

      {briefingOpen && (
        <div
          className="absolute inset-0 z-50 grid place-items-center bg-abyss-950/78 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="first-mission-briefing-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-quest-400/35 bg-abyss-900 p-5 text-center shadow-2xl shadow-black/55 sm:p-6">
            <ByteMascot size={70} className="mx-auto" mood="thinking" />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-quest-400">Nhiệm vụ đầu tiên</p>
            <h2 id="first-mission-briefing-title" className="mt-1 text-xl font-extrabold text-slate-100">Byte không thể tự đi</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              “Mình chỉ làm đúng từng dòng code bạn viết. Hãy giúp mình tới ô phát sáng nhé!”
            </p>
            <div className="mt-4 rounded-xl border border-treasure-400/25 bg-treasure-500/8 px-3 py-2.5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide text-treasure-300">Mục tiêu</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">Quan sát 3 lệnh <code className="text-quest-300">moveForward();</code> đưa Byte tới đích.</p>
            </div>
            <Button
              ref={briefingButtonRef}
              onClick={() => {
                playSound('click');
                setBriefingOpen(false);
              }}
              fullWidth
              className="mt-5"
              leadingIcon={<Play className="size-4" aria-hidden="true" />}
            >
              Bắt đầu nhiệm vụ
            </Button>
            <p className="mt-2 text-[10px] text-slate-500">Không cần biết C++ trước — Byte sẽ hướng dẫn từng bước.</p>
          </div>
        </div>
      )}

      {pedagogyComplete && successPanel && (
        <div className="absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-abyss-950/82 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl">{successPanel}</div>
        </div>
      )}
    </section>
  );
}
