import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageThread } from './MessageThread';
import { MAX_MESSAGE_LENGTH, type MessageRow } from '@/services/supabase/messages.repo';

function makeMessage(overrides: Partial<MessageRow> = {}): MessageRow {
  return {
    id: 'm1',
    class_id: 'c1',
    student_id: 's1',
    sender_id: 's1',
    sender_name: 'Nguyễn Văn An',
    sender_role: 'student',
    body: 'Em chào thầy ạ',
    read_by_student: true,
    read_by_teacher: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function renderThread(props: Partial<Parameters<typeof MessageThread>[0]> = {}) {
  const onSend = props.onSend ?? vi.fn().mockResolvedValue(undefined);
  render(
    <MessageThread
      messages={[]}
      viewerRole="student"
      onSend={onSend}
      emptyHint="Em viết câu hỏi đầu tiên đi."
      placeholder="Nhập câu hỏi…"
      {...props}
    />,
  );
  return { onSend };
}

describe('Khung hội thoại', () => {
  it('chưa có tin nào thì mời viết câu đầu tiên', () => {
    renderThread();
    expect(screen.getByText(/viết câu hỏi đầu tiên/i)).toBeInTheDocument();
  });

  /**
   * Một lớp có NHIỀU giáo viên, nên học sinh phải biết thầy cô nào trả lời.
   * Thiếu tên thì em không biết hỏi tiếp ai.
   */
  it('hiện tên và nhãn của giáo viên đã trả lời', () => {
    renderThread({
      messages: [
        makeMessage({ id: 'a' }),
        makeMessage({
          id: 'b',
          sender_role: 'teacher',
          sender_name: 'Nguyễn Đình Vương',
          body: 'Em xem lại dòng 7 nhé',
        }),
      ],
    });

    expect(screen.getByText('Nguyễn Đình Vương')).toBeInTheDocument();
    expect(screen.getByText('Giáo viên')).toBeInTheDocument();
  });

  it('không lặp lại tên của chính người đang xem', () => {
    renderThread({ viewerRole: 'student', messages: [makeMessage()] });
    expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
  });

  it('cùng một luồng nhưng giáo viên xem thì thấy tên học sinh', () => {
    renderThread({ viewerRole: 'teacher', messages: [makeMessage()] });
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
  });
});

describe('Gửi tin nhắn', () => {
  it('bấm Gửi thì gọi lên máy chủ với nội dung đã cắt khoảng trắng', async () => {
    const user = userEvent.setup();
    const { onSend } = renderThread();

    await user.type(screen.getByLabelText(/nội dung tin nhắn/i), '  Thầy ơi em vướng  ');
    await user.click(screen.getByRole('button', { name: /gửi/i }));

    expect(onSend).toHaveBeenCalledWith('Thầy ơi em vướng');
  });

  it('Enter gửi luôn, Shift+Enter chỉ xuống dòng', async () => {
    const user = userEvent.setup();
    const { onSend } = renderThread();

    const box = screen.getByLabelText(/nội dung tin nhắn/i);
    await user.type(box, 'Dòng một{Shift>}{Enter}{/Shift}Dòng hai');
    expect(onSend).not.toHaveBeenCalled();

    await user.type(box, '{Enter}');
    expect(onSend).toHaveBeenCalledWith('Dòng một\nDòng hai');
  });

  it('ô trống thì nút Gửi không bấm được', () => {
    renderThread();
    expect(screen.getByRole('button', { name: /gửi/i })).toBeDisabled();
  });

  it('tin quá dài thì báo lỗi chứ không gửi lên', async () => {
    const user = userEvent.setup();
    const { onSend } = renderThread();

    const box = screen.getByLabelText(/nội dung tin nhắn/i);
    await user.click(box);
    await user.paste('a'.repeat(MAX_MESSAGE_LENGTH + 5));
    await user.click(screen.getByRole('button', { name: /gửi/i }));

    expect(await screen.findByText(/tối đa 1000 ký tự/i)).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  /**
   * Mạng phòng máy hay chập chờn. Gửi hỏng mà mất luôn nội dung vừa gõ thì học
   * sinh phải viết lại từ đầu — và nhiều em sẽ bỏ luôn, không hỏi nữa.
   */
  it('gửi hỏng thì trả lại nội dung để em không phải gõ lại', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockRejectedValue(new Error('Mất kết nối tới máy chủ.'));
    renderThread({ onSend });

    const box = screen.getByLabelText(/nội dung tin nhắn/i);
    await user.type(box, 'Câu hỏi dài em gõ mãi mới xong');
    await user.click(screen.getByRole('button', { name: /gửi/i }));

    expect(await screen.findByText(/mất kết nối/i)).toBeInTheDocument();
    expect(box).toHaveValue('Câu hỏi dài em gõ mãi mới xong');
  });
});

describe('Gỡ tin nhắn', () => {
  it('học sinh KHÔNG thấy nút gỡ', () => {
    renderThread({ messages: [makeMessage()] });
    expect(screen.queryByRole('button', { name: /^gỡ$/i })).not.toBeInTheDocument();
  });

  it('giáo viên gỡ được, nhưng phải xác nhận hai bước', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderThread({ viewerRole: 'teacher', messages: [makeMessage()], onDelete });

    await user.click(screen.getByRole('button', { name: /^gỡ$/i }));
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /gỡ tin này/i }));
    expect(onDelete).toHaveBeenCalledWith('m1');
  });
});

describe('Trình đọc màn hình', () => {
  it('vùng tin nhắn được đánh dấu là nhật ký cập nhật liên tục', () => {
    renderThread({ messages: [makeMessage()] });
    const log = screen.getByRole('log');

    expect(log).toHaveAttribute('aria-live', 'polite');
    expect(log).toHaveAccessibleName();
  });
});
