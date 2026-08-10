import { requireSupabase } from './client';
import { toRepositoryError } from './errors';
import type { ExitTicketRow } from '@/types/database';

/** Exit Ticket — bài kiểm tra nhanh cuối mỗi khu vực. */

export async function fetchExitTicket(
  userId: string,
  lessonId: string,
): Promise<ExitTicketRow | null> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('exit_tickets')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) throw error;
    return (data as ExitTicketRow | null) ?? null;
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được Exit Ticket.');
  }
}

export interface SubmitExitTicketInput {
  userId: string;
  lessonId: string;
  answers: Record<string, unknown>;
  score: number;
  reflection: string;
}

/** Cho phép làm lại — RLS có policy UPDATE cho chính chủ (mục 6: thử lại không giới hạn). */
export async function submitExitTicket(input: SubmitExitTicketInput): Promise<ExitTicketRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('exit_tickets')
      .upsert(
        {
          user_id: input.userId,
          lesson_id: input.lessonId,
          answers: input.answers,
          score: input.score,
          reflection: input.reflection.slice(0, 1_000),
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' },
      )
      .select('*')
      .single();

    if (error) throw error;
    return data as ExitTicketRow;
  } catch (error) {
    throw toRepositoryError(error, 'Không lưu được Exit Ticket.');
  }
}
