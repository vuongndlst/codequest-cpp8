import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearQueue,
  enqueue,
  flushQueue,
  getQueuedChallengeIds,
  isAuthenticationPendingError,
  isRetriableError,
  queueSize,
  readQueue,
  registerOfflineHandler,
  runOrQueue,
  setQueueUserResolver,
} from './offlineQueue';
beforeEach(() => setQueueUserResolver(() => 'u1'));

/** Giả lập lỗi mạng — đúng loại lỗi mà fetch ném ra khi mất kết nối. */
function networkError(): Error {
  return new TypeError('Failed to fetch');
}

/** Lỗi do dữ liệu sai, KHÔNG phải do mạng — xếp hàng chạy lại cũng vô ích. */
function validationError(): Error {
  return new Error('new row violates row-level security policy');
}

describe('Phân loại lỗi', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lỗi mạng thì đáng xếp hàng chạy lại', () => {
    expect(isRetriableError(networkError())).toBe(true);
    expect(isRetriableError(new Error('NetworkError when attempting to fetch'))).toBe(true);
    expect(isRetriableError(new Error('Không kết nối được máy chủ.'))).toBe(true);
  });

  it('lỗi do RLS chặn thì KHÔNG xếp hàng — chạy lại bao nhiêu lần cũng hỏng', () => {
    expect(isRetriableError(validationError())).toBe(false);
  });

  it('nhận ra lỗi do phiên đăng nhập chưa khôi phục', () => {
    expect(isAuthenticationPendingError(new Error('Phiên đăng nhập đã hết hạn.'))).toBe(true);
    expect(isAuthenticationPendingError(new Error('CAN_DANG_NHAP'))).toBe(true);
    expect(isAuthenticationPendingError(validationError())).toBe(false);
  });

  it('đang offline thì mọi lỗi đều coi là lỗi mạng', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(isRetriableError(validationError())).toBe(true);
  });
});

describe('runOrQueue', () => {
  beforeEach(() => {
    clearQueue();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    clearQueue();
    vi.restoreAllMocks();
  });

  it('ghi được thì không xếp hàng gì cả', async () => {
    const result = await runOrQueue('record-attempt', { a: 1 }, async () => {});

    expect(result).toEqual({ ok: true, queued: false });
    expect(queueSize()).toBe(0);
  });

  it('mất mạng thì xếp hàng để ghi lại sau', async () => {
    const result = await runOrQueue('record-attempt', { challengeId: 'l1-c1' }, async () => {
      throw networkError();
    });

    expect(result.ok).toBe(false);
    expect(result.queued).toBe(true);
    expect(queueSize()).toBe(1);
    expect(readQueue()[0].payload).toEqual({ challengeId: 'l1-c1' });
  });

  it('lỗi không phải do mạng thì báo lỗi chứ không xếp hàng', async () => {
    const result = await runOrQueue('record-attempt', {}, async () => {
      throw validationError();
    });

    expect(result.queued).toBe(false);
    expect(queueSize()).toBe(0);
  });
});

