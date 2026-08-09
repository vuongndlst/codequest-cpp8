/// <reference lib="webworker" />
import { analyzeChallenge } from '@/validators';
import type { Challenge } from '@/types/content';
import type { RunResult } from '@/types/runner';

/**
 * Web Worker chạy code của học sinh.
 *
 * Vì sao phải là Worker (docs mục 6.3):
 *   · Vòng lặp vô hạn của học sinh KHÔNG làm treo giao diện — luồng chính vẫn
 *     phản hồi, và luồng chính có thể `terminate()` worker sau 2 giây.
 *   · Worker không có `document`, không có `window` — dù trình thông dịch có lỗi
 *     thì code học sinh cũng không chạm được vào trang web hay mạng.
 */

export interface WorkerRequest {
  id: number;
  code: string;
  challenge: Challenge;
}

export type WorkerResponse =
  | { id: number; ok: true; result: RunResult }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, code, challenge } = event.data;

  try {
    const result = analyzeChallenge(code, challenge);
    const response: WorkerResponse = { id, ok: true, result };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
