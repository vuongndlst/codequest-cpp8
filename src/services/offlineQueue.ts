/**
 * Hàng đợi ghi dữ liệu khi mất mạng (mục 23 của đề bài).
 *
 * VẤN ĐỀ CẦN GIẢI: Wi-Fi phòng máy hay chập chờn. Nếu học sinh vừa hoàn thành
 * Boss Challenge mà đúng lúc đó mạng rớt, công sức cả tiết học biến mất — và
 * các em sẽ không bao giờ tin cái website này nữa.
 *
 * CÁCH LÀM: mọi thao tác ghi đều đi qua `runOrQueue`. Ghi được thì thôi; ghi
 * hỏng vì mạng thì xếp vào hàng đợi trong localStorage và tự chạy lại khi có
 * mạng. Hàng đợi sống sót qua cả việc đóng tab hay tắt máy.
 *
 * PHẠM VI: chỉ xếp hàng những thao tác GHI mà mất đi thì học sinh thiệt thòi.
 * Việc ĐỌC thì không xếp hàng — đọc hỏng chỉ cần thử lại là xong.
 */

const STORAGE_KEY = 'cq8:offline-queue';
const MAX_QUEUE_SIZE = 200;

/** Các loại thao tác được phép xếp hàng. */
export type QueuedOperationType =
  | 'submit-challenge-secure'
  | 'submit-checkpoint-secure'
  | 'record-attempt'
  | 'upsert-lesson-progress'
  | 'add-experience'
  | 'submit-exit-ticket'
  | 'save-draft';

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  payload: unknown;
  queuedAt: string;
  /** Số lần đã thử; không xóa bài chỉ vì mạng hỏng nhiều lần. */
  attempts: number;
}

type OperationHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<QueuedOperationType, OperationHandler>();
let currentUserId: () => string | null = () => null;
export function setQueueUserResolver(resolve: () => string | null): void {
  currentUserId = resolve;
}

/**
 * Đăng ký cách chạy lại một loại thao tác.
 *
 * Đăng ký thay vì import trực tiếp để tránh phụ thuộc vòng tròn: các repository
 * cần gọi `runOrQueue`, mà hàng đợi lại cần gọi ngược về repository.
 */
export function registerOfflineHandler(
  type: QueuedOperationType,
  handler: OperationHandler,
): void {
  handlers.set(type, handler);
}

export function readQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedOperation[];
    return Array.isArray(parsed) ? parsed.filter(item =>
      item && typeof item.id === 'string' && typeof item.type === 'string'
      && item.payload && typeof item.payload === 'object'
      && typeof item.attempts === 'number',
    ) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedOperation[]): void {
  try {
    // Giữ lại các mục MỚI NHẤT khi tràn: dữ liệu học tập gần đây có giá trị hơn
    const trimmed = queue.slice(-MAX_QUEUE_SIZE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage đầy hoặc bị chặn — không làm gì được thêm
  }
}

/**
 * Lấy các nhiệm vụ đã hoàn thành cục bộ nhưng còn chờ máy chủ xác nhận.
 *
 * Đây chỉ là dữ liệu mở khóa ở tầng UX. Edge Function vẫn chấm lại và database
 * vẫn kiểm tra thứ tự nhiệm vụ, nên sửa localStorage không thể tạo XP/Gem thật.
 */
export function getQueuedChallengeIds(lessonId: string, userId: string): string[] {
  const ids = readQueue()
    .filter((item) => item.type === 'submit-challenge-secure')
    .map((item) => item.payload as {
      lessonId?: unknown;
      challengeId?: unknown;
      optimisticCorrect?: unknown;
      userId?: unknown;
    })
    .filter((payload) =>
      payload.lessonId === lessonId &&
      payload.userId === userId &&
      typeof payload.challengeId === 'string' &&
      payload.optimisticCorrect === true,
    )
    .map((payload) => payload.challengeId as string);
  return [...new Set(ids)];
}

export function queueSize(): number {
  return readQueue().length;
}

export function enqueue(type: QueuedOperationType, payload: unknown): void {
  const queue = readQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    payload,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  });
  writeQueue(queue);
}

export function clearQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* bỏ qua */
  }
}

/** Lỗi do mạng thì đáng xếp hàng; lỗi do dữ liệu sai thì xếp hàng cũng vô ích. */
export function isRetriableError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (error instanceof TypeError) return true;

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('failed to send a request') ||
    message.includes('load failed') ||
    message.includes('không kết nối được') ||
    message.includes('timeout')
  );
}

/**
 * Phiên Supabase được khôi phục bất đồng bộ khi trang vừa mở. Nếu hàng đợi chạy
 * sớm hơn bước đó, lỗi đăng nhập chỉ có nghĩa là "chưa sẵn sàng", không phải dữ
 * liệu học tập hỏng. Tuyệt đối không tăng số lần thử hay xóa mục trong trường hợp này.
 */
