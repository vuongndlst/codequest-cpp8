import type { Challenge, ExitTicket, Lesson } from '@/types/content';
import { LESSONS_META } from '@/data/lessons.meta';
import { lesson4Guide } from './guide';
import { CLEAN_CODE_WITH_FUNCTIONS, STANDARD_CLEAN_CODE } from '../shared';

/**
 * KHU VỰC 4 — CỔNG QUYẾT ĐỊNH
 * Biểu thức điều kiện · toán tử so sánh · câu lệnh if · phân biệt = và ==
 *
 * Trọng tâm sư phạm của khu vực này là lỗi kinh điển `=` với `==`. Bộ chẩn đoán
 * chặn lỗi đó ngay từ bước preScan, kể cả khi C++ coi nó là code hợp lệ.
 */

const challenges: Challenge[] = [
  // ─────────────────────────────────────────────────────────── 1. Quan sát
  {
    id: 'l4-c1-observe',
    lessonId: 'l4',
    kind: 'story',
    title: 'Cánh cổng biết kén chọn',
    story:
      'Cổng Quyết Định chỉ mở cho ai đủ điều kiện. Byte đưa em bản mã của cổng: "Trong đây có hai câu hỏi. Em đoán thử xem cổng sẽ trả lời mấy câu nhé — không phải câu nào cũng được trả lời đâu."',
    instructions: [
      'Đọc kỹ hai khối bắt đầu bằng chữ if',
      'Mỗi khối chỉ chạy khi điều kiện trong ngoặc ĐÚNG',
      'Đoán xem chương trình in ra mấy dòng, rồi bấm "Chạy code"',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int energy = 8;
    int shield = 2;

    if (energy > 5) {
        cout << "Du nang luong de vuot cong" << endl;
    }

    if (shield > 5) {
        cout << "Du khien chan de vuot cong" << endl;
    }

    return 0;
}`,
    expectedOutput: 'Du nang luong de vuot cong',
    requiredPatterns: ['stmt:if'],
    testCases: [
      {
        id: 'l4-c1-t1',
        name: 'Cổng chỉ trả lời câu có điều kiện đúng',
        kind: 'output',
        expectedOutput: 'Du nang luong de vuot cong',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Biến `energy` bằng 8, `shield` bằng 2. Em thử thay số vào từng điều kiện: `8 > 5` đúng hay sai? `2 > 5` đúng hay sai?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Khối `if` chỉ chạy khi điều kiện đúng. Nếu điều kiện sai, máy tính bỏ qua toàn bộ phần trong ngoặc nhọn và đi tiếp — không báo lỗi gì cả.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Bài này em chỉ cần bấm "Chạy code" thôi, không phải sửa gì. Chú ý xem có mấy dòng hiện ra nhé!',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 10,
  },

  // ─────────────────────────────────────────── 2. Khám phá lệnh: câu lệnh if
  {
    id: 'l4-c2-concept',
    lessonId: 'l4',
    kind: 'concept',
    title: 'Khám phá: hỏi trước khi làm',
    story:
      'Byte khắc lên cổng sáu ký hiệu: == != < > <= >=. "Đây là sáu cách hỏi. Kết quả chỉ có thể là đúng hoặc sai. Giờ em viết câu hỏi đầu tiên của mình đi."',
    instructions: [
      'Cú pháp:  if (điều kiện) { ... }',
      'Toán tử so sánh:  ==  !=  <  >  <=  >=',
      'CỰC KỲ QUAN TRỌNG: một dấu = là GÁN, hai dấu == mới là SO SÁNH',
      'Nhiệm vụ: biến gemCount đã có sẵn giá trị 12',
      '   Viết if kiểm tra gemCount lớn hơn 10 thì in ra  Du ngoc de mo cong',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int gemCount = 12;

    // Viết câu lệnh if của em ở đây

    return 0;
}`,
    expectedOutput: 'Du ngoc de mo cong',
    requiredPatterns: ['stmt:if'],
    testCases: [
      {
        id: 'l4-c2-t1',
        name: 'Cổng mở khi đủ ngọc',
        kind: 'output',
        expectedOutput: 'Du ngoc de mo cong',
        required: true,
        visible: true,
      },
      {
        id: 'l4-c2-t2',
        name: 'Có dùng câu lệnh if',
        kind: 'structure',
        patterns: ['stmt:if'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'ASSIGN_IN_CONDITION',
        message:
          'Đây là lỗi ai cũng mắc ít nhất một lần! Trong điều kiện của `if`, em cần `==` để SO SÁNH, chứ một dấu `=` là GÁN giá trị.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Câu hỏi cần đặt ra là gì? "gemCount có lớn hơn 10 không?" — vậy em dùng ký hiệu so sánh nào trong sáu ký hiệu đã học?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Cấu trúc là: `if (` rồi điều kiện, rồi `) {` xuống dòng, câu lệnh cần chạy, rồi `}`. Điều kiện đặt trong ngoặc tròn, thân lệnh đặt trong ngoặc nhọn.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nif (gemCount ___ 10) {\n    cout << "___" << endl;\n}\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

int main() {
    int gemCount = 12;

    if (gemCount > 10) {
        cout << "Du ngoc de mo cong" << endl;
    }

    return 0;
}`,
  },

  // ──────────────────────────────────────────────────────── 3. Thử ngay
  {
    id: 'l4-c3-sandbox',
    lessonId: 'l4',
    kind: 'sandbox',
    title: 'Thử ngay: đổi ngưỡng kiểm tra',
    story:
      'Cổng vừa được nâng cấp: giờ nó đòi năng lượng phải ĐẠT ĐÚNG 50 trở lên, chứ không phải hơn 50. "Chỉ khác một ký tự thôi," Byte nhắc, "nhưng khác biệt rất lớn."',
    instructions: [
      'Biến energy đang bằng đúng 50',
      'Điều kiện hiện tại là energy > 50 nên cổng không mở',
      'Sửa để cổng mở khi năng lượng từ 50 TRỞ LÊN',
      'Chỉ cần đổi một ký hiệu so sánh',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int energy = 50;

    if (energy > 50) {
        cout << "Cong da mo" << endl;
    }

    return 0;
}`,
    expectedOutput: 'Cong da mo',
    requiredPatterns: ['stmt:if'],
    testCases: [
      {
        id: 'l4-c3-t1',
        name: 'Cổng mở khi năng lượng đúng bằng 50',
        kind: 'output',
        expectedOutput: 'Cong da mo',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          '"Lớn hơn 50" và "từ 50 trở lên" khác nhau ở chỗ nào? Với energy đúng bằng 50, cái nào cho kết quả đúng?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ký hiệu `>` nghĩa là lớn hơn hẳn, không tính bằng. Ký hiệu `>=` nghĩa là lớn hơn HOẶC bằng. Em cần cái thứ hai.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Em chỉ cần đổi một ký hiệu:\n```cpp\nif (energy ___ 50) {\n```\nĐổi `>` thành `>=` là xong.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

int main() {
    int energy = 50;

    if (energy >= 50) {
        cout << "Cong da mo" << endl;
    }

    return 0;
}`,
  },

  // ──────────────────────────────────── 4. Nhiệm vụ: hai điều kiện độc lập
  {
    id: 'l4-c4-mission',
    lessonId: 'l4',
    kind: 'mission',
    title: 'Bảng kiểm tra trước cổng',
    story:
      'Người gác cổng đưa em một bảng kiểm tra ba mục. "Mỗi mục là một câu hỏi riêng," ông nói. "Mục nào đạt thì ghi vào, mục nào không đạt thì bỏ trống — đừng cố ghi bừa."',
    instructions: [
      'Ba biến đã có sẵn: energy = 70, gemCount = 4, level = 3',
      'Viết ba câu lệnh if riêng biệt:',
      '   · Nếu energy lớn hơn hoặc bằng 50  →  in  Nang luong: dat',
      '   · Nếu gemCount lớn hơn hoặc bằng 10 →  in  Ngoc: dat',
      '   · Nếu level bằng 3                  →  in  Cap do: dat',
      'Chú ý: chỉ hai trong ba mục sẽ được in ra',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int energy = 70;
    int gemCount = 4;
    int level = 3;

    // Viết ba câu lệnh if ở đây

    return 0;
}`,
    expectedOutput: 'Nang luong: dat\nCap do: dat',
    requiredPatterns: ['stmt:if', 'op:>=', 'op:=='],
    testCases: [
      {
        id: 'l4-c4-t1',
        name: 'Chỉ hai mục đạt được ghi vào bảng',
        kind: 'output',
        expectedOutput: 'Nang luong: dat\nCap do: dat',
        required: true,
        visible: true,
      },
      {
        id: 'l4-c4-t2',
        name: 'Dùng toán tử == để kiểm tra cấp độ',
        kind: 'structure',
        patterns: ['op:=='],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'ASSIGN_IN_CONDITION',
        message:
          'Ở mục kiểm tra cấp độ, em cần `level == 3` (hai dấu bằng) để SO SÁNH. Viết `level = 3` là đang GÁN lại giá trị cho biến đấy!',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Ba mục là ba câu hỏi độc lập, nên cần mấy khối `if`? Và với mục "level bằng 3", em dùng ký hiệu nào — một dấu bằng hay hai dấu bằng?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ba khối `if` viết nối tiếp nhau, mỗi khối một điều kiện riêng. Nhớ: `>=` cho "từ … trở lên", `==` cho "bằng đúng".',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung của một khối, hai khối còn lại viết tương tự:\n```cpp\nif (energy >= 50) {\n    cout << "Nang luong: dat" << endl;\n}\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

int main() {
    int energy = 70;
    int gemCount = 4;
    int level = 3;

    if (energy >= 50) {
        cout << "Nang luong: dat" << endl;
    }

    if (gemCount >= 10) {
        cout << "Ngoc: dat" << endl;
    }

    if (level == 3) {
        cout << "Cap do: dat" << endl;
    }

    return 0;
}`,
  },

  // ────────────────────────────────── 5. Nhiệm vụ: kiểm tra trước khi hành động
  {
    id: 'l4-c5-mission',
    lessonId: 'l4',
    kind: 'mission',
    title: 'Có chìa mới mở cửa',
    story:
      'Phía trước có một cánh cửa khoá. Lao vào mà không kiểm tra thì em sẽ bị đẩy ngược lại. "Hỏi trước, làm sau," Byte nhắc. "Đây là bài học quan trọng nhất của Cổng Quyết Định."',
    instructions: [
      'Lệnh hasKey() trả về true nếu nhân vật đang giữ chìa khoá',
      'Viết if: nếu hasKey() đúng thì gọi openDoor()',
      'Sau khối if, gọi moveForward() hai lần để đi qua cửa và tới lá cờ',
      'Lệnh openDoor() mở cánh cửa ngay phía trước nhân vật',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Kiểm tra chìa khoá rồi mới mở cửa

    // Sau đó đi hai ô để tới lá cờ

    return 0;
}`,
    requiredPatterns: ['stmt:if', 'stmt:if>call:openDoor'],
    world: {
      cols: 3,
      startCol: 0,
      goalCol: 2,
      props: [{ id: 'door-1', type: 'door', col: 1 }],
      initialState: { hasKey: true, energy: 10 },
    },
    testCases: [
      {
        id: 'l4-c5-t1',
        name: 'Cửa được mở và nhân vật tới lá cờ',
        kind: 'world',
        expectedWorld: { col: 2, openedDoors: ['door-1'] },
        required: true,
        visible: true,
      },
      {
        id: 'l4-c5-t2',
        name: 'Lệnh openDoor nằm bên trong câu lệnh if',
        kind: 'structure',
        patterns: ['stmt:if>call:openDoor'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_MISSING',
        message:
          'Nhiệm vụ này cần em KIỂM TRA trước khi mở cửa. Hãy đặt lời gọi `openDoor();` vào bên trong khối `if (hasKey())`.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Trước khi mở cửa, em cần biết điều gì? Có lệnh nào cho em biết nhân vật đang giữ chìa khoá hay không?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Lệnh `hasKey()` tự nó đã cho ra kết quả đúng hoặc sai, nên em đặt thẳng vào ngoặc của if: `if (hasKey()) { ... }`. Bên trong khối đó mới gọi `openDoor();`',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nif (hasKey()) {\n    ___();\n}\n\nmoveForward();\nmoveForward();\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

int main() {
    if (hasKey()) {
        openDoor();
    }

    moveForward();
    moveForward();

    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 6. Debug Challenge 1
  {
    id: 'l4-c6-debug',
    lessonId: 'l4',
    kind: 'debug',
    title: 'Một dấu bằng hay hai?',
    story:
      'Cổng luôn mở toang bất kể ai đi qua — kể cả Bug. Byte nheo mắt nhìn màn hình: "Đây rồi. Lỗi này C++ không hề báo, vì về mặt cú pháp nó vẫn hợp lệ. Nhưng ý nghĩa thì sai hoàn toàn."',
    instructions: [
      'Chương trình đáng lẽ KHÔNG in gì cả, vì rank đang bằng 1 chứ không phải 5',
      'Nhưng nó lại in ra dòng chữ — nghĩa là điều kiện đang bị hiểu sai',
      'Tìm và sửa lỗi so sánh',
      'Sau khi sửa, chương trình phải in ra đúng dòng  Kiem tra xong',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int rank = 1;

    if (rank = 5) {
        cout << "Ban la Guardian cap cao" << endl;
    }

    cout << "Kiem tra xong" << endl;

    return 0;
}`,
    expectedOutput: 'Kiem tra xong',
    requiredPatterns: ['stmt:if', 'op:=='],
    testCases: [
      {
        id: 'l4-c6-t1',
        name: 'Cổng không mở nhầm cho người sai cấp',
        kind: 'output',
        expectedOutput: 'Kiem tra xong',
        required: true,
        visible: true,
      },
      {
        id: 'l4-c6-t2',
        name: 'Dùng == để so sánh, không dùng =',
        kind: 'structure',
        patterns: ['op:=='],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'ASSIGN_IN_CONDITION',
        message:
          'Chính xác chỗ đó! `rank = 5` là GÁN giá trị 5 cho rank, và phép gán luôn cho kết quả "đúng" nên khối if luôn chạy. Em cần `rank == 5` để SO SÁNH.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Đọc điều kiện trong ngoặc thành lời: nó đang nói "rank BẰNG 5 phải không?" hay đang nói "đặt rank THÀNH 5"?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Nhớ quy tắc: một dấu `=` là GÁN (đặt giá trị vào biến), hai dấu `==` là SO SÁNH (hỏi có bằng nhau không). Trong điều kiện của if, hầu như luôn dùng `==`.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Em chỉ cần thêm một dấu bằng:\n```cpp\nif (rank ___ 5) {\n```\nChỗ trống điền `==`.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

int main() {
    int rank = 1;

    if (rank == 5) {
        cout << "Ban la Guardian cap cao" << endl;
    }

    cout << "Kiem tra xong" << endl;

    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 7. Debug Challenge 2
  {
    id: 'l4-c7-debug',
    lessonId: 'l4',
    kind: 'debug',
    title: 'Cái bẫy dấu chấm phẩy',
    story:
      'Con Bug này gian lắm: nó thêm vào một dấu chấm phẩy ở chỗ tưởng như vô hại. Kết quả là khối if trở nên vô nghĩa — nó luôn chạy, bất kể điều kiện đúng hay sai.',
    instructions: [
      'Chương trình có hai lỗi',
      'Lỗi 1: có một dấu ; bị đặt sai chỗ, làm khối if mất tác dụng',
      'Lỗi 2: một biến bị viết sai tên',
      'Biến health đang bằng 20, nên chương trình KHÔNG được in dòng cảnh báo',
      'Kết quả đúng chỉ có một dòng:  Trang thai on dinh',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int health = 20;

    if (helth < 10);
    {
        cout << "Canh bao: mau thap" << endl;
    }

    cout << "Trang thai on dinh" << endl;

    return 0;
}`,
    expectedOutput: 'Trang thai on dinh',
    requiredPatterns: ['stmt:if'],
    testCases: [
      {
        id: 'l4-c7-t1',
        name: 'Không cảnh báo nhầm khi máu vẫn cao',
        kind: 'output',
        expectedOutput: 'Trang thai on dinh',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'VAR_TYPO',
        message:
          'Em khai báo biến `health` nhưng trong điều kiện lại viết `helth` — thiếu mất chữ a. Tên biến phải giống nhau hoàn toàn.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Nhìn kỹ ký tự ngay sau dấu `)` đóng điều kiện của if. Có gì ở đó không? Và tên biến trong điều kiện có giống tên lúc khai báo không?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Sau `if (điều kiện)` phải là ngoặc nhọn `{` ngay lập tức, TUYỆT ĐỐI không có dấu `;` xen vào. Nếu có dấu `;` thì C++ hiểu là "thân if rỗng", và khối `{ }` phía dưới trở thành một khối độc lập luôn chạy.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Hai chỗ cần sửa:\n```cpp\nif (___ < 10)      // tên biến viết sai, và bỏ dấu ; ở cuối dòng này\n{\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

int main() {
    int health = 20;

    if (health < 10) {
        cout << "Canh bao: mau thap" << endl;
    }

    cout << "Trang thai on dinh" << endl;

    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 8. Clean Code Check
  {
    id: 'l4-c8-cleancode',
    lessonId: 'l4',
    kind: 'cleancode',
    title: 'Điều kiện khó đọc',
    story:
      'Chương trình này chạy đúng, nhưng nhìn vào chẳng ai hiểu nó kiểm tra cái gì. "Tên biến là lời giải thích rẻ nhất mà em có," Byte nói. "Đừng tiết kiệm chữ ở chỗ đó."',
    instructions: [
      'Code chạy đúng rồi — kết quả in ra phải giữ nguyên',
      'Việc của em là làm nó dễ đọc hơn:',
      '   · Đổi tên biến  a  thành  playerEnergy',
      '   · Đổi tên biến  b  thành  requiredEnergy',
      '   · Thụt lề phần code bên trong { } vào một cấp',
      '   · Thêm khoảng trắng hai bên các dấu = và >=',
      'Nhớ đổi tên biến ở TẤT CẢ các chỗ xuất hiện',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
int a=80;
int b=60;
if(a>=b){
cout << "Du dieu kien vuot cong" << endl;
}
return 0;
}`,
    expectedOutput: 'Du dieu kien vuot cong',
    requiredPatterns: ['stmt:if'],
    testCases: [
      {
        id: 'l4-c8-t1',
        name: 'Kết quả in ra vẫn đúng như cũ',
        kind: 'output',
        expectedOutput: 'Du dieu kien vuot cong',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Biến `a` chứa cái gì, biến `b` chứa cái gì? Nếu ba tháng nữa em mở lại file này, em có đoán ra không?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ba việc cần làm: đổi tên biến ở mọi chỗ xuất hiện, thụt vào 4 dấu cách cho phần bên trong ngoặc nhọn, và thêm khoảng trắng quanh các dấu phép tính.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code sạch:\n```cpp\nint main() {\n    int playerEnergy = 80;\n    int requiredEnergy = 60;\n\n    if (playerEnergy >= requiredEnergy) {\n        cout << "Du dieu kien vuot cong" << endl;\n    }\n\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: [
      { rule: 'indent', weight: 30 },
      { rule: 'meaningful-var', weight: 35 },
      { rule: 'spacing', weight: 25 },
      { rule: 'one-statement-per-line', weight: 10 },
    ],
    minCleanCodeScore: 85,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

int main() {
    int playerEnergy = 80;
    int requiredEnergy = 60;

    if (playerEnergy >= requiredEnergy) {
        cout << "Du dieu kien vuot cong" << endl;
    }

    return 0;
}`,
  },

  // ─────────────────────────────────────────────────────── 9. Boss Challenge
  {
    id: 'l4-c9-boss',
    lessonId: 'l4',
    kind: 'boss',
    title: 'BOSS — Cánh cổng cuối cùng',
    story:
      'Bug Gác Cổng chặn đường với một câu đố: cánh cửa chỉ mở cho ai có chìa khoá, và chỉ đi tiếp được khi còn năng lượng. Em phải kiểm tra cả hai trước khi hành động — sai một bước là bị đẩy về vạch xuất phát.',
    instructions: [
      'Sửa các lỗi có sẵn trong code',
      'Viết hàm tryOpenDoor() chứa một câu lệnh if:',
      '   nếu hasKey() bằng true thì gọi openDoor()',
      'Trong main, theo đúng thứ tự:',
      '   1. moveForward() một lần',
      '   2. gọi tryOpenDoor()',
      '   3. viết if: nếu getEnergy() lớn hơn 0 thì moveForward() hai lần',
      'Lệnh getEnergy() cho biết năng lượng còn lại',
    ],
    starterCode: `#include <iostream>
using namespace std;

void tryOpenDoor() {
    if (hasKey() = true) {
        openDoor();
    }
}

int main() {
    moveForward();
    tryOpenDoor()

    // Viết câu lệnh if kiểm tra năng lượng ở đây

    return 0;
}`,
    requiredPatterns: [
      'decl:func:tryOpenDoor',
      'decl:func:tryOpenDoor>call:openDoor',
      'op:==',
      'call:getEnergy',
    ],
    world: {
      cols: 4,
      startCol: 0,
      goalCol: 3,
      props: [{ id: 'door-2', type: 'door', col: 2 }],
      initialState: { hasKey: true, energy: 5 },
    },
    testCases: [
      {
        id: 'l4-c9-t1',
        name: 'Mở được cửa và tới lá cờ',
        kind: 'world',
        expectedWorld: { col: 3, openedDoors: ['door-2'] },
        required: true,
        visible: true,
      },
      {
        id: 'l4-c9-t2',
        name: 'Lệnh openDoor nằm trong if kiểm tra chìa khoá',
        kind: 'structure',
        patterns: ['stmt:if>call:openDoor'],
        required: true,
        visible: true,
      },
      {
        id: 'l4-c9-t3',
        name: 'Có kiểm tra năng lượng trước khi đi tiếp',
        kind: 'structure',
        patterns: ['call:getEnergy'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'ASSIGN_IN_CONDITION',
        message:
          'Bug Gác Cổng đã xoá mất một dấu bằng! Trong `if (hasKey() = true)` em cần `==` để so sánh, không phải `=`.',
        hintLevel: 1,
      },
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Dòng gọi `tryOpenDoor()` còn thiếu dấu `;` ở cuối. Lời gọi hàm cũng là một câu lệnh mà.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Có hai lỗi cần sửa và một khối if cần viết thêm. Em bấm Chạy, đọc thông báo, sửa đúng một lỗi rồi lại bấm Chạy — cứ thế cho tới hết.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ba việc:\n1. Trong `tryOpenDoor`, đổi `=` thành `==`\n2. Thêm dấu `;` sau lời gọi `tryOpenDoor()`\n3. Viết khối `if (getEnergy() > 0) { ... }` chứa hai lời gọi `moveForward();`',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Phần cần viết thêm trong main:\n```cpp\nif (getEnergy() > 0) {\n    moveForward();\n    moveForward();\n}\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    thinkingPrompt:
      'Trước mỗi hành động, em tự hỏi: hành động này có luôn an toàn không? Nếu không, điều gì cần được kiểm tra trước? Và câu kiểm tra đó em đang HỎI hay đang GÁN?',
    whyThisMatters:
      'Kiểm tra trước khi hành động là thói quen giúp em tránh loại lỗi khó tìm nhất: chương trình chạy xong, không báo lỗi gì, nhưng kết quả lại sai.',
    xpReward: 80,
    solution: `#include <iostream>
using namespace std;

void tryOpenDoor() {
    if (hasKey() == true) {
        openDoor();
    }
}

int main() {
    moveForward();
    tryOpenDoor();

    if (getEnergy() > 0) {
        moveForward();
        moveForward();
    }

    return 0;
}`,
  },
];

const exitTicket: ExitTicket = {
  lessonId: 'l4',
  questions: [
    {
      id: 'l4-q1',
      type: 'knowledge',
      prompt: 'Đâu là khác biệt giữa dấu = và dấu == trong C++?',
      options: [
        'Một dấu = là gán giá trị, hai dấu == là so sánh',
        'Hai ký hiệu này giống hệt nhau, dùng cái nào cũng được',
        'Một dấu = dùng cho số, hai dấu == dùng cho chữ',
        'Hai dấu == chỉ dùng được bên trong vòng lặp for',
      ],
      correctIndex: 0,
      explanation:
        'Dấu = đặt giá trị vào biến. Dấu == đặt ra câu hỏi "hai bên có bằng nhau không?" và cho ra đúng hoặc sai.',
    },
    {
      id: 'l4-q2',
      type: 'read-code',
      prompt: 'Đoạn code dưới đây in ra gì?',
      code: `int score = 40;

if (score >= 50) {
    cout << "Dat";
}

cout << "Xong";`,
      options: ['Xong', 'DatXong', 'Dat', 'Không in gì cả'],
      correctIndex: 0,
      explanation:
        'score bằng 40 nên điều kiện `40 >= 50` sai, khối if bị bỏ qua. Dòng `cout << "Xong"` nằm NGOÀI khối if nên vẫn chạy bình thường.',
    },
    {
      id: 'l4-q3',
      type: 'self-assess',
      prompt: 'Sau khu vực này, em thấy mình dùng câu lệnh if ở mức nào?',
      options: [
        'Em tự viết if và chọn đúng toán tử so sánh, không nhầm = với ==',
        'Em viết được nhưng thỉnh thoảng vẫn nhầm = với ==',
        'Em làm được khi có gợi ý dẫn đường',
        'Em còn thấy khó, muốn được thầy giảng lại',
      ],
    },
  ],
  reflectionPrompt:
    'Vì sao lỗi viết `=` thay vì `==` lại nguy hiểm hơn lỗi thiếu dấu chấm phẩy? Em thử giải thích bằng lời của mình.',
};

const meta = LESSONS_META.find((item) => item.id === 'l4')!;

export const lesson4: Lesson = {
  ...meta,
  conceptGuide: lesson4Guide,
  challenges,
  exitTicket,
};
