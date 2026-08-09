import type { Challenge, ExitTicket, Lesson } from '@/types/content';
import { LESSONS_META } from '@/data/lessons.meta';
import { lesson2Guide } from './guide';
import { CLEAN_CODE_WITH_FUNCTIONS } from '../shared';

/**
 * KHU VỰC 2 — XƯỞNG PHÉP THUẬT
 * Khái niệm hàm · tách nhiệm vụ · hàm void · gọi hàm · tham số · tên hàm rõ nghĩa
 *
 * Nguyên tắc soạn bài: mỗi nhiệm vụ chỉ thêm MỘT ý mới so với nhiệm vụ trước.
 */

const challenges: Challenge[] = [
  // ─────────────────────────────────────────────────────────── 1. Quan sát
  {
    id: 'l2-c1-observe',
    lessonId: 'l2',
    kind: 'story',
    title: 'Cỗ máy biết tự chạy',
    story:
      'Trong Xưởng Phép Thuật, Byte chỉ vào một cỗ máy cũ. "Nhìn kỹ đoạn code này nhé — có một khối lệnh được đặt tên, rồi được gọi tới hai lần. Em đoán thử xem nó in ra mấy dòng?"',
    instructions: [
      'Đọc code và đếm xem chương trình sẽ in ra bao nhiêu dòng',
      'Chú ý: khối lệnh castSpell() được viết một lần, nhưng được gọi mấy lần?',
      'Bấm "Chạy code" để kiểm tra dự đoán của em',
    ],
    starterCode: `#include <iostream>
using namespace std;

void castSpell() {
    cout << "Phep thuat duoc kich hoat" << endl;
}

int main() {
    castSpell();
    castSpell();
    return 0;
}`,
    expectedOutput: 'Phep thuat duoc kich hoat\nPhep thuat duoc kich hoat',
    requiredPatterns: ['decl:func:castSpell', 'call:castSpell'],
    testCases: [
      {
        id: 'l2-c1-t1',
        name: 'Phép thuật được kích hoạt hai lần',
        kind: 'output',
        expectedOutput: 'Phep thuat duoc kich hoat\nPhep thuat duoc kich hoat',
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
          'Khối lệnh `castSpell` được VIẾT mấy lần, và được GỌI mấy lần? Hai con số đó có bằng nhau không?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Viết hàm chỉ là "dạy" máy tính cách làm một việc. Mỗi lần em gọi tên hàm kèm cặp ngoặc `()`, máy tính mới thật sự làm việc đó một lần.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Bài này em chỉ cần bấm "Chạy code" — không phải sửa gì cả. Cứ mạnh dạn bấm để xem kết quả nhé!',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 10,
  },

  // ──────────────────────────────────────────────── 2. Khám phá lệnh: hàm void
  {
    id: 'l2-c2-concept',
    lessonId: 'l2',
    kind: 'concept',
    title: 'Khám phá: viết hàm đầu tiên',
    story:
      'Byte đưa em một cuốn sổ trắng. "Giờ tới lượt em tự tạo một phép thuật. Đặt tên cho nó, viết những gì nó phải làm vào trong dấu ngoặc nhọn — rồi đừng quên gọi nó ra."',
    instructions: [
      'Cú pháp:  void tenHam() { ... }',
      'Ý nghĩa: void nghĩa là hàm không trả về giá trị nào, chỉ làm việc thôi',
      'Hàm phải viết BÊN NGOÀI hàm main, phía trên main',
      'Nhiệm vụ: viết hàm openWorkshop() in ra dòng  Xuong Phep Thuat da mo cua',
      'Rồi gọi hàm đó một lần trong main',
    ],
    starterCode: `#include <iostream>
using namespace std;

// Viết hàm openWorkshop() ở đây

int main() {
    // Gọi hàm openWorkshop() ở đây

    return 0;
}`,
    expectedOutput: 'Xuong Phep Thuat da mo cua',
    requiredPatterns: ['decl:func:openWorkshop', 'call:openWorkshop'],
    testCases: [
      {
        id: 'l2-c2-t1',
        name: 'Xưởng mở cửa',
        kind: 'output',
        expectedOutput: 'Xuong Phep Thuat da mo cua',
        required: true,
        visible: true,
      },
      {
        id: 'l2-c2-t2',
        name: 'Có viết hàm openWorkshop và có gọi nó',
        kind: 'structure',
        patterns: ['decl:func:openWorkshop', 'call:openWorkshop'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FUNC_NOT_CALLED',
        message:
          'Em viết hàm rất chuẩn rồi! Nhưng hàm chỉ chạy khi được GỌI. Em thêm dòng `openWorkshop();` vào trong `main()` nhé.',
        hintLevel: 2,
      },
      {
        errorCode: 'FUNC_NAME_MISMATCH',
        message:
          'Tên hàm lúc gọi phải giống hệt lúc khai báo, kể cả chữ hoa chữ thường. Em so lại hai chỗ nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em cần làm hai việc: viết hàm, và gọi hàm. Nếu chỉ làm một trong hai thì chuyện gì xảy ra?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Phần khai báo hàm nằm ngoài main, có dạng: `void tenHam() {` rồi các câu lệnh, rồi `}`. Phần gọi hàm nằm trong main, chỉ cần `tenHam();`',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nvoid openWorkshop() {\n    cout << "___" << endl;\n}\n\nint main() {\n    ___();\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

void openWorkshop() {
    cout << "Xuong Phep Thuat da mo cua" << endl;
}

int main() {
    openWorkshop();
    return 0;
}`,
  },

  // ──────────────────────────────────────────────────────── 3. Thử ngay
  {
    id: 'l2-c3-sandbox',
    lessonId: 'l2',
    kind: 'sandbox',
    title: 'Thử ngay: gọi lại nhiều lần',
    story:
      'Một cỗ máy trong xưởng cần được nạp năng lượng ba lần liên tiếp mới khởi động. "Đây chính là điểm hay của hàm," Byte nói. "Viết một lần, dùng bao nhiêu lần cũng được."',
    instructions: [
      'Hàm chargeMachine() đã có sẵn — em không cần sửa nó',
      'Việc của em: gọi hàm này ĐÚNG BA LẦN trong main',
      'Kết quả phải là ba dòng giống nhau',
    ],
    starterCode: `#include <iostream>
using namespace std;

void chargeMachine() {
    cout << "Nap nang luong..." << endl;
}

int main() {
    chargeMachine();
    // Gọi thêm hai lần nữa ở đây

    return 0;
}`,
    expectedOutput: 'Nap nang luong...\nNap nang luong...\nNap nang luong...',
    requiredPatterns: ['call:chargeMachine:count=3'],
    testCases: [
      {
        id: 'l2-c3-t1',
        name: 'Cỗ máy được nạp đủ ba lần',
        kind: 'output',
        expectedOutput: 'Nap nang luong...\nNap nang luong...\nNap nang luong...',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'MISSING_SEMICOLON',
        message: 'Mỗi lời gọi hàm cũng là một câu lệnh, nên cũng cần dấu `;` ở cuối nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Trong main đang có mấy dòng gọi `chargeMachine()`? Em cần tổng cộng bao nhiêu dòng như vậy?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Mỗi lần gọi là một dòng riêng: `chargeMachine();`. Em chép thêm cho đủ số lần cần thiết.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Trong main sẽ có ba dòng như thế này:\n```cpp\nchargeMachine();\nchargeMachine();\nchargeMachine();\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

void chargeMachine() {
    cout << "Nap nang luong..." << endl;
}

int main() {
    chargeMachine();
    chargeMachine();
    chargeMachine();
    return 0;
}`,
  },

  // ────────────────────────────────────────── 4. Nhiệm vụ: tách thành nhiều hàm
  {
    id: 'l2-c4-mission',
    lessonId: 'l2',
    kind: 'mission',
    title: 'Ba cỗ máy, ba phép thuật',
    story:
      'Xưởng có ba cỗ máy phải khởi động theo đúng thứ tự. Byte đưa em bản thiết kế: "Đừng viết dồn tất cả vào main. Mỗi cỗ máy một hàm riêng — sau này hỏng cái nào, mình biết ngay phải sửa ở đâu."',
    instructions: [
      'Viết ba hàm, mỗi hàm in ra một dòng:',
      '   startFurnace()  →  Lo ren da nong',
      '   startAnvil()    →  De ren da san sang',
      '   startForge()    →  Xuong ren bat dau hoat dong',
      'Gọi cả ba hàm trong main theo đúng thứ tự trên',
    ],
    starterCode: `#include <iostream>
using namespace std;

void startFurnace() {
    cout << "Lo ren da nong" << endl;
}

// Viết hai hàm còn lại ở đây

int main() {
    startFurnace();
    // Gọi hai hàm còn lại ở đây

    return 0;
}`,
    expectedOutput: 'Lo ren da nong\nDe ren da san sang\nXuong ren bat dau hoat dong',
    requiredPatterns: ['decl:func:startAnvil', 'decl:func:startForge', 'call:startForge'],
    testCases: [
      {
        id: 'l2-c4-t1',
        name: 'Ba cỗ máy khởi động đúng thứ tự',
        kind: 'output',
        expectedOutput: 'Lo ren da nong\nDe ren da san sang\nXuong ren bat dau hoat dong',
        required: true,
        visible: true,
      },
      {
        id: 'l2-c4-t2',
        name: 'Mỗi cỗ máy có một hàm riêng',
        kind: 'structure',
        patterns: ['decl:func:startFurnace', 'decl:func:startAnvil', 'decl:func:startForge'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FUNC_NOT_CALLED',
        message:
          'Có hàm em đã viết nhưng chưa gọi trong `main()`. Hàm chưa được gọi thì không chạy, nên dòng chữ của nó sẽ không hiện ra.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Hàm `startFurnace()` đã có sẵn làm mẫu rồi. Hai hàm còn lại có cấu trúc giống hệt, chỉ khác tên hàm và dòng chữ bên trong. Em nhìn mẫu rồi làm theo nhé.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Nhớ làm đủ hai việc cho mỗi cỗ máy: (1) viết hàm ở ngoài main, (2) gọi hàm ở trong main. Thứ tự gọi trong main quyết định thứ tự các dòng in ra.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung của một hàm còn thiếu:\n```cpp\nvoid startAnvil() {\n    cout << "___" << endl;\n}\n```\nHàm `startForge()` viết tương tự.',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

void startFurnace() {
    cout << "Lo ren da nong" << endl;
}

void startAnvil() {
    cout << "De ren da san sang" << endl;
}

void startForge() {
    cout << "Xuong ren bat dau hoat dong" << endl;
}

int main() {
    startFurnace();
    startAnvil();
    startForge();
    return 0;
}`,
  },

  // ───────────────────────────────────────────── 5. Nhiệm vụ: hàm có tham số
  {
    id: 'l2-c5-mission',
    lessonId: 'l2',
    kind: 'mission',
    title: 'Một hàm, nhiều công suất',
    story:
      'Ba cỗ máy chạy ở ba mức công suất khác nhau. Viết ba hàm gần như y hệt thì phí quá. "Cho hàm một cái ô trống," Byte gợi ý, "mỗi lần gọi em điền số khác nhau vào ô đó."',
    instructions: [
      'Viết hàm showPower(int power) in ra dòng:  Cong suat: X',
      '   trong đó X là giá trị được truyền vào',
      'Gọi hàm ba lần với các giá trị 30, 60, 90',
      'Kết quả là ba dòng:  Cong suat: 30  /  Cong suat: 60  /  Cong suat: 90',
    ],
    starterCode: `#include <iostream>
using namespace std;

// Viết hàm showPower có một tham số kiểu int ở đây

int main() {
    // Gọi showPower ba lần với 30, 60, 90

    return 0;
}`,
    expectedOutput: 'Cong suat: 30\nCong suat: 60\nCong suat: 90',
    requiredPatterns: ['decl:func:showPower:params>=1', 'call:showPower:count=3'],
    testCases: [
      {
        id: 'l2-c5-t1',
        name: 'Ba mức công suất hiện đúng',
        kind: 'output',
        expectedOutput: 'Cong suat: 30\nCong suat: 60\nCong suat: 90',
        required: true,
        visible: true,
      },
      {
        id: 'l2-c5-t2',
        name: 'Dùng MỘT hàm có tham số, không viết ba hàm riêng',
        kind: 'structure',
        patterns: ['decl:func:showPower:params>=1'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'VAR_UNDECLARED',
        message:
          'Bên trong hàm, em phải dùng đúng tên THAM SỐ đã khai báo ở dòng đầu của hàm. Ví dụ khai báo `void showPower(int power)` thì bên trong dùng `power`.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Ba dòng cần in ra chỉ khác nhau ở một con số. Vậy phần nào của hàm nên để trống cho mỗi lần gọi điền vào?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Tham số được khai báo trong cặp ngoặc tròn của hàm, phải ghi rõ kiểu: `void tenHam(int tenThamSo)`. Khi gọi thì đặt giá trị vào ngoặc: `tenHam(30);`',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nvoid showPower(int power) {\n    cout << "Cong suat: " << ___ << endl;\n}\n\nint main() {\n    showPower(___);\n    showPower(___);\n    showPower(___);\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

void showPower(int power) {
    cout << "Cong suat: " << power << endl;
}

int main() {
    showPower(30);
    showPower(60);
    showPower(90);
    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 6. Debug Challenge 1
  {
    id: 'l2-c6-debug',
    lessonId: 'l2',
    kind: 'debug',
    title: 'Phép thuật ngủ quên',
    story:
      'Một Bug tinh ranh đã xoá đúng một dòng trong main. Hàm vẫn còn nguyên vẹn, nhưng khi chạy thì chỉ hiện một dòng thay vì hai. "Hàm nào không được gọi thì cũng như chưa từng tồn tại," Byte thở dài.',
    instructions: [
      'Chương trình chạy được, nhưng thiếu mất một dòng in ra',
      'Kết quả đúng phải là hai dòng:',
      '   Kiem tra he thong',
      '   Bao ve da kich hoat',
      'Đọc kỹ thông báo màu vàng ở phần kết quả — nó chỉ đúng chỗ có vấn đề',
    ],
    starterCode: `#include <iostream>
using namespace std;

void activateShield() {
    cout << "Bao ve da kich hoat" << endl;
}

int main() {
    cout << "Kiem tra he thong" << endl;
    return 0;
}`,
    expectedOutput: 'Kiem tra he thong\nBao ve da kich hoat',
    requiredPatterns: ['call:activateShield'],
    testCases: [
      {
        id: 'l2-c6-t1',
        name: 'Lớp bảo vệ được kích hoạt',
        kind: 'output',
        expectedOutput: 'Kiem tra he thong\nBao ve da kich hoat',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FUNC_NOT_CALLED',
        message:
          'Đúng chỗ rồi đó! Hàm `activateShield()` đã được viết nhưng chưa ai gọi nó. Em thêm dòng `activateShield();` vào trong `main()` nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Trong chương trình có hàm nào được viết ra mà không xuất hiện lần nào trong `main()` không? Em thử tìm xem.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Hàm chỉ chạy khi được gọi. Gọi hàm là viết tên hàm kèm `()` và dấu `;` — đặt bên trong `main()`.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Trong main, sau dòng `cout` hiện có, em thêm một dòng:\n```cpp\nactivateShield();\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

void activateShield() {
    cout << "Bao ve da kich hoat" << endl;
}

int main() {
    cout << "Kiem tra he thong" << endl;
    activateShield();
    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 7. Debug Challenge 2
  {
    id: 'l2-c7-debug',
    lessonId: 'l2',
    kind: 'debug',
    title: 'Gọi nhầm tên phép thuật',
    story:
      'Bug đã lén đổi vài chữ cái trong tên các phép thuật. Với mắt thường thì gần như không thấy khác biệt — nhưng máy tính thì cực kỳ khó tính, sai một chữ là không nhận.',
    instructions: [
      'Chương trình có ba lỗi',
      'Gợi ý loại lỗi: một tên hàm bị gọi sai, một dấu ; bị thiếu, một tham số thiếu kiểu dữ liệu',
      'Sửa từng lỗi rồi bấm Chạy lại sau mỗi lần sửa',
      'Kết quả đúng:  Nap 50 don vi nang luong  /  Hoan tat',
    ],
    starterCode: `#include <iostream>
using namespace std;

void chargeEnergy(amount) {
    cout << "Nap " << amount << " don vi nang luong" << endl;
}

void finishCharging() {
    cout << "Hoan tat" << endl
}

int main() {
    chargeenergy(50);
    finishCharging();
    return 0;
}`,
    expectedOutput: 'Nap 50 don vi nang luong\nHoan tat',
    requiredPatterns: ['decl:func:chargeEnergy:params>=1', 'call:chargeEnergy'],
    testCases: [
      {
        id: 'l2-c7-t1',
        name: 'Nạp năng lượng và báo hoàn tất',
        kind: 'output',
        expectedOutput: 'Nap 50 don vi nang luong\nHoan tat',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FUNC_NAME_MISMATCH',
        message:
          'Bug đã đổi chữ E hoa thành e thường! Em khai báo `chargeEnergy` nhưng lại gọi `chargeenergy`. C++ phân biệt chữ hoa chữ thường rất nghiêm.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Ba chỗ cần soi: dòng khai báo tham số của hàm thứ nhất, ký tự cuối dòng `cout` của hàm thứ hai, và tên hàm ở dòng gọi trong main. Em so từng cặp xem có khớp nhau không.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Nhắc lại ba quy tắc:\n1. Tham số bắt buộc phải ghi kiểu dữ liệu: `(int amount)` chứ không phải `(amount)`\n2. Mọi câu lệnh kết thúc bằng dấu `;`\n3. Tên hàm khi gọi phải giống HỆT khi khai báo, kể cả chữ hoa chữ thường',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Ba chỗ cần sửa nằm ở đây:\n```cpp\nvoid chargeEnergy(___ amount) {   // thiếu kiểu dữ liệu\n\ncout << "Hoan tat" << endl___     // thiếu dấu ;\n\n___(50);                          // tên hàm viết sai\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

void chargeEnergy(int amount) {
    cout << "Nap " << amount << " don vi nang luong" << endl;
}

void finishCharging() {
    cout << "Hoan tat" << endl;
}

int main() {
    chargeEnergy(50);
    finishCharging();
    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 8. Clean Code Check
  {
    id: 'l2-c8-cleancode',
    lessonId: 'l2',
    kind: 'cleancode',
    title: 'Hàm main phình to',
    story:
      'Chương trình này chạy đúng, nhưng toàn bộ công việc bị nhồi hết vào main. Byte nhăn mặt: "Nếu mai mốt cần đổi cách chào, em phải mò trong đống này. Tách ra thành hàm riêng đi."',
    instructions: [
      'Code chạy đúng rồi — em không cần đổi kết quả in ra',
      'Việc của em: tách hai nhóm việc trong main thành hai hàm riêng',
      '   · Nhóm 1 (hai dòng chào) → hàm printWelcome()',
      '   · Nhóm 2 (hai dòng trạng thái) → hàm printStatus()',
      'Sau đó main chỉ còn gọi hai hàm đó thôi',
      'Nhớ thụt lề đều và đặt tên hàm bắt đầu bằng động từ',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
cout << "Chao mung den Xuong Phep Thuat" << endl;
cout << "Noi che tao moi co may cua ByteLand" << endl;
cout << "Trang thai: dang hoat dong" << endl;
cout << "So co may: 3" << endl;
return 0;
}`,
    expectedOutput:
      'Chao mung den Xuong Phep Thuat\nNoi che tao moi co may cua ByteLand\nTrang thai: dang hoat dong\nSo co may: 3',
    requiredPatterns: ['decl:func:printWelcome', 'decl:func:printStatus'],
    testCases: [
      {
        id: 'l2-c8-t1',
        name: 'Kết quả in ra giữ nguyên như cũ',
        kind: 'output',
        expectedOutput:
          'Chao mung den Xuong Phep Thuat\nNoi che tao moi co may cua ByteLand\nTrang thai: dang hoat dong\nSo co may: 3',
        required: true,
        visible: true,
      },
      {
        id: 'l2-c8-t2',
        name: 'Đã tách thành hai hàm riêng',
        kind: 'structure',
        patterns: ['decl:func:printWelcome', 'decl:func:printStatus'],
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
          'Bốn dòng `cout` trong main chia thành mấy nhóm việc khác nhau? Hai dòng đầu nói về điều gì, hai dòng sau nói về điều gì?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Cách tách hàm: cắt các dòng cần tách ra khỏi main, dán vào trong một hàm `void` mới đặt phía trên main, rồi trong main gọi tên hàm đó. Đừng quên thụt lề vào một cấp.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nvoid printWelcome() {\n    // hai dòng cout đầu tiên\n}\n\nvoid printStatus() {\n    // hai dòng cout còn lại\n}\n\nint main() {\n    printWelcome();\n    printStatus();\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: [
      { rule: 'indent', weight: 25 },
      { rule: 'extract-function', weight: 25 },
      { rule: 'action-verb-func', weight: 20 },
      { rule: 'main-length', weight: 15, params: { maxMainLines: 4 } },
      { rule: 'spacing', weight: 15 },
    ],
    minCleanCodeScore: 85,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

void printWelcome() {
    cout << "Chao mung den Xuong Phep Thuat" << endl;
    cout << "Noi che tao moi co may cua ByteLand" << endl;
}

void printStatus() {
    cout << "Trang thai: dang hoat dong" << endl;
    cout << "So co may: 3" << endl;
}

int main() {
    printWelcome();
    printStatus();
    return 0;
}`,
  },

  // ─────────────────────────────────────────────────────── 9. Boss Challenge
  {
    id: 'l2-c9-boss',
    lessonId: 'l2',
    kind: 'boss',
    title: 'BOSS — Dây chuyền phép thuật',
    story:
      'Bug Thợ Rèn đã phá hỏng dây chuyền sản xuất của cả xưởng. Để khởi động lại, em phải viết đủ ba phép thuật và ghép chúng theo đúng thứ tự. Đây là thử thách cuối của Khu vực 2.',
    instructions: [
      'Sửa các lỗi có sẵn trong code',
      'Viết đủ ba hàm:',
      '   openGate()          →  Cong xuong da mo',
      '   turnOnLights()      →  Den da sang',
      '   startProduction(int machines)  →  Khoi dong 5 co may',
      'Gọi ba hàm trong main theo đúng thứ tự trên, truyền số 5 cho hàm cuối',
      'Viết code sạch: thụt lề đều, tên hàm bắt đầu bằng động từ',
    ],
    starterCode: `#include <iostream>
using namespace std;

void openGate() {
    cout << "Cong xuong da mo" << endl
}

// Viết hàm turnOnLights() ở đây

// Viết hàm startProduction(int machines) ở đây

int main() {
    openGate();
    // Gọi hai hàm còn lại ở đây

    return 0;
}`,
    expectedOutput: 'Cong xuong da mo\nDen da sang\nKhoi dong 5 co may',
    requiredPatterns: [
      'decl:func:turnOnLights',
      'decl:func:startProduction:params>=1',
      'call:startProduction',
    ],
    testCases: [
      {
        id: 'l2-c9-t1',
        name: 'Dây chuyền khởi động đủ ba bước',
        kind: 'output',
        expectedOutput: 'Cong xuong da mo\nDen da sang\nKhoi dong 5 co may',
        required: true,
        visible: true,
      },
      {
        id: 'l2-c9-t2',
        name: 'Hàm startProduction có tham số',
        kind: 'structure',
        patterns: ['decl:func:startProduction:params>=1'],
        required: true,
        visible: true,
      },
      {
        id: 'l2-c9-t3',
        name: 'Cả ba hàm đều được gọi trong main',
        kind: 'structure',
        patterns: ['call:openGate', 'call:turnOnLights', 'call:startProduction'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Bug Thợ Rèn đã cắn mất dấu `;` ở cuối dòng `cout` trong hàm `openGate()`. Em thêm lại nhé.',
        hintLevel: 1,
      },
      {
        errorCode: 'FUNC_NOT_CALLED',
        message:
          'Có hàm em đã viết nhưng chưa gọi trong `main()`. Dây chuyền chỉ chạy khi cả ba bước đều được gọi.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Với mỗi phép thuật, em phải làm hai việc. Đó là hai việc gì? Và hàm thứ ba khác hai hàm kia ở điểm nào?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Hàm không tham số: `void tenHam() { ... }`, gọi bằng `tenHam();`\nHàm có tham số: `void tenHam(int thamSo) { ... }`, gọi bằng `tenHam(5);`\nĐừng quên rà lại dấu `;` ở mọi câu lệnh.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung hai hàm còn thiếu:\n```cpp\nvoid turnOnLights() {\n    cout << "___" << endl;\n}\n\nvoid startProduction(int machines) {\n    cout << "Khoi dong " << ___ << " co may" << endl;\n}\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    thinkingPrompt:
      'Với mỗi phép thuật em phải làm đúng hai việc — viết hàm và gọi hàm. Trước khi gõ, em thử đếm xem: cần bao nhiêu hàm, và trong main sẽ có bao nhiêu dòng gọi?',
    whyThisMatters:
      'Đây là lần đầu em tự thiết kế cấu trúc một chương trình chứ không chỉ điền vào chỗ trống. Biết chia việc thành các hàm có tên rõ nghĩa là kỹ năng em sẽ dùng suốt về sau.',
    xpReward: 80,
    solution: `#include <iostream>
using namespace std;

void openGate() {
    cout << "Cong xuong da mo" << endl;
}

void turnOnLights() {
    cout << "Den da sang" << endl;
}

void startProduction(int machines) {
    cout << "Khoi dong " << machines << " co may" << endl;
}

int main() {
    openGate();
    turnOnLights();
    startProduction(5);
    return 0;
}`,
  },
];

const exitTicket: ExitTicket = {
  lessonId: 'l2',
  questions: [
    {
      id: 'l2-q1',
      type: 'knowledge',
      prompt: 'Điều gì xảy ra nếu em viết một hàm nhưng không gọi nó trong main()?',
      options: [
        'Hàm không chạy, giống như chưa từng được viết',
        'Hàm tự động chạy một lần khi chương trình bắt đầu',
        'Chương trình báo lỗi và không chạy được',
        'Hàm chạy sau khi main kết thúc',
      ],
      correctIndex: 0,
      explanation:
        'Viết hàm chỉ là "dạy" máy tính cách làm. Máy chỉ thực sự làm khi em gọi tên hàm trong main.',
    },
    {
      id: 'l2-q2',
      type: 'read-code',
      prompt: 'Đoạn code dưới đây in ra gì?',
      code: `void showLevel(int level) {
    cout << "Cap do " << level << endl;
}

int main() {
    showLevel(3);
    showLevel(7);
    return 0;
}`,
      options: [
        'Cap do 3 rồi xuống dòng Cap do 7',
        'Cap do level rồi xuống dòng Cap do level',
        'Chỉ in ra Cap do 3',
        'Cap do 37',
      ],
      correctIndex: 0,
      explanation:
        'Mỗi lần gọi, giá trị trong ngoặc được đưa vào tham số `level`. Gọi hai lần với hai giá trị khác nhau nên in ra hai dòng khác nhau.',
    },
    {
      id: 'l2-q3',
      type: 'self-assess',
      prompt: 'Sau khu vực này, em thấy mình viết và gọi hàm ở mức nào?',
      options: [
        'Em tự viết hàm có tham số mà không cần nhìn lại ví dụ',
        'Em viết được hàm đơn giản, phần tham số thì còn phải xem lại',
        'Em làm được khi có gợi ý dẫn đường từng bước',
        'Em còn thấy khó, muốn được thầy giảng lại',
      ],
    },
  ],
  reflectionPrompt:
    'Theo em, tách chương trình thành nhiều hàm nhỏ có lợi gì so với viết dồn tất cả vào main?',
};

const meta = LESSONS_META.find((item) => item.id === 'l2')!;

export const lesson2: Lesson = {
  ...meta,
  conceptGuide: lesson2Guide,
  challenges,
  exitTicket,
};
