import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MAX_MESSAGE_LENGTH,
  buildThreadSummaries,
  validateMessage,
  type MessageRow,
} from './messages.repo';

function makeMessage(overrides: Partial<MessageRow> = {}): MessageRow {
  return {
    id: 'm1',
    class_id: 'c1',
    student_id: 's1',
    sender_id: 's1',
    sender_name: 'Nguyễn Văn An',
    sender_role: 'student',
    body: 'Em chào thầy',
    read_by_student: true,
    read_by_teacher: false,
    created_at: '2026-08-09T08:00:00.000Z',
    ...overrides,
  };
}

describe('Kiểm tra nội dung tin nhắn', () => {
  it('không gửi được tin rỗng', () => {
    expect(validateMessage('')).toContain('chưa viết gì');
    expect(validateMessage('    ')).toContain('chưa viết gì');
    expect(validateMessage('\n\n')).toContain('chưa viết gì');
  });

  it('nhận tin bình thường', () => {
    expect(validateMessage('Thầy ơi em vướng dòng 7 ạ')).toBeNull();
  });

  /** Giới hạn phải khớp ràng buộc `check` của cột `body` trong migration. */
  it('chặn tin dài hơn giới hạn của database', () => {
    expect(validateMessage('a'.repeat(MAX_MESSAGE_LENGTH))).toBeNull();
    expect(validateMessage('a'.repeat(MAX_MESSAGE_LENGTH + 1))).toContain('tối đa 1000');
  });
});

describe('Gộp tin nhắn thành cuộc trò chuyện', () => {
  it('mỗi cặp lớp–học sinh là một cuộc trò chuyện riêng', () => {
    const threads = buildThreadSummaries([
      makeMessage({ id: 'a', student_id: 's1' }),
      makeMessage({ id: 'b', student_id: 's2' }),
      makeMessage({ id: 'c', student_id: 's1' }),
    ]);

    expect(threads).toHaveLength(2);
  });

  /**
   * Cùng một học sinh nhưng ở hai lớp khác nhau là HAI cuộc trò chuyện.
   * Gộp chung thì tin của lớp cũ lọt sang lớp mới.
   */
  it('cùng học sinh ở hai lớp thì tách thành hai cuộc trò chuyện', () => {
    const threads = buildThreadSummaries([
      makeMessage({ id: 'a', class_id: 'c1', student_id: 's1' }),
      makeMessage({ id: 'b', class_id: 'c2', student_id: 's1' }),
    ]);

    expect(threads).toHaveLength(2);
  });

  it('chỉ đếm tin giáo viên chưa đọc', () => {
    const [thread] = buildThreadSummaries([
      makeMessage({ id: 'a', read_by_teacher: false }),
      makeMessage({ id: 'b', read_by_teacher: false }),
      makeMessage({ id: 'c', read_by_teacher: true }),
    ]);

    expect(thread.unreadCount).toBe(2);
  });

  it('lấy đúng tin mới nhất làm dòng xem trước, dù dữ liệu về lộn xộn', () => {
    const [thread] = buildThreadSummaries([
      makeMessage({ id: 'a', body: 'Tin cũ', created_at: '2026-08-09T08:00:00.000Z' }),
      makeMessage({ id: 'c', body: 'Tin mới nhất', created_at: '2026-08-09T10:00:00.000Z' }),
      makeMessage({ id: 'b', body: 'Tin giữa', created_at: '2026-08-09T09:00:00.000Z' }),
    ]);

    expect(thread.lastMessage.body).toBe('Tin mới nhất');
  });

  it('cuộc trò chuyện có tin mới nhất được xếp lên đầu', () => {
    const threads = buildThreadSummaries([
      makeMessage({ id: 'a', student_id: 's1', created_at: '2026-08-09T08:00:00.000Z' }),
      makeMessage({ id: 'b', student_id: 's2', created_at: '2026-08-09T11:00:00.000Z' }),
      makeMessage({ id: 'c', student_id: 's3', created_at: '2026-08-09T09:30:00.000Z' }),
    ]);

    expect(threads.map((thread) => thread.studentId)).toEqual(['s2', 's3', 's1']);
  });

  it('không có tin nào thì không có cuộc trò chuyện nào', () => {
    expect(buildThreadSummaries([])).toEqual([]);
  });
});

/**
 * Kiểm tra tĩnh trên migration 0004.
 *
 * Tin nhắn là bảng NHẠY CẢM NHẤT của cả dự án: nó chứa lời học sinh viết ra,
 * trong một sản phẩm dùng cho trẻ 13–14 tuổi. Mấy ràng buộc dưới đây là những
 * thứ tuyệt đối không được lỡ tay gỡ bỏ khi sửa schema về sau.
 */
describe('Migration 0004 — ràng buộc an toàn của bảng tin nhắn', () => {
  const sql = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '0004_messages.sql'),
    'utf8',
  );

  it('bật Row Level Security', () => {
    expect(sql).toContain('alter table public.messages enable row level security');
  });

  /**
   * Người gửi phải lấy từ phiên đăng nhập. Nếu tin dữ liệu client gửi lên thì
   * học sinh tự đặt `sender_role: 'teacher'` là giả danh được thầy cô ngay
   * trong lớp mình.
   */
  it('điền người gửi bằng auth.uid(), không tin dữ liệu từ client', () => {
    expect(sql).toContain('new.sender_id   := v_uid');
    expect(sql).toMatch(/create trigger trg_messages_set_sender\s+before insert/);
  });

  /** Không có policy UPDATE nghĩa là tin đã gửi thì không ai sửa được nội dung. */
  it('không có policy UPDATE cho bất kỳ ai', () => {
    expect(sql).not.toMatch(/create policy \w+ on public\.messages\s+for update/);
  });

  /**
   * Học sinh chỉ gửi được vào lớp MÌNH ĐANG HỌC. Thiếu điều kiện này thì em
   * đoán một uuid lớp bất kỳ là gửi tin vào lớp khác được.
   */
  it('học sinh chỉ gửi được vào luồng của mình, trong lớp mình đang học', () => {
    const policy = sql.slice(sql.indexOf('messages_insert_student on public.messages'));
    expect(policy).toContain('student_id = auth.uid()');
    expect(policy).toContain('class_members');
  });

  it('giáo viên chỉ trả lời được trong lớp mình dạy', () => {
    const policy = sql.slice(sql.indexOf('messages_insert_teacher on public.messages'));
    expect(policy).toContain('public.teaches_class(class_id)');
  });

  it('giáo viên gỡ được tin nhắn không phù hợp', () => {
    expect(sql).toMatch(/messages_delete_teacher on public\.messages\s+for delete/);
  });

  /** Học sinh xoá được thì thầy cô mất bằng chứng khi cần xử lý. */
  it('học sinh KHÔNG xoá được tin đã gửi', () => {
    expect(sql).not.toMatch(/for delete[\s\S]{0,120}student_id = auth\.uid\(\)/);
  });

  it('giới hạn độ dài tin nhắn khớp với giao diện', () => {
    expect(sql).toContain(`between 1 and ${MAX_MESSAGE_LENGTH}`);
  });

  it('không mở kênh chat giữa học sinh với nhau', () => {
    // Mọi policy đều phải neo vào student_id của luồng hoặc vào quyền dạy lớp
    const selectPolicies = sql.match(/create policy messages_select[\s\S]*?;/g) ?? [];
    expect(selectPolicies.length).toBeGreaterThan(0);
    for (const policy of selectPolicies) {
      expect(policy).toMatch(/student_id = auth\.uid\(\)|teaches_class/);
    }
  });
});
