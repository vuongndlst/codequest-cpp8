import type { ChallengeKind } from '@/types/content';
import { TILE, type TileRef } from '@/components/game/mapTiles';

export interface ZonePresentation {
  name: string;
  sceneName: string;
  objective: string;
  ground: 'town' | 'dungeon';
  atmosphereClass: string;
  borderClass: string;
  accentClass: string;
  props: readonly TileRef[];
  bossPhases: readonly [string, string, string];
}

const ZONES: Record<string, ZonePresentation> = {
  l1: {
    name: 'Làng Khởi Động',
    sceneName: 'Đường vào ByteLand',
    objective: 'Ra lệnh theo đúng thứ tự',
    ground: 'town',
    atmosphereClass: 'from-cyan-500/18 via-emerald-500/8 to-sky-950/70',
    borderClass: 'border-quest-400/35',
    accentClass: 'text-quest-200',
    props: [TILE.tree, TILE.gem, TILE.gate],
    bossPhases: ['Lập tuyến', 'Thu ngọc', 'Mở cổng'],
  },
  l2: {
    name: 'Xưởng Phép Thuật',
    sceneName: 'Dây chuyền chế tác',
    objective: 'Lắp hàm rồi gọi máy hoạt động',
    ground: 'dungeon',
    atmosphereClass: 'from-amber-500/18 via-orange-500/8 to-slate-950/80',
    borderClass: 'border-treasure-400/35',
    accentClass: 'text-treasure-200',
    props: [TILE.torch, TILE.sword, TILE.chest],
    bossPhases: ['Tách hàm', 'Truyền dữ liệu', 'Chạy dây chuyền'],
  },
  l3: {
    name: 'Thung Lũng Lặp',
    sceneName: 'Con đường tuần hoàn',
    objective: 'Dùng một mẫu lệnh cho nhiều bước',
    ground: 'town',
    atmosphereClass: 'from-emerald-500/18 via-lime-500/8 to-slate-950/80',
    borderClass: 'border-verdant-400/35',
    accentClass: 'text-verdant-200',
    props: [TILE.torch, TILE.gem, TILE.tree],
    bossPhases: ['Chọn số vòng', 'Lặp chính xác', 'Về đích'],
  },
  l4: {
    name: 'Cổng Quyết Định',
    sceneName: 'Hành lang cảm biến',
    objective: 'Quan sát rồi mới chọn hành động',
    ground: 'dungeon',
    atmosphereClass: 'from-violet-500/20 via-indigo-500/8 to-slate-950/85',
    borderClass: 'border-mage-400/35',
    accentClass: 'text-mage-200',
    props: [TILE.key, TILE.door, TILE.shield],
    bossPhases: ['Đọc trạng thái', 'Kiểm tra if', 'Mở cổng'],
  },
  l5: {
    name: 'Lâu Đài Lựa Chọn',
    sceneName: 'Sảnh Bug King',
    objective: 'Chọn đúng nhánh cho từng tình huống',
    ground: 'dungeon',
    atmosphereClass: 'from-rose-500/20 via-violet-500/10 to-slate-950/90',
    borderClass: 'border-alert-400/40',
    accentClass: 'text-alert-200',
    props: [TILE.sword, TILE.shield, TILE.boss],
    bossPhases: ['Phân tích Boss', 'Chọn hành động', 'Phá lớp giáp'],
  },
};

const FALLBACK = ZONES.l1;

export function zonePresentation(lessonId?: string): ZonePresentation {
  const normalizedId = lessonId?.replace(/^lesson-/, 'l');
  return (normalizedId && ZONES[normalizedId]) || FALLBACK;
}

export function challengePhaseLabel(kind: ChallengeKind): string {
  const labels: Record<ChallengeKind, string> = {
    story: 'Quan sát tình huống',
    concept: 'Khám phá lệnh mới',
    sandbox: 'Thử nghiệm tự do',
    mission: 'Thực hiện nhiệm vụ',
    debug: 'Tìm và sửa lỗi',
    cleancode: 'Tinh chỉnh giải pháp',
    quiz: 'Kiểm tra hiểu bài',
    boss: 'Thử thách tổng hợp',
  };
  return labels[kind];
}
