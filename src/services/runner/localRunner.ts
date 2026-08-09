import type { CodeRunner, RunRequest, RunResult } from '@/types/runner';
import { emptyRunResult } from '@/types/runner';
import { analyzeChallenge } from '@/validators';
import type { WorkerRequest, WorkerResponse } from './interpreter.worker';

/**
 * Bộ chạy code tại chỗ — mặc định của phiên bản MVP.
 *
 * Ưu tiên chạy trong Web Worker. Nếu môi trường không có Worker (một số trình
 * duyệt cũ ở phòng máy, hoặc khi chạy test), tự động lùi về chạy đồng bộ trên
 * luồng chính — vẫn an toàn vì trình thông dịch có ngân sách bước riêng,
 * chỉ là vòng lặp vô hạn sẽ làm trang đứng khoảng 2 giây thay vì không ảnh hưởng.
 */

const DEFAULT_TIMEOUT_MS = 2_000;

export class LocalInterpreterRunner implements CodeRunner {
  readonly id = 'local-interpreter' as const;

  private worker: Worker | null = null;
  private nextRequestId = 1;
  private workerUnavailable = false;

  private ensureWorker(): Worker | null {
    if (this.workerUnavailable) return null;
    if (this.worker) return this.worker;

    try {
      this.worker = new Worker(new URL('./interpreter.worker.ts', import.meta.url), {
        type: 'module',
      });
      return this.worker;
    } catch {
      this.workerUnavailable = true;
      return null;
    }
  }

  async run(request: RunRequest): Promise<RunResult> {
    const worker = this.ensureWorker();

    if (!worker) {
      return runInline(request);
    }

    const id = this.nextRequestId++;
    const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    return new Promise<RunResult>((resolve) => {
      let settled = false;

      const cleanup = () => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        clearTimeout(timer);
      };

      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== id || settled) return;
        settled = true;
        cleanup();

        if (event.data.ok) {
          resolve(event.data.result);
        } else {
          resolve(errorResult(event.data.error));
        }
      };

      const onError = () => {
        if (settled) return;
        settled = true;
        cleanup();
        // Worker hỏng -> lùi về chạy đồng bộ cho lần này và các lần sau
        this.disposeWorker();
        this.workerUnavailable = true;
        resolve(runInline(request));
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        // Cắt hẳn worker: đây chính là cách chặn vòng lặp vô hạn
        this.disposeWorker();
        resolve(timeoutResult());
      }, timeoutMs);

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);

      const message: WorkerRequest = {
        id,
        code: request.code,
        challenge: request.challenge,
      };
      worker.postMessage(message);
    });
  }

  private disposeWorker(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  dispose(): void {
    this.disposeWorker();
  }
}

function runInline(request: RunRequest): RunResult {
  try {
    return analyzeChallenge(request.code, request.challenge);
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : String(error));
  }
}

function timeoutResult(): RunResult {
  return {
    ...emptyRunResult(),
    diagnostics: [
      {
        code: 'TIMEOUT',
        message:
          'Chương trình của em chạy quá lâu nên thầy trò mình phải dừng lại. ' +
          'Em kiểm tra lại điều kiện dừng của vòng lặp `for` nhé — biến đếm có tăng lên không?',
        line: 0,
        severity: 'error',
        suggestHintLevel: 2,
      },
    ],
    errorCodes: ['TIMEOUT'],
  };
}

function errorResult(detail: string): RunResult {
  return {
    ...emptyRunResult(),
    diagnostics: [
      {
        code: 'UNKNOWN',
        message: `Có trục trặc khi chạy chương trình. Em thử bấm Chạy lại một lần nữa nhé. (${detail})`,
        line: 0,
        severity: 'error',
      },
    ],
    errorCodes: ['UNKNOWN'],
  };
}

/** Một instance dùng chung cho cả ứng dụng — tránh tạo Worker mới cho mỗi lần chạy. */
let sharedRunner: CodeRunner | null = null;

export function getCodeRunner(): CodeRunner {
  if (!sharedRunner) {
    sharedRunner = new LocalInterpreterRunner();
  }
  return sharedRunner;
}

/**
 * Điểm mở rộng cho tương lai: khi có dịch vụ biên dịch g++ thật, viết
 * `RemoteCompilerRunner implements CodeRunner` rồi gọi hàm này lúc khởi động.
 * Toàn bộ giao diện không cần sửa gì.
 */
export function setCodeRunner(runner: CodeRunner): void {
  sharedRunner?.dispose();
  sharedRunner = runner;
}
