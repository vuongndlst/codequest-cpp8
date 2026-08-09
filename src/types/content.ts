/**
 * Kieu du lieu cho NOI DUNG bai hoc.
 *
 * Nguyen tac: file nay khong duoc import React, Supabase hay bat ky thu vien
 * giao dien nao. Noi dung bai hoc la DU LIEU THUAN -> test duoc bang Vitest
 * khong can jsdom, va dung lai duoc neu sau nay chuyen sang CMS/DB.
 *
 * Chi tiet thiet ke: docs/phase-1-architecture.md muc 6.5
 */

/** Loai node nhiem vu tren ban do. Khop voi cau truc bai hoc muc 5 cua de bai. */
export type ChallengeKind =
  | 'story' // 5.1 + 5.2 Tinh huong mo dau + Quan sat
  | 'concept' // 5.3 Kham pha lenh
  | 'sandbox' // 5.4 Thu ngay
  | 'mission' // 5.5 Nhiem vu game
  | 'debug' // 5.6 Debug Challenge
  | 'cleancode' // 5.7 Clean Code Check
  | 'quiz' // 5.8 Exit Ticket
  | 'boss'; // 5.9 Boss Challenge

/** Ma loi thuong gap -> tra ra thong bao tieng Viet. Xem docs muc 6.4 */
export type ErrorCode =
  | 'MISSING_SEMICOLON'
  | 'UNBALANCED_BRACE'
  | 'UNBALANCED_PAREN'
  | 'VAR_TYPO'
  | 'VAR_UNDECLARED'
  | 'FUNC_NOT_CALLED'
  | 'FUNC_NAME_MISMATCH'
  | 'FUNC_UNDEFINED'
  | 'ASSIGN_IN_CONDITION'
  | 'COUT_SYNTAX'
  | 'COUT_MISSING_QUOTE'
  | 'FOR_MISSING_UPDATE'
  | 'FOR_WRONG_COUNT'
  | 'MISSING_MAIN'
  | 'MISSING_INCLUDE'
  | 'TIMEOUT'
  | 'UNSUPPORTED_FEATURE'
  | 'OUTPUT_MISMATCH'
  | 'PATTERN_MISSING'
  | 'PATTERN_FORBIDDEN'
  | 'UNKNOWN';

/** Cac quy tac Clean Code Coach cham. Xem docs muc 6.8 */
export type CleanCodeRuleId =
  | 'indent'
  | 'one-statement-per-line'
  | 'meaningful-var'
  | 'action-verb-func'
  | 'unused-var'
  | 'no-duplication'
  | 'spacing'
  | 'main-length'
  | 'extract-function';

export interface CleanCodeRule {
  rule: CleanCodeRuleId;
  /** Trong so trong thang 100. Tong cac rule cua mot challenge = 100. */
  weight: number;
  params?: Record<string, unknown>;
}

export interface Hint {
  level: 1 | 2 | 3;
  /** 1 = cau hoi dinh huong, 2 = nhac cau truc, 3 = khung code co cho trong */
  type: 'question' | 'structure' | 'skeleton';
  content: string;
}

export interface CommonMistake {
  errorCode: ErrorCode;
  /** Bieu thuc DSL phat hien loi (xem docs muc 6.6). De trong = dung bo chan doan chung. */
  detect?: string;
  /** Thong bao rieng cho challenge nay, uu tien hon thong bao chung. */
  message: string;
  hintLevel?: 1 | 2 | 3;
}

export interface TestCase {
  id: string;
  /** Tên hiển thị cho học sinh, vd. "Nhân vật đi đủ 5 ô" */
  name: string;
  kind: 'output' | 'world' | 'structure';
  input?: string;
  expectedOutput?: string;
  expectedWorld?: Record<string, unknown>;
  /** Chỉ dùng với kind = 'structure': các mẫu AST phải khớp (cùng DSL với requiredPatterns) */
  patterns?: string[];
  /** true = bắt buộc (tính vào tỉ lệ 70% để cấp chứng chỉ) */
  required: boolean;
  /** false = test ẩn, chống dò đáp án */
  visible: boolean;
}

