import { lazy } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import { PublicShell } from '@/components/layout/PublicShell';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard, GuestGuard, TeacherGuard } from '@/components/auth/Guards';

import { LandingPage } from '@/pages/LandingPage';
import { MapPreviewPage } from '@/pages/MapPreviewPage';
import { HandbookPage } from '@/pages/HandbookPage';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

import { DashboardPage } from '@/pages/app/DashboardPage';
import { ProfilePage } from '@/pages/app/ProfilePage';
/**
 * Bốn trang này được tách khỏi bundle chính:
 *   · ChallengePage và DemoPage kéo theo CodeMirror (~140 KB gzip)
 *   · LessonPage và ExitTicketPage kéo theo toàn bộ nội dung 5 khu vực (~20 KB gzip)
 *
 * Nhờ vậy màn hình đăng nhập và dashboard không phải tải cả code editor lẫn
 * nội dung bài học — khác biệt cảm nhận rõ trên máy phòng ICT dùng Wi-Fi chung.
 */
const ChallengePage = lazy(() =>
  import('@/pages/app/ChallengePage').then((module) => ({ default: module.ChallengePage })),
);
const DemoPage = lazy(() =>
  import('@/pages/DemoPage').then((module) => ({ default: module.DemoPage })),
);
const LessonPage = lazy(() =>
  import('@/pages/app/LessonPage').then((module) => ({ default: module.LessonPage })),
);
const ExitTicketPage = lazy(() =>
  import('@/pages/app/ExitTicketPage').then((module) => ({ default: module.ExitTicketPage })),
);
const LessonGuidePage = lazy(() =>
  import('@/pages/app/LessonGuidePage').then((module) => ({ default: module.LessonGuidePage })),
);
const ProloguePage = lazy(() =>
  import('@/pages/ProloguePage').then((module) => ({ default: module.ProloguePage })),
);

// Chứng chỉ kéo theo thư viện tạo PDF; dashboard giáo viên thì học sinh không
// bao giờ mở tới. Tách cả hai ra khỏi bundle chính.
const CertificatesPage = lazy(() =>
  import('@/pages/app/CertificatesPage').then((module) => ({ default: module.CertificatesPage })),
);
const CertificateDetailPage = lazy(() =>
  import('@/pages/app/CertificateDetailPage').then((module) => ({
    default: module.CertificateDetailPage,
  })),
);
const TeacherDashboardPage = lazy(() =>
  import('@/pages/teacher/TeacherDashboardPage').then((module) => ({
    default: module.TeacherDashboardPage,
  })),
);
const TeacherStudentDetailPage = lazy(() =>
  import('@/pages/teacher/TeacherStudentDetailPage').then((module) => ({
    default: module.TeacherStudentDetailPage,
  })),
);
const TeacherSettingsPage = lazy(() =>
  import('@/pages/teacher/TeacherSettingsPage').then((module) => ({
    default: module.TeacherSettingsPage,
  })),
);
const TeacherClassesPage = lazy(() =>
  import('@/pages/teacher/TeacherClassesPage').then((module) => ({
    default: module.TeacherClassesPage,
  })),
);
const TeacherClassDetailPage = lazy(() =>
  import('@/pages/teacher/TeacherClassDetailPage').then((module) => ({
    default: module.TeacherClassDetailPage,
  })),
);
const JoinClassPage = lazy(() =>
  import('@/pages/app/JoinClassPage').then((module) => ({ default: module.JoinClassPage })),
);
const ChatPage = lazy(() =>
  import('@/pages/app/ChatPage').then((module) => ({ default: module.ChatPage })),
);
const TeacherChatPage = lazy(() =>
  import('@/pages/teacher/TeacherChatPage').then((module) => ({
    default: module.TeacherChatPage,
  })),
);

/**
 * Định tuyến ứng dụng.
 *
 * Dùng HashRouter (không phải BrowserRouter) vì GitHub Pages là hosting tĩnh:
 * với BrowserRouter, học sinh bấm F5 ở /app/lesson/l3 sẽ nhận 404 từ máy chủ.
 * HashRouter giữ toàn bộ đường dẫn sau dấu # nên luôn tải đúng.
 *
 * Supabase Auth (flow PKCE) trả về `?code=...` trên query string — nằm TRƯỚC
 * dấu # nên không xung đột với HashRouter.
 */
