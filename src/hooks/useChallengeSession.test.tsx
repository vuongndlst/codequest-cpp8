import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChallengeSession } from './useChallengeSession';
import { getChallenge } from '@/lessons';
import { emptyRunResult } from '@/types/runner';

const mocks = vi.hoisted(() => ({
  run: vi.fn(), submit: vi.fn(), badges: vi.fn(), draft: vi.fn(), count: vi.fn(),
  save: vi.fn(), refresh: vi.fn(),
  user: { id: 'student-session-test' },
}));
vi.mock('@/stores/authStore', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: mocks.user, refreshProfile: mocks.refresh }) }));
vi.mock('@/services/runner/localRunner', () => ({ getCodeRunner: () => ({ run: mocks.run }) }));
vi.mock('@/services/supabase/drafts.repo', () => ({ fetchDraft: mocks.draft, saveDraft: mocks.save }));
vi.mock('@/services/supabase/attempts.repo', () => ({ countAttempts: mocks.count }));
vi.mock('@/services/supabase/gamification.repo', () => ({ logActivityEvent: vi.fn() }));
vi.mock('@/services/supabase/authoritative.repo', () => ({ submitChallengeRun: mocks.submit, fetchBadgesByCodes: mocks.badges }));

const challenge = getChallenge('a0', 'a0-c1-first-program')!;
const saved = {
  grade: { isCorrect: true },
  persistence: { attemptNumber: 1, progress: { completed_challenges: [challenge.id] }, xpAwarded: 10, gemsAwarded: 3, newBadgeCodes: [] },
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.draft.mockResolvedValue(null);
  mocks.count.mockResolvedValue(0);
  mocks.save.mockResolvedValue(undefined);
  mocks.refresh.mockResolvedValue(undefined);
  mocks.badges.mockResolvedValue([]);
  mocks.run.mockResolvedValue({ ...emptyRunResult(), ok: true, isCorrect: true });
  mocks.submit.mockResolvedValue(saved);
});

describe('Phiên làm bài và xác nhận tiến trình', () => {
  it('khóa chạy lần hai trong khi lần đầu vẫn chờ máy chủ lưu', async () => {
    let finish!: (value: typeof saved) => void;
    mocks.submit.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { result } = renderHook(() => useChallengeSession({ challenge, persist: true }));
    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    let pending!: Promise<void>;
    act(() => { pending = result.current.run(); });
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
    expect(result.current.isRunning).toBe(true);
    await act(async () => { await result.current.run(); });
    expect(mocks.run).toHaveBeenCalledTimes(1);
    await act(async () => { finish(saved); await pending; });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.xpAwarded).toBe(10);
  });

  it('kết quả về muộn sau khi rời nhiệm vụ không ghi vào màn kế tiếp', async () => {
    let finish!: (value: typeof saved) => void;
    mocks.submit.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const onProgressChange = vi.fn();
    const { result, unmount } = renderHook(() => useChallengeSession({ challenge, persist: true, onProgressChange }));
    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    let pending!: Promise<void>;
    act(() => { pending = result.current.run(); });
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => { finish(saved); await pending; });
    expect(onProgressChange).not.toHaveBeenCalled();
  });

  it('lỗi tải huy hiệu không chặn qua màn và không làm mất thưởng đã lưu', async () => {
    mocks.badges.mockRejectedValue(new TypeError('Failed to fetch'));
    const onProgressChange = vi.fn();
    const { result } = renderHook(() => useChallengeSession({ challenge, persist: true, onProgressChange }));
    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    await act(async () => { await result.current.run(); });
    expect(result.current.justCompleted).toBe(true);
    expect(result.current.gemsAwarded).toBe(3);
    expect(result.current.syncError).toBeNull();
    expect(onProgressChange).toHaveBeenCalledWith(saved.persistence.progress);
  });

  it('nói rõ chênh lệch bộ chấm thay vì im lặng khi máy chủ không công nhận', async () => {
    mocks.submit.mockResolvedValue({ ...saved, grade: { isCorrect: false } });
    const { result } = renderHook(() => useChallengeSession({ challenge, persist: true }));
    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    await act(async () => { await result.current.run(); });
    expect(result.current.justCompleted).toBe(false);
    expect(result.current.syncError).toContain('Máy chủ chưa xác nhận');
  });
});
