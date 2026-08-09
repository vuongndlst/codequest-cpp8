import type { ActivityEventRow } from '@/types/database';
import { LESSONS_META } from '@/data/lessons.meta';

/** Định dạng thời gian tương đối bằng tiếng Việt, vd. "3 phút trước". */
export function formatRelativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return '';

  const diffSeconds = Math.round((Date.now() - then) / 1000);

  if (diffSeconds < 60) return 'vừa xong';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
  if (diffSeconds < 86_400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
  if (diffSeconds < 604_800) return `${Math.floor(diffSeconds / 86_400)} ngày trước`;

  return new Date(isoDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function zoneNameOf(lessonId: string | null): string {
  if (!lessonId) return '';
  return LESSONS_META.find((lesson) => lesson.id === lessonId)?.zoneName ?? lessonId;
}

/**
 * Chuyển một sự kiện hoạt động thành câu tiếng Việt cho học sinh đọc.
 * Giọng văn luôn tích cực — không có từ "thất bại" hay "sai" (mục 6).
 */
export function formatEventLabel(event: ActivityEventRow): string {
  const zone = zoneNameOf(event.lesson_id);

  switch (event.event_type) {
    case 'lesson_started':
      return `Bắt đầu khám phá ${zone}`;
    case 'lesson_completed':
      return `Giải cứu thành công ${zone}`;
    case 'challenge_passed':
      return `Hoàn thành một nhiệm vụ ở ${zone}`;
    case 'challenge_attempted':
      return `Thử sức với một nhiệm vụ ở ${zone}`;
    case 'boss_defeated':
      return `Đánh bại Boss của ${zone}`;
    case 'badge_earned': {
      const name = (event.metadata as { badgeName?: string }).badgeName;
      return name ? `Nhận huy hiệu ${name}` : 'Nhận một huy hiệu mới';
    }
    case 'certificate_issued': {
      const name = (event.metadata as { certificateName?: string }).certificateName;
      return name ? `Nhận chứng chỉ ${name}` : 'Nhận một chứng chỉ mới';
    }
    case 'clean_code_checked':
      return `Kiểm tra Clean Code ở ${zone}`;
    case 'hint_used':
      return `Xem gợi ý ở ${zone}`;
    case 'challenge_started':
      return `Mở một nhiệm vụ mới ở ${zone}`;
    case 'reported_issue':
      return 'Báo cho thầy một nhiệm vụ có vấn đề';
    default:
      return 'Hoạt động học tập';
  }
}
