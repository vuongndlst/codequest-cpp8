import type { LessonMeta } from '@/types/content';

/**
 * Metadata 5 khu vực của ByteLand.
 *
 * File này CHỈ chứa thông tin tổng quan (dùng cho bản đồ, dashboard, chứng chỉ).
 * Nội dung challenge đầy đủ nằm ở `src/lessons/lesson-N/` — thêm ở Giai đoạn 3.
 *
 * Thứ tự nội dung tuân thủ mục 3 của đề bài và KHÔNG được thay đổi:
 *   cú pháp cơ bản → hàm → vòng lặp for → if → if-else
 */

export const LESSONS_META: LessonMeta[] = [
  {
    id: 'l1',
    order: 1,
    zoneName: 'Làng Khởi Động',
    title: 'Ra lệnh & Thuật toán',
    subtitle: 'Chia một việc lớn thành các bước máy làm được',
    intro:
      'Cổng làng Khởi Động đóng chặt từ ngày Bug tràn vào. Byte đứng đó chờ em — nhưng Byte không tự đi được bước nào. Byte chỉ làm đúng những gì em ghi ra, đúng thứ tự em ghi. Việc của em là chia quãng đường thành từng bước nhỏ để Byte đi được.',
    objectives: [
      'Hiểu chương trình là một danh sách các bước, chạy từ trên xuống dưới',
      'Chia một mục tiêu lớn thành các bước đủ nhỏ để máy làm được',
      'Nhận ra thứ tự các bước quyết định kết quả',
      'Điều khiển nhân vật đi và quay hướng trên bản đồ',
      'Tìm đường vòng khi gặp vật cản',
      'Dùng cout để nhân vật nói ra một câu tác động lên thế giới',
      'Đọc code để tìm lỗi logic, không chỉ lỗi cú pháp',
      'Nhớ dấu ; ở cuối câu lệnh và viết code có thụt lề',
    ],
    certificateCode: 'cpp-starter',
    accent: 'quest',
    icon: 'Home',
    estimatedMinutes: 45,
    challengeCount: 9,
    requiredChallengeCount: 9,
  },
  {
    id: 'l2',
    order: 2,
    zoneName: 'Xưởng Phép Thuật',
    title: 'Hàm',
    subtitle: 'Chia nhiệm vụ lớn thành những phép thuật nhỏ',
    intro:
      'Xưởng Phép Thuật là nơi chế tạo mọi cỗ máy của ByteLand. Nhưng bản thiết kế đã bị viết dồn thành một khối khổng lồ, không ai đọc nổi. Em cần tách nó thành từng phép thuật nhỏ — chính là các hàm.',
    objectives: [
      'Hiểu hàm là gì và vì sao cần dùng hàm',
      'Tách một nhiệm vụ lớn thành nhiều hàm nhỏ',
      'Viết hàm void không trả về giá trị',
      'Gọi hàm từ trong main()',
      'Truyền tham số cơ bản cho hàm',
      'Đặt tên hàm rõ nghĩa, thể hiện hành động',
    ],
    certificateCode: 'function-builder',
    accent: 'mage',
    icon: 'Wrench',
    estimatedMinutes: 45,
    challengeCount: 9,
    requiredChallengeCount: 9,
  },
  {
    id: 'l3',
    order: 3,
    zoneName: 'Thung Lũng Lặp',
    title: 'Vòng lặp for',
    subtitle: 'Làm nhiều lần mà chỉ viết một lần',
    intro:
      'Con đường qua Thung Lũng Lặp dài hàng trăm ô giống hệt nhau. Viết tay từng bước thì đến tối cũng chưa xong. Có một phép thuật giúp em đi hết chỉ với ba dòng lệnh — đó là vòng lặp for.',
    objectives: [
      'Hiểu mục đích của vòng lặp',
      'Nắm cấu trúc for (khởi tạo; điều kiện; cập nhật)',
      'Sử dụng biến đếm đúng cách',
      'Viết điều kiện tiếp tục chính xác',
      'Nhớ tăng biến đếm để vòng lặp dừng lại được',
      'Lặp đúng số lần xác định',
      'Gọi hàm bên trong vòng lặp',
    ],
    certificateCode: 'loop-explorer',
    accent: 'verdant',
    icon: 'RefreshCw',
    estimatedMinutes: 45,
    challengeCount: 9,
    requiredChallengeCount: 9,
  },
  {
    id: 'l4',
    order: 4,
    zoneName: 'Cổng Quyết Định',
    title: 'Câu lệnh if',
    subtitle: 'Kiểm tra trước khi hành động',
    intro:
      'Cổng Quyết Định chỉ mở cho ai có đủ năng lượng và đúng chìa khoá. Lao vào mà không kiểm tra thì em sẽ bị đẩy ngược trở lại. Đã đến lúc học cách hỏi "nếu…" trước khi làm.',
    objectives: [
      'Viết biểu thức điều kiện',
      'Sử dụng các toán tử so sánh ==, !=, <, >, <=, >=',
      'Viết câu lệnh if đúng cú pháp',
      'Phân biệt rõ dấu = (gán) và dấu == (so sánh)',
      'Kiểm tra điều kiện trước khi cho nhân vật hành động',
    ],
    certificateCode: 'decision-maker',
    accent: 'treasure',
    icon: 'DoorOpen',
    estimatedMinutes: 45,
    challengeCount: 9,
    requiredChallengeCount: 9,
  },
  {
    id: 'l5',
    order: 5,
    zoneName: 'Lâu Đài Lựa Chọn',
    title: 'Cấu trúc if–else và tổng hợp',
    subtitle: 'Hai hướng đi, một quyết định — và trận chiến cuối cùng',
    intro:
      'Bug King đang chiếm giữ Lâu Đài Lựa Chọn, trung tâm điều khiển của cả ByteLand. Mỗi cánh cửa ở đây đều có hai lối đi. Em sẽ cần dùng tất cả những gì đã học: hàm, vòng lặp và điều kiện.',
    objectives: [
      'Viết cấu trúc if–else cho hai hướng xử lý',
      'Kết hợp hàm, vòng lặp for và if–else trong một bài toán',
      'Đọc và sửa các lỗi cú pháp thường gặp',
      'Viết code sạch, dễ đọc, thụt lề hợp lý',
      'Giải thích ngắn gọn thuật toán của mình bằng lời',
    ],
    certificateCode: 'byteland-code-guardian',
    accent: 'mage',
    icon: 'Castle',
    estimatedMinutes: 50,
    challengeCount: 9,
    requiredChallengeCount: 9,
  },
];

export function getLessonMeta(lessonId: string): LessonMeta | undefined {
  return LESSONS_META.find((lesson) => lesson.id === lessonId);
}

/** Tên hiển thị của 5 chứng chỉ (mục 12). */
export const CERTIFICATE_NAMES: Record<string, string> = {
  'cpp-starter': 'C++ Starter',
  'function-builder': 'Function Builder',
  'loop-explorer': 'Loop Explorer',
  'decision-maker': 'Decision Maker',
  'byteland-code-guardian': 'ByteLand Code Guardian',
};

export const COURSE_NAME = 'CodeQuest C++ 8';
export const TEACHER_NAME = 'Nguyễn Đình Vương';
