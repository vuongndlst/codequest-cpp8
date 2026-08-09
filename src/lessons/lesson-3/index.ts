import type { Challenge, ExitTicket, Lesson } from '@/types/content';
import { LESSONS_META } from '@/data/lessons.meta';
import { lesson3Guide } from './guide';
import { CLEAN_CODE_WITH_FUNCTIONS, STANDARD_CLEAN_CODE } from '../shared';

/**
 * KHU VỰC 3 — THUNG LŨNG LẶP
 * Mục đích vòng lặp · cấu trúc for · biến đếm · điều kiện dừng · gọi hàm trong vòng lặp
 *
 * Đây là khu vực đầu tiên dùng SÂN KHẤU GAME: chương trình của học sinh sinh ra
 * chuỗi sự kiện, giao diện phát lại thành animation nhân vật đi trên con đường.
 */

const challenges: Challenge[] = [
  // ─────────────────────────────────────────────────────────── 1. Quan sát
  {
    id: 'l3-c1-observe',
    lessonId: 'l3',
    kind: 'story',
    title: 'Ba lần gõ cửa',
    story:
      'Trước cửa Thung Lũng Lặp có một cánh cổng đá. Byte chỉ vào tấm bảng hướng dẫn: "Nhìn đoạn code này — nó chỉ có một dòng cout, nhưng em thử đoán xem màn hình sẽ hiện ra mấy dòng nhé."',
    instructions: [
      'Đọc kỹ dòng bắt đầu bằng chữ for',
      'Ba phần trong ngoặc là: khởi tạo — điều kiện — cập nhật',
      'Đoán xem chương trình in ra bao nhiêu dòng, rồi bấm "Chạy code" để kiểm tra',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    for (int i = 0; i < 3; i++) {
        cout << "Go cua lan " << i << endl;
    }
    return 0;
}`,
    expectedOutput: 'Go cua lan 0\nGo cua lan 1\nGo cua lan 2',
    requiredPatterns: ['stmt:for'],
    testCases: [
      {
        id: 'l3-c1-t1',
        name: 'Cổng đá được gõ đủ ba lần',
        kind: 'output',
        expectedOutput: 'Go cua lan 0\nGo cua lan 1\nGo cua lan 2',
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
          'Biến `i` bắt đầu từ giá trị nào? Vòng lặp còn chạy tiếp khi `i` bằng mấy? Và nó dừng lại khi `i` bằng mấy?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Với `for (int i = 0; i < 3; i++)`: i lần lượt nhận giá trị 0, 1, 2. Tới khi i bằng 3 thì điều kiện `i < 3` sai, vòng lặp dừng. Vậy thân vòng lặp chạy 3 lần.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Bài này em chỉ cần bấm "Chạy code" thôi, không phải sửa gì. Chú ý con số ở cuối mỗi dòng in ra nhé!',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 10,
  },

  // ──────────────────────────────────────────── 2. Khám phá lệnh: cấu trúc for
  {
    id: 'l3-c2-concept',
    lessonId: 'l3',
    kind: 'concept',
    title: 'Khám phá: ba phần của vòng for',
    story:
      'Byte vẽ lên cát ba ô trống. "Vòng lặp for cần đúng ba thông tin: bắt đầu từ đâu, chạy tới khi nào, và mỗi lần nhảy bao nhiêu. Em điền thử vào xem."',
    instructions: [
      'Cú pháp:  for (khởi tạo; điều kiện; cập nhật) { ... }',
      '   · Khởi tạo:  int i = 0    — biến đếm bắt đầu từ 0',
      '   · Điều kiện: i < 5        — còn đúng thì còn lặp',
      '   · Cập nhật:  i++          — mỗi vòng tăng i thêm 1',
      'Nhiệm vụ: viết vòng for in ra 5 dòng, mỗi dòng là  Buoc thu i',
      'Kết quả mong đợi: Buoc thu 0 … cho tới … Buoc thu 4',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Viết vòng lặp for của em ở đây

    return 0;
}`,
    expectedOutput: 'Buoc thu 0\nBuoc thu 1\nBuoc thu 2\nBuoc thu 3\nBuoc thu 4',
    requiredPatterns: ['stmt:for', 'stmt:for>stmt:cout'],
    testCases: [
      {
        id: 'l3-c2-t1',
        name: 'In đủ 5 bước, đánh số từ 0',
        kind: 'output',
        expectedOutput: 'Buoc thu 0\nBuoc thu 1\nBuoc thu 2\nBuoc thu 3\nBuoc thu 4',
        required: true,
        visible: true,
      },
      {
        id: 'l3-c2-t2',
        name: 'Có dùng vòng lặp for',
        kind: 'structure',
        patterns: ['stmt:for'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FOR_MISSING_UPDATE',
        message:
          'Vòng lặp của em thiếu phần tăng biến đếm nên chạy mãi không dừng. Phần thứ ba trong ngoặc phải là `i++`.',
        hintLevel: 2,
      },
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Ba phần bên trong ngoặc của `for` được ngăn cách bằng dấu `;` chứ không phải dấu phẩy. Em kiểm tra lại nhé.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em cần in ra 5 dòng. Nếu biến đếm bắt đầu từ 0, thì nó phải chạy tới số nào là dừng? Và điều kiện nên viết thế nào?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Công thức lặp N lần: `for (int i = 0; i < N; i++)`. Ở đây N bằng 5. Bên trong thân vòng lặp, em in ra chữ kèm giá trị của `i`.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nfor (int i = 0; i < ___; i++) {\n    cout << "Buoc thu " << ___ << endl;\n}\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

int main() {
    for (int i = 0; i < 5; i++) {
        cout << "Buoc thu " << i << endl;
    }
    return 0;
}`,
  },

  // ──────────────────────────────────────────────────────── 3. Thử ngay
  {
    id: 'l3-c3-sandbox',
    lessonId: 'l3',
    kind: 'sandbox',
    title: 'Thử ngay: đổi số lần lặp',
    story:
      'Cây cầu dây qua vực có 7 nhịp, không phải 3. "Cái hay của vòng lặp là em chỉ cần sửa đúng một con số," Byte nói, "chứ không phải chép thêm bốn dòng."',
    instructions: [
      'Code hiện tại in ra 3 dòng, nhưng cây cầu có 7 nhịp',
      'Chỉ sửa MỘT con số trong dòng for để nó lặp 7 lần',
      'Kết quả: Nhip cau 1 … cho tới … Nhip cau 7',
      'Chú ý: biến đếm ở đây bắt đầu từ 1, không phải từ 0',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 3; i++) {
        cout << "Nhip cau " << i << endl;
    }
    return 0;
}`,
    expectedOutput:
      'Nhip cau 1\nNhip cau 2\nNhip cau 3\nNhip cau 4\nNhip cau 5\nNhip cau 6\nNhip cau 7',
    requiredPatterns: ['stmt:for'],
    testCases: [
      {
        id: 'l3-c3-t1',
        name: 'Cây cầu có đủ 7 nhịp',
        kind: 'output',
        expectedOutput:
          'Nhip cau 1\nNhip cau 2\nNhip cau 3\nNhip cau 4\nNhip cau 5\nNhip cau 6\nNhip cau 7',
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
          'Trong ba phần của vòng for, phần nào quyết định vòng lặp dừng lúc nào? Em cần đổi con số ở phần đó.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ở đây điều kiện dùng dấu `<=` chứ không phải `<`. Với `i` bắt đầu từ 1 và điều kiện `i <= N`, vòng lặp chạy đúng N lần.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Em chỉ cần đổi một con số:\n```cpp\nfor (int i = 1; i <= ___; i++) {\n```\nCầu có 7 nhịp thì chỗ trống điền số 7.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 7; i++) {
        cout << "Nhip cau " << i << endl;
    }
    return 0;
}`,
  },

  // ──────────────────────────────────── 4. Nhiệm vụ: đi hết con đường bằng for
  {
    id: 'l3-c4-mission',
    lessonId: 'l3',
    kind: 'mission',
    title: 'Con đường năm ô',
    story:
      'Trước mặt em là con đường gồm 5 ô giống hệt nhau dẫn tới lá cờ. Em có thể gõ moveForward() năm lần — nhưng Byte lắc đầu: "Nếu con đường có 500 ô thì sao? Dùng vòng lặp đi."',
    instructions: [
      'Nhân vật cần đi đúng 5 ô để tới lá cờ',
      'Dùng vòng lặp for gọi moveForward() 5 lần',
      'KHÔNG được gõ moveForward() nhiều lần bằng tay — nhiệm vụ này luyện vòng lặp',
      'Lệnh moveForward() làm nhân vật tiến lên một ô',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Dùng vòng lặp for để đi 5 ô

    return 0;
}`,
    requiredPatterns: ['stmt:for', 'stmt:for>call:moveForward'],
    forbiddenPatterns: ['call:moveForward:count>=2'],
    world: { cols: 6, startCol: 0, goalCol: 5 },
    testCases: [
      {
        id: 'l3-c4-t1',
        name: 'Nhân vật đi đủ 5 ô và tới lá cờ',
        kind: 'world',
        expectedWorld: { col: 5 },
        required: true,
        visible: true,
      },
      {
        id: 'l3-c4-t2',
        name: 'Lời gọi moveForward nằm bên trong vòng lặp',
        kind: 'structure',
        patterns: ['stmt:for>call:moveForward'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_FORBIDDEN',
        detect: 'call:moveForward:count>=2',
        message:
          'Cách này chạy đúng đó! Nhưng nhiệm vụ này muốn em luyện vòng lặp. Em thử viết MỘT lời gọi `moveForward();` rồi đặt nó vào trong vòng `for` xem sao.',
        hintLevel: 2,
      },
      {
        errorCode: 'FOR_WRONG_COUNT',
        message:
          'Vòng lặp chạy chưa đủ số lần. Con đường có 5 ô, em kiểm tra lại điều kiện `i < ...` nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em cần lặp lại hành động này bao nhiêu lần? Và trong ba phần của vòng for, con số đó đặt ở phần nào?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Hãy thử dùng cấu trúc `for (khởi tạo; điều kiện; cập nhật)`, rồi đặt lời gọi `moveForward();` vào bên trong cặp ngoặc nhọn của vòng lặp.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nfor (int i = 0; i < ___; i++) {\n    // hành động cần lặp\n}\n```\nChỗ trống là số ô cần đi.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

int main() {
    for (int i = 0; i < 5; i++) {
        moveForward();
    }
    return 0;
}`,
  },

  // ───────────────────────────────────── 5. Nhiệm vụ: gọi hàm trong vòng lặp
  {
    id: 'l3-c5-mission',
    lessonId: 'l3',
    kind: 'mission',
    title: 'Vừa đi vừa thắp đèn',
    story:
      'Con đường tối om. Mỗi bước đi, em vừa phải tiến lên vừa phải thắp một ngọn đèn. "Gói hai việc đó vào một hàm," Byte gợi ý, "rồi gọi hàm đó trong vòng lặp."',
    instructions: [
      'Viết hàm stepAndLight() làm hai việc theo thứ tự:',
      '   1. Gọi turnOnLight()',
      '   2. Gọi moveForward()',
      'Dùng vòng lặp for gọi stepAndLight() 4 lần',
      'Kết quả: nhân vật đi được 4 ô và thắp sáng dọc đường',
    ],
    starterCode: `#include <iostream>
using namespace std;

// Viết hàm stepAndLight() ở đây

int main() {
    // Dùng vòng lặp for gọi stepAndLight() 4 lần

    return 0;
}`,
    requiredPatterns: [
      'decl:func:stepAndLight',
      'stmt:for>call:stepAndLight',
      'decl:func:stepAndLight>call:moveForward',
    ],
    world: { cols: 5, startCol: 0, goalCol: 4 },
    testCases: [
      {
        id: 'l3-c5-t1',
        name: 'Nhân vật đi đủ 4 ô',
        kind: 'world',
        expectedWorld: { col: 4 },
        required: true,
        visible: true,
      },
      {
        id: 'l3-c5-t2',
        name: 'Hàm stepAndLight được gọi bên trong vòng lặp',
        kind: 'structure',
        patterns: ['stmt:for>call:stepAndLight'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FUNC_NOT_CALLED',
        message:
          'Em viết hàm `stepAndLight()` rồi nhưng chưa gọi nó trong vòng lặp. Hàm chỉ chạy khi được gọi nhé.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Mỗi bước đi gồm mấy hành động? Nếu gói chúng vào một hàm, thì trong vòng lặp em cần gọi mấy dòng?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Hàm viết ở ngoài main: `void stepAndLight() { ... }` chứa hai lời gọi. Trong main, vòng `for` chỉ cần gọi `stepAndLight();` một dòng duy nhất.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nvoid stepAndLight() {\n    turnOnLight();\n    ___();\n}\n\nint main() {\n    for (int i = 0; i < ___; i++) {\n        stepAndLight();\n    }\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

void stepAndLight() {
    turnOnLight();
    moveForward();
}

int main() {
    for (int i = 0; i < 4; i++) {
        stepAndLight();
    }
    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 6. Debug Challenge 1
  {
    id: 'l3-c6-debug',
    lessonId: 'l3',
    kind: 'debug',
    title: 'Vòng lặp không chịu dừng',
    story:
      'Một Bug đã xoá mất phần cuối trong ngoặc của vòng lặp. Giờ nó chạy mãi không dừng — Byte gọi đây là "vòng lặp vô tận", cơn ác mộng của mọi lập trình viên.',
    instructions: [
      'Chương trình bị treo vì vòng lặp không bao giờ dừng',
      'Nguyên nhân: biến đếm không bao giờ thay đổi nên điều kiện luôn đúng',
      'Sửa để vòng lặp chạy đúng 4 lần',
      'Kết quả đúng: Vong 1 / Vong 2 / Vong 3 / Vong 4',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 4; ) {
        cout << "Vong " << i << endl;
    }
    return 0;
}`,
    expectedOutput: 'Vong 1\nVong 2\nVong 3\nVong 4',
    requiredPatterns: ['stmt:for'],
    testCases: [
      {
        id: 'l3-c6-t1',
        name: 'Vòng lặp dừng sau đúng 4 vòng',
        kind: 'output',
        expectedOutput: 'Vong 1\nVong 2\nVong 3\nVong 4',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FOR_MISSING_UPDATE',
        message:
          'Chính xác là chỗ đó! Phần thứ ba trong ngoặc đang trống nên `i` mãi bằng 1, điều kiện `i <= 4` luôn đúng. Em thêm `i++` vào nhé.',
        hintLevel: 1,
      },
      {
        errorCode: 'TIMEOUT',
        message:
          'Vòng lặp của em chạy mãi không dừng. Em kiểm tra phần thứ ba trong ngoặc `for` — biến đếm `i` có được tăng lên không?',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Sau mỗi vòng lặp, giá trị của `i` thay đổi thế nào? Nếu nó không đổi thì điều kiện `i <= 4` có bao giờ sai được không?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Vòng `for` cần đủ ba phần: khởi tạo, điều kiện, và CẬP NHẬT. Phần cập nhật là nơi biến đếm tăng lên — thường viết là `i++`.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Dòng for hiện tại đang thiếu phần cuối:\n```cpp\nfor (int i = 1; i <= 4; ___) {\n```\nChỗ trống điền `i++`.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 4; i++) {
        cout << "Vong " << i << endl;
    }
    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 7. Debug Challenge 2
  {
    id: 'l3-c7-debug',
    lessonId: 'l3',
    kind: 'debug',
    title: 'Lệch đúng một bước',
    story:
      'Con đường có 6 ô, nhưng nhân vật cứ dừng ở ô thứ 5 rồi đứng ngơ ngác. "Lỗi lệch một đơn vị," Byte nói. "Lỗi này nhỏ xíu nhưng lập trình viên nào cũng dính ít nhất một lần."',
    instructions: [
      'Nhân vật cần đi đúng 6 ô để tới lá cờ, nhưng hiện chỉ đi được 5',
      'Chương trình chạy được, không báo lỗi cú pháp — sai ở logic',
      'Chỉ cần sửa điều kiện trong vòng for',
      'Mẹo: với i bắt đầu từ 1, điều kiện i < 6 chạy mấy lần?',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i < 6; i++) {
        moveForward();
    }
    return 0;
}`,
    requiredPatterns: ['stmt:for>call:moveForward'],
    world: { cols: 7, startCol: 0, goalCol: 6 },
    testCases: [
      {
        id: 'l3-c7-t1',
        name: 'Nhân vật đi đủ 6 ô và tới lá cờ',
        kind: 'world',
        expectedWorld: { col: 6 },
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FOR_WRONG_COUNT',
        message:
          'Vòng lặp đang chạy 5 lần nhưng con đường có 6 ô. Với `i` bắt đầu từ 1, em cần điều kiện `i <= 6` hoặc `i < 7`.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Với `int i = 1` và điều kiện `i < 6`, em thử liệt kê ra giấy: i nhận những giá trị nào? Đếm xem có bao nhiêu giá trị.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Hai công thức cần nhớ:\n· Bắt đầu từ 0, lặp N lần: `i < N`\n· Bắt đầu từ 1, lặp N lần: `i <= N`\nCode hiện tại bắt đầu từ 1 nhưng lại dùng dấu `<`.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Em chỉ cần sửa phần điều kiện:\n```cpp\nfor (int i = 1; i ___ 6; i++) {\n```\nĐổi dấu `<` thành `<=` là xong.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 6; i++) {
        moveForward();
    }
    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 8. Clean Code Check
  {
    id: 'l3-c8-cleancode',
    lessonId: 'l3',
    kind: 'cleancode',
    title: 'Sáu dòng giống hệt nhau',
    story:
      'Chương trình này chạy đúng, nhưng có sáu dòng chép đi chép lại y hệt. Byte chỉ vào màn hình: "Thấy code lặp lại là thấy cơ hội dùng vòng lặp. Gọn hơn, và sửa cũng dễ hơn."',
    instructions: [
      'Code chạy đúng rồi — kết quả in ra phải giữ nguyên',
      'Việc của em: thay sáu dòng cout giống nhau bằng MỘT vòng lặp for',
      'Nhớ thụt lề phần bên trong vòng lặp vào một cấp',
      'Kết quả vẫn phải là sáu dòng  Kiem tra o duong',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
cout << "Kiem tra o duong" << endl;
cout << "Kiem tra o duong" << endl;
cout << "Kiem tra o duong" << endl;
cout << "Kiem tra o duong" << endl;
cout << "Kiem tra o duong" << endl;
cout << "Kiem tra o duong" << endl;
return 0;
}`,
    expectedOutput:
      'Kiem tra o duong\nKiem tra o duong\nKiem tra o duong\nKiem tra o duong\nKiem tra o duong\nKiem tra o duong',
    requiredPatterns: ['stmt:for'],
    testCases: [
      {
        id: 'l3-c8-t1',
        name: 'Vẫn in ra đủ sáu dòng như cũ',
        kind: 'output',
        expectedOutput:
          'Kiem tra o duong\nKiem tra o duong\nKiem tra o duong\nKiem tra o duong\nKiem tra o duong\nKiem tra o duong',
        required: true,
        visible: true,
      },
      {
        id: 'l3-c8-t2',
        name: 'Đã thay code lặp bằng vòng lặp for',
        kind: 'structure',
        patterns: ['stmt:for', 'stmt:cout:count=1'],
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
          'Sáu dòng đó có khác nhau chỗ nào không? Nếu chúng hoàn toàn giống nhau, em cần lặp lại một dòng bao nhiêu lần?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Giữ lại đúng MỘT dòng `cout`, đặt nó vào trong thân vòng lặp `for` chạy 6 lần, rồi xoá năm dòng còn lại. Đừng quên thụt lề.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code sạch:\n```cpp\nint main() {\n    for (int i = 0; i < ___; i++) {\n        cout << "Kiem tra o duong" << endl;\n    }\n\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: [
      { rule: 'indent', weight: 30 },
      { rule: 'no-duplication', weight: 35 },
      { rule: 'one-statement-per-line', weight: 20 },
      { rule: 'spacing', weight: 15 },
    ],
    minCleanCodeScore: 85,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

int main() {
    for (int i = 0; i < 6; i++) {
        cout << "Kiem tra o duong" << endl;
    }

    return 0;
}`,
  },

  // ─────────────────────────────────────────────────────── 9. Boss Challenge
  {
    id: 'l3-c9-boss',
    lessonId: 'l3',
    kind: 'boss',
    title: 'BOSS — Vượt Thung Lũng Lặp',
    story:
      'Bug Vòng Lặp đã kéo dài con đường ra thành 8 ô và phá hỏng chương trình di chuyển. Để thoát khỏi thung lũng, em phải viết một hàm rồi gọi nó trong vòng lặp — đúng số lần, không thừa không thiếu.',
    instructions: [
      'Sửa các lỗi có sẵn trong code',
      'Viết hàm takeOneStep() gọi moveForward() một lần',
      'Dùng vòng lặp for gọi takeOneStep() đúng 8 lần để tới lá cờ',
      'KHÔNG gõ tay nhiều lần — nhiệm vụ này chấm cả cách làm',
      'Viết code sạch: thụt lề đều, tên hàm bắt đầu bằng động từ',
    ],
    starterCode: `#include <iostream>
using namespace std;

// Viết hàm takeOneStep() ở đây

int main() {
    for (int i = 0; i < 8; i++)
        // Gọi takeOneStep() ở đây
    }
    return 0;
}`,
    requiredPatterns: ['decl:func:takeOneStep', 'stmt:for>call:takeOneStep'],
    forbiddenPatterns: ['call:takeOneStep:count>=2'],
    world: { cols: 9, startCol: 0, goalCol: 8 },
    testCases: [
      {
        id: 'l3-c9-t1',
        name: 'Nhân vật vượt hết 8 ô và tới lá cờ',
        kind: 'world',
        expectedWorld: { col: 8 },
        required: true,
        visible: true,
      },
      {
        id: 'l3-c9-t2',
        name: 'Có hàm takeOneStep và được gọi trong vòng lặp',
        kind: 'structure',
        patterns: ['decl:func:takeOneStep', 'stmt:for>call:takeOneStep'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'PATTERN_FORBIDDEN',
        detect: 'call:takeOneStep:count>=2',
        message:
          'Cách này tới đích được, nhưng Bug Vòng Lặp chỉ chịu thua khi em dùng đúng một lời gọi đặt trong vòng `for` thôi.',
        hintLevel: 2,
      },
      {
        errorCode: 'UNBALANCED_BRACE',
        message:
          'Số dấu `{` và `}` chưa bằng nhau. Vòng `for` của em đang thiếu dấu `{` mở thân vòng lặp.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Con đường có 8 ô. Vòng lặp cần chạy bao nhiêu lần? Và trong thân vòng lặp, em gọi cái gì?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Đếm lại số dấu `{` và `}` trong chương trình xem có bằng nhau không — thân vòng `for` cũng cần một cặp ngoặc nhọn riêng. Sau đó viết hàm `void takeOneStep()` ở ngoài main.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung chương trình đúng:\n```cpp\nvoid takeOneStep() {\n    moveForward();\n}\n\nint main() {\n    for (int i = 0; i < 8; i++) {\n        ___();\n    }\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    thinkingPrompt:
      'Ba câu trước khi gõ: (1) việc gì được lặp lại — viết ra đúng một lần thôi; (2) lặp bao nhiêu lần, con số đó từ đâu ra; (3) biến đếm bắt đầu từ 0 hay từ 1, và điều kiện tương ứng là gì?',
    whyThisMatters:
      'Bài này ghép hai kiến thức lần đầu: hàm để đặt tên cho việc, vòng lặp để nói số lần. Ghép được hai thứ này là em đã có công cụ giải phần lớn bài tập ở mức lớp 8.',
    xpReward: 80,
    solution: `#include <iostream>
using namespace std;

void takeOneStep() {
    moveForward();
}

int main() {
    for (int i = 0; i < 8; i++) {
        takeOneStep();
    }
    return 0;
}`,
  },
];

const exitTicket: ExitTicket = {
  lessonId: 'l3',
  questions: [
    {
      id: 'l3-q1',
      type: 'knowledge',
      prompt: 'Ba phần bên trong ngoặc của vòng for lần lượt là gì?',
      options: [
        'Khởi tạo — điều kiện — cập nhật',
        'Điều kiện — khởi tạo — cập nhật',
        'Bắt đầu — kết thúc — bước nhảy',
        'Biến — hàm — kết quả',
      ],
      correctIndex: 0,
      explanation:
        'Đúng thứ tự là: khởi tạo biến đếm, điều kiện để tiếp tục lặp, và cách cập nhật biến đếm sau mỗi vòng. Ba phần ngăn cách bằng dấu ;',
    },
    {
      id: 'l3-q2',
      type: 'read-code',
      prompt: 'Vòng lặp dưới đây chạy bao nhiêu lần?',
      code: `for (int i = 2; i <= 6; i++) {
    cout << "x";
}`,
      options: ['5 lần', '4 lần', '6 lần', '7 lần'],
      correctIndex: 0,
      explanation:
        'i nhận các giá trị 2, 3, 4, 5, 6 — tất cả là 5 giá trị, nên thân vòng lặp chạy 5 lần. Cách tính nhanh: 6 − 2 + 1 = 5.',
    },
    {
      id: 'l3-q3',
      type: 'self-assess',
      prompt: 'Sau khu vực này, em thấy mình dùng vòng lặp for ở mức nào?',
      options: [
        'Em tự viết được vòng for đúng số lần mà không cần đếm lại',
        'Em viết được nhưng hay bị lệch một đơn vị, phải thử lại',
        'Em làm được khi có gợi ý dẫn đường',
        'Em còn thấy khó, muốn được thầy giảng lại',
      ],
    },
  ],
  reflectionPrompt:
    'Lỗi "lệch một đơn vị" là gì, và em có mẹo nào để tự kiểm tra vòng lặp chạy đúng số lần không?',
};

const meta = LESSONS_META.find((item) => item.id === 'l3')!;

export const lesson3: Lesson = {
  ...meta,
  conceptGuide: lesson3Guide,
  challenges,
  exitTicket,
};
