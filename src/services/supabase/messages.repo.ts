import { requireSupabase } from './client';
import { toRepositoryError } from './errors';

/**
 * Hỏi đáp giữa học sinh và giáo viên.
 *
 * Một luồng hội thoại được xác định bằng cặp `(class_id, student_id)`. Mọi
 * giáo viên của lớp đều đọc và trả lời được cùng luồng đó.
 *
 * Người gửi KHÔNG được gửi kèm từ client — trigger `set_message_sender` trong
 * database tự điền từ phiên đăng nhập. Nếu tin client thì học sinh tự đặt
 * `sender_role: 'teacher'` là giả danh được thầy cô ngay trong lớp mình.
 */

export const MAX_MESSAGE_LENGTH = 1000;

export interface MessageRow {
  id: string;
  class_id: string;
  student_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'student' | 'teacher';
  body: string;
  read_by_student: boolean;
  read_by_teacher: boolean;
  created_at: string;
}

/** Một luồng hội thoại trong danh sách của giáo viên. */
export interface ThreadSummary {
  classId: string;
  studentId: string;
  lastMessage: MessageRow;
  unreadCount: number;
}

export function validateMessage(body: string): string | null {
  const value = body.trim();
  if (!value) return 'Em chưa viết gì cả.';
  if (value.length > MAX_MESSAGE_LENGTH) {
    return `Tin nhắn dài tối đa ${MAX_MESSAGE_LENGTH} ký tự (hiện có ${value.length}).`;
  }
  return null;
}

/** Toàn bộ hội thoại của một học sinh, cũ trước mới sau. */
export async function fetchThread(classId: string, studentId: string): Promise<MessageRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as MessageRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được cuộc trò chuyện.');
  }
}

export async function sendMessage(input: {
  classId: string;
  studentId: string;
  body: string;
}): Promise<MessageRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('messages')
      .insert({
        class_id: input.classId,
        student_id: input.studentId,
        body: input.body.trim(),
        // Ba cột dưới đây bị trigger ghi đè — điền vào chỉ để thoả kiểu NOT NULL
        sender_id: input.studentId,
        sender_name: '',
        sender_role: 'student',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as MessageRow;
  } catch (error) {
    throw toRepositoryError(error, 'Chưa gửi được tin nhắn.');
  }
}

/** Đánh dấu cả luồng là đã đọc. Trả về số tin vừa được đánh dấu. */
export async function markThreadRead(classId: string, studentId: string): Promise<number> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.rpc('mark_thread_read', {
      p_class_id: classId,
      p_student_id: studentId,
    });

    if (error) throw error;
    return (data as number) ?? 0;
  } catch {
    // Đánh dấu đã đọc hỏng thì không đáng làm gãy màn hình chat
    return 0;
  }
}

/** Số tin thầy cô gửi mà học sinh chưa đọc. */
export async function countUnreadForStudent(studentId: string): Promise<number> {
  try {
    const supabase = requireSupabase();
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('read_by_student', false);

    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Số tin học sinh gửi mà chưa giáo viên nào đọc, trên mọi lớp đang dạy. */
export async function countUnreadForTeacher(): Promise<number> {
  try {
    const supabase = requireSupabase();
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('read_by_teacher', false);

    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Gộp danh sách tin nhắn thành từng luồng hội thoại.
 *
 * Tách thành hàm thuần để test được mà không cần database — phần gộp nhóm và
 * đếm chưa đọc chính là chỗ dễ sai nhất.
 */
export function buildThreadSummaries(messages: MessageRow[]): ThreadSummary[] {
  const byThread = new Map<string, ThreadSummary>();

  for (const message of messages) {
    const key = `${message.class_id}::${message.student_id}`;
    const current = byThread.get(key);

    if (!current) {
      byThread.set(key, {
        classId: message.class_id,
        studentId: message.student_id,
        lastMessage: message,
        unreadCount: message.read_by_teacher ? 0 : 1,
      });
      continue;
    }

    if (!message.read_by_teacher) current.unreadCount += 1;
    if (message.created_at > current.lastMessage.created_at) {
      current.lastMessage = message;
    }
  }

  // Luồng có tin mới nhất lên đầu — đúng thứ tự thầy cô cần xử lý
  return [...byThread.values()].sort((a, b) =>
    b.lastMessage.created_at.localeCompare(a.lastMessage.created_at),
  );
}

/**
 * Tin nhắn gần đây của mọi lớp giáo viên đang dạy (RLS tự lọc).
 *
 * Giới hạn số dòng vì bảng này lớn dần suốt năm học. 400 dòng đủ dựng danh
 * sách hội thoại gần đây; lịch sử đầy đủ được tải khi mở đúng một luồng.
 */
export async function fetchRecentMessagesForTeacher(limit = 400): Promise<MessageRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as MessageRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được danh sách hỏi đáp.');
  }
}

/** Giáo viên gỡ một tin nhắn không phù hợp khỏi lớp mình. */
export async function deleteMessage(messageId: string): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không gỡ được tin nhắn này.');
  }
}
