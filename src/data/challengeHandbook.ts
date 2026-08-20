import { HANDBOOK_CARDS } from '@/data/handbook';
import type { Challenge, HandbookCard } from '@/types/content';

/**
 * Chọn đúng thẻ sổ tay mà nhiệm vụ đang cần.
 *
 * Trước đây học sinh bấm "Xem lệnh" là mở nguyên sổ tay 12 thẻ, phải tự dò xem
 * nhiệm vụ này liên quan thẻ nào. Với học sinh lớp 8 thì bước dò đó đủ để em
 * bỏ cuộc và quay ra hỏi thầy cô một câu mà sổ tay đã trả lời sẵn.
 *
 * Danh sách thẻ được SUY RA từ `requiredPatterns` của chính nhiệm vụ, không
 * khai báo tay cho từng bài. Lý do: số nhiệm vụ sẽ tiếp tục tăng và khai báo tay dễ
 * có bài bị sót, và mỗi lần sửa yêu cầu của bài lại phải nhớ sửa kèm — kiểu dữ
 * liệu đó luôn lệch dần theo thời gian.
 */

/** Mẫu trong `requiredPatterns` → thẻ sổ tay tương ứng. Xét theo thứ tự này. */
const PATTERN_TO_CARD: Array<{ test: RegExp; card: string }> = [
  /*
    Lệnh điều khiển nhân vật phải xét TRƯỚC mẫu `call:` chung.

    Nếu để `call:` bắt trước, nhiệm vụ khu vực 1 dùng `moveForward()` sẽ chỉ
    sang thẻ "Gọi hàm" — một khái niệm mãi khu vực 2 mới dạy. Học sinh mở ra
    đọc sẽ càng rối.
  */
  { test: /call:(chargeMachine|setSwitch)/, card: 'energy-machines' },
  { test: /call:(collectKey|hasKey|openDoor|getEnergy)/, card: 'decision-sensors' },
  { test: /call:(turnOnLight|attackBug|getBugHp)/, card: 'loop-game-api' },
  { test: /call:(moveRight|moveLeft|moveUp|moveDown|turnRight|turnLeft|collectGem|gemsCollected)/, card: 'robot-commands' },
  { test: /stmt:cin/, card: 'cin' },
  { test: /stmt:for/, card: 'for-loop' },
  { test: /stmt:if-else/, card: 'if-else' },
  /*
    `(?!-else)` là bắt buộc, không phải cho gọn.

    `\b` sau `if` VẪN khớp trong chuỗi "stmt:if-else" vì dấu gạch ngang cũng là
    ranh giới từ. Không có phần chặn này thì nhiệm vụ if-else chỉ ra cả hai thẻ,
    và học sinh mở nhầm thẻ `if` — đúng cái nhầm mà tính năng này sinh ra để
    tránh.
  */
  { test: /stmt:if(?!-else)/, card: 'if' },
  { test: /stmt:cout/, card: 'cout' },
  { test: /decl:ref/, card: 'reference-parameter' },
  { test: /decl:array/, card: 'one-dimensional-array' },
  { test: /access:array/, card: 'array-index-bounds' },
  { test: /decl:var/, card: 'variables' },
  { test: /op:(\+|-|\*|\/|%)/, card: 'arithmetic-operators' },
  { test: /decl:func:[^:]+>stmt:return/, card: 'function-return' },
  { test: /decl:func:[^:]+:params/, card: 'function-params' },
  { test: /decl:func/, card: 'function-declare' },
  { test: /call:/, card: 'function-call' },
  { test: /op:(==|!=|<=|>=|<|>)/, card: 'comparison-operators' },
  { test: /op:(&&|\|\||!)/, card: 'logical-operators' },
];

/** Thẻ luôn hữu ích, xếp cuối nếu nhiệm vụ chưa gợi ra thẻ nào khác. */
const FALLBACK_CARD_IDS = ['program-structure', 'cout'];

const CARD_BY_ID = new Map(HANDBOOK_CARDS.map((card) => [card.id, card]));

/**
 * Các thẻ lệnh liên quan tới nhiệm vụ, đã sắp theo mức liên quan.
 *
 * `challenge.handbookCards` cho phép người soạn bài chỉ định tay khi cách suy
 * ra tự động chưa trúng ý — ví dụ bài debug về dấu `;` thì nên chỉ thẳng sang
 * thẻ lỗi thường gặp.
 */
export function relevantHandbookCards(challenge: Challenge): HandbookCard[] {
  const ids: string[] = [];

  const add = (id: string) => {
    if (!ids.includes(id) && CARD_BY_ID.has(id)) ids.push(id);
  };

  for (const id of challenge.handbookCards ?? []) add(id);

  for (const pattern of challenge.requiredPatterns) {
    for (const { test, card } of PATTERN_TO_CARD) {
      if (test.test(pattern)) {
        add(card);
        break;
      }
    }
  }

  // Bài debug thì thẻ lỗi thường gặp gần như luôn đáng đọc
  if (challenge.kind === 'debug') add('common-errors');
  if (challenge.kind === 'cleancode') add('clean-code');

  if (ids.length === 0) FALLBACK_CARD_IDS.forEach(add);

  return ids.map((id) => CARD_BY_ID.get(id)!);
}
