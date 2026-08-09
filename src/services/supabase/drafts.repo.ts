import { requireSupabase } from './client';
import { toRepositoryError } from './errors';

/** Bản nháp code đang làm dở (auto-save). */

export interface CodeDraft {
  challengeId: string;
  code: string;
  updatedAt: string;
}

export async function fetchDraft(userId: string, challengeId: string): Promise<CodeDraft | null> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('code_drafts')
      .select('challenge_id, code, updated_at')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      challengeId: data.challenge_id as string,
      code: data.code as string,
      updatedAt: data.updated_at as string,
    };
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được bản code đã lưu.');
  }
}

export async function saveDraft(
  userId: string,
  lessonId: string,
  challengeId: string,
  code: string,
): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('code_drafts').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        challenge_id: challengeId,
        // Cắt bớt cho khớp ràng buộc độ dài ở database (mục 22)
        code: code.slice(0, 10_000),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,challenge_id' },
    );

    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không lưu được code lên máy chủ.');
  }
}
