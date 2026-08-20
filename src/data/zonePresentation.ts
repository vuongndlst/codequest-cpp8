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
  a3: {
    name: 'Lò Toán Tử', sceneName: 'Xưởng năng lượng cổ', objective: 'Biến biểu thức C++ thành năng lượng và tín hiệu', ground: 'dungeon',
    atmosphereClass: 'from-amber-500/24 via-orange-500/10 to-slate-950/90', borderClass: 'border-treasure-400/40', accentClass: 'text-treasure-200',
    props: [TILE.machine, TILE.powerSwitch, TILE.gem], bossPhases: ['Tính năng lượng', 'Cấp cho ba máy', 'Đồng bộ lõi'],
  },
  a4: {
    name: 'Cổng Quyết Định', sceneName: 'Mê cung cảm biến', objective: 'Đọc trạng thái rồi chọn đúng nhánh hành động', ground: 'dungeon',
    atmosphereClass: 'from-rose-500/22 via-red-500/8 to-slate-950/90', borderClass: 'border-alert-400/40', accentClass: 'text-alert-200',
    props: [TILE.door, TILE.key, TILE.powerSwitch], bossPhases: ['Đọc cảm biến', 'Chọn nhánh', 'Mở cổng'],
  },
  a5: {
    name: 'Thung Lũng Lặp', sceneName: 'Đường mòn vọng âm', objective: 'Dùng một cấu trúc gọn để lặp đúng số hành động', ground: 'town',
    atmosphereClass: 'from-emerald-500/24 via-cyan-500/8 to-slate-950/88', borderClass: 'border-verdant-400/40', accentClass: 'text-verdant-200',
    props: [TILE.torch, TILE.gem, TILE.boss], bossPhases: ['Đếm lớp giáp', 'Lặp đòn đánh', 'Mở cổng'],
  },
  a6: {
    name: 'Xưởng Hàm', sceneName: 'Dây chuyền mô-đun cổ', objective: 'Đóng gói thuật toán thành hàm có thể gọi lại và truyền dữ liệu', ground: 'dungeon',
    atmosphereClass: 'from-cyan-500/22 via-amber-500/10 to-slate-950/92', borderClass: 'border-treasure-400/45', accentClass: 'text-treasure-200',
    props: [TILE.machine, TILE.powerSwitch, TILE.boss], bossPhases: ['Gọi mô-đun dẫn đường', 'Truyền số lớp giáp', 'Khởi động lõi xưởng'],
  },
  a7: {
    name:'Phòng Gương Bộ Nhớ', sceneName:'Điện thờ phản chiếu', objective:'Phân biệt bản sao với cùng một ô nhớ', ground:'dungeon',
    atmosphereClass:'from-violet-500/28 via-cyan-500/10 to-slate-950/94', borderClass:'border-mage-400/45', accentClass:'text-mage-200',
    props:[TILE.gem,TILE.boss,TILE.gate], bossPhases:['Theo dấu ô nhớ','Sửa dữ liệu gốc','Né Người Gác'],
  },
  a8: {
    name:'Mê Cung Chỉ Số', sceneName:'Kho rune đánh số', objective:'Dùng chỉ số và vòng lặp để điều khiển cả dãy', ground:'dungeon',
    atmosphereClass:'from-sky-500/25 via-violet-500/10 to-slate-950/94', borderClass:'border-quest-400/45', accentClass:'text-quest-200',
    props:[TILE.gem,TILE.key,TILE.boss], bossPhases:['Đọc chỉ số','Giữ đúng biên','Giải mã tuyến'],
  },
  a9: {
    name:'Đài Quan Sát Dữ Liệu', sceneName:'Mạng quét pha lê', objective:'Duyệt dữ liệu để tổng hợp và tìm kiếm', ground:'town',
    atmosphereClass:'from-emerald-500/26 via-cyan-500/10 to-slate-950/92', borderClass:'border-verdant-400/45', accentClass:'text-verdant-200',
    props:[TILE.machine,TILE.gem,TILE.boss], bossPhases:['Duyệt tín hiệu','Giữ ứng viên','Tìm mã portal'],
  },
  a10: {
    name:'Thành Trì Thuật Toán', sceneName:'Lõi sắp xếp cổ đại', objective:'Sắp xếp dãy và giải thích vì sao thuật toán đúng', ground:'dungeon',
    atmosphereClass:'from-rose-500/28 via-amber-500/10 to-slate-950/95', borderClass:'border-alert-400/50', accentClass:'text-alert-200',
    props:[TILE.boss,TILE.machine,TILE.gate], bossPhases:['So sánh cặp','Giữ bất biến','Ổn định lõi'],
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
