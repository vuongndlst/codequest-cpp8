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
  a0: {
    name: 'Trạm Khởi Động', sceneName: 'Phòng điều khiển tín hiệu', objective: 'Viết và quan sát chương trình C++ đầu tiên', ground: 'dungeon',
    atmosphereClass: 'from-cyan-500/20 via-blue-500/8 to-slate-950/85', borderClass: 'border-quest-400/35', accentClass: 'text-quest-200',
    props: [TILE.torch, TILE.gem, TILE.gate], bossPhases: ['Viết tín hiệu', 'Kiểm tra cú pháp', 'Khởi động'],
  },
  a1: {
    name: 'Đồng Cỏ Thuật Toán', sceneName: 'Đường tới cổng dịch chuyển', objective: 'Biến đường đi thành chuỗi lời gọi hàm', ground: 'town',
    atmosphereClass: 'from-emerald-500/20 via-lime-500/8 to-sky-950/75', borderClass: 'border-verdant-400/35', accentClass: 'text-verdant-200',
    props: [TILE.tree, TILE.gem, TILE.gate], bossPhases: ['Lập tuyến', 'Debug từng bước', 'Vào portal'],
  },
  a2: {
    name: 'Kho Dữ Liệu Pha Lê', sceneName: 'Hành lang ký ức', objective: 'Dùng biến để theo dõi trạng thái thế giới', ground: 'dungeon',
    atmosphereClass: 'from-violet-500/22 via-fuchsia-500/8 to-slate-950/88', borderClass: 'border-mage-400/35', accentClass: 'text-mage-200',
    props: [TILE.gem, TILE.key, TILE.chest], bossPhases: ['Thu thập', 'Cập nhật dữ liệu', 'Mở kho'],
  },
};

const FALLBACK = ZONES.a0;
export function zonePresentation(lessonId?: string): ZonePresentation { return (lessonId && ZONES[lessonId]) || FALLBACK; }

export function challengePhaseLabel(kind: ChallengeKind): string {
  return ({
    story:'Quan sát và dự đoán', concept:'Khám phá ý mới', sandbox:'Thử ngay', mission:'Nhiệm vụ bản đồ', debug:'Debug Lab',
    cleancode:'Tinh chỉnh giải pháp', quiz:'Checkpoint', boss:'Thử thách tổng hợp',
  } satisfies Record<ChallengeKind,string>)[kind];
}
