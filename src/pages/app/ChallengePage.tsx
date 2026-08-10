import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlignLeft,
  ArrowLeft,
  BookOpen,
  Brain,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Target,
} from 'lucide-react';
import { getChallenge, getChallengeIds, getLesson } from '@/lessons';
import { relevantHandbookCards } from '@/data/challengeHandbook';
import { useChallengeSession } from '@/hooks/useChallengeSession';
import { useAuthStore } from '@/stores/authStore';
import { CodeEditor, type CodeEditorHandle } from '@/components/editor/CodeEditor';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { paletteForChallenge } from '@/data/commandPalette';
import { ResultPanel } from '@/components/editor/ResultPanel';
import { HintPanel } from '@/components/learning/HintPanel';
import { HandbookModal } from '@/components/learning/Handbook';
import { ThinkingPrompt } from '@/components/learning/ConceptGuidePanel';
import { GameStage } from '@/components/game/GameStage';
import { ByteMascot } from '@/components/game/ByteMascot';
import { VictoryPanel } from '@/components/game/VictoryPanel';
import { BadgeToast } from '@/components/game/BadgeToast';
import { Button } from '@/components/ui/Button';
import { SaveIndicator, LoadingState } from '@/components/common/StateViews';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { cn } from '@/utils/cn';

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

