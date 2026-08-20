import { describe, expect, it } from 'vitest';
import { formatSchoolDate, getPacingOverrides, isSchoolDatePast } from './classPacing';
import type { ClassAreaControlRow } from '@/types/database';

const control = (
  lessonId: string,
  accessMode: ClassAreaControlRow['access_mode'],
): ClassAreaControlRow => ({
  id: lessonId,
  class_id: 'class-1',
  lesson_id: lessonId,
  access_mode: accessMode,
  due_date: null,
  updated_by: null,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
});

describe('class pacing', () => {
  it('tách đúng danh sách giáo viên mở và khóa', () => {
    expect(getPacingOverrides([
      control('a0', 'sequence'),
      control('a1', 'open'),
      control('a2', 'locked'),
    ])).toEqual({ teacherUnlockedLessons: ['a1'], teacherLockedLessons: ['a2'] });
  });

  it('định dạng ngày trường học không bị lệch múi giờ', () => {
    expect(formatSchoolDate('2026-08-13')).toBe('13/08/2026');
  });

  it('chỉ báo quá hạn khi ngày nhỏ hơn hôm nay', () => {
    const now = new Date(2026, 7, 13, 23, 30);
    expect(isSchoolDatePast('2026-08-12', now)).toBe(true);
    expect(isSchoolDatePast('2026-08-13', now)).toBe(false);
  });
});
