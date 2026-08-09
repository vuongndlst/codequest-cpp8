import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { initOfflineSync } from '@/services/offlineHandlers';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { env } from '@/lib/env';

export function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeUi = useUiStore((state) => state.initialize);

  useEffect(() => {
    initializeUi();
    // Nối hàng đợi offline TRƯỚC khi xác thực: có thể tiết trước học sinh đã
    // tắt máy khi đang mất mạng, và dữ liệu đó cần được ghi lại ngay.
    initOfflineSync();
    void initializeAuth();
  }, [initializeAuth, initializeUi]);

  return (
    <ErrorBoundary showDetail={env.isDev}>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
