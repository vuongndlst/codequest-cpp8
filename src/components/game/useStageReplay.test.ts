import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore } from '@/stores/uiStore';
import type { WorldEvent } from '@/validators/world';
import { REPLAY_STEP_MS, useStageReplay, type ReplaySpeed } from './useStageReplay';

const EVENTS: WorldEvent[] = Array.from({ length: 3 }, (_, index) => ({
  type: 'move',
  index,
  col: index + 1,
  row: 0,
  message: `Bước ${index + 1}`,
}));

describe('Điều khiển phát lại sân khấu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useUiStore.setState({ reducedMotion: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('chế độ thường phát đủ sự kiện theo từng nhịp', () => {
    const { result } = renderHook(() => useStageReplay(EVENTS, 0, 'normal'));

    expect(result.current.playedCount).toBe(0);
    expect(result.current.isPlaying).toBe(true);

    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS.normal));
    expect(result.current.playedCount).toBe(1);

    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS.normal * 2));
    expect(result.current.playedCount).toBe(3);
    expect(result.current.isDone).toBe(true);
  });

  it('đổi sang nhanh giữa chừng tiếp tục từ vị trí hiện tại', () => {
    const { result, rerender } = renderHook(
      ({ speed }: { speed: ReplaySpeed }) => useStageReplay(EVENTS, 0, speed),
      { initialProps: { speed: 'normal' as ReplaySpeed } },
    );

    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS.normal));
    expect(result.current.playedCount).toBe(1);

    rerender({ speed: 'fast' });
    act(() => vi.advanceTimersByTime(REPLAY_STEP_MS.fast));
    expect(result.current.playedCount).toBe(2);
  });

  it('chế độ từng bước chỉ tiến khi học sinh chủ động bấm', () => {
    const { result } = renderHook(() => useStageReplay(EVENTS, 0, 'step'));

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.playedCount).toBe(0);
    expect(result.current.isPlaying).toBe(false);

    act(() => result.current.stepForward());
    expect(result.current.playedCount).toBe(1);

    act(() => result.current.skipToEnd());
    expect(result.current.playedCount).toBe(3);
    expect(result.current.isDone).toBe(true);
  });

  it('lượt chạy mới quay lại vạch xuất phát', () => {
    const { result, rerender } = renderHook(
      ({ playKey }) => useStageReplay(EVENTS, playKey, 'step'),
      { initialProps: { playKey: 0 } },
    );

    act(() => result.current.skipToEnd());
    expect(result.current.playedCount).toBe(3);

    rerender({ playKey: 1 });
    expect(result.current.playedCount).toBe(0);
  });
});
