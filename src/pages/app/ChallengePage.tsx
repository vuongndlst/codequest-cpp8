import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CircleGauge,
  Footprints,
  Rabbit,
  ScrollText,
  Snail,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Square,
  Target,
} from 'lucide-react';
import { getChallenge, getChallengeIds, getLesson, LESSONS } from '@/lessons';
import { relevantHandbookCards } from '@/data/challengeHandbook';
import { paletteForChallenge } from '@/data/commandPalette';
import { guidedHintsForChallenge, newGameApiForChallenge } from '@/data/challengeScaffolding';
import { useChallengeSession } from '@/hooks/useChallengeSession';
import { useLessonAccess } from '@/hooks/useLessonAccess';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { updateProfile } from '@/services/supabase/profiles.repo';
import {
  equipItem,
  fetchEquipmentCatalog,
  fetchUserEquipment,
  purchaseOrUpgradeEquipment,
} from '@/services/supabase/equipment.repo';
import type { EquipmentCatalogRow, UserEquipmentRow } from '@/types/database';
import { CodeEditor, type CodeEditorHandle } from '@/components/editor/CodeEditor';
import { ResultPanel } from '@/components/editor/ResultPanel';
import { HintPanel } from '@/components/learning/HintPanel';
import { HandbookModal } from '@/components/learning/Handbook';
import { ConceptGuideModal } from '@/components/learning/ConceptGuideModal';
import { MissionBriefingModal } from '@/components/learning/MissionBriefingModal';
import { ApiDiscoveryModal } from '@/components/learning/ApiDiscoveryModal';
import { GameStage } from '@/components/game/GameStage';
import { ZoneSceneStage } from '@/components/game/ZoneSceneStage';
import { MapSettingsMenu } from '@/components/game/MapSettingsMenu';
import { useStageReplay, type ReplaySpeed } from '@/components/game/useStageReplay';
import { VictoryPanel } from '@/components/game/VictoryPanel';
import { BadgeToast } from '@/components/game/BadgeToast';
import { Button } from '@/components/ui/Button';
import { ErrorState, NoAccessState, SaveIndicator, LoadingState } from '@/components/common/StateViews';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { cn } from '@/utils/cn';
import { isChallengeUnlocked } from '@/utils/progression';
import { playSound, setGameMusicActive, setGameMusicScene } from '@/services/audio';

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

const REPLAY_SPEED_LABELS: Record<ReplaySpeed, string> = {
  slow: 'Chậm',
  normal: 'Thường',
  fast: 'Nhanh',
  step: 'Từng bước · Debug',
};

