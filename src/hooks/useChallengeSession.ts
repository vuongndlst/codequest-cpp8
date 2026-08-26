import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Challenge } from '@/types/content';
import type { RunResult } from '@/types/runner';
import { getCodeRunner } from '@/services/runner/localRunner';
import { useAuthStore } from '@/stores/authStore';
import { useAutoSave, readLocalDraft } from './useAutoSave';
import { fetchDraft } from '@/services/supabase/drafts.repo';
import { countAttempts } from '@/services/supabase/attempts.repo';
import { logActivityEvent } from '@/services/supabase/gamification.repo';
import {
  fetchBadgesByCodes,
  submitChallengeRun,
  type SubmitChallengeRunResult,
} from '@/services/supabase/authoritative.repo';
import { runOrQueue } from '@/services/offlineQueue';
import { getRequiredChallengeIds } from '@/lessons';
import { calculateLessonPercent } from '@/utils/progression';
import type { BadgeRow, LessonProgressRow } from '@/types/database';

/**
 * Điều phối một phiên làm nhiệm vụ: code, chạy, gợi ý, lưu, ghi tiến trình.
 *
 * Gom vào một hook để trang ChallengePage chỉ lo phần hiển thị, và để logic
 * này dùng lại được cho cả chế độ Demo (không đăng nhập).
 */

/** Số lần thử tối thiểu trước khi mở đáp án mẫu, khi giáo viên chưa bật quyền xem. */
const ATTEMPTS_BEFORE_SOLUTION = 6;

interface UseChallengeSessionOptions {
  challenge: Challenge;
  /** false ở chế độ Demo — không ghi gì lên database */
  persist: boolean;
  /** Giáo viên bật quyền xem đáp án cho lớp */
  allowSolutionView?: boolean;
  /** Đẩy tiến trình vừa lưu vào lớp kiểm tra quyền trước khi cho chuyển màn. */
  onProgressChange?: (progress: LessonProgressRow) => void;
  /** Snapshot dùng để mở màn kế tiếp ngay cả khi Wi-Fi vừa rớt. */
  currentProgress?: LessonProgressRow | null;
}