/** Cau hinh san khau game 2D cho mot challenge. */
/**
 * Loai san khau.
 *
 *   · path          — con duong o luoi, nhan vat di tu trai sang (khu vuc 3-5)
 *   · signal-tower  — thap tin hieu: den sang theo tung `cout`, tinh the giu
 *                     gia tri bien (khu vuc 1)
 *   · workshop      — xuong ren: moi ham la mot co may, goi ham thi may chay
 *                     (khu vuc 2)
 *
 * Bo trong thi mac dinh `path`, nen 7 nhiem vu da co san khau khong doi gi.
 */
export type WorldKind = 'path' | 'signal-tower' | 'workshop';

export interface WorldSpec {
  kind?: WorldKind;
  /** So o cua con duong / kich thuoc luoi. San khau khac dung lam so cho trong. */
  cols: number;
  rows?: number;
  startCol?: number;
  goalCol?: number;
  /** Cac vat the tinh: den, cua, cau, chuong ngai vat... */
  props?: Array<{ id: string; type: string; col: number; row?: number; state?: string }>;
  /** Bien khoi tao cua the gioi, vd. { energy: 10, hasKey: true } */
  initialState?: Record<string, unknown>;
}

export interface Challenge {
  id: string;
  lessonId: string;
  kind: ChallengeKind;
  title: string;
  /** 2-4 cau dat hoc sinh vao tinh huong */
  story: string;
  instructions: string[];
  starterCode: string;
  expectedOutput?: string;
  /** DSL tren AST, khong phai regex. Xem docs muc 6.6 */
  requiredPatterns: string[];
  forbiddenPatterns?: string[];
  testCases: TestCase[];
  commonMistakes: CommonMistake[];
  /** Bat buoc >= 3 cap. Script validate:content se kiem tra. */
  hints: Hint[];
  cleanCodeRules: CleanCodeRule[];
  /**
   * Điểm Clean Code tối thiểu để hoàn thành node.
   *
   * CHỈ đặt cho node `kind: 'cleancode'` — ở đó việc dọn code chính là nhiệm vụ,
   * và starter code vốn đã chạy đúng nên không có tiêu chí này thì học sinh
   * bấm Chạy là qua mà chẳng cần sửa gì.
   *
   * Các node khác KHÔNG được đặt: mục 11 của đề bài quy định điểm clean code
   * không được làm học sinh trượt khi chương trình đã đúng.
   */
  minCleanCodeScore?: number;
  xpReward: number;
  /**
   * Chỉ định tay các thẻ sổ tay lệnh liên quan tới nhiệm vụ.
   *
   * Bỏ trống thì hệ thống tự suy ra từ `requiredPatterns` — xem
   * `src/data/challengeHandbook.ts`. Chỉ dùng khi cách suy ra tự động chưa
   * trúng ý người soạn bài.
   */
  handbookCards?: string[];
  /** Node "Khám phá thêm" — không tính vào tiến trình, không đánh giá */
  optional?: boolean;
  world?: WorldSpec;
  /** Chỉ lộ khi class_settings.allow_solution_view = true hoặc học sinh đã thử >= 6 lần */
  solution?: string;

  /**
   * Câu hỏi học sinh nên TỰ TRẢ LỜI TRƯỚC KHI gõ dòng code đầu tiên.
   *
   * Mục đích: tách bước "nghĩ" ra khỏi bước "gõ". Học sinh lớp 8 rất hay lao
   * vào gõ ngay rồi sửa mò — câu hỏi này buộc các em dừng lại một nhịp.
   */
  thinkingPrompt?: string;

  /** Nhiệm vụ này rèn kỹ năng gì, nối với kiến thức nào — 1 tới 2 câu */
  whyThisMatters?: string;
}

/** Cau hoi Exit Ticket. Muc 5.8: 1 cau kien thuc + 1 cau doc code + 1 cau tu danh gia. */
export interface ExitTicketQuestion {
  id: string;
  type: 'knowledge' | 'read-code' | 'self-assess';
  prompt: string;
  /** Doan code de hoc sinh doc (chi voi type = 'read-code') */
  code?: string;
  options: string[];
  /** Chi so dap an dung. Cau tu danh gia khong co dap an dung/sai. */
  correctIndex?: number;
  explanation?: string;
}

export interface ExitTicket {
  lessonId: string;
  questions: ExitTicketQuestion[];
  /** Cau hoi mo cuoi cung, luon hien thi */
  reflectionPrompt: string;
}

