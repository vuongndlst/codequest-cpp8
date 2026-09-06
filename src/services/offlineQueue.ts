/** Per-item persistent outbox: no whole-array overwrites and no silent eviction.
 * Old queues migrate only after every item has been written successfully. */
const LEGACY_KEY = 'cq8:offline-queue';
const PREFIX = 'cq8:outbox:v2:';
const MAX_QUEUE_SIZE = 200;
export const QUEUE_CHANGED_EVENT = 'cq8:queue-changed';
export type QueuedOperationType = 'submit-challenge-secure' | 'submit-checkpoint-secure'
  | 'record-attempt' | 'upsert-lesson-progress' | 'add-experience' | 'submit-exit-ticket' | 'save-draft';
export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  payload: unknown;
  queuedAt: string;
  attempts: number;
  blocked?: boolean;
  lastError?: string;
}
type OperationHandler = (payload: unknown) => Promise<void>;
const handlers = new Map<QueuedOperationType, OperationHandler>();
let currentUserId: () => string | null = () => null;
export function setQueueUserResolver(resolve: () => string | null): void { currentUserId = resolve; }
export function registerOfflineHandler(type: QueuedOperationType, handler: OperationHandler): void { handlers.set(type, handler); }
function valid(value: unknown): value is QueuedOperation {
  const item = value as QueuedOperation | null;
  return Boolean(item && typeof item.id === 'string' && typeof item.type === 'string'
    && typeof item.queuedAt === 'string' && item.payload && typeof item.payload === 'object' && typeof item.attempts === 'number');
}
function legacyItems(): QueuedOperation[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '[]');
    return Array.isArray(data) ? data.filter(valid) : [];
  } catch { return []; }
}
export function readQueue(): QueuedOperation[] {
  const items = new Map(legacyItems().map(item => [item.id, item]));
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      try {
        const item: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (valid(item)) items.set(item.id, item);
      } catch { /* Preserve malformed items, don't crash the page. */ }
    }
  } catch { /* Storage may be disabled. */ }
  return [...items.values()].sort((a, b) => a.queuedAt.localeCompare(b.queuedAt) || a.id.localeCompare(b.id));
}
function changed() { if (typeof window !== 'undefined') window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT)); }
function writeItem(item: QueuedOperation): void { localStorage.setItem(PREFIX + item.id, JSON.stringify(item)); }
function migrateLegacy(): void {
  for (const item of legacyItems()) if (!localStorage.getItem(PREFIX + item.id)) writeItem(item);
  // If a write throws, the source remains untouched.
  if (legacyItems().length) localStorage.removeItem(LEGACY_KEY);
}
function ownerOf(item: QueuedOperation) { return (item.payload as { userId?: string })?.userId; }
function secure(type: QueuedOperationType) { return type.endsWith('-secure'); }
function storageError() { return new Error('Chưa lưu được bài chờ gửi vì bộ nhớ trình duyệt đầy hoặc bị chặn. Em giữ trang này mở, kết nối mạng rồi chạy lại; chưa có xác nhận lưu bài.'); }
export function getQueuedChallengeIds(lessonId: string, userId: string): string[] {
  return [...new Set(readQueue().filter(item => !item.blocked && item.type === 'submit-challenge-secure' && ownerOf(item) === userId)
    .map(item => item.payload as { lessonId?: string; challengeId?: string; optimisticCorrect?: boolean })
    .filter(p => p.lessonId === lessonId && typeof p.challengeId === 'string' && p.optimisticCorrect === true)
    .map(p => p.challengeId!))];
}
export function queueSize() { return readQueue().length; }
let sequence = 0;
export function enqueue(type: QueuedOperationType, payload: unknown): void {
  try {
    migrateLegacy();
    if (readQueue().length >= MAX_QUEUE_SIZE) throw storageError();
    writeItem({ id: Date.now() + '-' + String(sequence++).padStart(6, '0') + '-' + crypto.randomUUID(),
      type, payload, queuedAt: new Date().toISOString(), attempts: 0 });
    changed();
    scheduleRetry();
  } catch { throw storageError(); }
}
/** Only for tests / explicit clearing; never called on logout. */
export function clearQueue(): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    keys.filter((key): key is string => Boolean(key?.startsWith(PREFIX))).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(LEGACY_KEY);
    changed();
  } catch { /* no removal possible */ }
}
export function isRetriableError(error: unknown): boolean {
  const typed = error as { retryable?: boolean; isOffline?: boolean } | null;
  if (typed?.retryable || typed?.isOffline) return true;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return ['failed to fetch', 'networkerror', 'network request failed', 'failed to send a request', 'load failed', 'không kết nối được', 'timeout'].some(part => message.includes(part));
}
export function isAuthenticationPendingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return ['can_dang_nhap', 'cần đăng nhập', 'phiên đăng nhập', 'jwt'].some(part => message.includes(part));
}
export interface RunOrQueueResult { ok: boolean; queued: boolean; error?: unknown; }
export async function runOrQueue(type: QueuedOperationType, payload: unknown, operation: () => Promise<void>): Promise<RunOrQueueResult> {
  const owner = (payload as { userId?: string })?.userId;
  // New submissions cannot overtake earlier offline prerequisites.
  if (secure(type) && owner && readQueue().some(item => secure(item.type) && ownerOf(item) === owner)) {
    try { enqueue(type, payload); setTimeout(() => { void flushQueue(); }, 0); return { ok: false, queued: true }; }
    catch (error) { return { ok: false, queued: false, error }; }
  }
  try { await operation(); return { ok: true, queued: false }; }
  catch (error) {
    if (isRetriableError(error) || isAuthenticationPendingError(error)) {
      try { enqueue(type, payload); return { ok: false, queued: true, error }; }
      catch (storageFailure) { return { ok: false, queued: false, error: storageFailure }; }
    }
    return { ok: false, queued: false, error };
  }
}
export interface FlushResult { processed: number; succeeded: number; remaining: number; /** Rejections retained for review, not deleted. */ dropped: number; }
let activeFlush: Promise<FlushResult> | null = null;
export function flushQueue(): Promise<FlushResult> {
  if (!activeFlush) {
    // Browser-managed lock is released automatically if a tab closes.
    const work = (async () => typeof navigator !== 'undefined' && navigator.locks
      ? await navigator.locks.request('cq8:outbox-sync', () => flushQueueOnce()) : await flushQueueOnce())();
    // A denied browser lock must not become an unhandled rejection or trigger an unlocked flush.
    activeFlush = work.catch(() => ({ processed: 0, succeeded: 0, remaining: queueSize(), dropped: 0 }))
      .finally(() => { activeFlush = null; scheduleRetry(); });
  }
  return activeFlush;
}
async function flushQueueOnce(): Promise<FlushResult> {
  let succeeded = 0, dropped = 0, processed = 0;
  try {
    migrateLegacy();
    const heldOwners = new Set<string>();
    for (const item of readQueue()) {
      const owner = ownerOf(item);
      if ((secure(item.type) && (!owner || owner !== currentUserId())) || (owner && owner !== currentUserId())) continue;
      if (owner && heldOwners.has(owner)) continue;
      if (item.blocked || !handlers.has(item.type)) { if (owner) heldOwners.add(owner); continue; }
      if (!localStorage.getItem(PREFIX + item.id)) continue;
      processed++;
      try {
        await handlers.get(item.type)!(item.payload);
        localStorage.removeItem(PREFIX + item.id);
        succeeded++;
      } catch (error) {
        if (isAuthenticationPendingError(error)) break;
        const retryable = isRetriableError(error);
        if (localStorage.getItem(PREFIX + item.id)) writeItem({ ...item, attempts: item.attempts + 1,
          blocked: !retryable, lastError: retryable ? 'Đang chờ kết nối máy chủ.' : 'Máy chủ chưa chấp nhận bài. Em kiểm tra quyền mở nhiệm vụ rồi đồng bộ lại.' });
        if (!retryable) dropped++;
        break; // Preserve submission order, including when a teacher closes a gate.
      }
    }
  } catch { /* Original persisted items remain; storage failure is not an acknowledgement. */ }
  changed();
  if (succeeded > 0 && typeof window !== 'undefined') window.dispatchEvent(new Event('cq8:progress-synced'));
  return { processed, succeeded, remaining: queueSize(), dropped };
}
export async function retryCurrentUserQueue(): Promise<FlushResult> {
  try {
    migrateLegacy();
    for (const item of readQueue()) if (ownerOf(item) === currentUserId()) writeItem({ ...item, blocked: false });
  } catch { throw storageError(); }
  changed();
  return flushQueue();
}
let listenerAttached = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRetry() {
  if (!listenerAttached || retryTimer || !navigator.onLine) return;
  const pending = readQueue().filter(item => !item.blocked && ownerOf(item) === currentUserId());
  if (!pending.length) return;
  const delay = Math.min(300_000, 15_000 * 2 ** Math.min(5, pending[0].attempts));
  retryTimer = setTimeout(() => { retryTimer = null; void flushQueue(); }, delay);
}
export function startOfflineQueueWatcher(): void {
  if (listenerAttached || typeof window === 'undefined') return;
  listenerAttached = true;
  const reconnect = () => { if (navigator.onLine) void flushQueue(); };
  window.addEventListener('online', reconnect);
  window.addEventListener('focus', reconnect);
  window.addEventListener('storage', event => { if (event.key?.startsWith(PREFIX)) changed(); });
  reconnect();
}
