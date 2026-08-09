import type {
  CertificateRow,
  ChallengeAttemptRow,
  LessonProgressRow,
} from '@/types/database';
import type { StudentProfile } from '@/services/supabase/teacher.repo';
import { LESSONS_META } from '@/data/lessons.meta';
import { labelForErrorCode } from '@/validators/errorLabels';

/**
 * Tổng hợp số liệu cho dashboard giáo viên.
 *
 * Toàn bộ file là hàm thuần: nhận dữ liệu thô, trả về số liệu đã tổng hợp.
 * Không đụng mạng, không đụng React — nên test được đầy đủ, và nếu sau này đổi
 * cách lấy dữ liệu thì phần tính toán này không phải sửa.
 */

export interface StudentSummary {
  student: StudentProfile;
  /** Số khu vực đã hoàn thành trên tổng số 5 */
  lessonsCompleted: number;
  /** Phần trăm tiến trình trung bình trên cả khoá */
  overallPercent: number;
  totalStars: number;
  certificatesCount: number;
  attemptCount: number;
  /** Số lần thử trung bình cho mỗi nhiệm vụ làm được — cao thì em ấy đang vất vả */
  averageAttemptsPerSolved: number;
  /** Mức gợi ý cao nhất từng dùng (0..3) */
  maxHintLevel: number;
  /** Trung bình điểm clean code, null nếu chưa có dữ liệu */
  averageCleanCode: number | null;
  /** Ba mã lỗi hay gặp nhất của riêng học sinh này */
  topErrors: Array<{ code: string; label: string; count: number }>;
  lastActiveAt: string | null;
}

export interface AnalyticsInput {
  students: StudentProfile[];
  progress: LessonProgressRow[];
  certificates: CertificateRow[];
  attempts: ChallengeAttemptRow[];
}

export function buildStudentSummaries(input: AnalyticsInput): StudentSummary[] {
  const progressByUser = groupBy(input.progress, (row) => row.user_id);
  const certificatesByUser = groupBy(input.certificates, (row) => row.user_id);
  const attemptsByUser = groupBy(input.attempts, (row) => row.user_id);

  return input.students.map((student) => {
    const progressRows = progressByUser.get(student.id) ?? [];
    const attempts = attemptsByUser.get(student.id) ?? [];

    const lessonsCompleted = progressRows.filter((row) => row.status === 'completed').length;
    const overallPercent = Math.round(
      progressRows.reduce((sum, row) => sum + row.progress_percent, 0) / LESSONS_META.length,
    );
    const totalStars = progressRows.reduce((sum, row) => sum + row.stars, 0);

    const solvedChallenges = new Set(
      attempts.filter((attempt) => attempt.is_correct).map((attempt) => attempt.challenge_id),
    );
    const averageAttemptsPerSolved =
      solvedChallenges.size > 0
        ? Math.round((attempts.length / solvedChallenges.size) * 10) / 10
        : 0;

    const cleanCodeScores = attempts
      .map((attempt) => attempt.clean_code_score)
      .filter((score): score is number => score !== null);

    return {
      student,
      lessonsCompleted,
      overallPercent,
      totalStars,
      certificatesCount: (certificatesByUser.get(student.id) ?? []).length,
      attemptCount: attempts.length,
      averageAttemptsPerSolved,
      maxHintLevel: attempts.reduce((max, attempt) => Math.max(max, attempt.hint_level_used), 0),
      averageCleanCode:
        cleanCodeScores.length > 0
          ? Math.round(cleanCodeScores.reduce((sum, score) => sum + score, 0) / cleanCodeScores.length)
          : null,
      topErrors: countErrors(attempts).slice(0, 3),
      lastActiveAt: latestTimestamp(attempts),
    };
  });
}

export interface ErrorStat {
  code: string;
  label: string;
  count: number;
  /** Số học sinh khác nhau từng mắc lỗi này */
  studentCount: number;
}

/**
 * Thống kê lỗi phổ biến.
 *
 * `studentCount` quan trọng hơn `count`: một em bấm Chạy 30 lần với cùng một
 * lỗi không có nghĩa cả lớp đang vướng. Giáo viên nên nhìn cột số học sinh để
 * quyết định có cần giảng lại cho cả lớp hay không.
 */
