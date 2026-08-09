import { isNetworkError, SupabaseNotConfiguredError } from './client';

/** Lỗi tầng dữ liệu, đã được dịch sang tiếng Việt để hiển thị thẳng cho học sinh. */
export class RepositoryError extends Error {
  readonly isOffline: boolean;
  readonly needsAuth: boolean;

  constructor(message: string, isOffline = false, needsAuth = false) {
    super(message);
    this.name = 'RepositoryError';
    this.isOffline = isOffline;
    this.needsAuth = needsAuth;
  }
}

export function toRepositoryError(error: unknown, fallback: string): RepositoryError {
  if (error instanceof RepositoryError) return error;

  if (error instanceof SupabaseNotConfiguredError) {
    return new RepositoryError('Tính năng này cần đăng nhập.', false, true);
  }

  if (isNetworkError(error)) {
    return new RepositoryError(
      'Không kết nối được máy chủ. Em kiểm tra mạng rồi thử lại nhé.',
      true,
    );
  }

  // Postgres 42501 = insufficient_privilege -> thường là RLS chặn
  const code = (error as { code?: string } | null)?.code;
  if (code === '42501' || code === 'PGRST301') {
    return new RepositoryError('Em không có quyền xem dữ liệu này.', false, true);
  }

  const detail = error instanceof Error ? error.message : String(error ?? '');
  return new RepositoryError(detail ? `${fallback} (${detail})` : fallback);
}
