/**
 * Danh sách 8 nhân vật pixel dùng thống nhất trong đăng ký, hồ sơ và bản đồ.
 *
 * Sprite lấy từ Kenney Tiny Dungeon (CC0). Bộ gốc không đặt tên riêng cho từng
 * nhân vật, vì vậy CodeQuest dùng tên nguyên bản của ByteLand thay vì gọi theo màu.
 */

export interface AvatarDef {
  id: string;
  name: string;
  shortName: string;
  role: string;
  description: string;
  /** Chỉ số ô trong public/game/tiny-dungeon.png. */
  tileIndex: number;
}

export const AVATARS: AvatarDef[] = [
  {
    id: 'guardian-cyan',
    name: 'Arin Kiếm Sĩ',
    shortName: 'Arin',
    role: 'Kiếm sĩ ByteLand',
    description: 'Bình tĩnh, bền bỉ và luôn tiến từng bước chắc chắn.',
    tileIndex: 84,
  },
  {
    id: 'guardian-violet',
    name: 'Lyra Hộ Vệ',
    shortName: 'Lyra',
    role: 'Hộ vệ Ánh Sao',
    description: 'Quan sát kỹ bản đồ trước khi chọn hành động.',
    tileIndex: 85,
  },
  {
    id: 'mage-emerald',
    name: 'Mộc Linh',
    shortName: 'Mộc',
    role: 'Pháp sư Rừng Mã',
    description: 'Biến những câu lệnh nhỏ thành giải pháp thông minh.',
    tileIndex: 86,
  },
  {
    id: 'mage-amber',
    name: 'Sol Hỏa Thuật',
    shortName: 'Sol',
    role: 'Pháp sư Hỏa Tinh',
    description: 'Tò mò, nhanh nhạy và thích thử nghiệm nhiều cách giải.',
    tileIndex: 87,
  },
  {
    id: 'bot-sky',
    name: 'Bolt Thợ Máy',
    shortName: 'Bolt',
    role: 'Kỹ sư Robot',
    description: 'Yêu máy móc, hàm lệnh và những hệ thống chạy chính xác.',
    tileIndex: 96,
  },
  {
    id: 'bot-rose',
    name: 'Nova Trinh Sát',
    shortName: 'Nova',
    role: 'Trinh sát Tinh Vân',
    description: 'Nhanh nhẹn và luôn tìm ra lỗi ẩn trong chương trình.',
    tileIndex: 97,
  },
  {
    id: 'scout-lime',
    name: 'Moss Du Hiệp',
    shortName: 'Moss',
    role: 'Du hiệp Thung Lũng',
    description: 'Kiên nhẫn tìm đường và không ngại sửa code để thử lại.',
    tileIndex: 98,
  },
  {
    id: 'scout-indigo',
    name: 'Kiro Bóng Đêm',
    shortName: 'Kiro',
    role: 'Hiệp sĩ Bóng Đêm',
    description: 'Tập trung, gọn gàng và luôn viết code có kế hoạch.',
    tileIndex: 99,
  },
];

export const DEFAULT_AVATAR_ID = 'guardian-cyan';

export function getAvatar(id: string | null | undefined): AvatarDef {
  return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
}
