import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Supabase client dung chung.
 *
 * · Chi dung PUBLISHABLE KEY (khoa cong khai). Tuyet doi khong dat
 *   service role key o frontend - moi bao ve that su nam o RLS (muc 22).
 * · flowType 'pkce': an toan hon implicit flow va tuong thich HashRouter
 *   tren GitHub Pages (Supabase tra ve `?code=...` thay vi token tren hash).
 * · Tra ve `null` khi chua cau hinh -> ung dung chay o che do Demo thay vi crash.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'cq8-auth',
      },
      global: {
        headers: { 'x-application-name': 'codequest-cpp8' },
      },
    })
  : null;

/**
 * Lay client va nem loi neu chua cau hinh.
 * Dung o cac ham repository bat buoc phai co ket noi.
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new SupabaseNotConfiguredError();
  }
  return supabase;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Chưa kết nối Supabase. Tính năng này cần đăng nhập.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

/** Phat hien loi mang de hien banner offline thay vi bao loi ky thuat kho hieu */
export function isNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed')
  );
}
