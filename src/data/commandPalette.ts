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
  if (order < 0) return BY_LESSON.l1 ?? [];

  return BY_LESSON[challenge.lessonId] ?? BY_LESSON.l1 ?? [];
}
