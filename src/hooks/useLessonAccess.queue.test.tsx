import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import type { LessonProgressRow, ProfileRow } from '@/types/database';
import { useAuthStore } from '@/stores/authStore';

const fetchAllLessonProgress = vi.hoisted(() => vi.fn());
const fetchClassSettings = vi.hoisted(() => vi.fn());
const fetchAccessibleAreaControls = vi.hoisted(() => vi.fn());
const getQueuedChallengeIds = vi.hoisted(() => vi.fn());

vi.mock('@/services/supabase/progress.repo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/supabase/progress.repo')>()),
  fetchAllLessonProgress,
}));
vi.mock('@/services/supabase/gamification.repo', () => ({ fetchClassSettings }));
vi.mock('@/services/supabase/areaControls.repo', () => ({ fetchAccessibleAreaControls }));
vi.mock('@/services/offlineQueue', () => ({ getQueuedChallengeIds }));

import { useLessonAccess } from './useLessonAccess';

const profile: ProfileRow = {
  id: 'student-queue',
  full_name: 'Học sinh kiểm thử',
  class_name: '8A11',
  student_code: '2900001',
  avatar_id: 'arin',
  role: 'student',
  total_xp: 0,
  level: 1,
  streak_days: 0,
  last_active_date: null,
  gem_balance: 0,
  created_at: '2026-08-26T00:00:00.000Z',
  updated_at: '2026-08-26T00:00:00.000Z',
};

const progress: LessonProgressRow = {
  id: 'progress-queue',
  user_id: profile.id,
  lesson_id: 'a0',
  status: 'in_progress',
  progress_percent: 0,
  stars: 0,
  xp: 0,
  completed_challenges: [],
  started_at: '2026-08-26T00:00:00.000Z',
  completed_at: null,
  updated_at: '2026-08-26T00:00:00.000Z',
};

describe('useLessonAccess với kết quả đang chờ đồng bộ', () => {
  afterEach(() => {
    act(() => useAuthStore.setState({ user: null, profile: null }));
    vi.clearAllMocks();
  });

  it('không khóa lại trạm kế tiếp khi route mount lại lúc Wi-Fi chập chờn', async () => {
    fetchAllLessonProgress.mockResolvedValue([progress]);
    fetchClassSettings.mockResolvedValue(null);
    fetchAccessibleAreaControls.mockResolvedValue([]);
    getQueuedChallengeIds.mockReturnValue(['a0-c1-first-program']);
    act(() => useAuthStore.setState({ user: { id: profile.id } as User, profile }));

    const { result } = renderHook(() => useLessonAccess('a0'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.progressByLesson.a0?.completed_challenges).toEqual([
      'a0-c1-first-program',
    ]);
  });

  it('tách riêng nhiệm vụ chờ xác nhận với nhiệm vụ máy chủ đã lưu', async () => {
    fetchAllLessonProgress.mockResolvedValue([
      { ...progress, completed_challenges: ['a0-c1-first-program'] },
    ]);
    fetchClassSettings.mockResolvedValue(null);
    fetchAccessibleAreaControls.mockResolvedValue([]);
    getQueuedChallengeIds.mockReturnValue(['a0-c1-first-program', 'a0-c2-cout']);
    act(() => useAuthStore.setState({ user: { id: profile.id } as User, profile }));

    const { result } = renderHook(() => useLessonAccess('a0'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Bài máy chủ đã xác nhận thì không còn nằm trong nhóm chờ, dù hàng đợi
    // vẫn giữ bản sao của nó.
    expect(result.current.pendingChallengeIds).toEqual(['a0-c2-cout']);
  });
});
