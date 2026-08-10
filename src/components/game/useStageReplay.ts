import { useCallback, useEffect, useRef, useState } from 'react';
import { useUiStore } from '@/stores/uiStore';
import type { WorldEvent } from '@/validators/world';

/**
 * Tốc độ phát lại chuỗi sự kiện.
 *
 *   · normal — nhịp vừa phải, đủ để mắt bám theo từng bước chân
 *   · fast   — xem lại nhanh khi đã hiểu bài, khỏi phải ngồi chờ
 *   · step   — ĐỨNG YÊN, mỗi lần bấm mới nhích một sự kiện
 *
 * Chế độ `step` là công cụ debug quan trọng nhất của cả màn hình: học sinh
 * dừng đúng ngay trước bước sai, nhìn nhân vật đang đứng đâu, quay hướng nào,
 * rồi mới đối chiếu với dòng code. Không có nó thì mọi lỗi chỉ hiện ra ở kết
 * quả cuối cùng, và việc "tìm ra sai chỗ nào" biến thành đoán mò.
 */
export type ReplaySpeed = 'normal' | 'fast' | 'step';

export const REPLAY_STEP_MS: Record<Exclude<ReplaySpeed, 'step'>, number> = {
  normal: 320,
  fast: 110,
};

/** Nhịp của chế độ bình thường — tên cũ, giữ lại cho các chỗ đang dùng. */
export const STAGE_STEP_MS = REPLAY_STEP_MS.normal;

export interface StageReplay {
  /** Số sự kiện đã phát tới thời điểm này */
  playedCount: number;
  /** Tổng số sự kiện của lần chạy hiện tại */
  total: number;
  /** Đang tự động chạy (chế độ từng bước không tính là đang chạy) */
  isPlaying: boolean;
  /** Đã phát hết chuỗi sự kiện */
  isDone: boolean;
  /** Đang dừng tại một bước do học sinh chủ động bấm Stop/Reset map. */
  isPaused: boolean;
  /** Nhích thêm một sự kiện — dùng ở chế độ từng bước */
  stepForward: () => void;
  /** Nhảy thẳng tới cuối, bỏ qua phần còn lại */
  skipToEnd: () => void;
  /** Dừng hoạt ảnh tại trạng thái hiện tại, không xoá code. */
  stop: () => void;
  /** Đưa riêng bản đồ về trạng thái đầu, không xoá code trong editor. */
  resetMap: () => void;
  /** Tiếp tục phát từ bước đang dừng. */
  resume: () => void;
}

/**
 * Phát lại chuỗi sự kiện thành từng bước.
 *
 * Hook này CỐ Ý được gọi ở TRANG chứ không ở trong sân khấu. Trước đây mỗi sân
 * khấu tự đếm nhịp của riêng nó, nên nút bấm nằm ngoài sân khấu — thanh điều
 * khiển dưới bản đồ — không cách nào ra lệnh "nhích một bước" được. Nay trang
 * giữ tiến độ, sân khấu chỉ nhận `playedCount` rồi vẽ. Sân khấu thành thuần
 * hiển thị, còn nút bấm thì điều khiển được thật.
 *
 * Khi học sinh bật chế độ giảm chuyển động, kết quả cuối hiện ra ngay thay vì
 * chạy từng nhịp — yêu cầu về khả năng tiếp cận, không phải tuỳ chọn. Riêng
 * chế độ từng bước thì VẪN đi từng bước: đó là học sinh chủ động bấm để tìm
 * lỗi, không phải hoạt hình trang trí.
 */
export function useStageReplay(
  events: WorldEvent[],
  playKey: number,
  speed: ReplaySpeed = 'normal',
): StageReplay {
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const [playedCount, setPlayedCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = events.length;

  /*
    Tiến độ được giữ song song trong một ref.

    Lý do: effect chạy tự động phụ thuộc vào `speed`, nên đổi tốc độ giữa chừng
    sẽ dọn timer cũ và dựng timer mới. Nếu chỉ có state thì lần dựng lại đó bắt
    đầu từ đâu là chuyện của closure cũ — dễ thành "bấm Nhanh ở bước tám thì
    nhân vật nhảy về vạch xuất phát". Đọc tiến độ từ ref thì timer mới luôn nối
    tiếp đúng chỗ đang dở.
  */
  const playedRef = useRef(0);

  const setPlayed = useCallback((next: number) => {
    playedRef.current = next;
    setPlayedCount(next);
  }, []);

  // --- Có chuỗi sự kiện mới (mỗi lần bấm Chạy) thì quay về vạch xuất phát ---
  useEffect(() => {
    setPlayed(0);
    setIsPaused(false);
  }, [events, playKey, setPlayed]);

  useEffect(() => {
    if (speed === 'step') setIsPaused(true);
    else if (total > 0 && playedRef.current < total) setIsPaused(false);
  }, [speed, total]);

  // --- Tự động nhích từng nhịp ---
  useEffect(() => {
    if (total === 0 || speed === 'step' || isPaused) return;

    if (reducedMotion) {
      setPlayed(total);
      return;
    }

    if (playedRef.current >= total) return;

    /*
      `setTimeout` hẹn lại từng nhịp thay vì `setInterval`: dọn timer khi đổi
      tốc độ thì chỉ mất đúng một nhịp đang chờ, không mất tiến độ.
    */
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const next = Math.min(playedRef.current + 1, total);
      setPlayed(next);
      if (next < total) timer = setTimeout(tick, REPLAY_STEP_MS[speed]);
    };

    timer = setTimeout(tick, REPLAY_STEP_MS[speed]);
    return () => clearTimeout(timer);
  }, [events, playKey, reducedMotion, speed, total, setPlayed, isPaused]);

  const stepForward = useCallback(() => {
    setIsPaused(true);
    setPlayed(Math.min(playedRef.current + 1, total));
  }, [total, setPlayed]);

  const skipToEnd = useCallback(() => setPlayed(total), [total, setPlayed]);
  const stop = useCallback(() => setIsPaused(true), []);
  const resetMap = useCallback(() => {
    setIsPaused(true);
    setPlayed(0);
  }, [setPlayed]);
  const resume = useCallback(() => {
    if (speed !== 'step' && playedRef.current < total) setIsPaused(false);
  }, [speed, total]);

  return {
    playedCount,
    total,
    isPlaying: total > 0 && playedCount < total && speed !== 'step' && !isPaused,
    isDone: total > 0 && playedCount >= total,
    isPaused,
    stepForward,
    skipToEnd,
    stop,
    resetMap,
    resume,
  };
}
