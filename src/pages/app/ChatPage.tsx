import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare, Ticket } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { MessageThread } from '@/components/chat/MessageThread';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { fetchMyClass, type ClassRow } from '@/services/supabase/classes.repo';
import {
  fetchThread,
  markThreadRead,
  sendMessage,
  type MessageRow,
} from '@/services/supabase/messages.repo';

/** Khoảng thời gian hỏi lại máy chủ xem có tin mới không. */
const POLL_INTERVAL_MS = 15_000;

/**
 * Học sinh hỏi thầy cô.
 *
 * Một học sinh có ĐÚNG MỘT luồng hội thoại, với cả nhóm giáo viên của lớp
 * mình. Thầy cô nào rảnh thì trả lời — em không phải chọn hỏi ai, và cũng
 * không nhắn riêng được cho một người, đúng nguyên tắc lớp học.
 */
export function ChatPage() {
  const profile = useAuthStore((state) => state.profile);
  const myId = profile?.id;

  const [classRow, setClassRow] = useState<ClassRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Giữ id lớp trong ref để vòng hỏi lại không phải dựng lại mỗi lần state đổi
  const classIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const classId = classIdRef.current;
    if (!classId || !myId) return;

    const rows = await fetchThread(classId, myId);
    setMessages(rows);

    // Mở màn hình chat nghĩa là đã đọc
    if (rows.some((row) => !row.read_by_student)) {
      await markThreadRead(classId, myId);
    }
  }, [myId]);

  useEffect(() => {
    if (!myId) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const row = await fetchMyClass();
        if (cancelled) return;

        setClassRow(row);
        classIdRef.current = row?.id ?? null;

        if (row) await refresh();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Không mở được cuộc trò chuyện.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [myId, refresh]);

  /*
    Hỏi lại máy chủ theo chu kỳ thay vì dùng Realtime của Supabase.

    Realtime cần bật thêm publication cho bảng; nếu dự án chưa bật thì màn hình
    chat im lặng không báo lỗi gì. Hỏi lại mỗi 15 giây thì luôn chạy, không phụ
    thuộc cấu hình, và đủ nhanh cho việc hỏi bài trong lớp.

    Dừng hẳn khi học sinh chuyển sang tab khác — không tiêu mạng vô ích ở phòng
    máy dùng chung Wi-Fi.
  */
  useEffect(() => {
    if (!classRow || !myId) return;

    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    const timer = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [classRow, myId, refresh]);

  const handleSend = async (body: string) => {
    if (!classRow || !myId) return;

    setIsSending(true);
    try {
      const sent = await sendMessage({ classId: classRow.id, studentId: myId, body });
      setMessages((current) => [...current, sent]);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <LoadingState label="Đang mở cuộc trò chuyện…" />;
  if (error) return <ErrorState description={error} onRetry={() => window.location.reload()} />;

  if (!classRow) {
    return (
      <EmptyState
        title="Em cần vào lớp trước đã"
        description="Hỏi đáp diễn ra trong phạm vi lớp của em, nên em nhập mã lớp thầy cô cho trước nhé."
        action={
          <Link to="/app/join-class">
            <Button leadingIcon={<Ticket className="size-4" aria-hidden="true" />}>
              Nhập mã lớp
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100">Hỏi thầy cô</h1>
        <p className="text-sm text-slate-400 mt-1">
          Em đang ở lớp {classRow.name}. Thầy cô của lớp đều đọc được câu hỏi của em.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Cuộc trò chuyện của em"
          description="Em cứ hỏi thoải mái — hỏi bài là chuyện hoàn toàn bình thường"
          icon={<MessagesSquare className="size-5 text-quest-400" aria-hidden="true" />}
        />

        <MessageThread
          messages={messages}
          viewerRole="student"
          onSend={handleSend}
          isSending={isSending}
          emptyHint="Em viết câu hỏi đầu tiên đi. Nói rõ em đang làm nhiệm vụ nào và vướng ở chỗ nào thì thầy cô trả lời nhanh hơn."
          placeholder="Ví dụ: Em làm nhiệm vụ Cây cầu ánh sáng, chạy code thì báo thiếu dấu chấm phẩy mà em tìm mãi không ra…"
        />
      </Card>

      <Alert tone="tip">
        Thầy cô không phải lúc nào cũng trả lời ngay được. Trong lúc chờ, em thử bấm gợi ý ở màn
        hình nhiệm vụ — ba mức gợi ý thường đủ để gỡ vướng.
      </Alert>

      <p className="text-xs text-slate-500 leading-relaxed">
        Tin nhắn ở đây chỉ có em và thầy cô của lớp đọc được. Bạn cùng lớp không đọc được. Tin đã
        gửi thì không sửa hay xoá được, nên em viết cẩn thận nhé.
      </p>
    </div>
  );
}
