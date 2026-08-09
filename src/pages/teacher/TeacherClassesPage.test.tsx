import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TeacherClassesPage } from './TeacherClassesPage';
import {
  createClass,
  fetchAllClassMembers,
  fetchMyClasses,
  type ClassRow,
} from '@/services/supabase/classes.repo';

/*
  Giữ nguyên các hàm kiểm tra dữ liệu thật (validateNewClassName…) và chỉ thay
  ba hàm gọi mạng. Nếu mock luôn cả validator thì test sẽ xanh ngay cả khi giới
  hạn độ dài lệch với ràng buộc của database — đúng loại lỗi cần bắt.
*/
vi.mock('@/services/supabase/classes.repo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/supabase/classes.repo')>();
  return {
    ...actual,
    fetchMyClasses: vi.fn(),
    fetchAllClassMembers: vi.fn(),
    createClass: vi.fn(),
  };
});

function makeClass(overrides: Partial<ClassRow> = {}): ClassRow {
  return {
    id: 'c1',
    name: '8A1',
    join_code: '8A1-K7MQ',
    school_year: '2025-2026',
    note: null,
    is_open: true,
    created_by: 'gv1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TeacherClassesPage />
    </MemoryRouter>,
  );
}

describe('Trang quản lý lớp của giáo viên', () => {
  beforeEach(() => {
    vi.mocked(fetchMyClasses).mockResolvedValue([]);
    vi.mocked(fetchAllClassMembers).mockResolvedValue([]);
    vi.mocked(createClass).mockReset();
  });

  it('chưa có lớp nào thì mời thầy cô tạo lớp đầu tiên', async () => {
    renderPage();
    expect(await screen.findByText(/chưa có lớp nào/i)).toBeInTheDocument();
  });

  /**
   * Mã lớp PHẢI hiện ngay trên thẻ lớp. Đây là thứ thầy cô cần đọc cho cả lớp
   * chép; bắt bấm thêm một lớp nữa mới thấy là hỏng mục đích của cả tính năng.
   */
  it('hiện mã lớp và sĩ số ngay trên danh sách', async () => {
    vi.mocked(fetchMyClasses).mockResolvedValue([makeClass()]);
    vi.mocked(fetchAllClassMembers).mockResolvedValue([
      { id: 'm1', class_id: 'c1', student_id: 's1', joined_at: '' },
      { id: 'm2', class_id: 'c1', student_id: 's2', joined_at: '' },
    ]);

    renderPage();

    expect(await screen.findByText('8A1-K7MQ')).toBeInTheDocument();
    expect(screen.getByText(/2 học sinh/)).toBeInTheDocument();
  });

  it('lớp đã khoá được đánh dấu rõ ràng', async () => {
    vi.mocked(fetchMyClasses).mockResolvedValue([makeClass({ is_open: false })]);
    renderPage();

    expect(await screen.findByText('Đã khoá')).toBeInTheDocument();
  });

  it('tạo lớp xong thì mã lớp mới hiện lên ngay', async () => {
    const user = userEvent.setup();
    vi.mocked(createClass).mockResolvedValue(
      makeClass({ id: 'c2', name: '8A2', join_code: '8A2-QRTV' }),
    );

    renderPage();
    await user.click(await screen.findByRole('button', { name: /tạo lớp mới/i }));
    await user.type(screen.getByLabelText(/tên lớp/i), '8A2');
    await user.click(screen.getByRole('button', { name: /^tạo lớp$/i }));

    await waitFor(() => {
      expect(vi.mocked(createClass)).toHaveBeenCalledWith(
        expect.objectContaining({ name: '8A2' }),
      );
    });

    expect(await screen.findByText('8A2-QRTV')).toBeInTheDocument();
  });

  it('tên lớp để trống thì báo lỗi chứ không gửi lên máy chủ', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /tạo lớp mới/i }));
    await user.click(screen.getByRole('button', { name: /^tạo lớp$/i }));

    expect(await screen.findByText(/chưa đặt tên lớp/i)).toBeInTheDocument();
    expect(vi.mocked(createClass)).not.toHaveBeenCalled();
  });

  it('lỗi từ máy chủ được nói lại bằng tiếng Việt, không mất dữ liệu đã nhập', async () => {
    const user = userEvent.setup();
    vi.mocked(createClass).mockRejectedValue(new Error('Chỉ tài khoản giáo viên mới được tạo lớp.'));

    renderPage();
    await user.click(await screen.findByRole('button', { name: /tạo lớp mới/i }));
    await user.type(screen.getByLabelText(/tên lớp/i), '8A3');
    await user.click(screen.getByRole('button', { name: /^tạo lớp$/i }));

    expect(await screen.findByText(/chỉ tài khoản giáo viên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tên lớp/i)).toHaveValue('8A3');
  });
});
