import type { Challenge, ExitTicket, Lesson } from '@/types/content';
import { LESSONS_META } from '@/data/lessons.meta';
import { STANDARD_CLEAN_CODE } from '../shared';
import { lesson1Guide } from './guide';

/**
 * KHU VỰC 1 — LÀNG KHỞI ĐỘNG · Ra lệnh & Thuật toán
 *
 * Khu vực này KHÔNG mở đầu bằng cú pháp. Nó mở đầu bằng việc học sinh phải tự
 * chia một mục tiêu thành các bước, đúng thứ tự — tức là tự viết ra một thuật
 * toán, trước khi biết gọi nó là thuật toán.
 *
 * VÌ SAO `cout` XUỐNG TẬN NHIỆM VỤ 5:
 * Lệnh đầu tiên học sinh gõ phải khiến NHÂN VẬT ĐỘNG ĐẬY. Bước đi thì nhìn
 * thấy được, sai thì thấy ngay nhân vật đâm vào bụi cây — còn một dòng chữ in
 * ra màn hình chưa nói lên điều gì với em mới bắt đầu. Khi `cout` xuất hiện, nó
 * xuất hiện như một HÀNH ĐỘNG trong thế giới: nhân vật hô câu thần chú và cổng
 * đá mở ra.
 *
 * SỐ DÒNG VÀNG được đặt ở mức của lời giải gọn nhất. Học sinh giải dài hơn vẫn
 * qua bài — chỉ là màn hình mời em thử tìm đường ngắn hơn.
 */

