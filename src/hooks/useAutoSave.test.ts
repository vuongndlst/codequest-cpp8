import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAutoSave, readLocalDraft, writeLocalDraft, draftStorageKey } from './useAutoSave';

const saveDraftMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/supabase/drafts.repo', () => ({
  saveDraft: saveDraftMock,
}));

const BASE = {
  userId: 'u1',
  lessonId: 'l1',
  challengeId: 'l1-c4-mission',
  enabled: true,
};

describe('Lưu tạm trong localStorage', () => {
  beforeEach(() => localStorage.clear());

  it('khoá lưu tách riêng theo học sinh và theo nhiệm vụ', () => {
    expect(draftStorageKey('u1', 'c1')).toBe('cq8:code:u1:c1');
    expect(draftStorageKey('u1', 'c2')).not.toBe(draftStorageKey('u1', 'c1'));
    // Hai học sinh dùng chung một máy phòng ICT không được đè code của nhau
    expect(draftStorageKey('u2', 'c1')).not.toBe(draftStorageKey('u1', 'c1'));
  });

  it('chế độ Demo dùng khoá riêng, không lẫn với tài khoản thật', () => {
    expect(draftStorageKey(null, 'c1')).toBe('cq8:code:demo:c1');
  });

  it('ghi rồi đọc lại được', () => {
    writeLocalDraft('u1', 'c1', 'int main() {}');
    expect(readLocalDraft('u1', 'c1')?.code).toBe('int main() {}');
  });

  it('chưa có bản nháp thì trả về null', () => {
    expect(readLocalDraft('u1', 'chua-co')).toBeNull();
  });

  it('dữ liệu hỏng thì trả về null chứ không làm sập màn hình nhiệm vụ', () => {
    localStorage.setItem(draftStorageKey('u1', 'c1'), 'khong phai JSON');
    expect(readLocalDraft('u1', 'c1')).toBeNull();
  });
});

describe('Tự động lưu', () => {
  it('không ghi đè bản nháp trong lúc đang khôi phục dù rời trang', async () => {
    writeLocalDraft('u1', BASE.challengeId, 'bài đang làm dở');
    const { result, unmount } = renderHook(() => useAutoSave({
      ...BASE, code: 'starter chưa khôi phục', suspended: true,
    }));
    await act(async () => { await result.current.flush(); });
    unmount();
    expect(readLocalDraft('u1', BASE.challengeId)?.code).toBe('bài đang làm dở');
    expect(saveDraftMock).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    localStorage.clear();
    saveDraftMock.mockReset();
    saveDraftMock.mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('không ghi database ngay khi vừa gõ — phải chờ hết debounce', async () => {
    const { rerender } = renderHook((props) => useAutoSave(props), {
      initialProps: { ...BASE, code: 'a' },
    });

    rerender({ ...BASE, code: 'ab' });

    // Đây chính là điều đề bài yêu cầu: không tạo một bản ghi cho mỗi phím gõ
    expect(saveDraftMock).not.toHaveBeenCalled();
  });

  it('gõ liên tục nhiều lần chỉ ghi database MỘT lần', async () => {
    const { rerender } = renderHook((props) => useAutoSave(props), {
      initialProps: { ...BASE, code: 'a' },
    });

    for (const code of ['ab', 'abc', 'abcd', 'abcde']) {
      rerender({ ...BASE, code });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
    }

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(saveDraftMock).toHaveBeenCalledTimes(1);
    expect(saveDraftMock).toHaveBeenCalledWith('u1', 'l1', 'l1-c4-mission', 'abcde');
  });

  it('trạng thái đi từ "đang chỉnh sửa" sang "đã lưu"', async () => {
    const { result, rerender } = renderHook((props) => useAutoSave(props), {
      initialProps: { ...BASE, code: 'a' },
    });

    rerender({ ...BASE, code: 'ab' });
    expect(result.current.saveState).toBe('editing');

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.saveState).toBe('saved');
  });

  it('flush() ghi ngay lập tức, không chờ debounce — dùng khi bấm Chạy', async () => {
    const { result, rerender } = renderHook((props) => useAutoSave(props), {
      initialProps: { ...BASE, code: 'a' },
    });

    rerender({ ...BASE, code: 'ab' });

    await act(async () => {
      await result.current.flush();
    });

    expect(saveDraftMock).toHaveBeenCalledWith('u1', 'l1', 'l1-c4-mission', 'ab');
  });

  /**
   * Đây là yêu cầu quan trọng nhất của mục 23: KHÔNG BAO GIỜ để mất code.
   * Máy chủ hỏng thì code vẫn phải nằm an toàn trong localStorage.
   */
  it('ghi máy chủ hỏng thì code vẫn được giữ trên máy', async () => {
    saveDraftMock.mockRejectedValue(new Error('Failed to fetch'));

    const { result, rerender } = renderHook((props) => useAutoSave(props), {
      initialProps: { ...BASE, code: 'a' },
    });

    rerender({ ...BASE, code: 'code cua hoc sinh' });

    await act(async () => {
      await result.current.flush();
    });

    expect(readLocalDraft('u1', 'l1-c4-mission')?.code).toBe('code cua hoc sinh');
    expect(['failed', 'local_only']).toContain(result.current.saveState);
  });

  it('chế độ Demo chỉ lưu trên máy, không đụng tới database', async () => {
    const { result, rerender } = renderHook((props) => useAutoSave(props), {
      initialProps: { ...BASE, userId: null, enabled: false, code: 'a' },
    });

    rerender({ ...BASE, userId: null, enabled: false, code: 'ab' });

    await act(async () => {
      await result.current.flush();
    });

    expect(saveDraftMock).not.toHaveBeenCalled();
    expect(result.current.saveState).toBe('local_only');
    expect(readLocalDraft(null, 'l1-c4-mission')?.code).toBe('ab');
  });

  it('code không đổi thì không ghi lại lần nữa', async () => {
    const { result } = renderHook((props) => useAutoSave(props), {
      initialProps: { ...BASE, code: 'khong doi' },
    });

    await act(async () => {
      await result.current.flush();
      await result.current.flush();
    });

    expect(saveDraftMock).not.toHaveBeenCalled();
  });
});