export function ChallengePage() {
  const { lessonId = '', challengeId = '' } = useParams();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);

  const [handbookOpen, setHandbookOpen] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const editorRef = useRef<CodeEditorHandle>(null);

  const lesson = getLesson(lessonId);
  const challenge = getChallenge(lessonId, challengeId);

  const session = useChallengeSession({
    challenge: challenge ?? FALLBACK_CHALLENGE,
    persist: true,
  });

  // Esc để thoát chế độ phóng to editor
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

  const editorPanel = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-200">Code của em</h2>
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

      <CommandPalette
        commands={paletteForChallenge(challenge)}
        onInsert={(snippet) => editorRef.current?.insert(snippet)}
      />

      {session.isRestoring ? (
        <LoadingState label="Đang mở lại code em viết dở…" />
      ) : (
        <CodeEditor
          handleRef={editorRef}
          value={session.code}
          onChange={session.setCode}
          highlightedLines={session.highlightedLines}
          minHeight={isEditorExpanded ? 'calc(100vh - 220px)' : '340px'}
          ariaLabel={`Vùng viết code cho nhiệm vụ ${challenge.title}`}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => void session.run()}
          isLoading={session.isRunning}
          loadingLabel="Đang chạy"
          leadingIcon={<Play className="size-4" aria-hidden="true" />}
        >
          Chạy code
        </Button>
        {/*
          Nút dọn thụt lề. Không có nó thì học sinh có code lộn xộn sẽ bị Clean
          Code Coach nhắc mãi mà không biết sửa bằng cách nào.
        */}
        <Button
          variant="secondary"
          onClick={() => editorRef.current?.format()}
          title="Phím tắt: Shift + Alt + F"
          leadingIcon={<AlignLeft className="size-4" aria-hidden="true" />}
        >
          Thụt lề lại
        </Button>
        <Button
          variant="secondary"
          onClick={session.reset}
          leadingIcon={<RotateCcw className="size-4" aria-hidden="true" />}
        >
          Đặt lại
        </Button>
        <Button
          variant="secondary"
          onClick={() => setHandbookOpen(true)}
          leadingIcon={<BookOpen className="size-4" aria-hidden="true" />}
        >
          Tra lệnh
        </Button>
      </div>
    </div>
  );

  if (isEditorExpanded) {
    return (
      <div className="fixed inset-0 z-40 bg-abyss-950 p-4 overflow-y-auto">
        <div className="mx-auto max-w-5xl">{editorPanel}</div>
        <div className="mx-auto max-w-5xl mt-4">
          <ResultPanel
            result={session.result}
            isRunning={session.isRunning}
            onRequestHint={() => {
              setIsEditorExpanded(false);
              session.unlockNextHint();
            }}
            hintsAvailable={session.hintLevel < challenge.hints.length}
            showCleanCode={challenge.kind !== 'story'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* --- Thanh điều hướng nhiệm vụ --- */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to={`/app/lesson/${lessonId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {lesson.zoneName}
        </Link>

        <p className="text-xs text-slate-500">
          Nhiệm vụ {index + 1}/{challengeIds.length}
        </p>
      </div>

      <div className="flex items-start gap-3 flex-wrap">
        <span
          className={cn(
            'px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide',
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

      {/*
        BỐ CỤC HAI CỘT — sắp lại tháng 8/2026.

        Trước đây bảng gợi ý nằm cuối cột TRÁI, dưới đề bài và sân khấu game,
        còn ô viết code ở cột PHẢI. Học sinh đang gõ dở mà cần gợi ý thì phải
        cuộn xuống, liếc sang trái, đọc, rồi cuộn ngược lên tìm lại chỗ đang
        viết. Thầy Vương phản ánh đúng chỗ này.

        Nay chia theo VIỆC chứ không theo loại nội dung:
          · Cột trái  = đọc hiểu đề  (đứng yên khi cuộn, không cần đọc lại)
          · Cột phải  = chỗ làm việc (viết → chạy → xem kết quả → xem gợi ý)

        Sân khấu game cũng chuyển sang phải: nó là KẾT QUẢ của việc chạy code,
        nên phải nằm cạnh nút Chạy, không nằm lẫn trong phần đề bài.
      */}
      <div className="grid lg:grid-cols-5 gap-4 items-start">
        {/* ============ CỘT TRÁI — ĐỀ BÀI ============ */}
        <div
          className={cn(
            // `min-w-0`: o luoi mac dinh la `min-width: auto` nen KHONG co
            // lai duoc duoi kich thuoc noi dung — ban do rong hon cot la ca
            // TRANG keo ngang duoc tren dien thoai.
            'lg:col-span-2 min-w-0 space-y-4',
            // Đề bài dính theo màn hình để em không phải cuộn ngược lên đọc lại.
            // Chiều cao giới hạn theo khung nhìn, trừ chiều cao thanh trên cùng.
            'lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1',
          )}
        >
          {/* Tình huống */}
          <section className="cq-panel p-4" aria-labelledby="story-heading">
            <h2 id="story-heading" className="sr-only">
              Tình huống
            </h2>
            <div className="flex gap-3">
              <ByteMascot size={44} animated={false} />
              <p className="text-sm text-slate-300 leading-relaxed">{challenge.story}</p>
            </div>
          </section>

          {/* Vì sao nhiệm vụ này đáng làm */}
          {challenge.whyThisMatters && (
            <section className="cq-panel p-4 border-verdant-500/30">
              <h2 className="flex items-center gap-2 text-sm font-bold text-verdant-400 mb-1.5">
                <Target className="size-4" aria-hidden="true" />
                Nhiệm vụ này rèn cho em điều gì
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">{challenge.whyThisMatters}</p>
            </section>
          )}

          {/* Nhắc tư duy — hiện TRƯỚC phần yêu cầu, để học sinh nghĩ trước khi gõ */}
          <ThinkingPrompt
            challengePrompt={challenge.thinkingPrompt}
            guide={lesson.conceptGuide}
          />

          {/* Yêu cầu */}
          <section className="cq-panel p-4" aria-labelledby="instructions-heading">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 id="instructions-heading" className="text-sm font-bold text-slate-200">
                Yêu cầu
              </h2>
              <Link
                to={`/app/lesson/${lessonId}/guide`}
                className="inline-flex items-center gap-1 text-xs text-mage-300 hover:text-mage-400"
              >
                <Brain className="size-3.5" aria-hidden="true" />
                Học kiến thức
              </Link>
            </div>
            <ul className="space-y-1.5">
              {challenge.instructions.map((instruction, position) => (
                <li key={position} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-quest-400 shrink-0" aria-hidden="true">
                    ·
                  </span>
                  <span className="leading-relaxed whitespace-pre-line">{instruction}</span>
                </li>
              ))}
            </ul>
          </section>

        </div>

        {/* ============ CỘT PHẢI — CHỖ LÀM VIỆC ============ */}
        <div className="lg:col-span-3 min-w-0 space-y-4">
          {/* Sân khấu game: nằm trên ô code để em nhìn thấy ngay khi bấm Chạy */}
          {challenge.world && (
            <GameStage
              spec={challenge.world}
              events={session.result?.worldEvents ?? []}
              avatarId={profile?.avatar_id}
              playKey={session.playKey}
            />
          )}

          {editorPanel}

          <ResultPanel
            result={session.result}
            isRunning={session.isRunning}
            onRequestHint={session.unlockNextHint}
            hintsAvailable={session.hintLevel < challenge.hints.length}
            showCleanCode={challenge.kind !== 'story'}
          />

          {/* Gợi ý — ngay dưới kết quả chạy, đúng lúc em cần tới nó nhất */}
          <HintPanel
            hints={challenge.hints}
            unlockedLevel={session.hintLevel}
            onUnlock={session.unlockNextHint}
            solution={challenge.solution}
            canViewSolution={session.canViewSolution}
            onViewSolution={session.showSolution}
            solutionVisible={session.solutionVisible}
            attemptCount={session.attemptCount}
          />

          {/* Hoàn thành -> mời sang nhiệm vụ tiếp theo */}
          {session.justCompleted && (
            <VictoryPanel
              challenge={challenge}
              result={session.result}
              xpAwarded={session.xpAwarded}
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
        </div>
      </div>

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

/** Challenge rỗng để hook luôn được gọi đúng số lần, kể cả khi route sai. */
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
