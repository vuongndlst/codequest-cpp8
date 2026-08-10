import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlignLeft,
  ArrowLeft,
  BookOpen,
  Brain,
  ChevronsRight,
  Footprints,
  Gauge,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  SkipForward,
  Target,
} from 'lucide-react';
import { getChallenge, getChallengeIds, getLesson } from '@/lessons';
import { relevantHandbookCards } from '@/data/challengeHandbook';
import { paletteForChallenge } from '@/data/commandPalette';
import { useChallengeSession } from '@/hooks/useChallengeSession';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { updateProfile } from '@/services/supabase/profiles.repo';
import { CodeEditor, type CodeEditorHandle } from '@/components/editor/CodeEditor';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { ResultPanel } from '@/components/editor/ResultPanel';
import { HintPanel } from '@/components/learning/HintPanel';
import { FirstMissionWorkspace } from '@/components/learning/FirstMissionWorkspace';
import { HandbookModal } from '@/components/learning/Handbook';
import { GameStage } from '@/components/game/GameStage';
import { MapSettingsMenu } from '@/components/game/MapSettingsMenu';
import { useStageReplay, type ReplaySpeed } from '@/components/game/useStageReplay';
import { ByteMascot } from '@/components/game/ByteMascot';
import { VictoryPanel } from '@/components/game/VictoryPanel';
import { BadgeToast } from '@/components/game/BadgeToast';
import { Button } from '@/components/ui/Button';
import { SaveIndicator, LoadingState } from '@/components/common/StateViews';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { cn } from '@/utils/cn';
import { playSound, setGameMusicActive } from '@/services/audio';

const KIND_LABELS: Record<string, string> = {
  story: 'Quan sát',
  concept: 'Khám phá lệnh',
  sandbox: 'Thử ngay',
  mission: 'Nhiệm vụ',
  debug: 'Debug Challenge',
  cleancode: 'Clean Code Check',
  quiz: 'Exit Ticket',
  boss: 'BOSS',
};

/**
 * Màn làm nhiệm vụ theo một trục duy nhất:
 *
 *   ① Nhiệm vụ ngắn
 *   ② Bản đồ lớn + Chạy code
 *   ③ Khám phá lệnh mới (nếu là màn nhập môn)
 *   ④ Editor + các lệnh đúng cho riêng nhiệm vụ
 *   ⑤ Phản hồi (chỉ xuất hiện sau khi chạy)
 *
 * Học sinh không còn phải quét qua hai cột và nhiều card ngang hàng để đoán
 * xem nên nhìn vào đâu trước. Bản đồ là sân chơi chính; mọi công cụ còn lại
 * xếp theo đúng thứ tự sử dụng.
 */
