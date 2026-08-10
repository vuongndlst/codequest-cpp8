import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Challenge } from '@/types/content';
import type { RunResult } from '@/types/runner';
import { getCodeRunner } from '@/services/runner/localRunner';
import { useAuthStore } from '@/stores/authStore';
import { useAutoSave, readLocalDraft } from './useAutoSave';
import { fetchDraft } from '@/services/supabase/drafts.repo';
import { countAttempts, recordAttempt } from '@/services/supabase/attempts.repo';
import { logActivityEvent } from '@/services/supabase/gamification.repo';
import { completeChallenge } from '@/services/progressService';
import { fetchAllLessonProgress, indexProgressByLesson } from '@/services/supabase/progress.repo';
import { awardBadges, evaluateBadges, loadBadgeHistory } from '@/services/badgeService';
import { fetchAllBadges, fetchUserBadges } from '@/services/supabase/gamification.repo';
import { awardChallengeGems } from '@/services/supabase/equipment.repo';
import type { BadgeRow } from '@/types/database';

/**
 * Điều phối một phiên làm nhiệm vụ: code, chạy, gợi ý, lưu, ghi tiến trình.
 *
 * Gom vào một hook để trang ChallengePage chỉ lo phần hiển thị, và để logic
 * này dùng lại được cho cả chế độ Demo (không đăng nhập).
 */

/** Số lần thử tối thiểu trước khi mở đáp án mẫu, khi giáo viên chưa bật quyền xem. */
const ATTEMPTS_BEFORE_SOLUTION = 6;

/**
 * Xét và trao huy hiệu.
 *
 * Tách ra khỏi hook để giữ phần `run()` dễ đọc, và để mọi lỗi ở đây đều bị
 * nuốt — huy hiệu là phần thưởng phụ, không bao giờ được phép chặn việc học.
 */
async function checkBadges(
  userId: string,
  input: Omit<Parameters<typeof evaluateBadges>[0], 'history' | 'earnedCodes'>,
): Promise<BadgeRow[]> {
  try {
    const [allBadges, userBadges, history] = await Promise.all([
      fetchAllBadges(),
      fetchUserBadges(userId),
      loadBadgeHistory(userId),
    ]);

    const earnedIds = new Set(userBadges.map((badge) => badge.badge_id));
    const earnedCodes = allBadges
      .filter((badge) => earnedIds.has(badge.id))
      .map((badge) => badge.code);

    const codes = evaluateBadges({ ...input, history, earnedCodes });
    return await awardBadges(userId, codes);
  } catch {
    return [];
  }
}

interface UseChallengeSessionOptions {
  challenge: Challenge;
  /** false ở chế độ Demo — không ghi gì lên database */
  persist: boolean;
  /** Giáo viên bật quyền xem đáp án cho lớp */
  allowSolutionView?: boolean;
}

export function useChallengeSession({
  challenge,
  persist,
  allowSolutionView = false,
}: UseChallengeSessionOptions) {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
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
    setIsRunning(true);
    await flush();

    const runResult = await runnerRef.current.run({ code, challenge });

    setResult(runResult);
    setPlayKey((key) => key + 1);
    setIsRunning(false);

    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);

    if (!persist || !user || !profile) return;

    // Ghi lại lần làm bài TRƯỚC khi xét huy hiệu, để thống kê lịch sử đã có
    // lần chạy này. Hỏng thì bỏ qua, không chặn việc học.
    await recordAttempt({
      userId: user.id,
      lessonId: challenge.lessonId,
      challengeId: challenge.id,
      code,
      result: runResult,
      hintLevelUsed: hintLevel,
      attemptNumber: nextAttempt,
    }).catch(() => undefined);

    // Chưa đúng: chỉ xét huy hiệu ở lần chạy ĐẦU TIÊN của nhiệm vụ này.
    // Giới hạn như vậy để học sinh bấm Chạy liên tục không tạo ra một loạt
    // truy vấn database không cần thiết.
    if (!runResult.isCorrect) {
      if (attemptCount === 0) {
        void checkBadges(user.id, {
          challenge,
          result: runResult,
          attemptNumber: nextAttempt,
          hintLevelUsed: hintLevel,
          progressByLesson: {},
        }).then(setNewBadges);
      }
      return;
    }

    try {
      const allProgress = await fetchAllLessonProgress(user.id);
      const currentProgress = indexProgressByLesson(allProgress)[challenge.lessonId] ?? null;

      const outcome = await completeChallenge({
        userId: user.id,
        profile,
        lessonId: challenge.lessonId,
        challenge,
        currentProgress,
      });

      setXpAwarded(outcome.xpAwarded);
      const newGems = await awardChallengeGems(challenge.id).catch(() => 0);
      setGemsAwarded(newGems);
      setJustCompleted(true);
      await refreshProfile();

      const awarded = await checkBadges(user.id, {
        challenge,
        result: runResult,
        attemptNumber: nextAttempt,
        hintLevelUsed: hintLevel,
        // Dùng tiến trình VỪA cập nhật, nếu không thì huy hiệu Boss sẽ chậm một nhịp
        progressByLesson: {
          ...indexProgressByLesson(allProgress),
          [challenge.lessonId]: outcome.progress,
        },
      });
      setNewBadges(awarded);
    } catch {
      // Chạy đúng rồi nhưng chưa lưu được tiến trình — vẫn báo hoàn thành cho
      // học sinh, lần sau vào lại sẽ đồng bộ.
      setJustCompleted(true);
    }
  }, [code, challenge, flush, attemptCount, persist, user, profile, hintLevel, refreshProfile]);

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
    dismissBadges: () => setNewBadges([]),
    attemptsBeforeSolution: ATTEMPTS_BEFORE_SOLUTION,
  };
}
