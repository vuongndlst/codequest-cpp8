import type { Challenge } from '@/types/content';
import type { BadgeRow, LessonProgressRow } from '@/types/database';
import type { RunResult } from '@/types/runner';
import { LESSONS, getLesson } from '@/lessons';
import { CLEAN_CODE_STAR_THRESHOLD } from '@/validators/cleanCodeCoach';
import { requireSupabase } from '@/services/supabase/client';
import { fetchAllBadges, logActivityEvent } from '@/services/supabase/gamification.repo';

/**
 * Hệ thống huy hiệu (mục 26 của đề bài).
 *
 * NGUYÊN TẮC THIẾT KẾ — quan trọng hơn phần kỹ thuật:
 *   · Không huy hiệu nào PHẠT học sinh, kể cả gián tiếp
 *   · "No Hint Hero" là phần thưởng phụ, KHÔNG hiển thị số gợi ý đã dùng ở bất
 *     kỳ đâu khác — dùng gợi ý phải luôn là chuyện bình thường
 *   · "Persistent Coder" thưởng cho việc THỬ LẠI NHIỀU LẦN rồi thành công,
 *     tức là thưởng đúng cái mà hệ thống điểm thường vô tình phạt
 */

/** Dữ liệu cần để xét huy hiệu, gom sẵn để chỉ phải truy vấn database một lần. */
export interface BadgeContext {
  challenge: Challenge;
  result: RunResult;
  /** Số lần thử cho tới lúc làm được (tính cả lần thành công) */
  attemptNumber: number;
  /** Mức gợi ý đã mở ở nhiệm vụ này */
  hintLevelUsed: number;
  /** Tiến trình mọi bài học, sau khi đã cập nhật cho lần hoàn thành này */
  progressByLesson: Record<string, LessonProgressRow | undefined>;
  /** Thống kê rút từ toàn bộ lịch sử làm bài */
  history: BadgeHistory;
  /** Mã huy hiệu học sinh đã có, để không xét lại */
  earnedCodes: string[];
}

export interface BadgeHistory {
  /** Đã từng bấm Chạy lần nào chưa */
  hasRunBefore: boolean;
  /** Số nhiệm vụ Debug đã hoàn thành */
  debugChallengesCompleted: number;
  /** Số nhiệm vụ mà học sinh từng mắc lỗi thiếu `;` rồi tự sửa được */
  semicolonFixCount: number;
  /** Điểm clean code cao nhất đạt được ở mỗi bài học */
  bestCleanCodeByLesson: Record<string, number>;
}

interface BadgeRule {
  code: string;
  /** Trả về true nếu đủ điều kiện nhận huy hiệu ngay lúc này */
  isEarned: (context: BadgeContext) => boolean;
}

const BADGE_RULES: BadgeRule[] = [
  {
    code: 'first-run',
    // Trao ngay lần chạy đầu tiên, kể cả khi code chưa đúng — mục đích là
    // khích lệ việc DÁM BẤM CHẠY, không phải khen kết quả.
    isEarned: (context) => !context.history.hasRunBefore,
  },
  {
    code: 'bug-hunter',
    isEarned: (context) => context.history.debugChallengesCompleted >= 5,
  },
  {
    code: 'semicolon-saver',
    isEarned: (context) => context.history.semicolonFixCount >= 3,
  },
  {
    code: 'function-builder',
    isEarned: (context) => isBossCleared('a1', context),
  },
  {
    code: 'data-keeper',
    isEarned: (context) => isBossCleared('a2', context),
  },
  {
    code: 'clean-code-rookie',
    isEarned: (context) =>
      context.result.ok && context.result.cleanCode.score >= CLEAN_CODE_STAR_THRESHOLD,
  },
  {
    code: 'clean-code-guardian',
    isEarned: (context) =>
      LESSONS.every((lesson) => (context.history.bestCleanCodeByLesson[lesson.id] ?? 0) >= 90),
  },
  {
    code: 'no-hint-hero',
    isEarned: (context) =>
      context.challenge.kind === 'boss' &&
      context.result.isCorrect &&
      context.hintLevelUsed === 0,
  },
  {
    code: 'persistent-coder',
    // Thưởng cho sự kiên trì: làm được sau ít nhất 5 lần thử
    isEarned: (context) => context.result.isCorrect && context.attemptNumber >= 5,
  },
];

