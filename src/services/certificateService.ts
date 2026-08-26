import type { CertificateCode } from '@/types/content';
import type {
  CertificateMetadata,
  CertificateRow,
  ChallengeAttemptRow,
  ExitTicketRow,
  LessonProgressRow,
  ProfileRow,
} from '@/types/database';
import { getLesson, getRequiredChallengeIds } from '@/lessons';
import { CERTIFICATE_NAMES, COURSE_NAME, TEACHER_NAME, getLessonMeta } from '@/data/lessons.meta';
import { requireSupabase } from '@/services/supabase/client';
import { toRepositoryError } from '@/services/supabase/errors';

/**
 * Cấp chứng chỉ (mục 12 của đề bài).
 *
 * Chứng chỉ là phần thưởng mặc định khi học sinh hoàn thành một khu vực.
 * Toàn bộ phần XÉT ĐIỀU KIỆN là hàm thuần — không đụng mạng, không đụng React —
 * nên test được đầy đủ mọi tổ hợp mà không cần dựng database.
 */

export interface CertificateRequirement {
  id: string;
  label: string;
  met: boolean;
  /** Mô tả tiến độ hiện tại, vd. "8/9 nhiệm vụ" */
  detail: string;
}

export interface CertificateEligibility {
  lessonId: string;
  requirements: CertificateRequirement[];
  eligible: boolean;
}

export interface EligibilityInput {
  lessonId: string;
  progress: LessonProgressRow | null;
  exitTicket: ExitTicketRow | null;
  /** Toàn bộ lần làm bài của học sinh trong bài học này */
  attempts: ChallengeAttemptRow[];
}

/** Giữ để báo tiến trình học tập; từ nay ngưỡng này không chặn chứng chỉ. */
export const REQUIRED_TEST_PASS_RATE = 0.7;

/**
 * Xét năm điều kiện cấp chứng chỉ.
 *
 * Điều kiện thứ năm chỉ xác nhận học sinh đã từng chạy code và nhận phản hồi
 * về cách trình bày. Điểm clean code không bao giờ là điểm phạt.
 */
export function checkEligibility(input: EligibilityInput): CertificateEligibility {
  const { lessonId, progress, exitTicket, attempts } = input;

  const lesson = getLesson(lessonId);
  const completed = progress?.completed_challenges ?? [];
  const requiredIds = getRequiredChallengeIds(lessonId);
  const doneCount = requiredIds.filter((id) => completed.includes(id)).length;

  // ① Hoàn thành tất cả nhiệm vụ bắt buộc
  const allChallengesDone = requiredIds.length > 0 && doneCount === requiredIds.length;

  // ② Vượt qua Boss Challenge
  const boss = lesson?.challenges.find((challenge) => challenge.kind === 'boss');
  const bossPassed = boss ? completed.includes(boss.id) : false;

  // ③ Hoàn thành Exit Ticket
  const exitTicketDone = (exitTicket?.score ?? 0) >= 70;

  // Hai tín hiệu dưới đây vẫn hữu ích để học sinh tự nhìn lại, nhưng không còn
  // là “cửa khóa” phần thưởng. Hoàn thành khu vực là đủ nhận chứng chỉ.
  const correctAttempts = attempts.filter((attempt) => attempt.total_tests > 0);
  const totalTests = correctAttempts.reduce((sum, attempt) => sum + attempt.total_tests, 0);
  const passedTests = correctAttempts.reduce((sum, attempt) => sum + attempt.passed_tests, 0);
  const passRate = totalTests > 0 ? passedTests / totalTests : 0;
  const testRateOk = allChallengesDone || passRate >= REQUIRED_TEST_PASS_RATE;
  const cleanCodeChecked = attempts.some((attempt) => attempt.clean_code_score !== null);

  const requirements: CertificateRequirement[] = [
    {
      id: 'all-challenges',
      label: 'Hoàn thành tất cả nhiệm vụ bắt buộc',
      met: allChallengesDone,
      detail: `${doneCount}/${requiredIds.length} nhiệm vụ`,
    },
    {
      id: 'boss',
      label: 'Vượt qua Boss Challenge',
      met: bossPassed,
      detail: bossPassed ? 'Đã đánh bại' : 'Chưa hoàn thành',
    },
    {
      id: 'exit-ticket',
      label: 'Nộp Exit Ticket',
      met: exitTicketDone,
      detail: exitTicketDone
        ? `Đã đạt · ${exitTicket?.score ?? 0} điểm`
        : exitTicket
          ? `Chưa đạt · ${exitTicket.score} điểm`
          : 'Chưa nộp',
    },
    {
      id: 'test-rate',
      label: `Đạt ${Math.round(REQUIRED_TEST_PASS_RATE * 100)}% test bắt buộc · không chặn chứng chỉ`,
      met: testRateOk,
      detail: totalTests > 0 ? `${Math.round(passRate * 100)}%` : 'Chưa có dữ liệu',
    },
    {
      id: 'clean-code',
      label: 'Đã xem phản hồi trình bày code · không chặn chứng chỉ',
      met: cleanCodeChecked,
      detail: cleanCodeChecked ? 'Đã xem' : 'Có thể xem sau',
    },
  ];

  return {
    lessonId,
    requirements,
    // `completed` là trạng thái có thẩm quyền do checkpoint ghi. Nhánh thứ hai
    // giữ tương thích với dữ liệu cũ đã đủ ba mốc nhưng chưa cập nhật status.
    eligible:
      progress?.status === 'completed' || requirements.slice(0, 3).every((requirement) => requirement.met),
  };
}

