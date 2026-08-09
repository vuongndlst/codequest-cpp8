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
import { logActivityEvent } from '@/services/supabase/gamification.repo';

/**
 * Cấp chứng chỉ (mục 12 của đề bài).
 *
 * Năm điều kiện, đúng như thiết kế ở docs/phase-1-architecture.md mục 7.1.
 * Toàn bộ phần XÉT ĐIỀU KIỆN là hàm thuần — không đụng mạng, không đụng React —
 * nên test được đầy đủ mọi tổ hợp mà không cần dựng database.
 */

/** Tỉ lệ test case bắt buộc phải vượt qua. */
export const REQUIRED_TEST_PASS_RATE = 0.7;

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

/**
 * Xét năm điều kiện cấp chứng chỉ.
 *
 * Lưu ý về mục 11 của đề bài: điều kiện thứ năm chỉ yêu cầu học sinh ĐÃ TỪNG
 * làm Clean Code Check, KHÔNG yêu cầu đạt điểm cao. Điểm clean code không bao
 * giờ được phép làm học sinh mất chứng chỉ khi chương trình đã chạy đúng.
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
  const exitTicketDone = exitTicket !== null;

  // ④ Đạt ít nhất 70% test case bắt buộc
  const correctAttempts = attempts.filter((attempt) => attempt.total_tests > 0);
  const totalTests = correctAttempts.reduce((sum, attempt) => sum + attempt.total_tests, 0);
  const passedTests = correctAttempts.reduce((sum, attempt) => sum + attempt.passed_tests, 0);
  const passRate = totalTests > 0 ? passedTests / totalTests : 0;
  // Hoàn thành hết nhiệm vụ nghĩa là đã vượt mọi test bắt buộc ở lần cuối,
  // nên điều kiện này chỉ thực sự chặn khi học sinh chưa làm xong bài.
  const testRateOk = allChallengesDone || passRate >= REQUIRED_TEST_PASS_RATE;

  // ⑤ Đã thực hiện ít nhất một lần Clean Code Check
  const cleanCodeNode = lesson?.challenges.find((challenge) => challenge.kind === 'cleancode');
  const cleanCodeChecked = cleanCodeNode
    ? completed.includes(cleanCodeNode.id) ||
      attempts.some((attempt) => attempt.challenge_id === cleanCodeNode.id)
    : attempts.some((attempt) => attempt.clean_code_score !== null);

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
      detail: exitTicketDone ? `Đã nộp · ${exitTicket?.score ?? 0} điểm` : 'Chưa nộp',
    },
    {
      id: 'test-rate',
      label: `Đạt ít nhất ${Math.round(REQUIRED_TEST_PASS_RATE * 100)}% test case bắt buộc`,
      met: testRateOk,
      detail: totalTests > 0 ? `${Math.round(passRate * 100)}%` : 'Chưa có dữ liệu',
    },
    {
      id: 'clean-code',
      label: 'Thực hiện Clean Code Check ít nhất một lần',
      met: cleanCodeChecked,
      detail: cleanCodeChecked ? 'Đã làm' : 'Chưa làm',
    },
  ];

  return {
    lessonId,
    requirements,
    eligible: requirements.every((requirement) => requirement.met),
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
  progress: LessonProgressRow | null,
): Promise<CertificateRow> {
  const supabase = requireSupabase();

  const existing = await fetchCertificate(profile.id, lessonId);
  if (existing) return existing;

  const row = {
    user_id: profile.id,
    lesson_id: lessonId,
    certificate_code: buildCertificateCode(lessonId, profile.id),
    xp_at_issue: progress?.xp ?? 0,
    stars_at_issue: progress?.stars ?? 0,
    metadata: buildCertificateMetadata(profile, lessonId),
  };

  const { data, error } = await supabase.from('certificates').insert(row).select('*').single();

  if (error) {
    // 23505 = vi phạm ràng buộc duy nhất -> đã có người ghi trước, đọc lại bản đó
    if (error.code === '23505') {
      const raced = await fetchCertificate(profile.id, lessonId);
      if (raced) return raced;
    }
    throw toRepositoryError(error, 'Không cấp được chứng chỉ.');
  }

  void logActivityEvent(profile.id, {
    eventType: 'certificate_issued',
    lessonId,
    metadata: { certificateName: row.metadata.certificateName, code: row.certificate_code },
  });

  return data as CertificateRow;
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