export const router = createHashRouter([
  // ---------- Công khai ----------
  {
    path: '/',
    element: <PublicShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'map-preview', element: <MapPreviewPage /> },
      { path: 'demo', element: <DemoPage /> },
      { path: 'handbook', element: <HandbookPage /> },
      // Phần mở đầu về thuật toán — nội dung nền, không cần đăng nhập
      { path: 'prologue', element: <ProloguePage /> },

      /*
        Trang xem trước mẫu chứng chỉ, CHỈ tồn tại khi chạy `npm run dev`.

        Lời gọi `import()` được đặt HẲN BÊN TRONG nhánh này chứ không khai báo
        `lazy()` ở đầu file. Lý do: khi build production, Vite thay
        `import.meta.env.DEV` bằng `false`, cả nhánh trở thành code chết và
        Rollup loại bỏ luôn — nếu để `lazy()` ở ngoài thì chunk vẫn bị sinh ra
        và nằm chình ình trong `dist` dù không ai tải tới.
      */
      ...(import.meta.env.DEV
        ? [
            {
              path: 'dev/certificate-preview',
              lazy: async () => {
                const module = await import('@/pages/dev/CertificatePreviewDevPage');
                return { Component: module.CertificatePreviewDevPage };
              },
            },
            {
              path: 'dev/stage-preview',
              lazy: async () => {
                const module = await import('@/pages/dev/StagePreviewDevPage');
                return { Component: module.StagePreviewDevPage };
              },
            },
          ]
        : []),
      // Phần kiến thức mở công khai: đây là nội dung học thuần tuý, không gắn
      // tiến trình. Học sinh chưa có tài khoản vẫn nên đọc được (mục 21).
      { path: 'guide/:lessonId', element: <LessonGuidePage /> },
    ],
  },

  // ---------- Xác thực (chỉ dành cho khách) ----------
  {
    path: '/auth',
    element: (
      <GuestGuard>
        <PublicShell />
      </GuestGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot', element: <ForgotPasswordPage /> },
    ],
  },

  // Đặt lại mật khẩu KHÔNG nằm sau GuestGuard: khi mở đường dẫn từ email,
  // Supabase đã tạo sẵn một phiên tạm nên học sinh lúc đó đang ở trạng thái
  // "đã đăng nhập" — GuestGuard sẽ đá ngược về dashboard và không đổi được mật khẩu.
  {
    path: '/auth/reset',
    element: <PublicShell />,
    errorElement: <RouteErrorPage />,
    children: [{ index: true, element: <ResetPasswordPage /> }],
  },

  // ---------- Học sinh ----------
  {
    path: '/app',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'map', element: <Navigate to="/app" replace /> },
      { path: 'prologue', element: <ProloguePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'join-class', element: <JoinClassPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'handbook', element: <HandbookPage /> },
      { path: 'lesson/:lessonId', element: <LessonPage /> },
      { path: 'lesson/:lessonId/guide', element: <LessonGuidePage /> },
      { path: 'lesson/:lessonId/challenge/:challengeId', element: <ChallengePage /> },
      { path: 'lesson/:lessonId/exit-ticket', element: <ExitTicketPage /> },
      { path: 'certificates', element: <CertificatesPage /> },
      { path: 'certificates/:lessonId', element: <CertificateDetailPage /> },
    ],
  },

  // ---------- Giáo viên ----------
  {
    path: '/teacher',
    element: (
      <TeacherGuard>
        <AppShell />
      </TeacherGuard>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <TeacherDashboardPage /> },
      { path: 'classes', element: <TeacherClassesPage /> },
      { path: 'chat', element: <TeacherChatPage /> },
      { path: 'classes/:classId', element: <TeacherClassDetailPage /> },
      { path: 'students/:userId', element: <TeacherStudentDetailPage /> },
      { path: 'settings', element: <TeacherSettingsPage /> },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