export function useChallengeSession({
  challenge,
  persist,
  allowSolutionView = false,
  onProgressChange,
  currentProgress = null,
}: UseChallengeSessionOptions) {
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const userId = persist ? (user?.id ?? null) : null;

  const [code, setCode] = useState(challenge.starterCode);
  const [isRestoring, setIsRestoring] = useState(true);
  const [result, setResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [gemsAwarded, setGemsAwarded] = useState(0);
  const [newBadges, setNewBadges] = useState<BadgeRow[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  const { saveState, flush, markSaved } = useAutoSave({
    userId,
    lessonId: challenge.lessonId,
    challengeId: challenge.id,
    code,
    enabled: persist && Boolean(user),
  });

  const runnerRef = useRef(getCodeRunner());

  // --- Khôi phục code đang làm dở ---------------------------------------
  useEffect(() => {
    let cancelled = false;
    setIsRestoring(true);
    setResult(null);
    setHintLevel(0);
    setSolutionVisible(false);
    setJustCompleted(false);
    setXpAwarded(0);
    setGemsAwarded(0);
    setSyncError(null);
    setPendingSync(false);

    void (async () => {
      const local = readLocalDraft(userId, challenge.id);
      let restored = local?.code ?? null;

      if (persist && user) {
        try {
          const remote = await fetchDraft(user.id, challenge.id);
          // Bản nào mới hơn thì dùng bản đó — không im lặng ghi đè công sức học sinh
          if (remote && (!local || remote.updatedAt > local.updatedAt)) {
            restored = remote.code;
          }
        } catch {
          // Không tải được bản trên máy chủ -> dùng bản localStorage
        }

        try {
          const count = await countAttempts(user.id, challenge.id);
          if (!cancelled) setAttemptCount(count);
        } catch {
          /* bỏ qua */
        }
      }

      if (cancelled) return;

      const nextCode = restored && restored.trim().length > 0 ? restored : challenge.starterCode;
      setCode(nextCode);
      markSaved(nextCode);
      setIsRestoring(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [challenge.id, challenge.starterCode, persist, user, userId, markSaved]);

  // --- Chạy code ---------------------------------------------------------
  const run = useCallback(async () => {
    // Mỗi lần chạy là một bằng chứng mới. Nếu lần trước đúng nhưng lần này em
    // đang thử thay đổi code, không giữ bảng chiến thắng phủ lên kết quả mới.
    setJustCompleted(false);
    setSyncError(null);
    setPendingSync(false);
    setIsRunning(true);
    await flush();

    const runResult = await runnerRef.current.run({ code, challenge });

    setResult(runResult);
    setPlayKey((key) => key + 1);
    setIsRunning(false);

    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);

    if (!persist) {
      if (runResult.isCorrect) {
        setXpAwarded(challenge.xpReward);
        setGemsAwarded(3);
        setJustCompleted(true);
      }
      return;
    }

    if (!user) return;

    try {
      const payload = {
        lessonId: challenge.lessonId,
        challengeId: challenge.id,
        code,
        hintLevelUsed: hintLevel,
      };
      const queuedPayload = { ...payload, optimisticCorrect: runResult.isCorrect };
      let authoritative: SubmitChallengeRunResult | null = null;
      const write = await runOrQueue('submit-challenge-secure', queuedPayload, async () => {
        authoritative = await submitChallengeRun(payload);
      });
      if (!write.ok && !write.queued) throw write.error;

      if (write.queued) {
        // Local result is only an optimistic UX while offline. The queued code
        // will be re-graded by the same interpreter on the server later.
        if (runResult.isCorrect) {
          const optimistic = buildOptimisticProgress(user.id, challenge, currentProgress);
          onProgressChange?.(optimistic);
          setXpAwarded(
            currentProgress?.completed_challenges.includes(challenge.id) ? 0 : challenge.xpReward,
          );
          setGemsAwarded(currentProgress?.completed_challenges.includes(challenge.id) ? 0 : 3);
          setPendingSync(true);
          setJustCompleted(true);
        }
        return;
      }

      if (!authoritative) return;
      const saved = authoritative as SubmitChallengeRunResult;
      setAttemptCount(saved.persistence.attemptNumber);
      setNewBadges(await fetchBadgesByCodes(saved.persistence.newBadgeCodes));
      if (!saved.grade.isCorrect || !saved.persistence.progress) return;

      // useLessonAccess đã tải một snapshot khi vào màn. Nếu không cập nhật
      // snapshot này, nút Tiếp tục sẽ sang route mới trước và khóa nhầm màn kế.
      onProgressChange?.(saved.persistence.progress);
      setXpAwarded(saved.persistence.xpAwarded);
      setGemsAwarded(saved.persistence.gemsAwarded);
      setPendingSync(false);
      setJustCompleted(true);
      await refreshProfile();
    } catch (error) {
      // Không công nhận phần thưởng nếu server từ chối. Kết quả chạy và chỉ dẫn
      // sửa code vẫn hiển thị, đồng thời phải nói rõ vì sao chưa được mở màn kế.
      setSyncError(
        error instanceof Error
          ? error.message
          : 'Chưa lưu được tiến trình. Em kiểm tra mạng rồi bấm Chạy code lại nhé.',
      );
    }
  }, [code, challenge, flush, attemptCount, persist, user, hintLevel, refreshProfile, onProgressChange, currentProgress]);

  // --- Gợi ý -------------------------------------------------------------
  const unlockNextHint = useCallback(() => {
    setHintLevel((level) => {
      const next = Math.min(level + 1, challenge.hints.length);
      if (next > level && persist && user) {
        void logActivityEvent(user.id, {
          eventType: 'hint_used',
          lessonId: challenge.lessonId,
          challengeId: challenge.id,
          metadata: { level: next },
        });
      }
      return next;
    });
  }, [challenge, persist, user]);

  const reset = useCallback(() => {
    setCode(challenge.starterCode);
    setResult(null);
  }, [challenge.starterCode]);

  const canViewSolution = useMemo(
    () =>
      Boolean(challenge.solution) &&
      (allowSolutionView || attemptCount >= ATTEMPTS_BEFORE_SOLUTION) &&
      hintLevel >= challenge.hints.length,
    [challenge, allowSolutionView, attemptCount, hintLevel],
  );

  /** Dòng cần làm nổi bật trong editor — chỉ lấy dòng của lỗi chính. */
  const highlightedLines = useMemo(() => {
    const primary = result?.diagnostics.find((item) => item.severity === 'error');
    return primary && primary.line > 0 ? [primary.line] : [];
  }, [result]);

  return {
    code,
    setCode,
    isRestoring,
    result,
    isRunning,
    run,
    reset,
    saveState,
    hintLevel,
    unlockNextHint,
    attemptCount,
    canViewSolution,
    solutionVisible,
    showSolution: () => setSolutionVisible(true),
    highlightedLines,
    playKey,
    justCompleted,
    xpAwarded,
    gemsAwarded,
    newBadges,
    syncError,
    pendingSync,
    dismissBadges: () => setNewBadges([]),
    attemptsBeforeSolution: ATTEMPTS_BEFORE_SOLUTION,
  };
}

function buildOptimisticProgress(
  userId: string,
  challenge: Challenge,
  current: LessonProgressRow | null,
): LessonProgressRow {
  const alreadyDone = current?.completed_challenges.includes(challenge.id) ?? false;
  const completed = alreadyDone
    ? (current?.completed_challenges ?? [])
    : [...(current?.completed_challenges ?? []), challenge.id];
  const required = getRequiredChallengeIds(challenge.lessonId);
  const percent = calculateLessonPercent(completed, required);
  const stars = percent < 70 ? 0 : percent < 100 ? 1 : 2;
  const now = new Date().toISOString();

  return {
    id: current?.id ?? `local-${challenge.lessonId}`,
    user_id: userId,
    lesson_id: challenge.lessonId,
    status: current?.status ?? 'in_progress',
    progress_percent: percent,
    stars: Math.max(current?.stars ?? 0, stars),
    xp: (current?.xp ?? 0) + (alreadyDone ? 0 : challenge.xpReward),
    completed_challenges: completed,
    started_at: current?.started_at ?? now,
    completed_at: current?.completed_at ?? null,
    updated_at: now,
  };
}
