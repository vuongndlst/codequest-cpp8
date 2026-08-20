import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TopBar } from './TopBar';
import { useAuthStore } from '@/stores/authStore';
import type { ProfileRow, UserRole } from '@/types/database';

function makeProfile(role: UserRole): ProfileRow {
  return {
    id: 'u1',
    full_name: 'Nguyễn Đình Vương',
    class_name: null,
    student_code: null,
    avatar_id: 'guardian-cyan',
    role,
    total_xp: 0,
    level: 1,
    streak_days: 0,
    last_active_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function renderTopBar() {
  return render(
    <MemoryRouter>
      <TopBar />
    </MemoryRouter>,
  );
}

/**
 * Test này ra đời từ một lỗi có thật khi đưa website lên chạy:
 *
 * Tài khoản giáo viên đăng nhập xong rơi vào dashboard học sinh, và thanh điều
 * hướng KHÔNG có mục nào dẫn sang khu vực giáo viên. Route `/teacher` vẫn chạy
 * đúng, nhưng không ai bấm tới được — phải tự gõ địa chỉ mới vào nổi.
 *
 * Loại lỗi này không có test nào bắt được: mọi thành phần đều hoạt động, chỉ
 * thiếu một sợi dây nối giữa chúng.
 */
describe('Thanh điều hướng — phân biệt giáo viên và học sinh', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'authenticated',
      session: null,
      user: null,
      profile: null,
      profileError: null,
    });
  });

  it('giáo viên PHẢI có đường dẫn sang khu vực giáo viên', () => {
    useAuthStore.setState({ profile: makeProfile('teacher') });
    renderTopBar();

    const teacherLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.endsWith('/teacher'));

    expect(teacherLinks.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Theo dõi').length).toBeGreaterThan(0);
  });

  /**
   * Cùng loại lỗi như trên, một tầng sâu hơn: trang quản lý lớp có tồn tại
   * nhưng nếu không có mục điều hướng thì thầy cô không tạo lớp được, và học
   * sinh sẽ không bao giờ có mã lớp để nhập.
   */
  it('giáo viên PHẢI có đường dẫn sang trang quản lý lớp', () => {
    useAuthStore.setState({ profile: makeProfile('teacher') });
    renderTopBar();

    const classLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.endsWith('/teacher/classes'));

    expect(classLinks.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lớp của tôi').length).toBeGreaterThan(0);
  });

  it('học sinh KHÔNG thấy đường dẫn tới khu vực giáo viên', () => {
    useAuthStore.setState({ profile: makeProfile('student') });
    renderTopBar();

    const teacherLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.includes('/teacher'));

    expect(teacherLinks).toHaveLength(0);
    expect(screen.queryByText('Theo dõi')).not.toBeInTheDocument();
    expect(screen.queryByText('Lớp của tôi')).not.toBeInTheDocument();
  });

  it('chưa tải xong hồ sơ thì chưa hiện mục giáo viên', () => {
    useAuthStore.setState({ profile: null });
    renderTopBar();

    expect(screen.queryByText('Theo dõi')).not.toBeInTheDocument();
    expect(screen.queryByText('Lớp của tôi')).not.toBeInTheDocument();
  });

  it('giáo viên vẫn vào được mọi khu vực của học sinh', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ profile: makeProfile('teacher') });
    renderTopBar();

    for (const label of ['Bản đồ', 'Sổ tay lệnh', 'Chứng chỉ']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    await user.click(screen.getByRole('button', { name: 'Mở menu hồ sơ' }));
    expect(screen.getByRole('link', { name: 'Hồ sơ của em' })).toBeInTheDocument();
  });

  it('học sinh có menu chính một hàng và gom tùy chọn phụ', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ profile: makeProfile('student') });
    renderTopBar();

    const desktopNav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    for (const label of ['Bản đồ', 'Hỏi thầy cô', 'Sổ tay lệnh', 'Chứng chỉ']) {
      expect(desktopNav).toContainElement(screen.getAllByRole('link', { name: label })[0]);
    }
    expect(desktopNav).not.toHaveTextContent('Hồ sơ');

    await user.click(screen.getByRole('button', { name: 'Mở tùy chọn giao diện' }));
    expect(screen.getByRole('region', { name: 'Tùy chọn giao diện' })).toBeInTheDocument();
    expect(screen.getByText('Giảm chuyển động')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mở menu hồ sơ' }));
    expect(screen.getByRole('region', { name: 'Menu hồ sơ' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hồ sơ của em' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
  });
});
