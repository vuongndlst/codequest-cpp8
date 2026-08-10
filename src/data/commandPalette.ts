import { LESSONS_META } from '@/data/lessons.meta';
import type { Challenge } from '@/types/content';

/**
 * Bảng lệnh bấm-để-chèn.
 *
 * Học sinh lớp 8 gõ sai dấu `;` và sai chính tả tên lệnh nhiều hơn là sai tư
 * duy. Mỗi lần như vậy là một vòng "chạy → đọc lỗi → sửa" tiêu tốn sự tập
 * trung mà chẳng dạy được gì về thuật toán.
 *
 * Bảng này đưa sẵn khối lệnh viết đúng: bấm là chèn nguyên vẹn, kèm dấu `;`.
 * Đây chính là cách Swift Playgrounds làm — thanh phím tắt phía trên bàn phím.
 *
 * CỐ Ý KHÔNG đưa lời giải: bảng chỉ có từng lệnh rời, việc GHÉP CHÚNG THEO THỨ
 * TỰ NÀO vẫn hoàn toàn là việc của học sinh. Đề bài cấm tự động hoàn thành bài
 * hộ, và ghép thứ tự mới là phần dạy tư duy.
 */

export interface PaletteCommand {
  /** Chữ hiện trên nút */
  label: string;
  /** Code được chèn vào editor */
  snippet: string;
  /** Giải thích ngắn, hiện khi rê chuột */
  hint: string;
  /**
   * `expression` là mảnh code đặt BÊN TRONG một câu lệnh khác, ví dụ
   * `isBlocked()` nằm trong ngoặc của `if`. Những mảnh này KHÔNG có dấu `;` —
   * thêm vào là sai cú pháp.
   *
   * Khai báo rõ ở đây thay vì để test tự đoán: có một chỗ duy nhất nói lên ý
   * định, và test kiểm tra đúng ý định đó.
   */
  insertKind?: 'statement' | 'expression';
}

/** Lệnh điều khiển nhân vật trên bản đồ. */
const MOVEMENT: PaletteCommand[] = [
  {
    label: 'moveForward();',
    snippet: 'moveForward();',
    hint: 'Nhân vật tiến một ô theo hướng đang quay',
  },
  { label: 'turnRight();', snippet: 'turnRight();', hint: 'Quay sang phải, đứng yên tại chỗ' },
  { label: 'turnLeft();', snippet: 'turnLeft();', hint: 'Quay sang trái, đứng yên tại chỗ' },
];

const COLLECT: PaletteCommand[] = [
  { label: 'collectGem();', snippet: 'collectGem();', hint: 'Nhặt viên ngọc ở ô đang đứng' },
  { label: 'collectKey();', snippet: 'collectKey();', hint: 'Nhặt chìa khoá ở ô đang đứng' },
  { label: 'openDoor();', snippet: 'openDoor();', hint: 'Mở cánh cửa ngay phía trước' },
];

const OUTPUT: PaletteCommand[] = [
  {
    label: 'cout << "..." << endl;',
    snippet: 'cout << "" << endl;',
    hint: 'Nhân vật nói ra dòng chữ trong dấu nháy kép',
  },
];

const VARIABLES: PaletteCommand[] = [
  { label: 'int ten = 0;', snippet: 'int soBuoc = 0;', hint: 'Tạo một biến số nguyên' },
];

const LOOP: PaletteCommand[] = [
  {
    label: 'for (...) { }',
    snippet: 'for (int i = 0; i < 4; i = i + 1) {\n    \n}',
    hint: 'Lặp lại một nhóm lệnh nhiều lần',
  },
];

const CONDITION: PaletteCommand[] = [
  {
    label: 'if (...) { }',
    snippet: 'if (isBlocked()) {\n    \n}',
    hint: 'Chỉ chạy nhóm lệnh khi điều kiện đúng',
  },
  {
    label: 'isBlocked()',
    snippet: 'isBlocked()',
    hint: 'Đúng khi phía trước có vật cản — đặt trong ngoặc của if',
    insertKind: 'expression',
  },
];

