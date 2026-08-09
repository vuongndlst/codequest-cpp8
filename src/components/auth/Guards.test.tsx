import type { ReactNode } from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard, GuestGuard, TeacherGuard } from './Guards';
import { useAuthStore } from '@/stores/authStore';
import type { ProfileRow, UserRole } from '@/types/database';

function makeProfile(role: UserRole): ProfileRow {
  return {
    id: 'user-1',
    full_name: 'Nguyễn Văn An',
    class_name: '8A1',
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

/** Dựng một cây route nhỏ để quan sát guard chuyển hướng đi đâu. */
function renderWithRoutes(element: ReactNode, initialPath = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/auth/login" element={<p>Trang đăng nhập</p>} />
        <Route path="/app" element={<p>Bản đồ học sinh</p>} />
        <Route path="/teacher" element={<p>Dashboard giáo viên</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthGuard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'initializing',
      session: null,
      user: null,
      profile: null,
      profileError: null,
    });
  });

  it('hiện trạng thái đang tải khi còn khôi phục phiên đăng nhập', () => {
    renderWithRoutes(
      <AuthGuard>
        <p>Nội dung bí mật</p>
      </AuthGuard>,
    );

    expect(screen.getByText(/Đang khôi phục phiên đăng nhập/)).toBeInTheDocument();
    expect(screen.queryByText('Nội dung bí mật')).not.toBeInTheDocument();
  });

  it('đẩy về trang đăng nhập khi chưa đăng nhập', () => {
    useAuthStore.setState({ status: 'unauthenticated' });

    renderWithRoutes(
      <AuthGuard>
        <p>Nội dung bí mật</p>
      </AuthGuard>,
    );

    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung bí mật')).not.toBeInTheDocument();
  });

  it('cho vào khi đã đăng nhập', () => {
    useAuthStore.setState({ status: 'authenticated', profile: makeProfile('student') });

    renderWithRoutes(
      <AuthGuard>
        <p>Nội dung bí mật</p>
      </AuthGuard>,
    );

    expect(screen.getByText('Nội dung bí mật')).toBeInTheDocument();
  });

  it('báo chưa kết nối máy chủ thay vì đẩy về đăng nhập khi thiếu cấu hình Supabase', () => {
    useAuthStore.setState({ status: 'not_configured' });

    renderWithRoutes(
      <AuthGuard>
        <p>Nội dung bí mật</p>
      </AuthGuard>,
    );

    expect(screen.getByText(/Chưa kết nối được máy chủ/)).toBeInTheDocument();
  });
});

describe('GuestGuard', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unauthenticated', profile: null });
  });

  it('cho khách xem trang đăng nhập', () => {
    renderWithRoutes(
      <GuestGuard>
        <p>Biểu mẫu đăng nhập</p>
      </GuestGuard>,
    );

    expect(screen.getByText('Biểu mẫu đăng nhập')).toBeInTheDocument();
  });

  it('học sinh đã đăng nhập thì chuyển thẳng vào bản đồ', () => {
    useAuthStore.setState({ status: 'authenticated', profile: makeProfile('student') });

    renderWithRoutes(
      <GuestGuard>
        <p>Biểu mẫu đăng nhập</p>
      </GuestGuard>,
    );

    expect(screen.getByText('Bản đồ học sinh')).toBeInTheDocument();
  });

  it('giáo viên đã đăng nhập thì chuyển vào dashboard giáo viên', () => {
    useAuthStore.setState({ status: 'authenticated', profile: makeProfile('teacher') });

    renderWithRoutes(
      <GuestGuard>
        <p>Biểu mẫu đăng nhập</p>
      </GuestGuard>,
    );

    expect(screen.getByText('Dashboard giáo viên')).toBeInTheDocument();
  });
});

describe('TeacherGuard', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'unauthenticated', profile: null });
  });

  it('chặn học sinh vào khu vực giáo viên', () => {
    useAuthStore.setState({ status: 'authenticated', profile: makeProfile('student') });

    renderWithRoutes(
      <TeacherGuard>
        <p>Danh sách học sinh</p>
      </TeacherGuard>,
    );

    expect(screen.getByText(/chưa có quyền vào khu vực này/i)).toBeInTheDocument();
    expect(screen.queryByText('Danh sách học sinh')).not.toBeInTheDocument();
  });

  it('cho giáo viên vào', () => {
    useAuthStore.setState({ status: 'authenticated', profile: makeProfile('teacher') });

    renderWithRoutes(
      <TeacherGuard>
        <p>Danh sách học sinh</p>
      </TeacherGuard>,
    );

    expect(screen.getByText('Danh sách học sinh')).toBeInTheDocument();
  });

  it('chưa tải xong hồ sơ thì chờ, không vội kết luận là không có quyền', () => {
    useAuthStore.setState({ status: 'authenticated', profile: null });

    renderWithRoutes(
      <TeacherGuard>
        <p>Danh sách học sinh</p>
      </TeacherGuard>,
    );

    expect(screen.getByText(/Đang tải hồ sơ/)).toBeInTheDocument();
    expect(screen.queryByText(/chưa có quyền/i)).not.toBeInTheDocument();
  });
});
