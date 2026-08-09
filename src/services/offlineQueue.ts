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
const MAX_ATTEMPTS_PER_ITEM = 5;

/** Các loại thao tác được phép xếp hàng. */
export type QueuedOperationType =
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
  /** Số lần đã thử chạy lại — quá ngưỡng thì bỏ để hàng đợi không kẹt mãi */
  attempts: number;
}

type OperationHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<QueuedOperationType, OperationHandler>();

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
    return Array.isArray(parsed) ? parsed : [];
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
    message.includes('load failed') ||
    message.includes('không kết nối được') ||
    message.includes('timeout')
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
  /** Số mục bị bỏ vì thử lại quá nhiều lần */
  dropped: number;
}

/**
 * Chạy lại toàn bộ hàng đợi theo đúng thứ tự đã xếp.
 *
 * Thứ tự quan trọng: nếu bản ghi tiến trình được xếp trước bản ghi cộng XP thì
 * phải chạy đúng thứ tự đó, không thì số liệu sẽ lệch.
 */
export async function flushQueue(): Promise<FlushResult> {
  const queue = readQueue();
  if (queue.length === 0) {
    return { processed: 0, succeeded: 0, remaining: 0, dropped: 0 };
  }

  const stillPending: QueuedOperation[] = [];
  let succeeded = 0;
  let dropped = 0;

  for (const item of queue) {
    const handler = handlers.get(item.type);

    // Chưa có handler (vd. trang chưa nạp xong module đó) -> giữ lại chờ lần sau
    if (!handler) {
      stillPending.push(item);
      continue;
    }

    try {
      await handler(item.payload);
      succeeded += 1;
    } catch (error) {
      const attempts = item.attempts + 1;

      if (!isRetriableError(error) || attempts >= MAX_ATTEMPTS_PER_ITEM) {
        // Bỏ hẳn: một mục hỏng vĩnh viễn không được phép chặn cả hàng đợi
        dropped += 1;
        continue;
      }

      stillPending.push({ ...item, attempts });
    }
  }

  writeQueue(stillPending);

  return {
    processed: queue.length,
    succeeded,
    remaining: stillPending.length,
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
