import { describe, expect, it } from 'vitest';
import { findStudentsNeedingAttention, type StudentSummary } from './teacherAnalytics';

const NOW = new Date('2026-08-10T10:00:00.000Z').getTime();
const DAY = 86_400_000;

function makeSummary(overrides: Partial<StudentSummary> = {}): StudentSummary {
  return {
    student: {
      id: 's1',
      full_name: 'Nguyễn Văn An',
      class_name: '8A1',
      student_code: null,
      avatar_id: 'guardian-cyan',
      total_xp: 300,
      level: 2,
      last_active_date: null,
    },
    lessonsCompleted: 1,
    overallPercent: 40,
    totalStars: 3,
    certificatesCount: 1,
    attemptCount: 20,
    averageAttemptsPerSolved: 2,
    maxHintLevel: 1,
    averageCleanCode: 85,
    topErrors: [],
    lastActiveAt: new Date(NOW - DAY).toISOString(),
    ...overrides,
  };
}

/**
 * Đây là phần trả lời câu hỏi mà giáo viên thật sự cần: "hôm nay phải để ý em
 * nào". Bảng tiến trình trung bình không trả lời được — một lớp trung bình 70%
 * có thể là cả lớp đều 70%, mà cũng có thể là nửa lớp xong hết còn nửa lớp
 * chưa mở bài bao giờ.
 */
describe('Học sinh cần chú ý', () => {
  it('em học đều thì không bị nhắc', () => {
    expect(findStudentsNeedingAttention([makeSummary()], NOW)).toHaveLength(0);
  });

  it('em chưa chạy code lần nào là gấp nhất', () => {
    const items = findStudentsNeedingAttention([makeSummary({ attemptCount: 0 })], NOW);
    expect(items[0].reason).toBe('chua-bat-dau');
  });

  it('em bỏ lâu không vào học thì được nhắc kèm số ngày', () => {
    const items = findStudentsNeedingAttention(
      [makeSummary({ lastActiveAt: new Date(NOW - 9 * DAY).toISOString() })],
      NOW,
    );

    expect(items[0].reason).toBe('lau-khong-hoc');
    expect(items[0].detail).toContain('9 ngày');
  });

  it('em phải thử quá nhiều lần mỗi nhiệm vụ thì bị đánh dấu đang vướng', () => {
    const items = findStudentsNeedingAttention(
      [
        makeSummary({
          averageAttemptsPerSolved: 9,
          topErrors: [{ code: 'MISSING_SEMICOLON', label: 'Thiếu dấu chấm phẩy', count: 12 }],
        }),
      ],
      NOW,
    );

    expect(items[0].reason).toBe('dang-vuong');
    expect(items[0].detail).toContain('Thiếu dấu chấm phẩy');
  });

  /**
   * Em học xong cả khoá rồi thì thôi không vào nữa là chuyện bình thường.
   * Nhắc thầy cô về những em này chỉ làm loãng danh sách cần xử lý.
   */
  it('em đã hoàn thành cả khoá thì không nhắc dù lâu không vào', () => {
    const items = findStudentsNeedingAttention(
      [
        makeSummary({
          overallPercent: 100,
          lastActiveAt: new Date(NOW - 30 * DAY).toISOString(),
        }),
      ],
      NOW,
    );

    expect(items).toHaveLength(0);
  });

  it('xếp em chưa bắt đầu lên trước em đang vướng và em bỏ lâu', () => {
    const items = findStudentsNeedingAttention(
      [
        makeSummary({
          student: { ...makeSummary().student, id: 'lau' },
          lastActiveAt: new Date(NOW - 20 * DAY).toISOString(),
        }),
        makeSummary({
          student: { ...makeSummary().student, id: 'vuong' },
          averageAttemptsPerSolved: 8,
        }),
        makeSummary({ student: { ...makeSummary().student, id: 'chua' }, attemptCount: 0 }),
      ],
      NOW,
    );

    expect(items.map((item) => item.summary.student.id)).toEqual(['chua', 'vuong', 'lau']);
  });

  it('mỗi em chỉ xuất hiện một lần dù dính nhiều tiêu chí', () => {
    const items = findStudentsNeedingAttention(
      [
        makeSummary({
          attemptCount: 0,
          averageAttemptsPerSolved: 20,
          lastActiveAt: new Date(NOW - 40 * DAY).toISOString(),
        }),
      ],
      NOW,
    );

    expect(items).toHaveLength(1);
  });
});