export function computeErrorStats(attempts: ChallengeAttemptRow[]): ErrorStat[] {
  const counts = new Map<string, number>();
  const students = new Map<string, Set<string>>();

  for (const attempt of attempts) {
    for (const code of attempt.error_types ?? []) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
      if (!students.has(code)) students.set(code, new Set());
      students.get(code)!.add(attempt.user_id);
    }
  }

  return [...counts.entries()]
    .map(([code, count]) => ({
      code,
      label: labelForErrorCode(code),
      count,
      studentCount: students.get(code)?.size ?? 0,
    }))
    .sort((a, b) => b.studentCount - a.studentCount || b.count - a.count);
}

export interface LessonOverview {
  lessonId: string;
  zoneName: string;
  order: number;
  studentsStarted: number;
  studentsCompleted: number;
  averagePercent: number;
}

export function computeLessonOverview(
  students: StudentProfile[],
  progress: LessonProgressRow[],
): LessonOverview[] {
  return LESSONS_META.map((lesson) => {
    const rows = progress.filter((row) => row.lesson_id === lesson.id);
    const totalPercent = rows.reduce((sum, row) => sum + row.progress_percent, 0);

    return {
      lessonId: lesson.id,
      zoneName: lesson.zoneName,
      order: lesson.order,
      studentsStarted: rows.length,
      studentsCompleted: rows.filter((row) => row.status === 'completed').length,
      averagePercent:
        students.length > 0 ? Math.round(totalPercent / students.length) : 0,
    };
  });
}

/** Danh sách lớp có trong dữ liệu, đã sắp xếp. */
export function listClassNames(students: StudentProfile[]): string[] {
  const names = new Set<string>();
  for (const student of students) {
    if (student.class_name) names.add(student.class_name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'vi'));
}

// ─────────────────────────────────────────────────────────── Xuất CSV

const CSV_HEADERS = [
  'Họ và tên',
  'Lớp',
  'Mã học sinh',
  'Cấp độ',
  'Tổng XP',
  'Khu vực hoàn thành',
  'Tiến trình (%)',
  'Tổng sao',
  'Chứng chỉ',
  'Số lần thử',
  'Số lần thử TB mỗi nhiệm vụ',
  'Mức gợi ý cao nhất',
  'Clean code TB',
  'Lỗi hay gặp nhất',
  'Hoạt động gần nhất',
];

/**
 * Xuất bảng tiến trình ra CSV.
 *
 * ⚠ Bắt buộc có BOM `﻿` ở đầu file: nếu không, Excel trên Windows sẽ đọc
 * file như bảng mã ANSI và mọi chữ tiếng Việt có dấu sẽ thành ký tự lỗi.
 * Đây là chi tiết nhỏ nhưng làm hỏng hoàn toàn trải nghiệm nếu bỏ sót.
 */
export function buildProgressCsv(summaries: StudentSummary[]): string {
  const rows = summaries.map((summary) => [
    summary.student.full_name,
    summary.student.class_name ?? '',
    summary.student.student_code ?? '',
    String(summary.student.level),
    String(summary.student.total_xp),
    `${summary.lessonsCompleted}/${LESSONS_META.length}`,
    String(summary.overallPercent),
    String(summary.totalStars),
    String(summary.certificatesCount),
    String(summary.attemptCount),
    String(summary.averageAttemptsPerSolved),
    String(summary.maxHintLevel),
    summary.averageCleanCode === null ? '' : String(summary.averageCleanCode),
    summary.topErrors[0]?.label ?? '',
    summary.lastActiveAt ? formatCsvDate(summary.lastActiveAt) : '',
  ]);

  const lines = [CSV_HEADERS, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return `﻿${lines.join('\r\n')}`;
}

export function buildCsvFileName(className: string | null): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const scope = className ? className.replace(/[^A-Za-z0-9]/g, '') : 'TatCaLop';
  return `CodeQuest-TienTrinh-${scope}-${stamp}.csv`;
}

/** Bọc ô có dấu phẩy, nháy kép hoặc xuống dòng theo đúng chuẩn CSV. */
function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Tải chuỗi CSV xuống máy. Tách riêng để phần tính toán ở trên test được. */
export function downloadCsv(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ───────────────────────────────────────────────────────────── Tiện ích

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

function countErrors(
  attempts: ChallengeAttemptRow[],
): Array<{ code: string; label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const attempt of attempts) {
    for (const code of attempt.error_types ?? []) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, label: labelForErrorCode(code), count }))
    .sort((a, b) => b.count - a.count);
}

function latestTimestamp(attempts: ChallengeAttemptRow[]): string | null {
  let latest: string | null = null;
  for (const attempt of attempts) {
    if (!latest || attempt.created_at > latest) latest = attempt.created_at;
  }
  return latest;
}
