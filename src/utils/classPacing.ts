import type { ClassAreaControlRow } from '@/types/database';

export function getPacingOverrides(controls: ClassAreaControlRow[]) {
  return {
    teacherUnlockedLessons: controls
      .filter((control) => control.access_mode === 'open')
      .map((control) => control.lesson_id),
    teacherLockedLessons: controls
      .filter((control) => control.access_mode === 'locked')
      .map((control) => control.lesson_id),
  };
}

/** Định dạng ngày thuần túy, không để UTC làm lệch sang ngày hôm trước. */
export function formatSchoolDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

export function isSchoolDatePast(value: string, now = new Date()): boolean {
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return value < today;
}
