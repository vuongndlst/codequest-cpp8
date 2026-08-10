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
  /**
   * Số sự kiện đã phát.
   *
   * Trang giữ tiến độ (qua `useStageReplay`) chứ không phải sân khấu, để thanh
   * điều khiển nằm ngoài sân khấu ra lệnh chạy nhanh / nhích từng bước được.
   */
  playedCount: number;
  /** Trang đã có tiêu đề sân khấu riêng thì ẩn tiêu đề lặp bên trong. */
  hideTitle?: boolean;
  /** Nhấn mạnh sân khấu nhập môn mà không làm thay đổi các nhiệm vụ phía sau. */
  presentation?: 'default' | 'first-mission' | 'boss';
  /** Đồng bộ hiệu ứng sân khấu với tốc độ phát lại do trang điều khiển. */
  isPlaying?: boolean;
  motionDurationMs?: number;
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
export function GameStage({
  spec,
  events,
  avatarId,
  playedCount,
  hideTitle,
  presentation = 'default',
  isPlaying = false,
  motionDurationMs = 280,
}: GameStageProps) {
  switch (spec.kind) {
    case 'signal-tower':
      return <SignalTowerStage events={events} playedCount={playedCount} hideTitle={hideTitle} />;

    case 'workshop':
      return <WorkshopStage events={events} playedCount={playedCount} hideTitle={hideTitle} />;

    case 'map':
      return (
        <TileMapStage
          spec={spec}
          events={events}
          avatarId={avatarId}
          playedCount={playedCount}
          hideTitle={hideTitle}
          presentation={presentation}
          isPlaying={isPlaying}
          motionDurationMs={motionDurationMs}
        />
      );

    case 'path':
    default:
      return (
        <WorldStage
          spec={spec}
          events={events}
          avatarId={avatarId}
          playedCount={playedCount}
          hideTitle={hideTitle}
        />
      );
  }
}
