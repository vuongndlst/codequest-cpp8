import { requireSupabase } from './client';
import { translateAuthError } from './authErrors';
import { getAuthRedirectUrl } from '@/lib/env';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Lớp bọc quanh Supabase Auth.
 *
 * Mọi hàm ở đây trả về `{ data, error }` với `error` LÀ CHUỖI TIẾNG VIỆT,
 * không phải object lỗi của Supabase — giao diện không cần biết chi tiết kỹ thuật.
 */

export interface AuthResult<T = null> {
  data: T | null;
  error: string | null;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  className: string;
  studentCode?: string;
  avatarId?: string;
}

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Đăng ký tài khoản học sinh.
 *
 * Vai trò LUÔN là 'student' — được ép cứng bởi trigger `handle_new_user` trong
 * database. Dù client có gửi thêm `role: 'teacher'` vào metadata thì cũng bị bỏ qua.
 */
export async function signUp(input: SignUpInput): Promise<AuthResult<User>> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          full_name: input.fullName.trim(),
          class_name: input.className.trim(),
          student_code: input.studentCode?.trim() ?? '',
          avatar_id: input.avatarId ?? 'guardian-cyan',
        },
      },
    });

    if (error) return { data: null, error: translateAuthError(error) };
    return { data: data.user, error: null };
  } catch (error) {
    return { data: null, error: translateAuthError(error) };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult<Session>> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return { data: null, error: translateAuthError(error) };
    return { data: data.session, error: null };
  } catch (error) {
    return { data: null, error: translateAuthError(error) };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) return { data: null, error: translateAuthError(error) };
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: translateAuthError(error) };
  }
}

/** Gửi email chứa đường dẫn đặt lại mật khẩu. */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getAuthRedirectUrl('/auth/reset'),
    });
    if (error) return { data: null, error: translateAuthError(error) };
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: translateAuthError(error) };
  }
}

/** Đặt mật khẩu mới (chạy sau khi người dùng mở đường dẫn trong email). */
export async function updatePassword(newPassword: string): Promise<AuthResult<User>> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { data: null, error: translateAuthError(error) };
    return { data: data.user, error: null };
  } catch (error) {
    return { data: null, error: translateAuthError(error) };
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const supabase = requireSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/** ---------------- Kiểm tra dữ liệu nhập, chạy được không cần mạng ---------------- */

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Em chưa nhập email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Email chưa đúng định dạng. Ví dụ: tenem@gmail.com';
  }
  if (value.length > 120) return 'Email dài quá. Em kiểm tra lại nhé.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Em chưa nhập mật khẩu.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  if (password.length > 72) return 'Mật khẩu dài tối đa 72 ký tự.';
  return null;
}

export function validateFullName(fullName: string): string | null {
  const value = fullName.trim();
  if (!value) return 'Em chưa nhập họ và tên.';
  if (value.length < 2) return 'Họ và tên hơi ngắn. Em nhập đầy đủ giúp thầy nhé.';
  if (value.length > 80) return 'Họ và tên dài tối đa 80 ký tự.';
  return null;
}

export function validateClassName(className: string): string | null {
  const value = className.trim();
  if (!value) return 'Em chưa nhập lớp.';
  if (value.length > 20) return 'Tên lớp dài tối đa 20 ký tự.';
  return null;
}
