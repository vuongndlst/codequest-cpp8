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
  classCode: string;
  studentCode?: string;
  avatarId?: string;
}

export const LSTS_EMAIL_DOMAIN = 'lsts.edu.vn';

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Đánh giá độ mạnh mật khẩu.
 *
 * Tối thiểu 8 ký tự theo chính sách của lớp. Độ mạnh và lời khuyên chỉ để
 * tham khảo; không ép học sinh dùng thêm nhóm ký tự hay mật khẩu dài hơn.
 */
export type PasswordStrength = 'weak' | 'fair' | 'strong';

/**
 * Những mật khẩu bị dò đầu tiên trong mọi cuộc tấn công.
 *
 * So khớp theo lõi, không theo chuỗi con. Danh sách chỉ tạo lời khuyên,
 * không ngăn đăng ký khi mật khẩu đã đủ 8 ký tự.
 */
const COMMON_PASSWORDS = [
  'password', 'matkhau', 'qwerty', 'qwertyuiop', 'asdfghjkl', 'iloveyou',
  'admin', 'welcome', 'letmein', 'codequest', 'byteland', 'hocsinh',
  'giaovien', 'vietnam', 'abcdef', 'abcxyz',
];

/** Lõi chữ cái của mật khẩu: bỏ hết chữ số và ký tự đặc biệt. */
function passwordCore(password: string): string {
  return password.toLowerCase().replace(/[^a-z]/g, '');
}

export interface PasswordCheck {
  error: string | null;
  strength: PasswordStrength;
  /** Gợi ý để mạnh hơn — hiển thị cả khi mật khẩu đã hợp lệ */
  advice: string[];
}

export function checkPassword(password: string, context: { email?: string; fullName?: string } = {}): PasswordCheck {
  const advice: string[] = [];

  if (!password) {
    return { error: 'Em chưa nhập mật khẩu.', strength: 'weak', advice: [] };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự (hiện có ${password.length}).`,
      strength: 'weak',
      advice: [],
    };
  }

  if (new TextEncoder().encode(password).length > 72) {
    return { error: 'Mật khẩu dài tối đa 72 byte; ký tự có dấu có thể chiếm nhiều byte.', strength: 'weak', advice: [] };
  }

  const lower = password.toLowerCase();

  /*
    Thứ tự kiểm tra được chọn theo mức HỮU ÍCH của thông báo, không phải theo
    mức nghiêm trọng. "Mật khẩu toàn chữ số" nói rõ phải sửa gì; "nằm trong
    danh sách bị đoán" thì mơ hồ hơn. Nên cái cụ thể được kiểm tra trước.
  */
  if (/^\d+$/.test(password)) {
    advice.push('Em có thể thêm chữ để mật khẩu khó đoán hơn.');
  }

  if (/^(.)\1+$/.test(password)) {
    advice.push('Tránh dùng một ký tự lặp lại.');
  }

  const core = passwordCore(password);
  if (core.length >= 4 && COMMON_PASSWORDS.includes(core)) {
    advice.push('Mật khẩu này phổ biến; em nên chọn một cụm từ riêng dễ nhớ.');
  }

  // Khuyên tránh dùng thông tin định danh, không chặn đăng ký.
  const emailName = context.email?.split('@')[0]?.toLowerCase();
  if (emailName && emailName.length >= 4 && lower.includes(emailName)) {
    advice.push('Tránh dùng mã học sinh hoặc email làm mật khẩu.');
  }

  const groups = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;

  const strength: PasswordStrength =
    advice.length > 0 ? 'weak' : password.length >= 12 && groups >= 2 ? 'strong' : 'fair';

  return { error: null, strength, advice: advice.slice(0, 1) };
}

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
          class_code: input.classCode.trim().toUpperCase(),
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
    return 'Email chưa đúng định dạng. Ví dụ: 2406105@lsts.edu.vn';
  }
  if (value.length > 120) return 'Email dài quá. Em kiểm tra lại nhé.';
  return null;
}

/** Mã học sinh LSTS gồm đúng 7 chữ số, ví dụ 2406105. */
export function validateStudentCode(studentCode: string): string | null {
  const value = studentCode.trim();
  if (!value) return 'Em chưa nhập mã học sinh.';
  if (!/^\d{7}$/.test(value)) {
    return 'Mã học sinh LSTS phải gồm đúng 7 chữ số. Ví dụ: 2406105.';
  }
  return null;
}

/** Email trường là dữ liệu suy ra, không để học sinh phải gõ lại. */
export function studentEmailFromCode(studentCode: string): string {
  const value = studentCode.trim();
  return value ? `${value}@${LSTS_EMAIL_DOMAIN}` : '';
}

/**
 * Học sinh có thể đăng nhập bằng mã 7 chữ số để giảm thao tác ở phòng máy.
 * Giáo viên và quản trị viên vẫn dùng địa chỉ email đầy đủ như trước.
 */
export function normalizeLoginIdentifier(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  return /^\d{7}$/.test(value) ? studentEmailFromCode(value) : value;
}

export function validatePassword(
  password: string,
  context: { email?: string; fullName?: string } = {},
): string | null {
  return checkPassword(password, context).error;
}

/** Hai ô mật khẩu phải trùng nhau — chống gõ nhầm rồi không đăng nhập lại được. */
export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Em chưa nhập lại mật khẩu.';
  if (password !== confirm) return 'Hai ô mật khẩu chưa giống nhau. Em kiểm tra lại nhé.';
  return null;
}

/** Mã lớp do giáo viên cung cấp, dạng `8A1-K7M2`. */
export function validateClassCode(code: string): string | null {
  const value = code.trim();
  if (!value) return 'Em chưa nhập mã lớp. Mã này thầy cô cho em nhé.';
  if (value.length < 4 || value.length > 20) return 'Mã lớp chưa đúng định dạng.';
  if (!/^[A-Za-z0-9-]+$/.test(value)) {
    return 'Mã lớp chỉ gồm chữ, số và dấu gạch ngang.';
  }
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
