import { registerOfflineHandler, startOfflineQueueWatcher } from './offlineQueue';
import type { LessonProgressPatch } from '@/services/supabase/progress.repo';
import type { RecordAttemptInput } from '@/services/supabase/attempts.repo';
import type { SubmitExitTicketInput } from '@/services/supabase/exitTickets.repo';
import type {
  SubmitChallengeRunInput,
  SubmitCheckpointSecureInput,
} from '@/services/supabase/authoritative.repo';

/**
 * Nối hàng đợi offline với các repository.
 *
 * Tách khỏi `offlineQueue.ts` để tránh phụ thuộc vòng tròn: repository gọi
 * `runOrQueue`, còn hàng đợi lại cần gọi ngược về repository để chạy lại.
 *
 * ⚠ MỌI IMPORT TRONG CÁC HANDLER ĐỀU LÀ IMPORT ĐỘNG, và đó là chủ ý.
 *
 * File này được nạp ngay lúc ứng dụng khởi động (App.tsx gọi `initOfflineSync`).
 * Nếu import tĩnh, `progressService` sẽ kéo theo `@/lessons` — tức toàn bộ nội
 * dung toàn bộ nhiệm vụ — vào bundle chính. Nội dung vẫn được lazy-load theo route,
 * phình từ 91 KB lên 128 KB gzip, và màn hình đăng nhập phải tải cả nội dung
 * bài học dù chưa ai học gì.
 *
 * Các handler chỉ chạy khi có mạng trở lại VÀ hàng đợi không rỗng — một tình
 * huống hiếm — nên nạp muộn ở đây là hoàn toàn hợp lý.
 */

export interface QueuedProgressPayload {
  userId: string;
  lessonId: string;
  patch: LessonProgressPatch;
}

export interface QueuedExperiencePayload {
  userId: string;
  totalXp: number;
}

export interface QueuedDraftPayload {
  userId: string;
  lessonId: string;
  challengeId: string;
  code: string;
}

export function initOfflineSync(): void {
  registerOfflineHandler('submit-challenge-secure', async (payload) => {
    const { submitChallengeRun } = await import('@/services/supabase/authoritative.repo');
    await submitChallengeRun(payload as SubmitChallengeRunInput);
  });

  registerOfflineHandler('submit-checkpoint-secure', async (payload) => {
    const { submitCheckpointSecure } = await import('@/services/supabase/authoritative.repo');
    await submitCheckpointSecure(payload as SubmitCheckpointSecureInput);
  });

  registerOfflineHandler('record-attempt', async (payload) => {
    const { recordAttemptDirect } = await import('@/services/supabase/attempts.repo');
    await recordAttemptDirect(payload as RecordAttemptInput);
  });

  registerOfflineHandler('upsert-lesson-progress', async (payload) => {
    const { upsertLessonProgress } = await import('@/services/supabase/progress.repo');
    const { userId, lessonId, patch } = payload as QueuedProgressPayload;
    await upsertLessonProgress(userId, lessonId, patch);
  });

  registerOfflineHandler('add-experience', async (payload) => {
    const { setExperienceDirect } = await import('@/services/progressService');
    const { userId, totalXp } = payload as QueuedExperiencePayload;
    await setExperienceDirect(userId, totalXp);
  });

  registerOfflineHandler('submit-exit-ticket', async (payload) => {
    const { submitExitTicket } = await import('@/services/supabase/exitTickets.repo');
    await submitExitTicket(payload as SubmitExitTicketInput);
  });

  registerOfflineHandler('save-draft', async (payload) => {
    const { saveDraft } = await import('@/services/supabase/drafts.repo');
    const draft = payload as QueuedDraftPayload;
    await saveDraft(draft.userId, draft.lessonId, draft.challengeId, draft.code);
  });

  startOfflineQueueWatcher();
}