/** Mot the trong So tay lenh (muc 10). */
export interface HandbookCard {
  id: string;
  title: string;
  /** Bai hoc som nhat gioi thieu the nay -> dung de loc theo tien trinh */
  introducedInLesson: string;
  syntax: string;
  explanation: string;
  example: string;
  commonMistakes: string[];
  tip: string;
  keywords: string[];
}

/**
 * HƯỚNG DẪN KIẾN THỨC của một khu vực.
 *
 * Đây là phần DẠY TƯ DUY, tách hẳn khỏi phần dạy cú pháp.
 *
 * Nguyên tắc sư phạm: học sinh chỉ thật sự hiểu một lệnh khi các em từng CẢM
 * THẤY vấn đề mà lệnh đó giải quyết. Vì vậy mỗi hướng dẫn đi theo thứ tự:
 *
 *   ① Câu hỏi lớn      — khu vực này trả lời câu hỏi gì?
 *   ② Vấn đề trước đã  — thử làm KHÔNG có lệnh mới thì khổ ở đâu
 *   ③ Lệnh mới cứu ta  — nó gỡ đúng chỗ khổ đó thế nào
 *   ④ Mô hình tư duy   — cách hình dung để nhớ lâu
 *   ⑤ Các bước tư duy  — quy trình nghĩ khi gặp bài mới (KHÔNG phải đáp án)
 *   ⑥ Dùng / không dùng khi nào
 *   ⑦ Hiểu lầm thường gặp
 */
export interface ConceptGuide {
  lessonId: string;
  /** Câu hỏi lớn mà cả khu vực trả lời, viết theo giọng học sinh tự hỏi */
  bigQuestion: string;

  /** Bước ②: nêu vấn đề TRƯỚC khi giới thiệu lệnh */
  problem: {
    title: string;
    body: string;
    /** Đoạn code cho thấy cái khổ khi chưa có lệnh mới */
    painfulExample: string;
    /** Câu chốt để học sinh tự thấy vấn đề */
    punchline: string;
  };

  /** Bước ③: lệnh mới giải quyết ra sao */
  solution: {
    title: string;
    body: string;
    cleanExample: string;
    /** Điều gì đã thay đổi giữa hai đoạn code */
    whatChanged: string;
  };

  /** Bước ④: cách hình dung cho dễ nhớ */
  mentalModel: {
    analogy: string;
    explanation: string;
  };

  /** Bước ⑤: quy trình tư duy khi gặp bài toán mới */
  thinkingSteps: Array<{
    question: string;
    /** Vì sao phải tự hỏi câu này */
    why: string;
  }>;

  whenToUse: string[];
  whenNotToUse: string[];

  /** Bước ⑦: hiểu lầm phổ biến và cách nghĩ đúng */
  misconceptions: Array<{
    wrong: string;
    right: string;
    why: string;
  }>;
}

export interface Lesson {
  id: string;
  /** So thu tu khu vuc 1..5 */
  order: number;
  /** Ten khu vuc trong game, vd. "Lang Khoi Dong" */
  zoneName: string;
  title: string;
  subtitle: string;
  /** Gioi thieu 2-4 cau */
  intro: string;
  objectives: string[];
  /** Ma chung chi mo khoa khi hoan thanh bai nay */
  certificateCode: CertificateCode;
  /** Mau chu dao cua khu vuc (token Tailwind) */
  accent: 'quest' | 'mage' | 'verdant' | 'treasure' | 'alert';
  icon: string;
  estimatedMinutes: number;
  /** Phần dạy tư duy của khu vực — học sinh đọc TRƯỚC khi làm nhiệm vụ */
  conceptGuide: ConceptGuide;
  challenges: Challenge[];
  exitTicket: ExitTicket;
}

export type CertificateCode =
  | 'cpp-starter'
  | 'function-builder'
  | 'loop-explorer'
  | 'decision-maker'
  | 'byteland-code-guardian';

/**
 * Metadata bài học dùng cho bản đồ / dashboard.
 *
 * Cố ý KHÔNG chứa `challenges`, `exitTicket` và `conceptGuide` — đó là những
 * phần nội dung nặng. Nhờ vậy dashboard và bản đồ chỉ tải vài KB metadata thay
 * vì toàn bộ nội dung 5 khu vực.
 */
export type LessonMeta = Omit<Lesson, 'challenges' | 'exitTicket' | 'conceptGuide'> & {
  challengeCount: number;
  requiredChallengeCount: number;
};