const REPLAY_SPEED_ICONS: Record<ReplaySpeed, ReactNode> = {
  slow: <Snail className="size-4" aria-hidden="true" />,
  normal: <CircleGauge className="size-4" aria-hidden="true" />,
  fast: <Rabbit className="size-4" aria-hidden="true" />,
  step: <Footprints className="size-4" aria-hidden="true" />,
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
interface ChallengePageProps {
  lessonIdOverride?: string;
  challengeIdOverride?: string;
  persist?: boolean;
  demo?: boolean;
}

export function ChallengePage({
  lessonIdOverride,
  challengeIdOverride,
  persist = true,
  demo = false,
}: ChallengePageProps = {}) {
  const params = useParams();
  const lessonId = lessonIdOverride ?? params.lessonId ?? '';
  const challengeId = challengeIdOverride ?? params.challengeId ?? '';
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const setProfile = useAuthStore((state) => state.setProfile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const soundEnabled = useUiStore((state) => state.soundEnabled);
  const toggleSound = useUiStore((state) => state.toggleSound);
  const musicEnabled = useUiStore((state) => state.musicEnabled);
  const toggleMusic = useUiStore((state) => state.toggleMusic);

  const [handbookOpen, setHandbookOpen] = useState(false);
  const [conceptGuideOpen, setConceptGuideOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(true);
  const [missionAcknowledged, setMissionAcknowledged] = useState(false);
  const [apiIntroOpen, setApiIntroOpen] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>('normal');
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogRow[]>([]);
  const [userEquipment, setUserEquipment] = useState<UserEquipmentRow[]>([]);
  const [equipmentBusyId, setEquipmentBusyId] = useState<string | null>(null);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);
  const editorRef = useRef<CodeEditorHandle>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  const lesson = getLesson(lessonId);
  const challenge = getChallenge(lessonId, challengeId);
  const relevantCommands = useMemo(
    () => challenge ? paletteForChallenge(challenge) : [],
    [challenge],
  );
  const learningChallenge = useMemo(
    () => challenge ? { ...challenge, hints: guidedHintsForChallenge(challenge) } : FALLBACK_CHALLENGE,
    [challenge],
  );
  const newApiCommands = useMemo(
    () => challenge ? newGameApiForChallenge(challenge) : [],
    [challenge],
  );
  const access = useLessonAccess(lessonId, { disabled: demo });
  const session = useChallengeSession({
    challenge: learningChallenge,
    persist,
    onProgressChange: access.applyProgress,
  });

  const stageEvents = session.result?.worldEvents ?? NO_WORLD_EVENTS;
  const replay = useStageReplay(stageEvents, session.playKey, replaySpeed);
  const currentStageEvent = replay.playedCount > 0
    ? stageEvents[Math.min(replay.playedCount - 1, stageEvents.length - 1)]
    : null;

  // Nhạc chỉ thuộc về sân chơi. Rời route nhiệm vụ phải dừng ngay nhưng vẫn
  // giữ lựa chọn của học sinh để lần sau vào game có thể phát lại.
  useEffect(() => {
    if (access.isLoading || !access.isUnlocked) return;
    setGameMusicScene(lessonId, challengeId, challenge?.kind === 'boss');
    setGameMusicActive(true);
    return () => setGameMusicActive(false);
  }, [access.isLoading, access.isUnlocked, challenge?.kind, challengeId, lessonId]);

  useEffect(() => {
    if (!user) {
      setEquipmentCatalog([]);
      setUserEquipment([]);
      return;
    }

    let cancelled = false;
    void Promise.all([fetchEquipmentCatalog(), fetchUserEquipment(user.id)])
      .then(([catalog, owned]) => {
        if (cancelled) return;
        setEquipmentCatalog(catalog);
        setUserEquipment(owned);
        setEquipmentError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) setEquipmentError(error instanceof Error ? error.message : 'Chưa tải được kho trang bị.');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!isEditorExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsEditorExpanded(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isEditorExpanded]);

  useEffect(() => {
    setMissionAcknowledged(false);
    setMissionOpen(true);
    setApiIntroOpen(false);
  }, [challengeId]);

  useEffect(() => {
    if (!speedMenuOpen) return;
    const closeSpeedMenu = (event: PointerEvent) => {
      if (!speedMenuRef.current?.contains(event.target as Node)) setSpeedMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSpeedMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeSpeedMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeSpeedMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [speedMenuOpen]);

  if (!lesson || !challenge) return <NotFoundPage />;
  if (access.isLoading) return <LoadingState label="Đang kiểm tra tiến độ lớp…" />;
  if (access.error) return <ErrorState description={access.error} onRetry={() => window.location.reload()} />;
  if (!access.isUnlocked) {
    return (
      <NoAccessState
        description={access.control?.access_mode === 'locked'
          ? 'Giáo viên đang tạm khóa khu vực này để cả lớp học cùng nhịp. Em có thể luyện lại những nhiệm vụ đã mở.'
          : 'Em cần hoàn thành khu vực trước để mở nhiệm vụ này.'}
      />
    );
  }

  const challengeIds = getChallengeIds(lessonId);
  const index = challengeIds.indexOf(challenge.id);
  const completedChallenges = access.progressByLesson[lessonId]?.completed_challenges ?? [];
  const challengeUnlocked = demo || !user || isChallengeUnlocked(
    index,
    challengeIds,
    completedChallenges,
    challenge.optional ?? false,
    profile?.role === 'teacher',
  );
  if (!challengeUnlocked) {
    return <NoAccessState description="Em hoàn thành nhiệm vụ ngay trước đó để mở màn này nhé." />;
  }
  const nextChallengeId = challengeIds[index + 1];
  const nextChallenge = nextChallengeId ? getChallenge(lessonId, nextChallengeId) : undefined;
  const nextLesson = LESSONS.find((item) => item.order === lesson.order + 1);
  const nextDemoChallengeId = nextChallengeId ?? nextLesson?.challenges[0]?.id;
  const nextDemoLessonId = nextChallengeId ? lessonId : nextLesson?.id;
  const equippedRow = userEquipment.find((item) => item.equipped);
  const equippedItem = equippedRow
    ? { id: equippedRow.equipment_id, level: equippedRow.level }
    : null;
  const requiredTests = challenge.testCases.filter((test) => test.visible && test.required);
  const passedTestIds = new Set(
    session.result?.testResults.filter((test) => test.passed).map((test) => test.id) ?? [],
  );
  const passedRequiredCount = requiredTests.filter((test) => passedTestIds.has(test.id)).length;
  const hasStartedRun = session.isRunning || session.result !== null || replay.total > 0;

  /** Chạy từ editor thì tự đưa mắt học sinh trở lại bản đồ để xem nhân vật. */
  const runAndWatch = () => {
    playSound('click');
    setHintOpen(false);
    if (isEditorExpanded) setIsEditorExpanded(false);
    // Desktop kiểu CodeCombat đã cho map và editor cùng hiện một lúc. Tự cuộn
    // map lên đầu ở đây sẽ đẩy header/nhiệm vụ xuống dưới TopBar — chính là lỗi
    // giao diện bị "cắt đầu" khi chạy trên Chrome fullscreen. Mobile vẫn cần
    // đưa mắt học sinh từ editor trở lại map để quan sát animation.
    const desktopWorkspace = window.matchMedia?.('(min-width: 1024px)').matches ?? false;
    const desktopScrollY = window.scrollY;
    if (!desktopWorkspace) {
      window.requestAnimationFrame(() => {
        mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    void Promise.resolve(session.run()).finally(() => {
      if (desktopWorkspace) {
        window.requestAnimationFrame(() => window.scrollTo(0, desktopScrollY));
      }
    });
  };

  const changeAvatarOnMap = async (avatarId: string) => {
    if (!profile) return;
    const updated = await updateProfile(profile.id, { avatar_id: avatarId });
    setProfile(updated);
  };

  const buyOrUpgradeEquipment = async (equipmentId: string) => {
    setEquipmentBusyId(equipmentId);
    setEquipmentError(null);
    try {
      const wasOwned = userEquipment.some((item) => item.equipment_id === equipmentId);
      const purchased = await purchaseOrUpgradeEquipment(equipmentId);
      // RPC mua mới có thể tự đánh dấu trang bị. Gọi equip một lần để database đảm bảo
      // chỉ có đúng một vật phẩm đang dùng, kể cả với tài khoản được tạo từ migration cũ.
      const updated = !wasOwned && purchased.equipped ? await equipItem(equipmentId) : purchased;
      setUserEquipment((items) => {
        const exists = items.some((item) => item.equipment_id === equipmentId);
        return exists
          ? items.map((item) => (item.equipment_id === equipmentId ? updated : item))
          : [...items, updated];
      });
      await refreshProfile();
      playSound('gem');
    } catch (error) {
      setEquipmentError(error instanceof Error ? error.message : 'Chưa nâng cấp được trang bị.');
    } finally {
      setEquipmentBusyId(null);
    }
  };

  const equipEquipment = async (equipmentId: string) => {
    setEquipmentBusyId(equipmentId);
    setEquipmentError(null);
    try {
      const updated = await equipItem(equipmentId);
      setUserEquipment((items) =>
        items.map((item) => ({
          ...item,
          equipped: item.equipment_id === updated.equipment_id,
          updated_at: item.equipment_id === updated.equipment_id ? updated.updated_at : item.updated_at,
        })),
      );
      playSound('click');
    } catch (error) {
      setEquipmentError(error instanceof Error ? error.message : 'Chưa trang bị được vật phẩm.');
    } finally {
      setEquipmentBusyId(null);
    }
  };

  const editorPanel = (
    <section className="space-y-3" aria-labelledby="code-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-quest-400">
            Code điều khiển Byte
          </p>
          <h2 id="code-heading" className="text-lg font-bold text-slate-100">
            Chương trình của em
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
          commands={relevantCommands}
          highlightedLines={session.highlightedLines}
          minHeight={isEditorExpanded ? 'calc(100vh - 220px)' : '220px'}
          ariaLabel={`Vùng viết code cho nhiệm vụ ${challenge.title}`}
        />
      )}

    </section>
  );

  const runControls = (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      <ToolIconButton
        onClick={() => {
          if (window.confirm('Khôi phục code ban đầu? Bản code hiện tại sẽ được thay thế.')) session.reset();
        }}
        label="Khôi phục code"
        icon={<RotateCcw className="size-4" aria-hidden="true" />}
      />
      <ToolIconButton
        onClick={() => setHandbookOpen(true)}
        label="Tra lệnh"
        icon={<BookOpen className="size-4" aria-hidden="true" />}
      />
      <HintPanel
        hints={learningChallenge.hints}
        unlockedLevel={session.hintLevel}
        onUnlock={session.unlockNextHint}
        solution={challenge.solution}
        canViewSolution={session.canViewSolution}
        onViewSolution={session.showSolution}
        solutionVisible={session.solutionVisible}
        attemptCount={session.attemptCount}
        open={hintOpen}
        onOpenChange={setHintOpen}
        iconOnly
      />

      <div ref={speedMenuRef} className="relative shrink-0">
        <ToolIconButton
          onClick={() => setSpeedMenuOpen((open) => !open)}
          label={`Cách chạy: ${REPLAY_SPEED_LABELS[replaySpeed]}`}
          icon={REPLAY_SPEED_ICONS[replaySpeed]}
          active={speedMenuOpen}
          ariaExpanded={speedMenuOpen}
        />
        {speedMenuOpen && (
          <div className="absolute bottom-full left-0 z-40 mb-2 w-52 overflow-hidden rounded-2xl border border-abyss-600 bg-abyss-900 p-2 shadow-2xl shadow-black/35" role="menu" aria-label="Chọn cách chạy">
            {(Object.entries(REPLAY_SPEED_LABELS) as Array<[ReplaySpeed, string]>).map(([speed, label]) => (
              <button
                key={speed}
                type="button"
                role="menuitemradio"
                aria-checked={replaySpeed === speed}
                onClick={() => {
                  playSound('click');
                  setReplaySpeed(speed);
                  setSpeedMenuOpen(false);
                }}
                className={cn(
                  'flex h-10 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-sm font-semibold transition-colors',
                  replaySpeed === speed ? 'bg-quest-500/15 text-quest-300' : 'text-slate-300 hover:bg-abyss-700 hover:text-white',
                )}
              >
                <span className="flex items-center gap-2.5">
                  {REPLAY_SPEED_ICONS[speed]}
                  {label}
                </span>
                {replaySpeed === speed && <span className="size-2 rounded-full bg-quest-300" aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <ToolIconButton
        onClick={() => setMissionOpen(true)}
        label="Xem nhiệm vụ"
        icon={<ScrollText className="size-4" aria-hidden="true" />}
      />
      <ToolIconButton
        onClick={() => setConceptGuideOpen(true)}
        label="Xem lại kiến thức"
        icon={<Brain className="size-4" aria-hidden="true" />}
      />

      {replaySpeed === 'step' && replay.total > 0 && !replay.isDone && (
        <ToolIconButton
          onClick={() => {
            replay.stepForward();
          }}
          label="Chạy bước tiếp theo"
          icon={<Footprints className="size-4" aria-hidden="true" />}
        />
      )}

      {replaySpeed !== 'step' && replay.total > 0 && !replay.isDone && (
        <ToolIconButton
          onClick={() => {
            replay.isPaused ? replay.resume() : replay.stop();
          }}
          label={replay.isPaused ? 'Tiếp tục hoạt ảnh' : 'Dừng hoạt ảnh'}
          icon={replay.isPaused ? <Play className="size-4" /> : <Square className="size-4" />}
        />
      )}

      <Button
        onClick={runAndWatch}
        isLoading={session.isRunning || replay.isPlaying}
        loadingLabel={replay.isPlaying ? 'Byte đang chạy' : 'Đang chạy'}
        leadingIcon={<Play className="size-4" aria-hidden="true" />}
        className="ml-auto min-w-28 shrink-0 cursor-pointer px-4 sm:min-w-32"
      >
        Chạy code
      </Button>
    </div>
  );

  if (isEditorExpanded) {
    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-abyss-950 p-4">
        <div className="mx-auto max-w-5xl">{editorPanel}</div>
        {(session.result || session.isRunning) && (
          <div className="mx-auto mt-4 max-w-5xl">
            <ResultPanel
              result={session.result}
              isRunning={session.isRunning}
              showCleanCode={challenge.kind !== 'story'}
              expectsOutput={challenge.testCases.some((test) => test.kind === 'output')}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[118rem] space-y-1">
      <Link
        to={demo ? '/' : `/app/lesson/${lessonId}`}
        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {demo ? 'Về trang giới thiệu' : `Trở về ${lesson.zoneName}`}
      </Link>

      <section
        className="overflow-hidden rounded-2xl border border-quest-500/35 bg-abyss-900 shadow-2xl shadow-black/20"
        aria-label={`Không gian nhiệm vụ ${challenge.title}`}
      >
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-abyss-700 bg-abyss-800/95 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-quest-500/15 text-quest-300">
              <Target className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-quest-400">
                {lesson.zoneName} · Nhiệm vụ {index + 1}/{challengeIds.length}
              </p>
              <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'hidden rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex',
                challenge.kind === 'boss'
                  ? 'bg-alert-500/15 text-alert-400'
                  : challenge.kind === 'debug'
                    ? 'bg-treasure-400/15 text-treasure-300'
                    : 'bg-quest-500/15 text-quest-400',
              )}
            >
              {KIND_LABELS[challenge.kind] ?? challenge.kind}
            </span>
                <h1 className="truncate text-sm font-extrabold text-slate-100 sm:text-base">{challenge.title}</h1>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMissionOpen(true)}
            className="cursor-pointer rounded-lg border border-abyss-600 bg-abyss-950 px-2.5 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:border-quest-400/50 hover:text-quest-300"
            title="Xem nhiệm vụ và điều kiện hoàn thành"
          >
            Mục tiêu {session.result?.passedRequired ?? 0}/{session.result?.totalRequired ?? challenge.testCases.filter((test) => test.required).length}
          </button>
        </header>

      <div className="lg:grid lg:h-[calc(100dvh-9rem)] lg:min-h-[34rem] lg:grid-cols-[minmax(38rem,1.45fr)_minmax(28rem,.8fr)] lg:grid-rows-[minmax(0,1fr)]">

      {/* ② BẢN ĐỒ LỚN — nút chạy và debug nằm ngay trên sân chơi. */}
      <section
        ref={mapRef}
        className={cn(
          'scroll-mt-20 flex min-h-[25rem] flex-col overflow-hidden border-b border-abyss-700 bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,0.1),transparent_60%)] transition-shadow duration-300 lg:col-start-1 lg:row-start-1 lg:min-h-0 lg:border-r',
          replay.isPlaying && 'shadow-[0_0_48px_rgba(34,211,238,0.2)] ring-2 ring-quest-400/30',
        )}
        aria-label="Bản đồ trò chơi"
        data-testid="map-workspace"
      >
        <div
          className={cn(
            'cq-game-host relative flex min-h-80 flex-1 items-center justify-center overflow-hidden lg:min-h-0',
          )}
        >
          {challenge.world ? (
            <div className="cq-game-canvas relative h-full w-full" data-testid="game-canvas">
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
                accountHref={demo ? '/auth/register' : '/app/profile'}
                accountActionLabel={demo ? 'Tạo tài khoản miễn phí' : 'Mở hồ sơ đầy đủ'}
                showEquipment={lesson.order >= 2 || challenge.kind === 'boss'}
                equipmentCatalog={equipmentCatalog}
                userEquipment={userEquipment}
                equipmentBusyId={equipmentBusyId}
                equipmentError={equipmentError}
                currentLessonOrder={lesson.order}
                onBuyOrUpgrade={buyOrUpgradeEquipment}
                onEquip={equipEquipment}
                compact
              />
              <GameStage
                spec={challenge.world}
                events={stageEvents}
                avatarId={profile?.avatar_id}
                playedCount={replay.playedCount}
                hideTitle
                presentation={challenge.kind === 'boss' ? 'boss' : 'default'}
                isPlaying={replay.isPlaying}
                motionDurationMs={replaySpeed === 'slow' ? 900 : replaySpeed === 'fast' ? 140 : replaySpeed === 'step' ? 380 : 560}
                lessonId={lesson.id}
                equippedItem={equippedItem}
              />
            </div>
          ) : (
            <ZoneSceneStage
              lessonId={lesson.id}
              challengeKind={challenge.kind}
              challengeTitle={challenge.title}
              events={stageEvents}
              playedCount={replay.playedCount}
              avatarId={profile?.avatar_id}
              isPlaying={replay.isPlaying}
            />
          )}
        <div className="absolute inset-x-0 bottom-0 z-20 border-t-2 border-cyan-400/70 bg-[#07152f]/95 px-3 py-2.5 text-white shadow-[0_-6px_22px_rgba(6,182,212,.2)] backdrop-blur-sm" data-testid="stage-status-bar">
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <span className="inline-flex shrink-0 items-center gap-2 font-extrabold" aria-live="polite">
              <span className={cn('size-2.5 rounded-full', !hasStartedRun ? 'bg-quest-300' : replay.isDone ? 'bg-emerald-400' : session.isRunning || replay.isPlaying ? 'animate-pulse bg-cyan-300' : 'bg-amber-300')} aria-hidden="true" />
              {!hasStartedRun ? 'Nhiệm vụ' : session.isRunning ? 'Đang kiểm tra…' : replay.isDone || (session.result?.isCorrect && replay.total === 0) ? 'Đã chạy xong' : replay.isPlaying ? 'Đang chạy…' : 'Đang tạm dừng'}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-cyan-50" aria-live="polite">
              {!hasStartedRun
                ? challenge.story
                : session.isRunning && replay.total === 0
                  ? 'Byte đang đọc và chuẩn bị thực hiện từng lệnh.'
                  : session.result && replay.total === 0
                    ? session.result.isCorrect
                      ? 'Chương trình đã đạt tất cả mục tiêu.'
                      : session.result.diagnostics[0]?.message ?? 'Xem phản hồi dưới editor rồi sửa một chỗ.'
                : currentStageEvent
                  ? `→ ${currentStageEvent.message}`
                  : '→ Byte đang ở vị trí xuất phát. Bấm Bước tiếp để quan sát từng lệnh.'}
            </span>
            <span className="shrink-0 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-cyan-100">
              {replay.total === 0 ? `${passedRequiredCount}/${requiredTests.length} mục tiêu` : `${replay.playedCount}/${replay.total} bước`}
            </span>
          </div>
        </div>
        </div>
      </section>

      {/* ③ CODE — editor, lệnh cần dùng và công cụ nằm trong cùng một luồng. */}
      <section className="min-w-0 bg-abyss-900 p-3 sm:p-4 lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto" data-testid="editor-workspace">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col">
          {editorPanel}
          <section
            className="mt-3 shrink-0 overflow-visible border-t border-quest-500/25 bg-abyss-800/70 px-2 py-2.5 lg:rounded-xl lg:border"
            aria-label="Điều khiển chạy chương trình"
            data-testid="run-control-bar"
          >
            {runControls}
          </section>
          {(session.result || session.isRunning) && (
            <div className="mt-3" data-testid="inline-result-panel">
              <ResultPanel
                result={session.result}
                isRunning={session.isRunning}
                showCleanCode={challenge.kind !== 'story'}
                expectsOutput={challenge.testCases.some((test) => test.kind === 'output')}
              />
            </div>
          )}
        </div>
      </section>
      </div>
      </section>

      {session.justCompleted && (replay.total === 0 || replay.isDone) && (
        <VictoryPanel
          challenge={challenge}
          result={session.result}
          xpAwarded={session.xpAwarded}
          gemsAwarded={session.gemsAwarded}
          totalXp={demo ? session.xpAwarded : profile?.total_xp}
          gemBalance={demo ? session.gemsAwarded : profile?.gem_balance}
          nextTitle={nextChallenge?.title ?? (demo ? nextLesson?.challenges[0]?.title : 'Checkpoint cuối khu vực')}
          nextLabel="Tiếp tục"
          onNext={() =>
            navigate(demo
              ? nextDemoChallengeId && nextDemoLessonId
                ? `/demo?lesson=${nextDemoLessonId}&challenge=${nextDemoChallengeId}`
                : '/'
              : nextChallengeId
                ? `/app/lesson/${lessonId}/challenge/${nextChallengeId}`
                : `/app/lesson/${lessonId}/exit-ticket`)
          }
        />
      )}

      <HandbookModal
        open={handbookOpen}
        onClose={() => setHandbookOpen(false)}
        upToLessonId={lessonId}
        focusCardIds={relevantHandbookCards(challenge).map((card) => card.id)}
      />
      <ConceptGuideModal
        open={conceptGuideOpen}
        onClose={() => setConceptGuideOpen(false)}
        title={lesson.title}
        guide={lesson.conceptGuide}
      />
      <MissionBriefingModal
        open={missionOpen}
        challenge={challenge}
        zoneName={lesson.zoneName}
        position={index + 1}
        total={challengeIds.length}
        kindLabel={KIND_LABELS[challenge.kind] ?? challenge.kind}
        passedTestIds={passedTestIds}
        acknowledged={missionAcknowledged}
        actionLabel={!missionAcknowledged && newApiCommands.length > 0 ? 'Đã hiểu · Xem API mới' : undefined}
        onClose={() => {
          playSound('click');
          const shouldIntroduceApi = !missionAcknowledged && newApiCommands.length > 0;
          setMissionAcknowledged(true);
          setMissionOpen(false);
          setApiIntroOpen(shouldIntroduceApi);
        }}
      />
      <ApiDiscoveryModal
        open={apiIntroOpen}
        commands={newApiCommands}
        onClose={() => {
          playSound('click');
          setApiIntroOpen(false);
        }}
      />
      <BadgeToast badges={session.newBadges} onDismiss={session.dismissBadges} />
    </div>
  );
}

interface ToolIconButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  ariaExpanded?: boolean;
}

function ToolIconButton({ label, icon, onClick, active = false, ariaExpanded }: ToolIconButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        playSound('click');
        onClick();
      }}
      aria-label={label}
      aria-expanded={ariaExpanded}
      title={label}
      className={cn(
        'group/tool relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border transition-all',
        'hover:-translate-y-0.5 hover:border-quest-400/55 hover:bg-quest-500/12 hover:text-quest-300 hover:shadow-[0_0_18px_rgba(34,211,238,.2)]',
        active
          ? 'border-quest-400/60 bg-quest-500/15 text-quest-300 shadow-[0_0_18px_rgba(34,211,238,.2)]'
          : 'border-abyss-600 bg-abyss-950 text-slate-400',
      )}
    >
      {icon}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover/tool:opacity-100 group-focus-visible/tool:opacity-100">
        {label}
      </span>
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
