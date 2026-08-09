import { describe, expect, it } from 'vitest';
import {
  buildCsvFileName,
  buildProgressCsv,
  buildStudentSummaries,
  computeErrorStats,
  computeLessonOverview,
  listClassNames,
} from './teacherAnalytics';
import type { StudentProfile } from './supabase/teacher.repo';
import type { CertificateRow, ChallengeAttemptRow, LessonProgressRow } from '@/types/database';

function makeStudent(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 'u1',
    full_name: 'Nguyễn Văn An',
    class_name: '8A1',
    student_code: 'HS001',
    avatar_id: 'guardian-cyan',
    total_xp: 300,
    level: 3,
    last_active_date: null,
    ...overrides,
  };
}

function makeProgress(overrides: Partial<LessonProgressRow> = {}): LessonProgressRow {
  return {
    id: 'p1',
    user_id: 'u1',
    lesson_id: 'l1',
    status: 'completed',
    progress_percent: 100,
    stars: 3,
    xp: 300,
    completed_challenges: [],
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<ChallengeAttemptRow> = {}): ChallengeAttemptRow {
  return {
    id: `a-${Math.random()}`,
    user_id: 'u1',
    lesson_id: 'l1',
    challenge_id: 'l1-c4-mission',
    submitted_code: '',
    is_correct: false,
    passed_tests: 0,
    total_tests: 1,
    error_types: [],
    hint_level_used: 0,
    attempt_number: 1,
    clean_code_score: null,
    created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
    ...overrides,
  };
}

describe('Tổng hợp số liệu học sinh', () => {
  it('tính đúng số khu vực hoàn thành, sao và chứng chỉ', () => {
    const student = makeStudent();
    const certificate = { user_id: 'u1' } as CertificateRow;

    const [summary] = buildStudentSummaries({
      students: [student],
      progress: [
        makeProgress({ lesson_id: 'l1', status: 'completed', stars: 3, progress_percent: 100 }),
        makeProgress({ id: 'p2', lesson_id: 'l2', status: 'in_progress', stars: 1, progress_percent: 40 }),
      ],
      certificates: [certificate],
      attempts: [],
    });

    expect(summary.lessonsCompleted).toBe(1);
    expect(summary.totalStars).toBe(4);
    expect(summary.certificatesCount).toBe(1);
    // (100 + 40) / 5 khu vực = 28%
    expect(summary.overallPercent).toBe(28);
  });

  it('tính số lần thử trung bình cho mỗi nhiệm vụ làm được', () => {
    const [summary] = buildStudentSummaries({
      students: [makeStudent()],
      progress: [],
      certificates: [],
      attempts: [
        makeAttempt({ challenge_id: 'c1' }),
        makeAttempt({ challenge_id: 'c1' }),
        makeAttempt({ challenge_id: 'c1', is_correct: true }),
        makeAttempt({ challenge_id: 'c2', is_correct: true }),
      ],
    });

    // 4 lần thử / 2 nhiệm vụ làm được = 2
    expect(summary.attemptCount).toBe(4);
    expect(summary.averageAttemptsPerSolved).toBe(2);
  });

  it('ghi lại mức gợi ý cao nhất nhưng không dùng nó để đánh giá', () => {
    const [summary] = buildStudentSummaries({
      students: [makeStudent()],
      progress: [],
      certificates: [],
      attempts: [makeAttempt({ hint_level_used: 1 }), makeAttempt({ hint_level_used: 3 })],
    });

    expect(summary.maxHintLevel).toBe(3);
  });

  it('không có dữ liệu clean code thì trả về null thay vì 0', () => {
    const [summary] = buildStudentSummaries({
      students: [makeStudent()],
      progress: [],
      certificates: [],
      attempts: [makeAttempt({ clean_code_score: null })],
    });

    // 0 sẽ khiến giáo viên tưởng em ấy viết code rất tệ
    expect(summary.averageCleanCode).toBeNull();
  });

  it('chỉ gộp dữ liệu của đúng học sinh đó', () => {
    const summaries = buildStudentSummaries({
      students: [makeStudent({ id: 'u1' }), makeStudent({ id: 'u2', full_name: 'Trần Thị Bình' })],
      progress: [makeProgress({ user_id: 'u1' })],
      certificates: [],
      attempts: [makeAttempt({ user_id: 'u2' }), makeAttempt({ user_id: 'u2' })],
    });

    expect(summaries[0].lessonsCompleted).toBe(1);
    expect(summaries[0].attemptCount).toBe(0);
    expect(summaries[1].lessonsCompleted).toBe(0);
    expect(summaries[1].attemptCount).toBe(2);
  });
});

describe('Thống kê lỗi phổ biến', () => {
  it('xếp theo SỐ HỌC SINH trước, không phải số lượt', () => {
    const stats = computeErrorStats([
      // Một em bấm Chạy 5 lần với cùng một lỗi
      ...Array.from({ length: 5 }, () =>
        makeAttempt({ user_id: 'u1', error_types: ['TIMEOUT'] }),
      ),
      // Ba em khác nhau, mỗi em một lần
      makeAttempt({ user_id: 'u1', error_types: ['MISSING_SEMICOLON'] }),
      makeAttempt({ user_id: 'u2', error_types: ['MISSING_SEMICOLON'] }),
      makeAttempt({ user_id: 'u3', error_types: ['MISSING_SEMICOLON'] }),
    ]);

    // Lỗi cả lớp gặp phải đứng trên, dù tổng lượt ít hơn
    expect(stats[0].code).toBe('MISSING_SEMICOLON');
    expect(stats[0].studentCount).toBe(3);
    expect(stats[0].count).toBe(3);

    expect(stats[1].code).toBe('TIMEOUT');
    expect(stats[1].studentCount).toBe(1);
    expect(stats[1].count).toBe(5);
  });

  it('dịch mã lỗi sang tiếng Việt', () => {
    const stats = computeErrorStats([makeAttempt({ error_types: ['ASSIGN_IN_CONDITION'] })]);
    expect(stats[0].label).toBe('Nhầm = với == trong điều kiện');
  });

  it('không có lỗi thì trả về mảng rỗng', () => {
    expect(computeErrorStats([])).toEqual([]);
  });
});

describe('Tổng quan theo khu vực', () => {
  it('đếm số em đã bắt đầu và đã hoàn thành từng khu vực', () => {
    const overview = computeLessonOverview(
      [makeStudent({ id: 'u1' }), makeStudent({ id: 'u2' })],
      [
        makeProgress({ user_id: 'u1', lesson_id: 'l1', status: 'completed', progress_percent: 100 }),
        makeProgress({ user_id: 'u2', lesson_id: 'l1', status: 'in_progress', progress_percent: 50 }),
      ],
    );

    const lesson1 = overview.find((row) => row.lessonId === 'l1')!;
    expect(lesson1.studentsStarted).toBe(2);
    expect(lesson1.studentsCompleted).toBe(1);
    expect(lesson1.averagePercent).toBe(75);
  });
});

describe('Danh sách lớp', () => {
  it('gom lớp không trùng lặp và sắp xếp theo tiếng Việt', () => {
    const names = listClassNames([
      makeStudent({ id: 'u1', class_name: '8A2' }),
      makeStudent({ id: 'u2', class_name: '8A1' }),
      makeStudent({ id: 'u3', class_name: '8A1' }),
      makeStudent({ id: 'u4', class_name: null }),
    ]);

    expect(names).toEqual(['8A1', '8A2']);
  });
});

describe('Xuất CSV', () => {
  const summaries = buildStudentSummaries({
    students: [makeStudent()],
    progress: [makeProgress()],
    certificates: [],
    attempts: [makeAttempt({ error_types: ['MISSING_SEMICOLON'] })],
  });

  /**
   * Không có BOM thì Excel trên Windows đọc file như bảng mã ANSI và mọi chữ
   * tiếng Việt có dấu thành ký tự lỗi — hỏng hoàn toàn trải nghiệm của thầy cô.
   */
  it('bắt đầu bằng BOM để Excel đọc đúng tiếng Việt', () => {
    const csv = buildProgressCsv(summaries);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('có đủ dòng tiêu đề tiếng Việt và một dòng cho mỗi học sinh', () => {
    const csv = buildProgressCsv(summaries);
    const lines = csv.split('\r\n');

    expect(lines[0]).toContain('Họ và tên');
    expect(lines[0]).toContain('Mức gợi ý cao nhất');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Nguyễn Văn An');
    expect(lines[1]).toContain('Thiếu dấu chấm phẩy');
  });

  it('bọc ô có dấu phẩy trong nháy kép, và nhân đôi nháy kép bên trong', () => {
    const trickyName = buildProgressCsv(
      buildStudentSummaries({
        students: [makeStudent({ full_name: 'Nguyễn Văn An, Jr. "Bé An"' })],
        progress: [],
        certificates: [],
        attempts: [],
      }),
    );

    expect(trickyName).toContain('"Nguyễn Văn An, Jr. ""Bé An"""');
  });

  it('tên file có tên lớp và ngày xuất', () => {
    expect(buildCsvFileName('8A1')).toMatch(/^CodeQuest-TienTrinh-8A1-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(buildCsvFileName(null)).toContain('TatCaLop');
  });
});