export function isAuthenticationPendingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('can_dang_nhap') ||
    message.includes('cần đăng nhập') ||
    message.includes('phiên đăng nhập') ||
    message.includes('jwt')
  );
}

export interface RunOrQueueResult {
  ok: boolean;
  /** true nếu thao tác đã được xếp hàng để chạy lại sau */
  queued: boolean;
  error?: unknown;
}

/**
 * Chạy một thao tác ghi; hỏng vì mạng thì xếp hàng để chạy lại.
 *
 * Trả về kết quả thay vì ném lỗi, vì với hầu hết thao tác thì "đã xếp hàng"
 * cũng coi như thành công dưới góc nhìn của học sinh.
 */
export async function runOrQueue(
  type: QueuedOperationType,
  payload: unknown,
  operation: () => Promise<void>,
): Promise<RunOrQueueResult> {
  try {
    await operation();
    return { ok: true, queued: false };
  } catch (error) {
    if (isRetriableError(error)) {
      enqueue(type, payload);
      return { ok: false, queued: true, error };
    }
    return { ok: false, queued: false, error };
  }
}

export interface FlushResult {
  processed: number;
  succeeded: number;
  remaining: number;
  /** Số mục bị máy chủ từ chối vĩnh viễn (không phải lỗi mạng). */
  dropped: number;
}

/**
 * Chạy lại toàn bộ hàng đợi theo đúng thứ tự đã xếp.
 *
 * Thứ tự quan trọng: nếu bản ghi tiến trình được xếp trước bản ghi cộng XP thì
 * phải chạy đúng thứ tự đó, không thì số liệu sẽ lệch.
 */
let activeFlush: Promise<FlushResult> | null = null;
export function flushQueue(): Promise<FlushResult> {
  if (!activeFlush) activeFlush = flushQueueOnce().finally(() => { activeFlush = null; });
  return activeFlush;
}

async function flushQueueOnce(): Promise<FlushResult> {
  const queue = readQueue();
  if (queue.length === 0) {
    return { processed: 0, succeeded: 0, remaining: 0, dropped: 0 };
  }

  const stillPending: QueuedOperation[] = [];
  let succeeded = 0;
  let dropped = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    const handler = handlers.get(item.type);
    const owner = (item.payload as { userId?: string } | null)?.userId;
    const secure = item.type === 'submit-challenge-secure' || item.type === 'submit-checkpoint-secure';
    // Không gán bài offline cho học sinh đăng nhập sau trên cùng máy. Mục cũ
    // chưa có chủ sở hữu được giữ lại, không tự đoán tài khoản để nộp.
    if ((secure && (!owner || owner !== currentUserId())) || (owner && owner !== currentUserId())) {
      stillPending.push(item);
      continue;
    }

    // Chưa có handler (vd. trang chưa nạp xong module đó) -> giữ lại chờ lần sau
    if (!handler) {
      stillPending.push(item);
      continue;
    }

    try {
      await handler(item.payload);
      succeeded += 1;
    } catch (error) {
      if (isAuthenticationPendingError(error)) {
        // Giữ nguyên mục hiện tại và toàn bộ phần sau để bảo toàn đúng thứ tự.
        // AuthStore sẽ gọi flushQueue() lần nữa ngay khi session đã sẵn sàng.
        stillPending.push(item, ...queue.slice(index + 1));
        break;
      }

      const attempts = item.attempts + 1;

      if (!isRetriableError(error)) {
        // Bỏ hẳn: một mục hỏng vĩnh viễn không được phép chặn cả hàng đợi
        dropped += 1;
        continue;
      }

      // Dừng ở lỗi mạng: nộp node sau trước node này sẽ bị từ chối thứ tự.
      // Không xóa bài chỉ vì Wi-Fi hỏng nhiều lần.
      stillPending.push({ ...item, attempts }, ...queue.slice(index + 1));
      break;
    }
  }

  // Một lần chạy mới có thể enqueue trong lúc đang await. Giữ các mục đó.
  const snapshotIds = new Set(queue.map(item => item.id));
  const latest = readQueue();
  const latestIds = new Set(latest.map(item => item.id));
  const remaining = [
    ...stillPending.filter(item => latestIds.has(item.id)),
    ...latest.filter(item => !snapshotIds.has(item.id)),
  ];
  writeQueue(remaining);
  if (succeeded > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cq8:progress-synced'));
  }

  return {
    processed: queue.length,
    succeeded,
    remaining: remaining.length,
    dropped,
  };
}

let listenerAttached = false;

/** Tự chạy lại hàng đợi khi có mạng trở lại. Gọi một lần lúc khởi động ứng dụng. */
export function startOfflineQueueWatcher(): void {
  if (listenerAttached || typeof window === 'undefined') return;
  listenerAttached = true;

  window.addEventListener('online', () => {
    void flushQueue();
  });

  // Thử ngay lúc khởi động: có thể tiết trước học sinh đã tắt máy khi đang offline
  if (navigator.onLine) {
    void flushQueue();
  }
}