const challenges: Challenge[] = [
  // ─────────────────────────────────────── 1. Quan sát: máy chờ lệnh của em
  {
    id: 'l1-c1-observe',
    lessonId: 'l1',
    kind: 'story',
    title: 'Byte không tự đi được',
    story:
      'Byte đứng ở đầu làng, quay mặt sang phải, và không nhúc nhích. "Mình không tự đi được đâu," Byte nói. "Mình chỉ làm đúng những gì bạn ghi ra. Bạn ghi mấy bước thì mình đi mấy bước."',
    instructions: [
      'Nhìn bản đồ trước: Byte ở ô ngoài cùng bên trái, ô đích có viền vàng nhấp nháy ở bên phải.',
      'Đếm xem từ chỗ Byte tới ô đích là bao nhiêu ô.',
      'Code đã viết sẵn cho em. Bấm Chạy code và xem Byte đi.',
      'Thử xoá bớt một dòng rồi chạy lại — xem Byte dừng ở đâu.',
    ],
    thinkingPrompt:
      'Trước khi bấm Chạy, em đoán thử: ba dòng lệnh này sẽ đưa Byte tới ô số mấy? Đoán xong rồi hãy chạy để kiểm tra.',
    whyThisMatters:
      'Đây là ý quan trọng nhất của cả khu vực: một lệnh làm đúng một việc. Hiểu điều này thì em sẽ biết vì sao chương trình dài ra rất nhanh, và vì sao sau này người ta phải nghĩ ra vòng lặp.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    moveForward();

    return 0;
}`,
    requiredPatterns: ['call:moveForward'],
    testCases: [
      {
        id: 'l1-c1-t1',
        name: 'Byte tới được ô đích',
        kind: 'world',
        expectedWorld: { col: 3, row: 0 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Mỗi lệnh phải kết thúc bằng dấu `;`. Em có thể bấm nút lệnh ở bảng phía trên ô code — bấm là được chèn sẵn dấu chấm phẩy.',
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em đếm thử xem từ ô Byte đang đứng tới ô có viền vàng là bao nhiêu ô? Mỗi lệnh `moveForward()` đưa Byte đi được mấy ô?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Byte cần đi 3 ô, mà mỗi lệnh chỉ đi được 1 ô. Vậy cần bao nhiêu dòng lệnh giống nhau?',
      },
      {
        level: 3,
        type: 'skeleton',
        content: 'Ba dòng, mỗi dòng một lệnh:\n```cpp\nmoveForward();\nmoveForward();\nmoveForward();\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    parStatements: 3,
    xpReward: 15,
    world: {
      kind: 'map',
      cols: 4,
      rows: 1,
      startCol: 0,
      startRow: 0,
      startFacing: 'east',
      goalCol: 3,
      goalRow: 0,
      initialState: { energy: 10 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    moveForward();

    return 0;
}`,
  },

  // ─────────────────────────────────────── 2. Khám phá: thứ tự quyết định tất cả
  {
    id: 'l1-c2-concept',
    lessonId: 'l1',
    kind: 'concept',
    title: 'Thứ tự là tất cả',
    story:
      'Con đường rẽ xuống. "Mình chỉ đi được về phía đang nhìn thôi," Byte nhắc. "Muốn mình xuống dưới thì bạn phải cho mình quay trước đã. Mà quay thì mình đứng yên tại chỗ, không tự đi đâu hết."',
    instructions: [
      'Byte đang quay mặt sang phải. Ô đích nằm ở hàng dưới, cột ngoài cùng bên phải.',
      'Đi hết hàng trên trước, rồi mới quay xuống.',
      'Lệnh `turnRight()` chỉ đổi hướng nhìn — Byte vẫn đứng nguyên ô cũ.',
      'Thử đảo thứ tự hai dòng bất kỳ rồi chạy lại, xem Byte đi lạc đường thế nào.',
    ],
    thinkingPrompt:
      'Nếu em cho Byte quay phải NGAY TỪ ĐẦU rồi mới đi, Byte sẽ tới ô nào? Vẽ thử đường đi đó ra giấy trước khi gõ.',
    whyThisMatters:
      'Cùng một bộ lệnh, xếp khác thứ tự là ra kết quả khác hẳn. Đây chính là điều làm nên một thuật toán: không chỉ cần đủ bước, mà phải đúng trình tự.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();

    // Byte đang ở cuối hàng trên. Giờ làm sao xuống được hàng dưới?

    return 0;
}`,
    requiredPatterns: ['call:turnRight'],
    testCases: [
      {
        id: 'l1-c2-t1',
        name: 'Byte tới đúng ô đích ở hàng dưới',
        kind: 'world',
        expectedWorld: { col: 2, row: 1 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_MISSING',
        message:
          'Byte đang quay sang phải nên đi mãi cũng không xuống được hàng dưới. Em cần cho Byte quay trước đã.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Byte đang nhìn về hướng nào? Muốn đi xuống hàng dưới thì Byte phải nhìn về hướng nào trước đã?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Thứ tự là: đi hết hàng trên → quay phải để nhìn xuống → đi thêm một ô. Lệnh quay nằm GIỮA các lệnh đi, không phải ở đầu.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung bốn bước:\n```cpp\nmoveForward();\nmoveForward();\nturnRight();\nmoveForward();\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    parStatements: 4,
    xpReward: 20,
    world: {
      kind: 'map',
      cols: 3,
      rows: 2,
      startCol: 0,
      startRow: 0,
      startFacing: 'east',
      goalCol: 2,
      goalRow: 1,
      terrain: ['...', '##.'],
      initialState: { energy: 10 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    turnRight();
    moveForward();

    return 0;
}`,
  },

  // ─────────────────────────────────────── 3. Thử ngay: nhặt viên ngọc
  {
    id: 'l1-c3-sandbox',
    lessonId: 'l1',
    kind: 'sandbox',
    title: 'Thử ngay: viên ngọc đầu tiên',
    story:
      'Giữa đường có một viên ngọc xanh. "Nhặt được nó thì làng sáng thêm một chút," Byte nói. "Nhưng mình phải ĐỨNG ĐÚNG Ô có ngọc mới với tới được. Đứng từ xa thì chịu."',
    instructions: [
      'Viên ngọc nằm ở giữa đường, ô đích ở cuối đường.',
      'Đi tới đúng ô có ngọc, nhặt nó lên, rồi đi tiếp tới đích.',
      'Dùng `collectGem()` để nhặt ngọc.',
      'Đây là bài thử tự do — em cứ thử sai thoải mái, chạy lại bao nhiêu lần cũng được.',
    ],
    thinkingPrompt:
      'Viên ngọc ở ô thứ mấy tính từ chỗ Byte đứng? Em phải gọi `collectGem()` SAU bao nhiêu lệnh đi?',
    whyThisMatters:
      'Bài này rèn thói quen kiểm tra điều kiện trước khi hành động: lệnh nhặt chỉ có tác dụng khi nhân vật đã ở đúng chỗ.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Đi tới ô có ngọc, nhặt ngọc, rồi đi tiếp tới đích

    return 0;
}`,
    requiredPatterns: ['call:collectGem'],
    testCases: [
      {
        id: 'l1-c3-t1',
        name: 'Nhặt được viên ngọc và tới đích',
        kind: 'world',
        expectedWorld: { col: 3, row: 0, collectedGems: 1 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_MISSING',
        message:
          'Em nhớ gọi `collectGem()` khi Byte đã đứng đúng ô có ngọc nhé. Nhặt xong vẫn phải đi tiếp tới ô đích.',
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Byte phải đi mấy ô mới đứng lên được viên ngọc? Sau khi nhặt xong thì còn phải đi thêm mấy ô nữa?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Trình tự gồm ba phần: đi tới ô có ngọc → nhặt → đi nốt phần đường còn lại tới đích.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung bốn bước:\n```cpp\nmoveForward();\nmoveForward();\ncollectGem();\nmoveForward();\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    parStatements: 4,
    xpReward: 20,
    world: {
      kind: 'map',
      cols: 4,
      rows: 1,
      startCol: 0,
      startRow: 0,
      startFacing: 'east',
      goalCol: 3,
      goalRow: 0,
      props: [{ id: 'ngoc-1', type: 'gem', col: 2, row: 0 }],
      initialState: { energy: 12 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    collectGem();
    moveForward();

    return 0;
}`,
  },

  // ─────────────────────────────────────── 4. Nhiệm vụ: đi vòng qua vật cản
  {
    id: 'l1-c4-mission',
    lessonId: 'l1',
    kind: 'mission',
    title: 'Đường vòng qua bụi gai',
    story:
      'Một bụi gai rậm mọc chắn ngang lối đi. "Mình không chui qua được đâu," Byte lắc đầu. "Mà mình cũng không tự biết đường vòng. Bạn phải chỉ cho mình đi lối nào."',
    instructions: [
      'Bụi gai chắn ô ngay bên phải Byte. Đi thẳng là đâm vào.',
      'Ô đích nằm ở cuối hàng dưới.',
      'Xuống hàng dưới trước, đi hết hàng dưới rồi tới đích.',
      'Nhớ: quay xong phải quay lại hướng cũ mới đi tiếp sang phải được.',
    ],
    thinkingPrompt:
      'Em thử vẽ đường đi ra giấy trước: Byte cần quay mấy lần, và giữa hai lần quay đó thì đi mấy ô?',
    whyThisMatters:
      'Gặp vật cản thì phải nghĩ ra đường khác — đó là lúc em thật sự thiết kế một thuật toán, chứ không chỉ gõ lại lệnh có sẵn.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Bụi gai chắn phía trước. Tìm đường vòng xuống hàng dưới.

    return 0;
}`,
    requiredPatterns: ['call:turnRight', 'call:turnLeft'],
    testCases: [
      {
        id: 'l1-c4-t1',
        name: 'Byte đi vòng qua bụi gai và tới đích',
        kind: 'world',
        expectedWorld: { col: 3, row: 1 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_MISSING',
        message:
          'Quay xuống rồi thì Byte đang nhìn xuống dưới. Muốn đi sang phải tiếp thì phải quay thêm một lần nữa.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Sau khi Byte quay phải và đi xuống một ô, Byte đang nhìn về hướng nào? Hướng đó có phải hướng em muốn đi tiếp không?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Đường đi gồm bốn chặng: quay xuống → đi xuống một ô → quay lại sang phải → đi hết hàng dưới.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung sáu bước:\n```cpp\nturnRight();\nmoveForward();\nturnLeft();\nmoveForward();\nmoveForward();\nmoveForward();\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    parStatements: 6,
    xpReward: 25,
    world: {
      kind: 'map',
      cols: 4,
      rows: 2,
      startCol: 0,
      startRow: 0,
      startFacing: 'east',
      goalCol: 3,
      goalRow: 1,
      terrain: ['.#..', '....'],
      initialState: { energy: 15 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    turnRight();
    moveForward();
    turnLeft();
    moveForward();
    moveForward();
    moveForward();

    return 0;
}`,
  },

  // ─────────────────────────────────────── 5. Nhiệm vụ: cout xuất hiện ở đây
  {
    id: 'l1-c5-mission',
    lessonId: 'l1',
    kind: 'mission',
    title: 'Byte biết nói',
    story:
      'Cuối đường là một cánh cổng đá khắc đầy chữ cổ. "Cổng này không đẩy được," Byte đọc dòng chữ trên đá. "Nó chỉ mở khi có ai đó HÔ TO câu thần chú: MO CONG. Mà mình chỉ nói được khi bạn bảo mình nói."',
    instructions: [
      'Đi tới sát cổng — đứng ngay trước nó, đừng cố đi xuyên qua.',
      'Cho Byte hô câu thần chú bằng lệnh: `cout << "MO CONG" << endl;`',
      'Phần trong dấu nháy kép là câu Byte nói ra, phải viết đúng từng chữ hoa.',
      'Hô xong thì gọi `openDoor()` để đẩy cổng, rồi mới đi qua được.',
    ],
    thinkingPrompt:
      'Byte phải đứng ở đâu thì mới hô được câu thần chú cho cổng nghe thấy? Thứ tự "hô" và "đẩy cổng" có đảo được không?',
    whyThisMatters:
      'Đây là lần đầu em dùng `cout`. Nó không phải để trang trí màn hình — nó là cách nhân vật tác động lên thế giới bằng lời nói, và câu chữ phải chính xác từng ký tự.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();

    // Byte đang đứng trước cổng. Cho Byte hô câu thần chú rồi mở cổng.

    return 0;
}`,
    requiredPatterns: ['stmt:cout', 'call:openDoor'],
    testCases: [
      {
        id: 'l1-c5-t1',
        name: 'Byte hô đúng câu thần chú',
        kind: 'output',
        expectedOutput: 'MO CONG',
        required: true,
        visible: true,
      },
      {
        id: 'l1-c5-t2',
        name: 'Cổng mở ra và Byte đi qua được',
        kind: 'world',
        expectedWorld: { col: 3, row: 0 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'COUT_MISSING_QUOTE',
        message:
          'Câu thần chú phải nằm trong dấu nháy kép: `cout << "MO CONG" << endl;` — thiếu nháy kép thì máy tưởng đó là tên biến.',
      },
      {
        errorCode: 'OUTPUT_MISMATCH',
        message:
          'Cổng đá rất khó tính: phải đúng `MO CONG` viết hoa, không dấu. Em kiểm tra lại từng chữ nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Byte cần đi mấy ô để đứng sát cổng? Sau khi hô câu thần chú rồi, còn thiếu hành động nào nữa thì cổng mới thật sự mở?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Trình tự bốn phần: đi tới sát cổng → hô câu thần chú bằng `cout` → gọi `openDoor()` → đi qua cổng.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Phần còn thiếu:\n```cpp\ncout << "MO CONG" << endl;\nopenDoor();\nmoveForward();\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    parStatements: 5,
    xpReward: 30,
    world: {
      kind: 'map',
      cols: 4,
      rows: 1,
      startCol: 0,
      startRow: 0,
      startFacing: 'east',
      goalCol: 3,
      goalRow: 0,
      props: [{ id: 'cong-da', type: 'door', col: 3, row: 0 }],
      initialState: { energy: 12 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();

    cout << "MO CONG" << endl;
    openDoor();
    moveForward();

    return 0;
}`,
  },

  // ─────────────────────────────────────── 6. Debug: đếm hụt một bước
  {
    id: 'l1-c6-debug',
    lessonId: 'l1',
    kind: 'debug',
    title: 'Bug đếm hụt một bước',
    story:
      'Bug đã lẻn vào chương trình và xoá bớt một dòng. Byte chạy tới gần đích rồi dừng lại, đứng ngơ ngác. "Mình làm đúng những gì ghi trong này mà," Byte chỉ vào đoạn code.',
    instructions: [
      'Đọc code trước, ĐỪNG sửa vội.',
      'Đếm trên bản đồ: từ chỗ Byte tới đích là bao nhiêu ô?',
      'Đếm trong code: có bao nhiêu lệnh `moveForward()`?',
      'Hai con số đó có bằng nhau không? Đó chính là chỗ Bug cắn.',
    ],
    thinkingPrompt:
      'Trước khi sửa, em thử chạy code hiện tại và đoán xem Byte sẽ dừng ở ô nào. Đoán đúng nghĩa là em đã đọc hiểu code.',
    whyThisMatters:
      'Gỡ lỗi không phải là sửa mò cho tới khi chạy được. Đó là so sánh điều em MONG ĐỢI với điều thật sự XẢY RA, rồi tìm chỗ hai thứ lệch nhau.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    moveForward();

    return 0;
}`,
    requiredPatterns: ['call:moveForward'],
    testCases: [
      {
        id: 'l1-c6-t1',
        name: 'Byte đi đủ số ô và tới đích',
        kind: 'world',
        expectedWorld: { col: 4, row: 0 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_MISSING',
        message:
          'Byte dừng sớm một ô. Em đếm lại số ô trên bản đồ rồi so với số dòng `moveForward()` trong code nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em đếm trên bản đồ được bao nhiêu ô? Trong code có bao nhiêu lệnh đi? Hai con số này chênh nhau bao nhiêu?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Bản đồ dài 5 ô nên Byte cần đi 4 bước. Code hiện tại mới có 3 lệnh — còn thiếu đúng một dòng.',
      },
      {
        level: 3,
        type: 'skeleton',
        content: 'Thêm một dòng `moveForward();` nữa vào cuối, thành đủ bốn dòng.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    parStatements: 4,
    xpReward: 25,
    world: {
      kind: 'map',
      cols: 5,
      rows: 1,
      startCol: 0,
      startRow: 0,
      startFacing: 'east',
      goalCol: 4,
      goalRow: 0,
      initialState: { energy: 10 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    moveForward();
    moveForward();

    return 0;
}`,
  },

  // ─────────────────────────────────────── 7. Debug: quay nhầm hướng
  {
    id: 'l1-c7-debug',
    lessonId: 'l1',
    kind: 'debug',
    title: 'Bug xoay ngược la bàn',
    story:
      'Lần này Bug không xoá dòng nào cả — số dòng vẫn đủ. Nhưng Byte quay đúng một lần rồi đâm thẳng vào mép bản đồ. "Mình quay theo lệnh mà," Byte nói. "Chắc lệnh sai hướng."',
    instructions: [
      'Code này KHÔNG thiếu dòng nào. Số lượng lệnh đã đúng.',
      'Chạy thử và xem Byte quay về hướng nào.',
      'Ô đích nằm ở hàng DƯỚI so với chỗ Byte đứng.',
      'Sửa đúng một chữ trong code là xong.',
    ],
    thinkingPrompt:
      'Byte đang nhìn sang phải. Nếu quay trái thì Byte sẽ nhìn lên hay nhìn xuống? Em thử lấy tay mình xoay thử xem.',
    whyThisMatters:
      'Đây là lỗi LOGIC chứ không phải lỗi cú pháp: code viết đúng luật, máy chạy không báo lỗi, nhưng kết quả vẫn sai. Loại lỗi này chỉ tìm ra được bằng cách đọc và suy nghĩ.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    turnLeft();
    moveForward();

    return 0;
}`,
    requiredPatterns: ['call:turnRight'],
    testCases: [
      {
        id: 'l1-c7-t1',
        name: 'Byte quay đúng hướng và xuống được hàng dưới',
        kind: 'world',
        expectedWorld: { col: 1, row: 1 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_MISSING',
        message:
          'Byte đang nhìn sang phải. Quay trái thì Byte nhìn lên trên — mà đích lại ở phía dưới.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Byte đang nhìn sang phải. Em thử tưởng tượng mình đứng như Byte: quay sang trái thì mặt em hướng lên hay hướng xuống?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Đứng nhìn sang phải mà quay TRÁI thì thành nhìn lên trên. Muốn nhìn xuống dưới thì phải quay theo chiều ngược lại.',
      },
      {
        level: 3,
        type: 'skeleton',
        content: 'Đổi `turnLeft();` thành `turnRight();` — giữ nguyên dòng `moveForward();`.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    parStatements: 2,
    xpReward: 25,
    world: {
      kind: 'map',
      cols: 3,
      rows: 2,
      startCol: 1,
      startRow: 0,
      startFacing: 'east',
      goalCol: 1,
      goalRow: 1,
      initialState: { energy: 10 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    turnRight();
    moveForward();

    return 0;
}`,
  },

  // ─────────────────────────────────────── 8. Clean Code: dọn lại đường đi
  {
    id: 'l1-c8-cleancode',
    lessonId: 'l1',
    kind: 'cleancode',
    title: 'Dọn lại bản kế hoạch',
    story:
      'Chương trình này CHẠY ĐÚNG — Byte tới được đích. Nhưng nhìn vào thì rối mắt: các lệnh viết dồn lên nhau, dòng thò ra dòng thụt vào. "Tuần sau bạn đọc lại có hiểu nổi không?" Byte hỏi.',
    instructions: [
      'Code này đã chạy đúng rồi. Việc của em không phải sửa cho chạy, mà là sắp lại cho DỄ ĐỌC.',
      'Mỗi câu lệnh nằm trên một dòng riêng.',
      'Các lệnh bên trong `main()` phải thụt vào cùng một mức.',
      'Bấm nút "Thụt lề lại" ở trên ô code nếu em muốn máy dọn giúp phần thụt lề.',
    ],
    thinkingPrompt:
      'Code chạy đúng rồi thì dọn dẹp để làm gì? Em thử nghĩ xem: ai sẽ là người đọc lại đoạn code này, và khi nào?',
    whyThisMatters:
      'Code được viết một lần nhưng đọc lại rất nhiều lần — bởi bạn cùng nhóm, bởi thầy cô, và bởi chính em vài tuần sau. Viết cho người đọc hiểu cũng quan trọng ngang viết cho máy chạy.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
moveForward(); moveForward();
        moveForward();
return 0;
}`,
    requiredPatterns: ['call:moveForward'],
    testCases: [
      {
        id: 'l1-c8-t1',
        name: 'Byte vẫn tới được đích sau khi dọn',
        kind: 'world',
        expectedWorld: { col: 3, row: 0 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_MISSING',
        message:
          'Em nhớ giữ nguyên số lệnh nhé — dọn dẹp không được làm đổi cách chương trình chạy.',
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em nhìn xem có dòng nào đang chứa hai câu lệnh không? Và các dòng có thụt vào thẳng hàng nhau chưa?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Hai việc cần làm: tách mỗi lệnh ra một dòng riêng, và cho cả ba lệnh thụt vào cùng một mức bên trong `main()`.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Ba lệnh giống nhau, mỗi lệnh một dòng, cùng thụt vào bốn dấu cách:\n```cpp\n    moveForward();\n    moveForward();\n    moveForward();\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    minCleanCodeScore: 80,
    xpReward: 25,
    world: {
      kind: 'map',
      cols: 4,
      rows: 1,
      startCol: 0,
      startRow: 0,
      startFacing: 'east',
      goalCol: 3,
      goalRow: 0,
      initialState: { energy: 10 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    moveForward();
    moveForward();
    moveForward();

    return 0;
}`,
  },

  // ─────────────────────────────────────── 9. BOSS: mở cổng làng
  {
    id: 'l1-c9-boss',
    lessonId: 'l1',
    kind: 'boss',
    title: 'BOSS — Mở cổng làng Khởi Động',
    story:
      'Cổng làng đóng chặt từ ngày Bug tràn vào. Đường tới cổng bị bụi gai chắn, giữa đường lại có một viên ngọc cần nhặt để tiếp sức cho cánh cổng. "Lần này bạn phải dùng hết những gì đã học," Byte nói. "Mình tin bạn."',
    instructions: [
      'Bụi gai chắn ô thứ ba của hàng trên — phải đi vòng xuống hàng dưới.',
      'Trên đường có một viên ngọc: đi tới đúng ô đó và nhặt lên.',
      'Cuối hàng dưới là cổng đá: hô `MO CONG` rồi mở cổng.',
      'Đi qua cổng là hoàn thành nhiệm vụ.',
    ],
    thinkingPrompt:
      'Em hãy viết ra giấy toàn bộ đường đi TRƯỚC KHI gõ dòng nào: đi mấy ô, quay ở đâu, nhặt ngọc ở bước thứ mấy, hô thần chú lúc nào. Có kế hoạch rồi mới gõ thì sẽ nhanh hơn nhiều so với gõ tới đâu sửa tới đó.',
    whyThisMatters:
      'Đây là lần đầu em ghép tất cả lại: chia nhỏ mục tiêu, chọn đúng thứ tự, đi vòng qua vật cản, và dùng lời nói để tác động lên thế giới. Đó chính là quy trình em sẽ dùng suốt cả khoá học.',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Kế hoạch của em:
    // 1. Đi vòng xuống hàng dưới để tránh bụi gai
    // 2. Đi tới ô có ngọc và nhặt lên
    // 3. Tới trước cổng, hô câu thần chú rồi mở cổng
    // 4. Đi qua cổng

    return 0;
}`,
    requiredPatterns: [
      'call:turnRight',
      'call:turnLeft',
      'call:collectGem',
      'stmt:cout',
      'call:openDoor',
    ],
    testCases: [
      {
        id: 'l1-c9-t1',
        name: 'Byte hô đúng câu thần chú mở cổng',
        kind: 'output',
        expectedOutput: 'MO CONG',
        required: true,
        visible: true,
      },
      {
        id: 'l1-c9-t2',
        name: 'Nhặt được ngọc và đi qua được cổng làng',
        kind: 'world',
        expectedWorld: { col: 4, row: 1, collectedGems: 1 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_MISSING',
        message:
          'Em kiểm tra lại xem đã đủ bốn việc chưa: đi vòng qua bụi gai, nhặt ngọc, hô thần chú, mở cổng.',
        hintLevel: 1,
      },
      {
        errorCode: 'OUTPUT_MISMATCH',
        message: 'Câu thần chú phải đúng `MO CONG` — viết hoa, không dấu, một khoảng trắng ở giữa.',
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em chia nhiệm vụ này thành mấy chặng? Mỗi chặng kết thúc khi Byte đứng ở ô nào? Viết ra giấy trước khi gõ nhé.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Bốn chặng: (1) quay xuống, đi một ô, quay lại sang phải; (2) đi tới ô ngọc rồi nhặt; (3) hô thần chú và mở cổng; (4) bước qua cổng.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung chặng đầu và chặng cuối:\n```cpp\nturnRight();\nmoveForward();\nturnLeft();\n// ... đi tới ô ngọc rồi collectGem();\ncout << "MO CONG" << endl;\nopenDoor();\nmoveForward();\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    parStatements: 10,
    xpReward: 40,
    world: {
      kind: 'map',
      cols: 5,
      rows: 2,
      startCol: 0,
      startRow: 0,
      startFacing: 'east',
      goalCol: 4,
      goalRow: 1,
      terrain: ['..#..', '.....'],
      props: [
        { id: 'ngoc-boss', type: 'gem', col: 3, row: 1 },
        { id: 'cong-lang', type: 'door', col: 4, row: 1 },
      ],
      initialState: { energy: 20 },
    },
    solution: `#include <iostream>
using namespace std;

int main() {
    turnRight();
    moveForward();
    turnLeft();

    moveForward();
    moveForward();
    moveForward();
    collectGem();

    cout << "MO CONG" << endl;
    openDoor();
    moveForward();

    return 0;
}`,
  },
];

const exitTicket: ExitTicket = {
  lessonId: 'l1',
  questions: [
    {
      id: 'l1-q1',
      type: 'knowledge',
      prompt: 'Lệnh `turnRight()` làm gì với nhân vật?',
      options: [
        'Chỉ đổi hướng nhìn, nhân vật vẫn đứng nguyên ô cũ',
        'Vừa quay vừa tiến lên một ô',
        'Đưa nhân vật quay lại ô xuất phát',
        'Quay nhân vật và tự động đi tới đích',
      ],
      correctIndex: 0,
      explanation:
        'Quay và đi là hai việc tách rời. Nhờ tách rời mà em kiểm soát được chính xác nhân vật dừng ở ô nào.',
    },
    {
      id: 'l1-q2',
      type: 'read-code',
      prompt:
        'Byte đang ở ô số 0 và quay mặt sang phải. Sau khi chạy đoạn code này, Byte đứng ở đâu?',
      code: `moveForward();
turnRight();
moveForward();`,
      options: [
        'Cột 1, hàng 1',
        'Cột 2, hàng 0',
        'Cột 0, hàng 1',
        'Cột 1, hàng 0',
      ],
      correctIndex: 0,
      explanation:
        'Bước 1 đưa Byte sang cột 1. Bước 2 chỉ quay mặt xuống dưới, không di chuyển. Bước 3 đưa Byte xuống hàng 1. Vậy Byte ở cột 1, hàng 1.',
    },
    {
      id: 'l1-q3',
      type: 'self-assess',
      prompt: 'Khi gặp một bản đồ mới, em thường làm gì trước tiên?',
      options: [
        'Nhìn bản đồ và vẽ đường đi ra giấy trước khi gõ',
        'Gõ vài lệnh rồi chạy thử xem sao',
        'Bấm gợi ý ngay từ đầu',
        'Em chưa có cách nào cố định',
      ],
      explanation:
        'Không có đáp án đúng hay sai ở đây. Nhưng bạn nào tập được thói quen nhìn và lập kế hoạch trước thì càng về sau càng đỡ vất vả.',
    },
  ],
  reflectionPrompt:
    'Trong khu vực này, lần nào em thấy khó nhất? Lúc đó em đã làm gì để gỡ ra — đọc lại code, vẽ ra giấy, hay thử chạy rồi quan sát?',
};

const meta = LESSONS_META.find((item) => item.id === 'l1')!;

export const lesson1: Lesson = {
  ...meta,
  conceptGuide: lesson1Guide,
  challenges,
  exitTicket,
};
