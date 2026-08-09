import { describe, expect, it } from 'vitest';
import {
  buildCertificateCode,
  buildCertificateMetadata,
  checkEligibility,
  REQUIRED_TEST_PASS_RATE,
} from './certificateService';
import { getLesson, getRequiredChallengeIds } from '@/lessons';
import type {
  ChallengeAttemptRow,
  ExitTicketRow,
  LessonProgressRow,
  ProfileRow,
} from '@/types/database';

const LESSON_ID = 'l1';

function makeProgress(completedChallenges: string[]): LessonProgressRow {
  return {
    id: 'p1',
    user_id: 'u1',
    lesson_id: LESSON_ID,
    status: 'in_progress',
    progress_percent: 50,
    stars: 2,
    xp: 200,
    completed_challenges: completedChallenges,
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
  };
}

function makeExitTicket(): ExitTicketRow {
  return {
    id: 'e1',
    user_id: 'u1',
    lesson_id: LESSON_ID,
    answers: {},
    score: 100,
    reflection: 'Em thấy lỗi thiếu dấu chấm phẩy là khó phát hiện nhất.',
    submitted_at: new Date().toISOString(),
  };
}

function makeAttempt(overrides: Partial<ChallengeAttemptRow> = {}): ChallengeAttemptRow {
  return {
    id: 'a1',
    user_id: 'u1',
    lesson_id: LESSON_ID,
    challenge_id: 'l1-c4-mission',
    submitted_code: 'int main() {}',
    is_correct: true,
    passed_tests: 1,
    total_tests: 1,
    error_types: [],
    hint_level_used: 0,
    attempt_number: 1,
    clean_code_score: 90,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeProfile(): ProfileRow {
  return {
    id: '7f3a2199-0000-4000-8000-000000000000',
    full_name: 'Nguyễn Văn An',
    class_name: '8A1',
    student_code: 'HS001',
    avatar_id: 'guardian-cyan',
    role: 'student',
    total_xp: 300,
    level: 3,
    streak_days: 2,
    last_active_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/** Hồ sơ của một học sinh đã hoàn thành trọn vẹn Khu vực 1. */
function fullyCompletedInput() {
  const allIds = getRequiredChallengeIds(LESSON_ID);
  return {
    lessonId: LESSON_ID,
    progress: makeProgress(allIds),
    exitTicket: makeExitTicket(),
    attempts: [makeAttempt()],
  };
}

describe('Năm điều kiện cấp chứng chỉ', () => {
  it('đủ cả năm điều kiện thì được cấp', () => {
    const result = checkEligibility(fullyCompletedInput());

    expect(result.eligible).toBe(true);
    expect(result.requirements).toHaveLength(5);
    expect(result.requirements.every((requirement) => requirement.met)).toBe(true);
  });

  it('thiếu một nhiệm vụ bắt buộc thì chưa được cấp', () => {
    const allIds = getRequiredChallengeIds(LESSON_ID);
    const result = checkEligibility({
      ...fullyCompletedInput(),
      progress: makeProgress(allIds.slice(0, -1)),
    });

    expect(result.eligible).toBe(false);
    const requirement = result.requirements.find((item) => item.id === 'all-challenges')!;
    expect(requirement.met).toBe(false);
    expect(requirement.detail).toBe(`${allIds.length - 1}/${allIds.length} nhiệm vụ`);
  });

  it('chưa vượt Boss thì chưa được cấp', () => {
    const boss = getLesson(LESSON_ID)!.challenges.find((c) => c.kind === 'boss')!;
    const withoutBoss = getRequiredChallengeIds(LESSON_ID).filter((id) => id !== boss.id);

    const result = checkEligibility({
      ...fullyCompletedInput(),
      progress: makeProgress(withoutBoss),
    });

    expect(result.requirements.find((item) => item.id === 'boss')!.met).toBe(false);
    expect(result.eligible).toBe(false);
  });

  it('chưa nộp Exit Ticket thì chưa được cấp', () => {
    const result = checkEligibility({ ...fullyCompletedInput(), exitTicket: null });

    expect(result.requirements.find((item) => item.id === 'exit-ticket')!.met).toBe(false);
    expect(result.eligible).toBe(false);
  });

  it('chưa làm xong bài mà tỉ lệ test dưới ngưỡng thì chưa được cấp', () => {
    const result = checkEligibility({
      lessonId: LESSON_ID,
      progress: makeProgress(['l1-c1-observe']),
      exitTicket: makeExitTicket(),
      attempts: [makeAttempt({ passed_tests: 1, total_tests: 10 })],
    });

    const requirement = result.requirements.find((item) => item.id === 'test-rate')!;
    expect(requirement.met).toBe(false);
    expect(requirement.detail).toBe('10%');
  });

  it('ngưỡng test là 70% đúng như đề bài', () => {
    expect(REQUIRED_TEST_PASS_RATE).toBe(0.7);
  });

  /**
   * Guard cho mục 11: điểm clean code KHÔNG được làm học sinh mất chứng chỉ.
   * Chỉ cần em ấy đã TỪNG làm Clean Code Check, dù điểm rất thấp.
   */
  it('điểm clean code thấp KHÔNG làm mất chứng chỉ', () => {
    const result = checkEligibility({
      ...fullyCompletedInput(),
      attempts: [makeAttempt({ clean_code_score: 12 })],
    });

    expect(result.eligible).toBe(true);
    expect(result.requirements.find((item) => item.id === 'clean-code')!.met).toBe(true);
  });

  it('chưa từng làm Clean Code Check thì chưa được cấp', () => {
    const cleanCodeNode = getLesson(LESSON_ID)!.challenges.find((c) => c.kind === 'cleancode')!;
    const withoutCleanCode = getRequiredChallengeIds(LESSON_ID).filter(
      (id) => id !== cleanCodeNode.id,
    );

    const result = checkEligibility({
      lessonId: LESSON_ID,
      progress: makeProgress(withoutCleanCode),
      exitTicket: makeExitTicket(),
      attempts: [makeAttempt({ challenge_id: 'l1-c4-mission', clean_code_score: null })],
    });

    expect(result.requirements.find((item) => item.id === 'clean-code')!.met).toBe(false);
  });

  it('số lần thử và số gợi ý đã dùng KHÔNG ảnh hưởng tới việc cấp chứng chỉ', () => {
    const struggled = checkEligibility({
      ...fullyCompletedInput(),
      attempts: [
        makeAttempt({ attempt_number: 14, hint_level_used: 3, is_correct: false, passed_tests: 0 }),
        makeAttempt({ attempt_number: 15, hint_level_used: 3 }),
      ],
    });

    expect(struggled.eligible).toBe(true);
  });
});

describe('Mã chứng chỉ', () => {
  it('theo đúng định dạng CPP8-[LESSON]-[USER6]-[TIMESTAMP]', () => {
    const code = buildCertificateCode(
      'l3',
      '7f3a2199-0000-4000-8000-000000000000',
      new Date('2026-01-01T00:00:00Z'),
    );

    expect(code).toBe('CPP8-L3-7F3A21-1767225600');
    expect(code).toMatch(/^CPP8-[A-Z0-9]+-[A-F0-9]{6}-\d+$/);
  });

  it('chỉ lộ 6 ký tự đầu của user id, không lộ UUID đầy đủ', () => {
    const userId = '7f3a2199-abcd-4000-8000-000000000000';
    const code = buildCertificateCode('l1', userId);

    expect(code).toContain('7F3A21');
    expect(code).not.toContain('abcd');
    expect(code).not.toContain(userId);
  });

  it('hai học sinh khác nhau cho ra hai mã khác nhau', () => {
    const issuedAt = new Date('2026-01-01T00:00:00Z');
    const first = buildCertificateCode('l1', '11111111-0000-4000-8000-000000000000', issuedAt);
    const second = buildCertificateCode('l1', '22222222-0000-4000-8000-000000000000', issuedAt);

    expect(first).not.toBe(second);
  });
});

describe('Thông tin in trên chứng chỉ', () => {
  it('có đủ mọi mục đề bài yêu cầu', () => {
    const metadata = buildCertificateMetadata(makeProfile(), 'l3');

    expect(metadata.studentName).toBe('Nguyễn Văn An');
    expect(metadata.className).toBe('8A1');
    expect(metadata.certificateName).toBe('Loop Explorer');
    expect(metadata.lessonTitle).toContain('Thung Lũng Lặp');
    expect(metadata.teacherName).toBe('Nguyễn Đình Vương');
    expect(metadata.courseName).toBe('CodeQuest C++ 8');
  });

  it('mỗi khu vực ứng với một chứng chỉ khác nhau', () => {
    const names = ['l1', 'l2', 'l3', 'l4', 'l5'].map(
      (lessonId) => buildCertificateMetadata(makeProfile(), lessonId).certificateName,
    );

    expect(new Set(names).size).toBe(5);
    expect(names).toEqual([
      'C++ Starter',
      'Function Builder',
      'Loop Explorer',
      'Decision Maker',
      'ByteLand Code Guardian',
    ]);
  });
});
