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

export const LSTS_EMAIL_DOMAIN = 'lsts.edu.vn';

export const MIN_PASSWORD_LENGTH = 10;

/**
 * Đánh giá độ mạnh mật khẩu.
 *
 * Quy tắc chọn theo hướng dẫn hiện hành của NIST: ĐỘ DÀI quan trọng hơn việc
 * bắt buộc đủ loại ký tự. Bắt học sinh lớp 8 phải có ký tự đặc biệt thường dẫn
 * tới `Abc@1234` — dài 8, đủ loại, nhưng nằm trong mọi từ điển dò mật khẩu.
 *
 * Ở đây yêu cầu tối thiểu 10 ký tự và ít nhất hai nhóm ký tự, đồng thời chặn
 * những mật khẩu quá dễ đoán.
 */
export type PasswordStrength = 'weak' | 'fair' | 'strong';

/**
 * Những mật khẩu bị dò đầu tiên trong mọi cuộc tấn công.
 *
 * So khớp theo PHẦN LÕI chứ không theo chuỗi con: `Abc1234567` có chứa "abc123"
 * nhưng là mật khẩu hoàn toàn hợp lệ, chặn nó đi thì học sinh bực mà chẳng an
 * toàn hơn. Ngược lại `password123` phải bị chặn vì lõi của nó đúng là
 * "password".
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
      advice: ['Một câu ngắn dễ nhớ thường vừa dài vừa khó đoán, ví dụ: MeoCuaEmTen4Chan'],
    };
  }

  if (password.length > 72) {
    return { error: 'Mật khẩu dài tối đa 72 ký tự.', strength: 'weak', advice: [] };
  }

  const lower = password.toLowerCase();

  /*
    Thứ tự kiểm tra được chọn theo mức HỮU ÍCH của thông báo, không phải theo
    mức nghiêm trọng. "Mật khẩu toàn chữ số" nói rõ phải sửa gì; "nằm trong
    danh sách bị đoán" thì mơ hồ hơn. Nên cái cụ thể được kiểm tra trước.
  */
  if (/^\d+$/.test(password)) {
    return {
      error: 'Mật khẩu toàn chữ số rất dễ đoán. Em thêm chữ cái vào nhé.',
      strength: 'weak',
      advice: [],
    };
  }

  if (/^(.)\1+$/.test(password)) {
    return { error: 'Mật khẩu không nên chỉ gồm một ký tự lặp lại.', strength: 'weak', advice: [] };
  }

  const core = passwordCore(password);
  if (core.length >= 4 && COMMON_PASSWORDS.includes(core)) {
    return {
      error: 'Mật khẩu này nằm trong danh sách bị đoán đầu tiên. Em chọn mật khẩu khác nhé.',
      strength: 'weak',
      advice: [],
    };
  }

  // Không được chứa chính email hoặc tên của mình
  const emailName = context.email?.split('@')[0]?.toLowerCase();
  if (emailName && emailName.length >= 4 && lower.includes(emailName)) {
    return {
      error: 'Mật khẩu không nên chứa tên email của em — người khác đoán ra ngay.',
      strength: 'weak',
      advice: [],
    };
  }

  const groups = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;

  if (groups < 2) {
    return {
      error: 'Mật khẩu cần ít nhất hai loại ký tự, ví dụ chữ và số.',
      strength: 'weak',
      advice: [],
    };
  }

  if (password.length < 14) advice.push('Mật khẩu dài hơn 14 ký tự sẽ an toàn hơn nhiều');
  if (groups < 3) advice.push('Thêm chữ hoa hoặc ký tự đặc biệt để mạnh hơn');

  const strength: PasswordStrength =
    password.length >= 14 && groups >= 3 ? 'strong' : 'fair';

  return { error: null, strength, advice };
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
