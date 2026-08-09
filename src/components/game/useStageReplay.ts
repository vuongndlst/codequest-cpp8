import { useEffect, useState } from 'react';
import { useUiStore } from '@/stores/uiStore';
import type { WorldEvent } from '@/validators/world';

export const STAGE_STEP_MS = 320;

/**
 * Phát lại chuỗi sự kiện thành từng bước.
 *
 * Tách ra khỏi component vì cả ba sân khấu (đường đi, tháp tín hiệu, xưởng
 * rèn) đều cần đúng cơ chế này. Ba bản sao của một vòng `setInterval` là ba
 * chỗ để quên dọn timer.
 *
 * Khi học sinh bật chế độ giảm chuyển động, kết quả cuối hiện ra ngay thay vì
 * chạy từng nhịp — yêu cầu về khả năng tiếp cận, không phải tuỳ chọn.
 */
export function useStageReplay(events: WorldEvent[], playKey: number): number {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const [playedCount, setPlayedCount] = useState(0);

  useEffect(() => {
    if (events.length === 0) {
      setPlayedCount(0);
      return;
    }

    if (reducedMotion) {
      setPlayedCount(events.length);
      return;
    }

    setPlayedCount(0);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setPlayedCount(current);
      if (current >= events.length) clearInterval(timer);
    }, STAGE_STEP_MS);

    return () => clearInterval(timer);
  }, [events, playKey, reducedMotion]);

  return playedCount;
}
