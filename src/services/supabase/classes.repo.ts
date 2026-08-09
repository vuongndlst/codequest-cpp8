import { requireSupabase } from './client';
import { toRepositoryError } from './errors';

/**
 * Quản lý lớp học.
 *
 * Hai thao tác quan trọng nhất — tạo lớp và vào lớp — đi qua RPC
 * (`create_class`, `join_class_by_code`) chứ không ghi thẳng vào bảng.
 *
 * Lý do với `join_class_by_code`: nếu cho client đọc bảng `classes` để tra mã,
 * thì bất kỳ ai cũng liệt kê được toàn bộ lớp trong trường. RPC chỉ trả lời
 * đúng một câu hỏi "mã này có hợp lệ không".
 */

export interface ClassRow {
  id: string;
  name: string;
  join_code: string;
  school_year: string | null;
  note: string | null;
  is_open: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassMemberRow {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface ClassTeacherRow {
  id: string;
  class_id: string;
  teacher_id: string;
  role: 'owner' | 'teacher';
  added_at: string;
}

/** Giáo viên trong danh sách chọn thêm người cùng dạy. */
export interface TeacherProfile {
  id: string;
  full_name: string;
  avatar_id: string;
}

/**
 * Kiểm tra tên lớp trước khi gửi lên.
 *
 * Giới hạn 40 ký tự khớp đúng ràng buộc `check` của cột `classes.name` — bắt ở
 * đây để giáo viên thấy lỗi tiếng Việt ngay, thay vì một thông báo constraint
 * khó hiểu từ Postgres.
 */
export function validateNewClassName(name: string): string | null {
  const value = name.trim();
  if (!value) return 'Thầy cô chưa đặt tên lớp.';
  if (value.length > 40) return 'Tên lớp dài tối đa 40 ký tự.';
  return null;
}

export function validateSchoolYear(schoolYear: string): string | null {
  const value = schoolYear.trim();
  if (value.length > 20) return 'Năm học dài tối đa 20 ký tự.';
  return null;
}

export function validateClassNote(note: string): string | null {
  const value = note.trim();
  if (value.length > 200) return 'Ghi chú dài tối đa 200 ký tự.';
  return null;
}

/** Thông báo tiếng Việt cho các lỗi RPC trả về. */
function translateClassError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');

  if (raw.includes('MA_LOP_KHONG_DUNG')) {
    return 'Mã lớp không đúng. Em kiểm tra lại xem có gõ nhầm chữ nào không, hoặc hỏi lại thầy cô nhé.';
  }
  if (raw.includes('LOP_DA_KHOA')) {
    return 'Lớp này đã khoá, không nhận thêm học sinh. Em báo thầy cô giúp nhé.';
  }
  if (raw.includes('Chi giao vien moi duoc tao lop')) {
    return 'Chỉ tài khoản giáo viên mới được tạo lớp.';
  }
  if (raw.includes('Can dang nhap')) {
    return 'Em cần đăng nhập trước đã.';
  }
  return raw;
}

/** Giáo viên tạo lớp mới. Mã lớp được sinh tự động. */
export async function createClass(input: {
  name: string;
  schoolYear?: string;
  note?: string;
}): Promise<ClassRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.rpc('create_class', {
      p_name: input.name,
      p_school_year: input.schoolYear ?? null,
      p_note: input.note ?? null,
    });

    if (error) throw new Error(translateClassError(error));
    return data as ClassRow;
  } catch (error) {
    throw toRepositoryError(error, 'Không tạo được lớp.');
  }
}

/** Học sinh vào lớp bằng mã. Nhập mã mới thì chuyển lớp, không tạo bản ghi thứ hai. */
export async function joinClassByCode(code: string): Promise<ClassRow> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.rpc('join_class_by_code', {
      p_code: code.trim(),
    });

    if (error) throw new Error(translateClassError(error));
    return data as ClassRow;
  } catch (error) {
    throw toRepositoryError(error, 'Không vào được lớp.');
  }
}

