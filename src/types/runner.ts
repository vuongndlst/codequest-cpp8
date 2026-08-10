import type { Challenge, ErrorCode } from './content';
import type { Diagnostic } from '@/validators/tokens';
import type { CleanCodeReport } from '@/validators/cleanCodeCoach';
import type { WorldEvent, WorldState } from '@/validators/world';
import type { StatementCountResult } from '@/validators/statementCount';

/**
 * Hợp đồng giữa giao diện và bộ chạy code.
 *
 * Giao diện CHỈ phụ thuộc vào `RunResult`. Nhờ vậy, khi muốn thay trình thông
 * dịch tại chỗ bằng dịch vụ biên dịch g++ thật ở phía máy chủ, chỉ cần viết một
 * lớp mới implement `CodeRunner` — không phải sửa một dòng component nào
 * (yêu cầu mục 8 của đề bài).
 */

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  required: boolean;
  visible: boolean;
  /** Chỉ hiện với test `visible`, để học sinh tự so sánh */
  expected?: string;
  actual?: string;
  message?: string;
}

export interface RunResult {
  /** Chương trình chạy được (không lỗi cú pháp, không lỗi khi chạy) */
  ok: boolean;
  /** Đạt yêu cầu của nhiệm vụ */
  isCorrect: boolean;
  stdout: string[];
  worldEvents: WorldEvent[];
  finalWorld: WorldState | null;
  /** Luôn bằng tiếng Việt, đã sắp theo mức ưu tiên */
  diagnostics: Diagnostic[];
  testResults: TestResult[];
  cleanCode: CleanCodeReport;
  /**
   * Số câu lệnh học sinh viết, so với "số dòng vàng" của nhiệm vụ.
   *
   * `null` khi chương trình không phân tích được, hoặc khi nhiệm vụ không đặt
   * mức chuẩn (bài kể chuyện, bài thử nghiệm tự do).
   */
  par: StatementCountResult | null;
  passedRequired: number;
  totalRequired: number;
  /** Mã lỗi để ghi vào challenge_attempts.error_types cho dashboard giáo viên */
  errorCodes: ErrorCode[];
  durationMs: number;
}

export interface RunRequest {
  code: string;
  challenge: Challenge;
  stdin?: string;
  timeoutMs?: number;
}

export interface CodeRunner {
  readonly id: 'local-interpreter' | 'remote-compiler';
  run(request: RunRequest): Promise<RunResult>;
  dispose(): void;
}

/** Kết quả rỗng — dùng làm giá trị khởi tạo cho giao diện. */
export function emptyRunResult(): RunResult {
  return {
    ok: false,
    isCorrect: false,
    stdout: [],
    worldEvents: [],
    finalWorld: null,
    diagnostics: [],
    testResults: [],
    cleanCode: { score: 0, checks: [], suggestions: [], isClean: false },
    par: null,
    passedRequired: 0,
    totalRequired: 0,
    errorCodes: [],
    durationMs: 0,
  };
}
