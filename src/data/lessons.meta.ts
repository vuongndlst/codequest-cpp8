import type { LessonMeta } from '@/types/content';

export const LESSONS_META: LessonMeta[] = [
  {
    id: 'a0', order: 0, zoneName: 'Trạm Khởi Động', title: 'C++ bắt đầu từ đâu?',
    subtitle: 'main · cout · statement · dấu ; · comment',
    intro: 'Đánh thức hệ thống bằng chương trình C++ đầu tiên.',
    objectives: ['Nhận biết cấu trúc chương trình', 'Xuất dữ liệu với cout', 'Debug lỗi cú pháp đầu tiên'],
    certificateCode: 'cpp-starter', accent: 'quest', icon: 'terminal', estimatedMinutes: 60,
    challengeCount: 4, requiredChallengeCount: 4,
  },
  {
    id: 'a1', order: 1, zoneName: 'Đồng Cỏ Thuật Toán', title: 'Ra lệnh cho nhân vật',
    subtitle: 'function call · sequence · Game API',
    intro: 'Biến bản đồ thành chuỗi lời gọi hàm đúng thứ tự.',
    objectives: ['Gọi hàm đúng cú pháp', 'Lập chuỗi lệnh', 'Debug bằng chế độ từng bước'],
    certificateCode: 'function-builder', accent: 'verdant', icon: 'map', estimatedMinutes: 60,
    challengeCount: 5, requiredChallengeCount: 5,
  },
  {
    id: 'a2', order: 2, zoneName: 'Kho Dữ Liệu Pha Lê', title: 'Ghi nhớ trạng thái',
    subtitle: 'variable · data type · assignment · update',
    intro: 'Dùng biến để theo dõi ngọc, trạng thái và giá trị thay đổi.',
    objectives: ['Khai báo biến', 'Chọn kiểu dữ liệu', 'Gán và cập nhật giá trị'],
    certificateCode: 'data-keeper', accent: 'mage', icon: 'gem', estimatedMinutes: 60,
    challengeCount: 5, requiredChallengeCount: 5,
  },
];

export function getLessonMeta(lessonId: string): LessonMeta | undefined {
  return LESSONS_META.find((lesson) => lesson.id === lessonId);
}

export const CERTIFICATE_NAMES: Record<string, string> = {
  'cpp-starter': 'C++ Starter',
  'function-builder': 'Algorithm Navigator',
  'data-keeper': 'Data Keeper',
};

export const COURSE_NAME = 'CodeQuest C++ 8';
export const TEACHER_NAME = 'Nguyễn Đình Vương';
