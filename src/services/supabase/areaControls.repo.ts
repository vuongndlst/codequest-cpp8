import { requireSupabase } from './client';
import { toRepositoryError } from './errors';
import type { ClassAreaAccessMode, ClassAreaControlRow } from '@/types/database';

/**
 * Điều phối tiến độ theo lớp thật (`classes.id`). RLS tự giới hạn giáo viên vào
 * lớp mình dạy và học sinh vào đúng lớp mình đang tham gia.
 */
export async function fetchAccessibleAreaControls(): Promise<ClassAreaControlRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('class_area_controls')
      .select('*')
      .order('lesson_id', { ascending: true });

    if (error) throw error;
    return (data as ClassAreaControlRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được lịch mở khu vực.');
  }
}

export async function upsertAreaControl(input: {
  classId: string;
  lessonId: string;
  accessMode: ClassAreaAccessMode;
  dueDate: string | null;
  teacherId: string;
}): Promise<ClassAreaControlRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('class_area_controls')
      .upsert(
        {
          class_id: input.classId,
          lesson_id: input.lessonId,
          access_mode: input.accessMode,
          due_date: input.dueDate,
          updated_by: input.teacherId,
        },
        { onConflict: 'class_id,lesson_id' },
      )
      .select('*')
      .single();

    if (error) throw error;
    return data as ClassAreaControlRow;
  } catch (error) {
    throw toRepositoryError(error, 'Không lưu được tiến độ khu vực.');
  }
}

export function indexAreaControls(
  controls: ClassAreaControlRow[],
): Record<string, ClassAreaControlRow | undefined> {
  return Object.fromEntries(controls.map((control) => [control.lesson_id, control]));
}
