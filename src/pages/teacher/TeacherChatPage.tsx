import { useCallback, useEffect, useRef, useState } from 'react';
import { MessagesSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { MessageThread } from '@/components/chat/MessageThread';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import {
  buildThreadSummaries,
  deleteMessage,
  fetchRecentMessagesForTeacher,
  fetchThread,
  markThreadRead,
  sendMessage,
  type MessageRow,
  type ThreadSummary,
} from '@/services/supabase/messages.repo';
import { fetchMyClasses, type ClassRow } from '@/services/supabase/classes.repo';
import { fetchStudents, type StudentProfile } from '@/services/supabase/teacher.repo';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';

const POLL_INTERVAL_MS = 20_000;

/** Hộp thư hỏi đáp của giáo viên: danh sách học sinh đang hỏi + cuộc trò chuyện. */
export function TeacherChatPage() {
  const profile = useAuthStore((state) => state.profile);

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selected, setSelected] = useState<{ classId: string; studentId: string } | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const loadThreads = useCallback(async () => {
    const recent = await fetchRecentMessagesForTeacher();
    setThreads(buildThreadSummaries(recent));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [recent, studentRows, classRows] = await Promise.all([
          fetchRecentMessagesForTeacher(),
          fetchStudents(),
          fetchMyClasses(),
        ]);
        if (cancelled) return;

        setThreads(buildThreadSummaries(recent));
        setStudents(studentRows);
        setClasses(classRows);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được hộp thư.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Hỏi lại máy chủ theo chu kỳ, chỉ khi tab đang được xem
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      void loadThreads();

      const current = selectedRef.current;
      if (current) {
        void fetchThread(current.classId, current.studentId).then(setMessages);
      }
    };

    const timer = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [loadThreads]);

  const openThread = async (classId: string, studentId: string) => {
    setSelected({ classId, studentId });
    const rows = await fetchThread(classId, studentId);
    setMessages(rows);

    if (rows.some((row) => !row.read_by_teacher)) {
      await markThreadRead(classId, studentId);
      await loadThreads();
    }
  };

  const handleSend = async (body: string) => {
    if (!selected) return;
    setIsSending(true);
    try {
      const sent = await sendMessage({
        classId: selected.classId,
        studentId: selected.studentId,
        body,
      });
      setMessages((current) => [...current, sent]);
      await loadThreads();
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId);
    setMessages((current) => current.filter((message) => message.id !== messageId));
    await loadThreads();
  };

  if (isLoading) return <LoadingState label="Đang tải hộp thư hỏi đáp…" />;
  if (error) return <ErrorState description={error} onRetry={() => window.location.reload()} />;

  const studentById = new Map(students.map((student) => [student.id, student]));
  const classById = new Map(classes.map((classRow) => [classRow.id, classRow]));
  const totalUnread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  const selectedStudent = selected ? studentById.get(selected.studentId) : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100">Hỏi đáp với học sinh</h1>
        <p className="text-sm text-slate-400 mt-1">
          Xin chào {profile?.full_name}.{' '}
          {totalUnread > 0
            ? `Có ${totalUnread} tin chưa đọc.`
            : 'Không có tin nào chưa đọc.'}{' '}
          Mọi giáo viên của lớp đều trả lời được cùng một cuộc trò chuyện.
        </p>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          title="Chưa có học sinh nào hỏi bài"
          description="Khi học sinh gửi câu hỏi, cuộc trò chuyện sẽ hiện ở đây. Thầy cô nhắc các em rằng hỏi bài là chuyện bình thường — nhiều em ngại hỏi hơn ta tưởng."
        />
      ) : (
        <div className="grid lg:grid-cols-5 gap-4 items-start">
          {/* --- Danh sách cuộc trò chuyện --- */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title={`Cuộc trò chuyện (${threads.length})`}
                description="Tin mới nhất lên đầu"
                headingLevel={2}
              />

              <ul className="space-y-2 list-none max-h-[520px] overflow-y-auto pr-1">
                {threads.map((thread) => {
                  const student = studentById.get(thread.studentId);
                  const classRow = classById.get(thread.classId);
                  const isActive =
                    selected?.classId === thread.classId &&
                    selected?.studentId === thread.studentId;

                  return (
                    <li key={`${thread.classId}-${thread.studentId}`}>
                      <button
                        type="button"
                        onClick={() => void openThread(thread.classId, thread.studentId)}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'w-full text-left flex items-start gap-3 cq-panel p-3 transition-colors',
                          isActive ? 'border-quest-500/60' : 'hover:border-abyss-500',
                        )}
                      >
                        <AvatarIcon avatarId={student?.avatar_id} size={36} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 truncate">
                              {student?.full_name ?? 'Học sinh'}
                            </span>
                            {thread.unreadCount > 0 && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-alert-500 text-white">
                                {thread.unreadCount} mới
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 truncate">
                            {thread.lastMessage.sender_role === 'teacher' && 'Thầy cô: '}
                            {thread.lastMessage.body}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {classRow?.name && <>{classRow.name} · </>}
                            {formatRelativeTime(thread.lastMessage.created_at)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          {/* --- Cuộc trò chuyện đang mở --- */}
          <div className="lg:col-span-3">
            <Card>
              {selected ? (
                <>
                  <CardHeader
                    title={selectedStudent?.full_name ?? 'Học sinh'}
                    description={classById.get(selected.classId)?.name ?? undefined}
                    icon={
                      <MessagesSquare className="size-5 text-quest-400" aria-hidden="true" />
                    }
                    headingLevel={2}
                  />

                  <MessageThread
                    messages={messages}
                    viewerRole="teacher"
                    onSend={handleSend}
                    onDelete={handleDelete}
                    isSending={isSending}
                    emptyHint="Chưa có tin nhắn nào trong cuộc trò chuyện này."
                    placeholder="Trả lời em…"
                  />
                </>
              ) : (
                <EmptyState
                  title="Chọn một học sinh"
                  description="Bấm vào một cuộc trò chuyện bên trái để đọc và trả lời."
                />
              )}
            </Card>
          </div>
        </div>
      )}

      <Alert tone="tip">
        Gợi ý sư phạm: trả lời bằng một câu hỏi ngược thường dạy được nhiều hơn là đưa thẳng đáp
        án — ví dụ "em thử đọc kỹ dòng 7 xem thiếu gì nhé". Nút gỡ tin nhắn dành cho trường hợp
        học sinh viết nội dung không phù hợp.
      </Alert>
    </div>
  );
}
