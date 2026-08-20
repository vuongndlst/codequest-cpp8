import { TILE } from '@/components/game/mapTiles';

export interface EquipmentLearningDesign {
  tileIndex: number;
  curriculum: string;
  levels: readonly [string, string, string];
}

/**
 * Trang bị chỉ tạo phản hồi thị giác và nhắc chiến lược học tập.
 * Không món nào sửa code, tăng tỉ lệ đúng hay bỏ qua mục tiêu — nhờ vậy Gem có
 * ý nghĩa sưu tầm nhưng không biến việc học thành pay-to-win.
 */
export const EQUIPMENT_LEARNING: Record<string, EquipmentLearningDesign> = {
  navigator: {
    tileIndex: TILE.key.index,
    curriculum: 'Thứ tự lệnh và định hướng trên bản đồ',
    levels: ['Vệt bước chân của Byte', 'Đường đi phát sáng rõ hơn', 'Hiệu ứng portal nổi bật hơn'],
  },
  'data-satchel': {
    tileIndex: TILE.gem.index,
    curriculum: 'Biến dùng để ghi nhớ dữ liệu thay đổi',
    levels: ['Gem thu được phát sáng', 'Hiện nhịp đếm khi nhặt Gem', 'Hiệu ứng kho dữ liệu hoàn chỉnh'],
  },
  'operator-gauntlet': {
    tileIndex: TILE.machine.index,
    curriculum: 'Biểu thức và năng lượng',
    levels: ['Máy hiện luồng năng lượng', 'Công tắc phản hồi mạnh hơn', 'Ba lõi đồng bộ bằng hiệu ứng đặc biệt'],
  },
  'condition-shield': {
    tileIndex: TILE.shield.index,
    curriculum: 'Điều kiện if / else và kiểm thử',
    levels: ['Khiên sáng khi kiểm tra điều kiện', 'Hai nhánh có màu phân biệt', 'Hiệu ứng bảo vệ khi chọn đúng nhánh'],
  },
  'algorithm-sword': {
    tileIndex: TILE.sword.index,
    curriculum: 'Vòng lặp và hành động lặp lại',
    levels: ['Đòn đánh Boss có vệt sáng', 'Mỗi iteration tạo một nhịp chém', 'Hiệu ứng kết liễu khi vòng lặp đủ lượt'],
  },
  'function-toolkit': {
    tileIndex: TILE.machine.index,
    curriculum: 'Hàm, tham số và chia nhỏ thuật toán',
    levels: ['Lời gọi hàm tạo xung năng lượng', 'Tham số hiện trên lõi máy', 'Các mô-đun đồng bộ bằng hiệu ứng dây chuyền'],
  },
  'mirror-compass': {
    tileIndex: TILE.key.index,
    curriculum: 'Tham trị, tham chiếu và trạng thái ô nhớ',
    levels: ['Đánh dấu dữ liệu được sao chép', 'Nối tham chiếu với biến gốc', 'Hiện ba trạng thái của phép hoán đổi'],
  },
  'index-bracer': {
    tileIndex: TILE.shield.index,
    curriculum: 'Mảng một chiều, chỉ số và biên an toàn',
    levels: ['Làm sáng phần tử đang đọc', 'Đánh dấu miền chỉ số hợp lệ', 'Cảnh báo rõ bước sắp vượt biên'],
  },
  'scanner-lens': {
    tileIndex: TILE.gem.index,
    curriculum: 'Duyệt mảng, tích lũy và tìm kiếm tuyến tính',
    levels: ['Đánh dấu phần đã duyệt', 'Hiện ứng viên tốt nhất', 'Vẽ nhịp O(n) trên tuyến quét'],
  },
  'algorithm-core': {
    tileIndex: TILE.machine.index,
    curriculum: 'Sắp xếp, bất biến và độ phức tạp O(n²)',
    levels: ['Làm sáng cặp đang so sánh', 'Đánh dấu phần đuôi đã cố định', 'Hiện từng pass của thuật toán'],
  },
};

export function equipmentDesign(id: string): EquipmentLearningDesign {
  return EQUIPMENT_LEARNING[id] ?? EQUIPMENT_LEARNING.navigator;
}

export function lessonOrderFromId(lessonId: string): number {
  const order = Number(lessonId.replace(/\D/g, ''));
  return Number.isFinite(order) ? order : 0;
}