/**
 * Sinh mã chứng chỉ theo định dạng `CPP8-[LESSON]-[USER6]-[TIMESTAMP]`.
 *
 * `USER6` là 6 ký tự hex đầu của user id — đủ để phân biệt trong phạm vi một
 * trường, nhưng KHÔNG lộ UUID đầy đủ khi học sinh khoe chứng chỉ ra ngoài.
 */
export function buildCertificateCode(
  lessonId: string,
  userId: string,
  issuedAt: Date = new Date(),
): string {
  const lessonPart = lessonId.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const userPart = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const timestamp = Math.floor(issuedAt.getTime() / 1000);
  return `CPP8-${lessonPart}-${userPart}-${timestamp}`;
}

export function buildCertificateMetadata(
  profile: ProfileRow,
  lessonId: string,
): CertificateMetadata {
  const meta = getLessonMeta(lessonId);
  const certificateCode = (meta?.certificateCode ?? 'cpp-starter') as CertificateCode;

  return {
    studentName: profile.full_name,
    className: profile.class_name,
    lessonTitle: meta ? `Khu vực ${meta.order} — ${meta.zoneName}` : lessonId,
    certificateName: CERTIFICATE_NAMES[certificateCode] ?? certificateCode,
    teacherName: TEACHER_NAME,
    courseName: COURSE_NAME,
  };
}

/**
 * Chứng chỉ đã cấp là bất biến về mã/ngày/thành tích, nhưng tên và lớp phải đi
 * theo hồ sơ hiện tại. Nhờ vậy học sinh sửa đúng dấu tiếng Việt một lần thì cả
 * bản xem trước lẫn PDF cũ đều được sửa theo, không cần cấp lại chứng chỉ.
 */
export function syncCertificateIdentity(
  certificate: CertificateRow,
  profile: Pick<ProfileRow, 'full_name' | 'class_name'>,
): CertificateRow {
  return {
    ...certificate,
    metadata: {
      ...certificate.metadata,
      studentName: profile.full_name,
      className: profile.class_name,
    },
  };
}

/**
 * Cấp chứng chỉ, đảm bảo MỖI HỌC SINH CHỈ NHẬN MỘT LẦN cho mỗi bài học.
 *
 * Ba lớp chống cấp trùng:
 *   ① kiểm tra trước khi ghi
 *   ② ràng buộc UNIQUE(user_id, lesson_id) ở database
 *   ③ bắt lỗi 23505 rồi đọc lại bản ghi đã có
 *
 * Lớp ③ là lớp thật sự quan trọng: hai tab cùng mở, cùng bấm một lúc thì lớp ①
 * không đủ. Chứng chỉ đã cấp giữ nguyên `certificate_code` và `issued_at` vĩnh viễn.
 */
export async function issueCertificate(
  profile: ProfileRow,
  lessonId: string,
  _progress: LessonProgressRow | null,
): Promise<CertificateRow> {
  const supabase = requireSupabase();

  const existing = await fetchCertificate(profile.id, lessonId);
  if (existing) return existing;

  // Điều kiện và dữ liệu chứng chỉ được xác minh trong database. Trình duyệt
  // chỉ yêu cầu đồng bộ, không được tự chọn XP, số sao hay trạng thái hoàn thành.
  const { data, error } = await supabase.rpc('ensure_area_certificate', {
    p_user_id: profile.id,
    p_lesson_id: lessonId,
  });

  if (error) throw toRepositoryError(error, 'Không đồng bộ được chứng chỉ.');
  if (data) return data as CertificateRow;

  const issued = await fetchCertificate(profile.id, lessonId);
  if (!issued) {
    throw new Error('Khu vực chưa đủ điều kiện cấp chứng chỉ.');
  }
  return issued;
}

export async function fetchCertificate(
  userId: string,
  lessonId: string,
): Promise<CertificateRow | null> {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) throw error;
    return (data as CertificateRow | null) ?? null;
  } catch (error) {
    throw toRepositoryError(error, 'Không tải được chứng chỉ.');
  }
}
