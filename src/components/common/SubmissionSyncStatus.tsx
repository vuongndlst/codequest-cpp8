import { useEffect, useState } from 'react';
import { RefreshCw, CloudUpload } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AUTH_PENDING_MESSAGE, QUEUE_CHANGED_EVENT, readQueue, retryCurrentUserQueue } from '@/services/offlineQueue';

/** Compact, shown only while THIS student's submissions await confirmation. */
export function SubmissionSyncStatus() {
  const userId = useAuthStore(state => state.user?.id);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const update = () => setVersion(value => value + 1);
    window.addEventListener(QUEUE_CHANGED_EVENT, update);
    return () => window.removeEventListener(QUEUE_CHANGED_EVENT, update);
  }, []);
  void version;
  const entries = userId ? readQueue().filter(item => (item.payload as { userId?: string })?.userId === userId) : [];
  if (!entries.length) return null;
  const blocked = entries.some(item => item.blocked);
  const needsAuth = entries.some(item => item.lastError === AUTH_PENDING_MESSAGE);
  const reason = needsAuth
    ? ' · Phiên đăng nhập đã hết hạn, em đăng nhập lại'
    : blocked
      ? ' · Cần kiểm tra quyền mở nhiệm vụ'
      : '';
  return <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950" role="status">
    <CloudUpload className="size-4 shrink-0" aria-hidden="true" />
    <span>{entries.length} bài chờ xác nhận{reason}</span>
    <button type="button" disabled={busy} title="Gửi lại các bài đã lưu trên máy, không xóa code" className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-amber-700/30 px-2 py-1 hover:bg-amber-200 focus-visible:outline-2 disabled:opacity-60" onClick={async () => {
      setBusy(true); setError('');
      try { await retryCurrentUserQueue(); }
      catch { setError('Chưa đồng bộ được. Em giữ trang mở rồi thử lại khi có mạng.'); }
      finally { setBusy(false); }
    }}><RefreshCw className={`size-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />{busy ? 'Đang gửi' : 'Đồng bộ lại'}</button>
    {error && <span>{error}</span>}
  </div>;
}
