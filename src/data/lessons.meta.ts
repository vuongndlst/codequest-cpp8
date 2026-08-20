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
  {
    id: 'a3', order: 3, zoneName: 'Lò Toán Tử', title: 'Biến dữ liệu thành kết quả',
    subtitle: 'arithmetic · comparison · logic · expression',
    intro: 'Tính năng lượng, cân tinh thể và bật máy bằng các biểu thức C++.',
    objectives: ['Tính toán bằng toán tử số học', 'Tạo kết quả đúng–sai bằng so sánh', 'Ghép điều kiện bằng toán tử logic'],
    certificateCode: 'operator-smith', accent: 'treasure', icon: 'zap', estimatedMinutes: 60,
    challengeCount: 5, requiredChallengeCount: 5,
  },
  {
    id: 'a4', order: 4, zoneName: 'Cổng Quyết Định', title: 'Cho chương trình biết lựa chọn',
    subtitle: 'if · if-else · condition · sensor',
    intro: 'Đọc cảm biến, kiểm tra điều kiện và chọn hành động phù hợp với từng trạng thái.',
    objectives: ['Dùng if cho hành động có điều kiện', 'Dùng if-else cho hai kết quả', 'Kiểm thử cùng code với nhiều dữ liệu'],
    certificateCode: 'decision-maker', accent: 'alert', icon: 'git-branch', estimatedMinutes: 65,
    challengeCount: 5, requiredChallengeCount: 5,
  },
  {
    id: 'a5', order: 5, zoneName: 'Thung Lũng Lặp', title: 'Biến việc lặp lại thành thuật toán',
    subtitle: 'for · counter · iteration · off-by-one',
    intro: 'Dùng vòng lặp để thắp đèn, thu tinh thể và thực hiện chính xác số hành động cần thiết.',
    objectives: ['Đọc và viết vòng lặp for', 'Theo dõi biến đếm qua từng lượt', 'Debug lỗi lệch một lần lặp'],
    certificateCode: 'loop-explorer', accent: 'verdant', icon: 'repeat-2', estimatedMinutes: 65,
    challengeCount: 5, requiredChallengeCount: 5,
  },
  {
    id: 'a6', order: 6, zoneName: 'Xưởng Hàm', title: 'Đóng gói thuật toán để tái sử dụng',
    subtitle: 'function · parameter · argument · return · decomposition',
    intro: 'Biến các chuỗi hành động đã học thành những cỗ máy có tên, có đầu vào và có kết quả.',
    objectives: ['Tự định nghĩa và gọi hàm', 'Dùng tham số để tái sử dụng thuật toán', 'Trả về kết quả và chia nhỏ nhiệm vụ'],
    certificateCode: 'function-engineer', accent: 'treasure', icon: 'blocks', estimatedMinutes: 70,
    challengeCount: 5, requiredChallengeCount: 5,
  },
  {
    id:'a7', order:7, zoneName:'Phòng Gương Bộ Nhớ', title:'Kiểm soát dữ liệu qua lời gọi hàm',
    subtitle:'pass-by-value · reference · mutation · swap', intro:'Phân biệt bản sao và cùng ô nhớ qua các cơ chế game có thể quan sát.',
    objectives:['Phân biệt tham trị và tham chiếu','Cập nhật biến qua tham chiếu','Giải thích hoán đổi'],
    certificateCode:'reference-navigator', accent:'mage', icon:'split', estimatedMinutes:75, challengeCount:4, requiredChallengeCount:4,
  },
  {
    id:'a8', order:8, zoneName:'Mê Cung Chỉ Số', title:'Tổ chức dữ liệu bằng mảng một chiều',
    subtitle:'array · index · bounds · traversal', intro:'Điều khiển mê cung bằng dãy dữ liệu có thứ tự và chỉ số an toàn.',
    objectives:['Khai báo mảng một chiều','Truy cập và cập nhật phần tử','Duyệt mảng không vượt biên'],
    certificateCode:'array-cartographer', accent:'quest', icon:'grid-3x3', estimatedMinutes:80, challengeCount:4, requiredChallengeCount:4,
  },
  {
    id:'a9', order:9, zoneName:'Đài Quan Sát Dữ Liệu', title:'Tìm quy luật trong một dãy',
    subtitle:'traversal · aggregation · linear search · O(n)', intro:'Rút ra tổng, cực trị và vị trí mục tiêu từ dữ liệu trên bản đồ.',
    objectives:['Tích lũy khi duyệt mảng','Tìm cực trị','Viết tìm kiếm tuyến tính'],
    certificateCode:'search-strategist', accent:'verdant', icon:'scan-search', estimatedMinutes:85, challengeCount:4, requiredChallengeCount:4,
  },
  {
    id:'a10', order:10, zoneName:'Thành Trì Thuật Toán', title:'Sắp xếp và đánh giá thuật toán',
    subtitle:'swap · sorting · invariant · O(n²)', intro:'Chinh phục Lõi Thuật Toán bằng sắp xếp, bất biến và phân tích chi phí.',
    objectives:['Hoán đổi phần tử','Cài đặt bubble sort','Giải thích bất biến và O(n²)'],
    certificateCode:'algorithm-architect', accent:'alert', icon:'binary', estimatedMinutes:90, challengeCount:4, requiredChallengeCount:4,
  },
];

export function getLessonMeta(lessonId: string): LessonMeta | undefined {
  return LESSONS_META.find((lesson) => lesson.id === lessonId);
}

export const CERTIFICATE_NAMES: Record<string, string> = {
  'cpp-starter': 'C++ Starter',
  'function-builder': 'Algorithm Navigator',
  'data-keeper': 'Data Keeper',
  'operator-smith': 'Operator Smith',
  'decision-maker': 'Decision Maker',
  'loop-explorer': 'Loop Explorer',
  'function-engineer': 'Function Engineer',
  'reference-navigator': 'Reference Navigator',
  'array-cartographer': 'Array Cartographer',
  'search-strategist': 'Search Strategist',
  'algorithm-architect': 'Algorithm Architect',
};

export const COURSE_NAME = 'CodeQuest C++ 8';
export const TEACHER_NAME = 'Nguyễn Đình Vương';