export function ChallengePage() {
  const { lessonId = '', challengeId = '' } = useParams();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const soundEnabled = useUiStore((state) => state.soundEnabled);
  const toggleSound = useUiStore((state) => state.toggleSound);
  const musicEnabled = useUiStore((state) => state.musicEnabled);
  const toggleMusic = useUiStore((state) => state.toggleMusic);

  const [handbookOpen, setHandbookOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>('normal');
  const editorRef = useRef<CodeEditorHandle>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const lesson = getLesson(lessonId);
  const challenge = getChallenge(lessonId, challengeId);
  const session = useChallengeSession({
    challenge: challenge ?? FALLBACK_CHALLENGE,
    persist: true,
  });

  const stageEvents = session.result?.worldEvents ?? NO_WORLD_EVENTS;
  const replay = useStageReplay(stageEvents, session.playKey, replaySpeed);

  // Nhạc chỉ thuộc về sân chơi. Rời route nhiệm vụ phải dừng ngay nhưng vẫn
  // giữ lựa chọn của học sinh để lần sau vào game có thể phát lại.
  useEffect(() => {
    setGameMusicActive(true);
    return () => setGameMusicActive(false);
  }, []);

  useEffect(() => {
    if (!isEditorExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsEditorExpanded(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isEditorExpanded]);

  if (!lesson || !challenge) return <NotFoundPage />;

  const challengeIds = getChallengeIds(lessonId);
  const index = challengeIds.indexOf(challenge.id);
  const nextChallengeId = challengeIds[index + 1];
  const relevantCommands = paletteForChallenge(challenge);
  const isFirstMission = challenge.id === 'l1-c1-observe';

  /** Chạy từ editor thì tự đưa mắt học sinh trở lại bản đồ để xem nhân vật. */
  const runAndWatch = () => {
    playSound('click');
    setHintOpen(false);
    if (isEditorExpanded) setIsEditorExpanded(false);
    window.requestAnimationFrame(() => {
      mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    void session.run();
  };

  const requestHint = () => {
    session.unlockNextHint();
    setHintOpen(true);
  };

  const changeAvatarOnMap = async (avatarId: string) => {
    if (!profile) return;
    const updated = await updateProfile(profile.id, { avatar_id: avatarId });
    setProfile(updated);
  };

  const editorPanel = (
    <section className="space-y-3" aria-labelledby="code-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-quest-400">
            Bước {isFirstMission ? 4 : 3}
          </p>
          <h2 id="code-heading" className="text-lg font-bold text-slate-100">
            {isFirstMission ? 'Đọc và thử code' : 'Viết code của em'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator state={session.saveState} />
          <button
            type="button"
            onClick={() => setIsEditorExpanded((expanded) => !expanded)}
            aria-pressed={isEditorExpanded}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            {isEditorExpanded ? (
              <>
                <Minimize2 className="size-3.5" aria-hidden="true" /> Thu nhỏ
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5" aria-hidden="true" /> Phóng to
              </>
            )}
          </button>
        </div>
      </div>

      {session.isRestoring ? (
        <LoadingState label="Đang mở lại code em viết dở…" />
      ) : (
        <CodeEditor
          handleRef={editorRef}
          value={session.code}
          onChange={session.setCode}
          highlightedLines={session.highlightedLines}
          minHeight={isEditorExpanded ? 'calc(100vh - 220px)' : '380px'}
          ariaLabel={`Vùng viết code cho nhiệm vụ ${challenge.title}`}
        />
      )}

      {/* Chỉ những lệnh cần cho nhiệm vụ, đặt SAU editor như một thanh phím tắt. */}
      <CommandPalette
        commands={relevantCommands}
        onInsert={(snippet) => editorRef.current?.insert(snippet)}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => editorRef.current?.format()}
            title="Phím tắt: Shift + Alt + F"
            leadingIcon={<AlignLeft className="size-4" aria-hidden="true" />}
          >
            Dọn code
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={session.reset}
            leadingIcon={<RotateCcw className="size-4" aria-hidden="true" />}
          >
            Đặt lại
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHandbookOpen(true)}
            leadingIcon={<BookOpen className="size-4" aria-hidden="true" />}
          >
            Tra lệnh
          </Button>
          <HintPanel
            hints={challenge.hints}
            unlockedLevel={session.hintLevel}
            onUnlock={session.unlockNextHint}
            solution={challenge.solution}
            canViewSolution={session.canViewSolution}
            onViewSolution={session.showSolution}
            solutionVisible={session.solutionVisible}
            attemptCount={session.attemptCount}
            open={hintOpen}
            onOpenChange={setHintOpen}
          />
        </div>

        <Button
          onClick={runAndWatch}
          isLoading={session.isRunning || replay.isPlaying}
          loadingLabel={replay.isPlaying ? 'Byte đang chạy' : 'Đang chạy'}
          leadingIcon={<Play className="size-4" aria-hidden="true" />}
          className="sm:min-w-48"
        >
          Chạy và xem bản đồ
        </Button>
      </div>
    </section>
  );

  if (isFirstMission) {
    return (
      <div className="mx-auto max-w-[96rem] space-y-2">
        <Link
          to={`/app/lesson/${lessonId}`}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Trở về {lesson.zoneName}
        </Link>

        <FirstMissionWorkspace
          challenge={challenge}
          session={session}
          replay={replay}
          replaySpeed={replaySpeed}
          onReplaySpeedChange={setReplaySpeed}
          avatarId={profile?.avatar_id ?? 'guardian-cyan'}
          account={{
            name: profile?.full_name ?? 'Học viên ByteLand',
            className: profile?.class_name,
            studentCode: profile?.student_code,
            level: profile?.level ?? 1,
            totalXp: profile?.total_xp ?? 0,
            gems: profile?.gem_balance ?? 0,
          }}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          musicEnabled={musicEnabled}
          onToggleMusic={toggleMusic}
          onAvatarChange={changeAvatarOnMap}
          accountHref="/app/profile"
          accountActionLabel="Mở hồ sơ đầy đủ"
          successPanel={
            <VictoryPanel
              challenge={challenge}
              result={session.result}
              xpAwarded={session.xpAwarded}
              gemsAwarded={session.gemsAwarded}
              nextLabel={nextChallengeId ? 'Nhiệm vụ tiếp theo' : 'Về trang khu vực'}
              onNext={() =>
                navigate(
                  nextChallengeId
                    ? `/app/lesson/${lessonId}/challenge/${nextChallengeId}`
                    : `/app/lesson/${lessonId}`,
                )
              }
            />
          }
        />
        <BadgeToast badges={session.newBadges} onDismiss={session.dismissBadges} />
      </div>
    );
  }

  if (isEditorExpanded) {
    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-abyss-950 p-4">
        <div className="mx-auto max-w-5xl">{editorPanel}</div>
        {(session.result || session.isRunning) && (
          <div className="mx-auto mt-4 max-w-5xl">
            <ResultPanel
              result={session.result}
              isRunning={session.isRunning}
              onRequestHint={requestHint}
              hintsAvailable={session.hintLevel < challenge.hints.length}
              showCleanCode={challenge.kind !== 'story'}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('mx-auto space-y-5', isFirstMission ? 'max-w-7xl' : 'max-w-6xl')}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/app/lesson/${lessonId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {lesson.zoneName}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
                challenge.kind === 'boss'
                  ? 'bg-alert-500/15 text-alert-400'
                  : challenge.kind === 'debug'
                    ? 'bg-treasure-400/15 text-treasure-300'
                    : 'bg-quest-500/15 text-quest-400',
              )}
            >
              {KIND_LABELS[challenge.kind] ?? challenge.kind}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-100">{challenge.title}</h1>
          </div>
        </div>
        <p className="rounded-lg border border-abyss-700 bg-abyss-900 px-3 py-1.5 text-xs text-slate-400">
          Nhiệm vụ {index + 1}/{challengeIds.length}
        </p>
      </header>

      {/* ① NHIỆM VỤ — học sinh biết mục tiêu trước khi nhìn vào sân chơi. */}
      <section className="rounded-2xl border border-abyss-700 bg-abyss-900 p-4 sm:p-5" aria-labelledby="instructions-heading">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 gap-3">
            <ByteMascot size={42} animated={false} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-quest-400">
                Bước 1
              </p>
              <h2 id="instructions-heading" className="font-bold text-slate-100">
                Nhiệm vụ của em
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{challenge.story}</p>
              {challenge.whyThisMatters && (
                <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-verdant-400">
                  <Target className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {challenge.whyThisMatters}
                </p>
              )}
            </div>
          </div>

          <div className="lg:w-[46%] lg:border-l lg:border-abyss-700 lg:pl-5">
            <ul className="space-y-2">
              {challenge.instructions.map((instruction, position) => (
                <li key={position} className="flex gap-2 text-sm text-slate-200">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-quest-500/15 text-[10px] font-bold text-quest-400">
                    {position + 1}
                  </span>
                  <span className="leading-relaxed whitespace-pre-line">{instruction}</span>
                </li>
              ))}
            </ul>
            {!isFirstMission && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-abyss-700 pt-3">
                {(challenge.thinkingPrompt || lesson.conceptGuide.thinkingSteps[0]) && (
                  <p className="min-w-0 flex-1 text-xs leading-relaxed text-mage-300">
                    <strong>Trước khi gõ:</strong>{' '}
                    {challenge.thinkingPrompt ?? lesson.conceptGuide.thinkingSteps[0]?.question}
                  </p>
                )}
                <Link
                  to={`/app/lesson/${lessonId}/guide`}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-400 hover:text-mage-300"
                >
                  <Brain className="size-3.5" aria-hidden="true" />
                  Xem lại kiến thức
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ② BẢN ĐỒ LỚN — nút chạy và debug nằm ngay trên sân chơi. */}
      <section
        ref={mapRef}
        className={cn(
          'scroll-mt-20 overflow-hidden rounded-2xl border border-quest-500/35 bg-abyss-900 shadow-xl shadow-black/15 transition-shadow duration-300',
          isFirstMission && replay.isPlaying && 'shadow-[0_0_48px_rgba(34,211,238,0.2)] ring-2 ring-quest-400/30',
        )}
        aria-labelledby="game-board-heading"
      >
        <div className="flex flex-col gap-3 border-b border-abyss-700 bg-abyss-800/90 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-quest-400">
              Bước 2
            </p>
            <h2 id="game-board-heading" className="font-bold text-slate-100">
              Quan sát bản đồ
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1 rounded-lg border border-abyss-600 bg-abyss-950 p-1"
              role="group"
              aria-label="Tốc độ chạy"
            >
              <ReplayModeButton
                active={replaySpeed === 'normal'}
                onClick={() => setReplaySpeed('normal')}
                icon={<Gauge className="size-3.5" aria-hidden="true" />}
              >
                Thường
              </ReplayModeButton>
              <ReplayModeButton
                active={replaySpeed === 'fast'}
                onClick={() => setReplaySpeed('fast')}
                icon={<ChevronsRight className="size-3.5" aria-hidden="true" />}
              >
                Nhanh
              </ReplayModeButton>
              <ReplayModeButton
                active={replaySpeed === 'step'}
                onClick={() => setReplaySpeed('step')}
                icon={<Footprints className="size-3.5" aria-hidden="true" />}
              >
                Từng bước
              </ReplayModeButton>
            </div>

            {replaySpeed === 'step' && replay.total > 0 && !replay.isDone && (
              <Button
                size="sm"
                variant="secondary"
              onClick={() => {
                playSound('click');
                replay.stepForward();
              }}
                leadingIcon={<Footprints className="size-4" aria-hidden="true" />}
              >
                Bước tiếp
              </Button>
            )}

            {replay.total > 0 && !replay.isDone && (
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  replay.skipToEnd();
                }}
                className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-abyss-700 hover:text-slate-100"
                title="Tới kết quả cuối"
                aria-label="Bỏ qua hoạt ảnh, tới kết quả cuối"
              >
                <SkipForward className="size-4" aria-hidden="true" />
              </button>
            )}

            <Button
              onClick={runAndWatch}
              isLoading={session.isRunning || replay.isPlaying}
              loadingLabel={replay.isPlaying ? 'Byte đang chạy' : 'Đang chạy'}
              leadingIcon={<Play className="size-4" aria-hidden="true" />}
              className="min-w-32"
            >
              Chạy code
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'flex min-h-80 items-center bg-[radial-gradient(circle_at_50%_15%,rgba(34,211,238,0.08),transparent_58%)] p-3 sm:p-5',
            isFirstMission ? 'sm:min-h-[34rem] lg:p-7' : 'sm:min-h-[28rem]',
          )}
        >
          {challenge.world ? (
            <div className="relative w-full">
              <MapSettingsMenu
                avatarId={profile?.avatar_id ?? 'guardian-cyan'}
                account={{
                  name: profile?.full_name ?? 'Học viên ByteLand',
                  className: profile?.class_name,
                  studentCode: profile?.student_code,
                  level: profile?.level ?? 1,
                  totalXp: profile?.total_xp ?? 0,
                  gems: profile?.gem_balance ?? 0,
                }}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
                musicEnabled={musicEnabled}
                onToggleMusic={toggleMusic}
                onAvatarChange={changeAvatarOnMap}
                accountHref="/app/profile"
                accountActionLabel="Mở hồ sơ đầy đủ"
              />
              <GameStage
                spec={challenge.world}
                events={stageEvents}
                avatarId={profile?.avatar_id}
                playedCount={replay.playedCount}
                hideTitle
                presentation={isFirstMission ? 'first-mission' : challenge.kind === 'boss' ? 'boss' : 'default'}
                isPlaying={replay.isPlaying}
                motionDurationMs={replaySpeed === 'fast' ? 100 : replaySpeed === 'step' ? 220 : 280}
              />
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <ByteMascot size={72} className="mx-auto" mood="thinking" />
                <p className="mt-3 font-semibold text-slate-200">Byte đang chờ chương trình</p>
                <p className="mt-1 text-sm text-slate-500">
                  Nhiệm vụ này sẽ phản hồi qua màn hình kết quả sau khi chạy.
                </p>
              </div>
            </div>
          )}
        </div>

        {replay.total > 0 && (
          <div className="flex items-center justify-between border-t border-abyss-700 px-4 py-2 text-xs text-slate-400">
            <span aria-live="polite">
              {replay.isDone ? 'Đã chạy xong' : replay.isPlaying ? 'Đang chạy…' : 'Đang tạm dừng'}
            </span>
            <span className="font-mono tabular-nums">
              Bước {replay.playedCount}/{replay.total}
            </span>
          </div>
        )}
      </section>

      {/* ③ CODE — editor, lệnh cần dùng và công cụ nằm trong cùng một luồng. */}
      <section className="rounded-2xl border border-abyss-700 bg-abyss-900 p-4 sm:p-5">
        {editorPanel}
      </section>

      {(session.result || session.isRunning) && (
        <ResultPanel
          result={session.result}
          isRunning={session.isRunning}
          onRequestHint={requestHint}
          hintsAvailable={session.hintLevel < challenge.hints.length}
          showCleanCode={challenge.kind !== 'story'}
        />
      )}

      {session.justCompleted && (
        <VictoryPanel
          challenge={challenge}
          result={session.result}
          xpAwarded={session.xpAwarded}
          gemsAwarded={session.gemsAwarded}
          nextLabel={nextChallengeId ? 'Nhiệm vụ tiếp theo' : 'Về trang khu vực'}
          onNext={() =>
            navigate(
              nextChallengeId
                ? `/app/lesson/${lessonId}/challenge/${nextChallengeId}`
                : `/app/lesson/${lessonId}`,
            )
          }
          secondaryAction={
            nextChallengeId ? (
              <Link to={`/app/lesson/${lessonId}`}>
                <Button variant="secondary">Xem danh sách nhiệm vụ</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      <HandbookModal
        open={handbookOpen}
        onClose={() => setHandbookOpen(false)}
        upToLessonId={lessonId}
        focusCardIds={relevantHandbookCards(challenge).map((card) => card.id)}
      />
      <BadgeToast badges={session.newBadges} onDismiss={session.dismissBadges} />
    </div>
  );
}

interface ReplayModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}

function ReplayModeButton({ active, onClick, icon, children }: ReplayModeButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        playSound('click');
        onClick();
      }}
      aria-pressed={active}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition-colors',
        active
          ? 'bg-quest-500/20 text-quest-400'
          : 'text-slate-500 hover:bg-abyss-800 hover:text-slate-300',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

const FALLBACK_CHALLENGE = {
  id: '__missing__',
  lessonId: '__missing__',
  kind: 'mission' as const,
  title: '',
  story: '',
  instructions: [],
  starterCode: '',
  requiredPatterns: [],
  testCases: [],
  commonMistakes: [],
  hints: [],
  cleanCodeRules: [],
  xpReward: 0,
};

const NO_WORLD_EVENTS: never[] = [];