/** Các lớp mà giáo viên hiện tại đang dạy (RLS tự lọc). */
export async function fetchMyClasses(): Promise<ClassRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as ClassRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được danh sách lớp.');
  }
}

/** Lớp của học sinh hiện tại, null nếu chưa vào lớp nào. */
export async function fetchMyClass(): Promise<ClassRow | null> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.from('classes').select('*').limit(1).maybeSingle();

    if (error) throw error;
    return (data as ClassRow | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Một lớp cụ thể.
 *
 * Không cần kiểm tra quyền ở đây: RLS chỉ cho giáo viên thấy lớp mình dạy, nên
 * mở nhầm id lớp của người khác sẽ nhận `null` chứ không lộ gì.
 */
export async function fetchClassById(classId: string): Promise<ClassRow | null> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .maybeSingle();

    if (error) throw error;
    return (data as ClassRow | null) ?? null;
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được thông tin lớp.');
  }
}

/** Sửa tên lớp, năm học, ghi chú. Mã lớp KHÔNG đổi để link đã phát vẫn dùng được. */
export async function updateClass(
  classId: string,
  patch: { name?: string; schoolYear?: string | null; note?: string | null },
): Promise<void> {
  try {
    const supabase = requireSupabase();
    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name.trim();
    if (patch.schoolYear !== undefined) payload.school_year = patch.schoolYear || null;
    if (patch.note !== undefined) payload.note = patch.note || null;

    const { error } = await supabase.from('classes').update(payload).eq('id', classId);
    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không lưu được thay đổi của lớp.');
  }
}

/**
 * Danh sách tài khoản giáo viên, để chọn người cùng dạy.
 *
 * Chỉ lấy ba cột cần cho việc hiển thị. Không lấy XP, không lấy ngày hoạt động
 * — giáo viên không cần biết những thứ đó về đồng nghiệp.
 */
export async function fetchTeacherProfiles(): Promise<TeacherProfile[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_id')
      .eq('role', 'teacher')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data as TeacherProfile[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được danh sách giáo viên.');
  }
}

export async function fetchClassMembers(classId: string): Promise<ClassMemberRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', classId);

    if (error) throw error;
    return (data as ClassMemberRow[]) ?? [];
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được danh sách học sinh của lớp.');
  }
}

export async function fetchAllClassMembers(): Promise<ClassMemberRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.from('class_members').select('*');
    if (error) throw error;
    return (data as ClassMemberRow[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchClassTeachers(classId: string): Promise<ClassTeacherRow[]> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('class_teachers')
      .select('*')
      .eq('class_id', classId);

    if (error) throw error;
    return (data as ClassTeacherRow[]) ?? [];
  } catch {
    return [];
  }
}

/** Thêm một giáo viên khác vào cùng dạy lớp này. */
export async function addTeacherToClass(classId: string, teacherId: string): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('class_teachers')
      .insert({ class_id: classId, teacher_id: teacherId, role: 'teacher' });

    if (error && error.code !== '23505') throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không thêm được giáo viên vào lớp.');
  }
}

export async function removeTeacherFromClass(classId: string, teacherId: string): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('class_teachers')
      .delete()
      .eq('class_id', classId)
      .eq('teacher_id', teacherId);

    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không gỡ được giáo viên khỏi lớp.');
  }
}

export async function setClassOpen(classId: string, isOpen: boolean): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase.from('classes').update({ is_open: isOpen }).eq('id', classId);
    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không đổi được trạng thái lớp.');
  }
}

export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  try {
    const supabase = requireSupabase();
    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (error) throw error;
  } catch (error) {
    throw toRepositoryError(error, 'Không gỡ được học sinh khỏi lớp.');
  }
}

/** Đường dẫn để giáo viên gửi cho học sinh — mã lớp điền sẵn. */
export function buildJoinLink(joinCode: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}#/auth/register?lop=${encodeURIComponent(joinCode)}`;
}
