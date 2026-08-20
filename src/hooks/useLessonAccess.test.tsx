import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import type { LessonProgressRow, ProfileRow } from '@/types/database';
import { useAuthStore } from '@/stores/authStore';
import { useLessonAccess } from './useLessonAccess';

const initialProgress: LessonProgressRow = {
  id: 'progress-a1',
  user_id: 'student-1',
  lesson_id: 'a1',
  status: 'in_progress',
  progress_percent: 20,
  stars: 0,
  xp: 15,
  completed_challenges: ['a1-c1-move-right'],
  started_at: '2026-08-20T00:00:00.000Z',
  completed_at: null,
  updated_at: '2026-08-20T00:00:00.000Z',
};

const profile: ProfileRow = {
  id: 'student-1',
  full_name: 'Học sinh kiểm thử',
  class_name: '8A11',
  student_code: '2406105',
  avatar_id: 'arin',
  role: 'student',
  total_xp: 15,
  level: 1,
  streak_days: 1,
  last_active_date: null,
  created_at: '2026-08-20T00:00:00.000Z',
  updated_at: '2026-08-20T00:00:00.000Z',
};

describe('useLessonAccess đồng bộ tiến trình vừa hoàn thành', () => {
  afterEach(() => {
    act(() => useAuthStore.setState({ user: null, profile: null }));
    vi.clearAllMocks();
  });

  it('mở màn kế tiếp bằng snapshot mới mà không cần tải lại Supabase', () => {
    act(() => useAuthStore.setState({ user: { id: 'student-1' } as User, profile }));

    const { result } = renderHook(() => useLessonAccess('a1', { disabled: true }));

    act(() => {
      result.current.applyProgress({
        ...initialProgress,
        progress_percent: 40,
        completed_challenges: ['a1-c1-move-right', 'a1-c2-sequence'],
        updated_at: '2026-08-20T01:00:00.000Z',
      });
    });

    expect(result.current.progressByLesson.a1?.completed_challenges).toEqual([
      'a1-c1-move-right',
      'a1-c2-sequence',
    ]);
  });

  it('không nhận nhầm tiến trình từ tài khoản khác', () => {
    act(() => useAuthStore.setState({ user: { id: 'student-1' } as User, profile }));

    const { result } = renderHook(() => useLessonAccess('a1', { disabled: true }));

    act(() => result.current.applyProgress(initialProgress));

    act(() => {
      result.current.applyProgress({
        ...initialProgress,
        user_id: 'student-2',
        completed_challenges: ['a1-c1-move-right', 'a1-c2-sequence'],
      });
    });

    expect(result.current.progressByLesson.a1?.completed_challenges).toEqual([
      'a1-c1-move-right',
    ]);
  });
});