function isBossCleared(lessonId: string, context: BadgeContext): boolean {
  const boss = getLesson(lessonId)?.challenges.find((item) => item.kind === 'boss');
  if (!boss) return false;
  return context.progressByLesson[lessonId]?.completed_challenges.includes(boss.id) ?? false;
}

/** Xét toàn bộ luật và trả về mã các huy hiệu VỪA đạt được. */
export function evaluateBadges(context: BadgeContext): string[] {
  return BADGE_RULES.filter(
    (rule) => !context.earnedCodes.includes(rule.code) && rule.isEarned(context),
  ).map((rule) => rule.code);
}

/**
 * Rút thống kê từ lịch sử làm bài.
 *
 * Chỉ gọi khi học sinh vừa hoàn thành một nhiệm vụ, nên một truy vấn là chấp
 * nhận được. Giới hạn 500 dòng gần nhất để bảng không phình theo thời gian.
 */
export async function loadBadgeHistory(userId: string): Promise<BadgeHistory> {
  const empty: BadgeHistory = {
    hasRunBefore: false,
    debugChallengesCompleted: 0,
    semicolonFixCount: 0,
    bestCleanCodeByLesson: {},
  };

  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('challenge_attempts')
      .select('lesson_id, challenge_id, is_correct, error_types, clean_code_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error || !data) return empty;

    const rows = data as Array<{
      lesson_id: string;
      challenge_id: string;
      is_correct: boolean;
      error_types: string[] | null;
      clean_code_score: number | null;
    }>;

    const bestCleanCodeByLesson: Record<string, number> = {};
    const solvedChallenges = new Set<string>();
    const semicolonChallenges = new Set<string>();
    const debugChallengeIds = new Set(
      LESSONS.flatMap((lesson) =>
        lesson.challenges.filter((c) => c.kind === 'debug').map((c) => c.id),
      ),
    );

    for (const row of rows) {
      if (row.is_correct) solvedChallenges.add(row.challenge_id);
      if ((row.error_types ?? []).includes('MISSING_SEMICOLON')) {
        semicolonChallenges.add(row.challenge_id);
      }
      if (row.clean_code_score !== null) {
        const current = bestCleanCodeByLesson[row.lesson_id] ?? 0;
        bestCleanCodeByLesson[row.lesson_id] = Math.max(current, row.clean_code_score);
      }
    }

    // Chỉ tính là "tự sửa được" khi học sinh từng mắc lỗi thiếu `;` ở nhiệm vụ đó
    // VÀ sau cùng đã làm xong nhiệm vụ đó
    const semicolonFixCount = [...semicolonChallenges].filter((id) =>
      solvedChallenges.has(id),
    ).length;

    return {
      hasRunBefore: rows.length > 1,
      debugChallengesCompleted: [...solvedChallenges].filter((id) => debugChallengeIds.has(id))
        .length,
      semicolonFixCount,
      bestCleanCodeByLesson,
    };
  } catch {
    return empty;
  }
}

/**
 * Ghi huy hiệu vào database.
 *
 * Ràng buộc UNIQUE(user_id, badge_id) chặn cấp trùng ở tầng database, nên
 * chạy lại hàm này nhiều lần cũng an toàn.
 */
export async function awardBadges(userId: string, codes: string[]): Promise<BadgeRow[]> {
  if (codes.length === 0) return [];

  try {
    const supabase = requireSupabase();
    const allBadges = await fetchAllBadges();
    const toAward = allBadges.filter((badge) => codes.includes(badge.code));
    if (toAward.length === 0) return [];

    const { error } = await supabase.from('user_badges').insert(
      toAward.map((badge) => ({ user_id: userId, badge_id: badge.id })),
    );

    // Lỗi trùng khoá (23505) nghĩa là đã có sẵn — không phải vấn đề
    if (error && error.code !== '23505') return [];

    for (const badge of toAward) {
      void logActivityEvent(userId, {
        eventType: 'badge_earned',
        metadata: { badgeCode: badge.code, badgeName: badge.name },
      });
    }

    return toAward;
  } catch {
    // Huy hiệu là phần thưởng phụ — hỏng thì bỏ qua, tuyệt đối không chặn việc học
    return [];
  }
}
