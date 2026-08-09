import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LoadingState,
  NoAccessState,
  SupabaseDisconnectedState,
} from '@/components/common/StateViews';

/**
 * Bảo vệ route ở tầng giao diện.
 *
 * ⚠ Đây CHỈ là lớp trải nghiệm. Bảo vệ thật sự nằm ở Row Level Security trong
 * database (mục 22): kể cả khi ai đó vượt được guard này, RLS vẫn chặn mọi
 * truy vấn dữ liệu không thuộc về họ.
 */

interface GuardProps {
  children: ReactNode;
}

/** Yêu cầu đã đăng nhập. */
export function AuthGuard({ children }: GuardProps) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'initializing') {
    return <LoadingState label="Đang khôi phục phiên đăng nhập…" />;
  }

  if (status === 'not_configured') {
    return <SupabaseDisconnectedState />;
  }

  if (status === 'unauthenticated') {
    // Nhớ trang học sinh đang muốn vào để quay lại sau khi đăng nhập
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

/** Chỉ dành cho khách (chưa đăng nhập) — vd. trang Đăng nhập, Đăng ký. */
export function GuestGuard({ children }: GuardProps) {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.profile?.role);

  if (status === 'initializing') {
    return <LoadingState label="Đang kiểm tra…" />;
  }

  if (status === 'authenticated') {
    return <Navigate to={role === 'teacher' ? '/teacher' : '/app'} replace />;
  }

  return <>{children}</>;
}

/** Yêu cầu vai trò giáo viên. */
export function TeacherGuard({ children }: GuardProps) {
  const status = useAuthStore((state) => state.status);
  const profile = useAuthStore((state) => state.profile);

  if (status === 'initializing') {
    return <LoadingState label="Đang kiểm tra quyền truy cập…" />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/auth/login" replace />;
  }

  // Hồ sơ chưa tải xong -> chưa kết luận được, đợi thêm
  if (!profile) {
    return <LoadingState label="Đang tải hồ sơ…" />;
  }

  if (profile.role !== 'teacher') {
    return <NoAccessState />;
  }

  return <>{children}</>;
}