describe('Chạy lại hàng đợi khi có mạng', () => {
  beforeEach(() => {
    clearQueue();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    clearQueue();
    vi.restoreAllMocks();
  });

  it('ghi lại thành công thì hàng đợi trống', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    registerOfflineHandler('save-draft', handler);

    enqueue('save-draft', { code: 'int main() {}' });
    const result = await flushQueue();

    expect(handler).toHaveBeenCalledWith({ code: 'int main() {}' });
    expect(result.succeeded).toBe(1);
    expect(result.remaining).toBe(0);
    expect(queueSize()).toBe(0);
  });

  /**
   * Thứ tự quan trọng: nếu bản ghi tiến trình được xếp trước bản cộng XP thì
   * phải chạy đúng thứ tự đó, không thì số liệu của học sinh sẽ lệch.
   */
  it('chạy lại đúng theo thứ tự đã xếp', async () => {
    const order: string[] = [];
    registerOfflineHandler('upsert-lesson-progress', async (payload) => {
      order.push(`progress:${(payload as { step: number }).step}`);
    });
    registerOfflineHandler('add-experience', async (payload) => {
      order.push(`xp:${(payload as { step: number }).step}`);
    });

    enqueue('upsert-lesson-progress', { step: 1 });
    enqueue('add-experience', { step: 2 });
    enqueue('upsert-lesson-progress', { step: 3 });

    await flushQueue();

    expect(order).toEqual(['progress:1', 'xp:2', 'progress:3']);
  });

  it('vẫn mất mạng thì giữ lại trong hàng đợi và đếm số lần đã thử', async () => {
    registerOfflineHandler('save-draft', async () => {
      throw networkError();
    });

    enqueue('save-draft', { code: 'x' });
    const result = await flushQueue();

    expect(result.succeeded).toBe(0);
    expect(result.remaining).toBe(1);
    expect(readQueue()[0].attempts).toBe(1);
  });

  it('không xóa hay tăng số lần thử khi Auth chưa khôi phục xong', async () => {
    registerOfflineHandler('submit-challenge-secure', async () => {
      throw new Error('Phiên đăng nhập đã hết hạn. Em đăng nhập lại nhé.');
    });

    enqueue('submit-challenge-secure', { userId: 'u1', lessonId: 'a0', challengeId: 'a0-c1-first-program' });
    enqueue('submit-challenge-secure', { userId: 'u1', lessonId: 'a0', challengeId: 'a0-c2-cout' });
    const result = await flushQueue();

    expect(result.dropped).toBe(0);
    expect(result.remaining).toBe(2);
    expect(readQueue().map((item) => item.attempts)).toEqual([0, 0]);
  });

  /** Một mục hỏng vĩnh viễn không được phép chặn cả hàng đợi. */
  it('bỏ mục hỏng vĩnh viễn thay vì để nó kẹt mãi', async () => {
    registerOfflineHandler('save-draft', async () => {
      throw validationError();
    });

    enqueue('save-draft', { code: 'x' });
    const result = await flushQueue();

    expect(result.dropped).toBe(1);
    expect(queueSize()).toBe(0);
  });

  it('giữ bài khi mất mạng quá 5 lần', async () => {
    registerOfflineHandler('save-draft', async () => {
      throw networkError();
    });

    enqueue('save-draft', { code: 'x' });

    for (let round = 0; round < 5; round += 1) {
      await flushQueue();
    }

    expect(queueSize()).toBe(1);
  });

  it('mạng hỏng thì chưa nộp bước sau trước bước đang chờ', async () => {
    const ok = vi.fn().mockResolvedValue(undefined);
    registerOfflineHandler('add-experience', ok);
    registerOfflineHandler('save-draft', async () => {
      throw networkError();
    });

    enqueue('save-draft', { code: 'x' });
    enqueue('add-experience', { totalXp: 100 });

    const result = await flushQueue();

    expect(ok).not.toHaveBeenCalled();
    expect(result.succeeded).toBe(0);
    expect(result.remaining).toBe(2);
  });

  it('chưa có handler thì giữ lại chờ lần sau, không bỏ mất dữ liệu', async () => {
    enqueue('submit-exit-ticket', { lessonId: 'l1' });
    const result = await flushQueue();

    expect(result.succeeded).toBe(0);
    expect(result.dropped).toBe(0);
    expect(queueSize()).toBe(1);
  });

  it('hàng đợi trống thì không làm gì cả', async () => {
    const result = await flushQueue();
    expect(result).toEqual({ processed: 0, succeeded: 0, remaining: 0, dropped: 0 });
  });
});

describe('Hàng đợi sống sót qua việc đóng tab', () => {
  beforeEach(() => clearQueue());
  afterEach(() => clearQueue());

  it('dữ liệu nằm trong localStorage nên mở lại vẫn còn', () => {
    enqueue('record-attempt', { challengeId: 'l3-c9-boss' });

    // Đọc thẳng từ localStorage, mô phỏng việc mở lại trang
    const raw = localStorage.getItem('cq8:offline-queue');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)[0].payload).toEqual({ challengeId: 'l3-c9-boss' });
  });

  it('localStorage hỏng thì trả về hàng đợi rỗng chứ không làm sập ứng dụng', () => {
    localStorage.setItem('cq8:offline-queue', 'day khong phai JSON');
    expect(readQueue()).toEqual([]);
  });

  it('cung cấp node đang chờ để route mới không khóa nhầm học sinh', () => {
    enqueue('submit-challenge-secure', {
      userId: 'u1', lessonId: 'a0', challengeId: 'a0-c1-first-program', optimisticCorrect: true,
    });
    enqueue('submit-challenge-secure', {
      lessonId: 'a0', challengeId: 'a0-c2-cout', optimisticCorrect: false,
    });
    enqueue('submit-challenge-secure', {
      lessonId: 'a1', challengeId: 'a1-c1-move-right', optimisticCorrect: true,
    });

    expect(getQueuedChallengeIds('a0', 'u1')).toEqual(['a0-c1-first-program']);
    expect(getQueuedChallengeIds('a0', 'u2')).toEqual([]);
  });
  it('không nộp bài của tài khoản trước hoặc bài chưa rõ chủ sở hữu', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    registerOfflineHandler('submit-challenge-secure', handler);
    enqueue('submit-challenge-secure', { userId: 'u2', challengeId: 'c1' });
    enqueue('submit-challenge-secure', { challengeId: 'legacy' });
    enqueue('submit-challenge-secure', { userId: 'u1', challengeId: 'c2' });
    await flushQueue();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ userId: 'u1', challengeId: 'c2' });
    expect(readQueue()).toHaveLength(2);
  });
  it('hai lần flush cùng lúc không nộp trùng và không xóa bài vừa thêm', async () => {
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    const handler = vi.fn(() => pending);
    registerOfflineHandler('save-draft', handler);
    enqueue('save-draft', { code: 'old' });
    const first = flushQueue();
    const second = flushQueue();
    enqueue('save-draft', { code: 'new' });
    release();
    await Promise.all([first, second]);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(readQueue().map(item => item.payload)).toEqual([{ code: 'new' }]);
  });
});
