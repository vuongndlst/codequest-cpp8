import {
  ArrowDown,
  Award,
  Bug,
  Castle,
  DoorOpen,
  Feather,
  GitBranch,
  Heart,
  Home,
  Lightbulb,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * Bảng tra icon theo tên chuỗi.
 *
 * Dữ liệu bài học và bảng `badges` lưu tên icon dạng chuỗi. Tra qua bảng này
 * thay vì truy cập động vào thư viện — an toàn hơn và giúp tree-shaking hoạt động.
 * Icon lấy từ lucide-react (giấy phép ISC).
 */
const ICONS: Record<string, LucideIcon> = {
  ArrowDown,
  Award,
  Bug,
  Castle,
  DoorOpen,
  Feather,
  GitBranch,
  Heart,
  Home,
  Lightbulb,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
};

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Award;
}
