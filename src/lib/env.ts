/**
 * Doc va kiem tra bien moi truong.
 *
 * Quan trong: neu thieu cau hinh Supabase, ung dung KHONG duoc crash.
 * Website van chay o "che do Demo" (muc 21) - hoc sinh xem duoc gioi thieu,
 * ban do va so tay lenh, chi khong luu duoc tien trinh.
 */

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

function looksLikeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const env = {
  supabaseUrl: rawUrl,
  supabasePublishableKey: rawKey,
  /** Base path cua Vite - dung cho asset va redirect URL cua Supabase Auth */
  basePath: import.meta.env.BASE_URL,
  isDev: import.meta.env.DEV,
} as const;

/** true khi ca URL lan key deu hop le -> moi ket noi duoc Supabase */
export const isSupabaseConfigured: boolean =
  rawUrl.length > 0 && rawKey.length > 0 && looksLikeUrl(rawUrl);

/**
 * URL day du de Supabase chuyen huong ve sau khi xac thuc email / dat lai mat khau.
 * Vi dung HashRouter, dia chi nay luon la goc ung dung; supabase-js se doc
 * tham so `?code=` roi tu don dep URL.
 */
export function getAuthRedirectUrl(path = ''): string {
  const base = `${window.location.origin}${env.basePath}`;
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return path ? `${normalized}#${path}` : normalized;
}

/** Thông báo hướng dẫn khi thiếu cấu hình — dành cho người cài đặt, không phải học sinh */
export const MISSING_ENV_MESSAGE =
  'Chưa cấu hình kết nối Supabase. Hãy tạo file .env từ .env.example và điền ' +
  'VITE_SUPABASE_URL cùng VITE_SUPABASE_PUBLISHABLE_KEY, sau đó khởi động lại server.';
