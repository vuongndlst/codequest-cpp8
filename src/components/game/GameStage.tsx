import type { WorldSpec } from '@/types/content';
import type { WorldEvent } from '@/validators/world';
import { WorldStage } from './WorldStage';
import { SignalTowerStage } from './SignalTowerStage';
import { WorkshopStage } from './WorkshopStage';
import { TileMapStage } from './TileMapStage';

interface GameStageProps {
  spec: WorldSpec;
  events: WorldEvent[];
  avatarId?: string | null;
  playKey: number;
}

/**
 * Chọn sân khấu theo loại được khai báo trong nhiệm vụ.
 *
 * Trang nhiệm vụ chỉ gọi component này, không cần biết có mấy loại sân khấu.
 * Thêm loại mới về sau thì sửa đúng một chỗ.
 *
 * Bỏ trống `kind` thì mặc định là `path` — 7 nhiệm vụ đã có sân khấu từ trước
 * không phải sửa một dòng nào.
 */
export function GameStage({ spec, events, avatarId, playKey }: GameStageProps) {
  switch (spec.kind) {
    case 'signal-tower':
      return <SignalTowerStage events={events} playKey={playKey} />;

    case 'workshop':
      return <WorkshopStage events={events} playKey={playKey} />;

    case 'map':
      return (
        <TileMapStage spec={spec} events={events} avatarId={avatarId} playKey={playKey} />
      );

    case 'path':
    default:
      return <WorldStage spec={spec} events={events} avatarId={avatarId} playKey={playKey} />;
  }
}