/**
 * Lệnh mở dần theo khu vực.
 *
 * Hiện sẵn `for` từ khu vực 1 thì hỏng cả thiết kế: cái hay của khu vực 3 là
 * học sinh TỰ THẤY mình đang viết lặp rồi mới được trao vòng lặp. Đưa nút sẵn
 * ra trước là nói trước đáp án.
 */
const BY_LESSON: Record<string, PaletteCommand[]> = {
  l1: [...MOVEMENT, ...COLLECT, ...OUTPUT],
  l2: [...MOVEMENT, ...COLLECT, ...OUTPUT, ...VARIABLES],
  l3: [...MOVEMENT, ...COLLECT, ...OUTPUT, ...VARIABLES, ...LOOP],
  l4: [...MOVEMENT, ...COLLECT, ...OUTPUT, ...VARIABLES, ...LOOP, ...CONDITION],
  l5: [...MOVEMENT, ...COLLECT, ...OUTPUT, ...VARIABLES, ...LOOP, ...CONDITION],
};

export function paletteForChallenge(challenge: Challenge): PaletteCommand[] {
  // Bài dọn code và bài kể chuyện không cần bảng lệnh — ở đó việc của em là
  // đọc và sửa code có sẵn, không phải viết thêm lệnh mới.
  if (challenge.kind === 'cleancode') return [];

  const order = LESSONS_META.findIndex((lesson) => lesson.id === challenge.lessonId);
  const available = order < 0 ? (BY_LESSON.l1 ?? []) : (BY_LESSON[challenge.lessonId] ?? []);

  /*
    Không đưa toàn bộ "hộp đồ nghề" của cả khu vực vào mọi nhiệm vụ.

    Bản cũ làm một bài chỉ cần đi thẳng nhưng vẫn hiện quay trái, quay phải,
    nhặt chìa, mở cửa, cout... Học sinh phải tự đoán nút nào liên quan trước
    cả khi bắt đầu nghĩ thuật toán. Lời giải mẫu là nguồn tín hiệu chính xác
    nhất để biết LỆNH NÀO cần, nhưng ta chỉ lộ từng lệnh rời — tuyệt đối không
    lộ thứ tự hay số lần dùng nên vẫn không làm bài hộ.
  */
  const signal = [
    challenge.solution ?? '',
    challenge.starterCode,
    challenge.instructions.join('\n'),
    challenge.requiredPatterns.join('\n'),
    ...(challenge.testCases.map((test) =>
      [test.name, test.expectedOutput ?? '', JSON.stringify(test.expectedWorld ?? {})].join(' '),
    )),
  ].join('\n');

  const isRelevant = (command: PaletteCommand): boolean => {
    switch (command.label) {
      case 'moveForward();':
        return /\bmoveForward\b/.test(signal);
      case 'turnRight();':
        return /\bturnRight\b/.test(signal);
      case 'turnLeft();':
        return /\bturnLeft\b/.test(signal);
      case 'collectGem();':
        return /\bcollectGem\b/.test(signal);
      case 'collectKey();':
        return /\bcollectKey\b/.test(signal);
      case 'openDoor();':
        return /\bopenDoor\b/.test(signal);
      case 'cout << "..." << endl;':
        return /\bcout\b/.test(signal);
      case 'int ten = 0;':
        return /\bint\s+[A-Za-z_]/.test(signal);
      case 'for (...) { }':
        return /\bfor\s*\(/.test(signal);
      case 'if (...) { }':
        return /\bif\s*\(/.test(signal);
      case 'isBlocked()':
        return /\bisBlocked\s*\(/.test(signal);
      default:
        return false;
    }
  };

  const selected = available.filter(isRelevant);
  if (selected.length > 0) return selected;

  // Lưới an toàn cho nội dung chưa có lời giải mẫu: chỉ đưa đúng một lệnh
  // khởi đầu hợp ngữ cảnh, không quay lại hiển thị cả bảng của khu vực.
  const fallbackLabel =
    challenge.world?.kind === 'signal-tower' || challenge.world?.kind === 'workshop'
      ? 'cout << "..." << endl;'
      : 'moveForward();';
  return available.filter((command) => command.label === fallbackLabel).slice(0, 1);
}
