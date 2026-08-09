/**
 * Ghi nhớ học sinh đã mở phần lý thuyết của khu vực nào.
 *
 * Lưu ở localStorage chứ không lưu vào database: đây chỉ là gợi ý thứ tự học,
 * không phải dữ liệu tính điểm. Đổi máy thì mất — chấp nhận được, vì hậu quả
 * duy nhất là em được mời đọc lại lý thuyết một lần nữa.
 *
 * Cố ý KHÔNG khoá nhiệm vụ theo việc đã đọc hay chưa. Đề bài yêu cầu không
 * trừng phạt học sinh, và có em nắm bài rồi thì bắt đọc lại là vô ích.
 */

const PREFIX = 'cq8:guide-read:';

export function markGuideRead(lessonId: string): void {
  try {
    localStorage.setItem(`${PREFIX}${lessonId}`, '1');
  } catch {
    // localStorage bị chặn — chỉ mất phần ghi nhớ, mọi thứ khác vẫn chạy
  }
}

export function hasReadGuide(lessonId: string): boolean {
  try {
    return localStorage.getItem(`${PREFIX}${lessonId}`) === '1';
  } catch {
    return false;
  }
}
