import { requireSupabase } from './client';
import { RepositoryError, toRepositoryError } from './errors';
import type { BadgeRow, CertificateRow, ExitTicketRow, LessonProgressRow } from '@/types/database';
import type { CheckpointAnswer } from '@/types/content';

const GRADING_ERROR_MESSAGES: Record<string, string> = {
  CAN_DANG_NHAP: 'Phiên đăng nhập đã hết hạn. Em đăng nhập lại nhé.',
  NHIEM_VU_KHONG_TON_TAI: 'Nhiệm vụ này chưa có trong hệ thống chấm bài.',
  KHU_VUC_KHONG_TON_TAI: 'Khu vực này chưa có trong hệ thống.',
  NHIEM_VU_CHUA_MO: 'Nhiệm vụ chưa mở: em cần hoàn thành phần trước và khu vực phải được thầy cô cho phép truy cập.',
  CHUA_HOAN_THANH_NHIEM_VU: 'Em cần hoàn thành đủ nhiệm vụ bắt buộc trước checkpoint.',
  QUA_NHIEU_YEU_CAU: 'Em chạy hơi nhanh. Chờ vài giây rồi thử lại nhé.',
  CODE_QUA_DAI: 'Chương trình dài quá 10.000 ký tự. Em rút gọn rồi chạy lại nhé.',
  DAP_AN_QUA_DAI: 'Phần trả lời dài quá. Em rút gọn rồi nộp lại nhé.',
};

async function toAuthoritativeError(error: unknown, fallback: string) {
  const context = (error as { context?: unknown } | null)?.context;
  if (typeof Response !== 'undefined' && context instanceof Response) {
    try {
      const body = await context.clone().json() as { error?: string };
      if (body.error && GRADING_ERROR_MESSAGES[body.error]) {
        return new RepositoryError(GRADING_ERROR_MESSAGES[body.error]);
      }
    } catch {
      // Phản hồi không phải JSON: dùng bộ phân loại lỗi chung bên dưới.
    }
  }
  return toRepositoryError(error, fallback);
}

export interface SubmitChallengeRunInput {
  lessonId: string;
  challengeId: string;
  code: string;
  hintLevelUsed: number;
}

export interface SubmitChallengeRunResult {
  grade: {
    ok: boolean;
    isCorrect: boolean;
    passedRequired: number;
    totalRequired: number;
    errorCodes: string[];
  };
  persistence: {
    attemptNumber: number;
    progress: LessonProgressRow | null;
    xpAwarded: number;
    gemsAwarded: number;
    newBadgeCodes: string[];
  };
}

export async function submitChallengeRun(
  input: SubmitChallengeRunInput,
): Promise<SubmitChallengeRunResult> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke('submit-challenge', { body: input });
    if (error) throw error;
    if (!data || typeof data !== 'object' || !('persistence' in data)) {
      throw new Error('Phản hồi chấm bài chưa hợp lệ.');
    }
    return data as SubmitChallengeRunResult;
  } catch (error) {
    throw await toAuthoritativeError(error, 'Không đồng bộ được kết quả chấm bài an toàn.');
  }
}

export interface SubmitCheckpointSecureInput {
  lessonId: string;
  answers: Record<string, CheckpointAnswer>;
  reflection: string;
}

export interface SubmitCheckpointSecureResult {
  grade: { correct: number; total: number; percent: number; passed: boolean };
  persistence: {
    ticket: ExitTicketRow;
    progress: LessonProgressRow;
    certificate: CertificateRow | null;
  };
}

export async function submitCheckpointSecure(
  input: SubmitCheckpointSecureInput,
): Promise<SubmitCheckpointSecureResult> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke('submit-checkpoint', { body: input });
    if (error) throw error;
    if (!data || typeof data !== 'object' || !('persistence' in data)) {
      throw new Error('Phản hồi checkpoint chưa hợp lệ.');
    }
    return data as SubmitCheckpointSecureResult;
  } catch (error) {
    throw await toAuthoritativeError(error, 'Không đồng bộ được checkpoint an toàn.');
  }
}

export async function fetchBadgesByCodes(codes: string[]): Promise<BadgeRow[]> {
  if (codes.length === 0) return [];
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('badges').select('*').in('code', codes);
  if (error) return [];
  return (data as BadgeRow[]) ?? [];
}
