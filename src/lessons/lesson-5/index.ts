import type { Challenge, ExitTicket, Lesson } from '@/types/content';
import { LESSONS_META } from '@/data/lessons.meta';
import { lesson5Guide } from './guide';
import { CLEAN_CODE_WITH_FUNCTIONS, STANDARD_CLEAN_CODE } from '../shared';

/**
 * KHU VỰC 5 — LÂU ĐÀI LỰA CHỌN
 * if–else · hai hướng xử lý · KẾT HỢP hàm + for + if–else · sửa lỗi · clean code
 *
 * Đây là khu vực tổng hợp, nên từ nhiệm vụ số 5 trở đi mỗi bài đều đòi hỏi ít
 * nhất hai kiến thức của các khu vực trước cùng lúc.
 */

const challenges: Challenge[] = [
  // ─────────────────────────────────────────────────────────── 1. Quan sát
  {
    id: 'l5-c1-observe',
    lessonId: 'l5',
    kind: 'story',
    title: 'Hai cánh cửa',
    story:
      'Sảnh lớn của Lâu Đài Lựa Chọn có hai cánh cửa, và em buộc phải đi qua đúng một cánh. Byte đưa bản mã: "Khối này khác if thường ở chỗ nó luôn chọn một trong hai — không bao giờ bỏ trống."',
    instructions: [
      'Đọc kỹ cấu trúc if–else bên dưới',
      'Khác với if đơn: khi điều kiện SAI, phần else sẽ chạy',
      'Đoán xem chương trình in ra dòng nào, rồi bấm "Chạy code"',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int torchCount = 2;

    if (torchCount >= 5) {
        cout << "Di cua sang" << endl;
    } else {
        cout << "Di cua toi" << endl;
    }

    return 0;
}`,
    expectedOutput: 'Di cua toi',
    requiredPatterns: ['stmt:if-else'],
    testCases: [
      {
        id: 'l5-c1-t1',
        name: 'Chọn đúng một trong hai cánh cửa',
        kind: 'output',
        expectedOutput: 'Di cua toi',
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
          'torchCount bằng 2. Điều kiện `2 >= 5` đúng hay sai? Khi điều kiện sai thì phần nào sẽ chạy?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Với if–else, máy tính luôn chạy đúng MỘT trong hai khối: khối `if` khi điều kiện đúng, khối `else` khi điều kiện sai. Không bao giờ chạy cả hai, cũng không bao giờ bỏ qua cả hai.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Bài này em chỉ cần bấm "Chạy code" thôi. Chú ý xem dòng nào hiện ra — dòng của khối if hay của khối else nhé!',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 10,
  },

  // ────────────────────────────────────────── 2. Khám phá lệnh: if–else
  {
    id: 'l5-c2-concept',
    lessonId: 'l5',
    kind: 'concept',
    title: 'Khám phá: hai hướng xử lý',
    story:
      'Byte đặt hai viên đá lên bàn cân. "if đơn giống như chỉ có một lối: đúng thì đi, sai thì đứng yên. if–else thì luôn có lối thứ hai. Em thử viết một cái xem."',
    instructions: [
      'Cú pháp:  if (điều kiện) { ... } else { ... }',
      'Lưu ý: sau else KHÔNG có điều kiện và KHÔNG có ngoặc tròn',
      'Biến guardEnergy đã có sẵn giá trị 30',
      'Nhiệm vụ: nếu guardEnergy lớn hơn hoặc bằng 50 thì in  Linh gac con khoe',
      '   ngược lại thì in  Linh gac can nghi ngoi',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int guardEnergy = 30;

    // Viết cấu trúc if-else của em ở đây

    return 0;
}`,
    expectedOutput: 'Linh gac can nghi ngoi',
    requiredPatterns: ['stmt:if-else'],
    testCases: [
      {
        id: 'l5-c2-t1',
        name: 'Chọn đúng nhánh khi năng lượng thấp',
        kind: 'output',
        expectedOutput: 'Linh gac can nghi ngoi',
        required: true,
        visible: true,
      },
      {
        id: 'l5-c2-t2',
        name: 'Có dùng cấu trúc if–else, không phải hai if riêng',
        kind: 'structure',
        patterns: ['stmt:if-else'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'ASSIGN_IN_CONDITION',
        message:
          'Trong điều kiện của `if`, em cần `>=` hoặc `==` để so sánh. Một dấu `=` là gán giá trị.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Có hai kết quả có thể xảy ra, và luôn phải xảy ra đúng một trong hai. Vậy em dùng hai khối if riêng, hay một khối if–else?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Cấu trúc: `if (điều kiện) {` … `} else {` … `}`. Chữ `else` nằm ngay sau dấu `}` đóng khối if, và không đi kèm điều kiện nào.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nif (guardEnergy >= ___) {\n    cout << "___" << endl;\n} else {\n    cout << "___" << endl;\n}\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

int main() {
    int guardEnergy = 30;

    if (guardEnergy >= 50) {
        cout << "Linh gac con khoe" << endl;
    } else {
        cout << "Linh gac can nghi ngoi" << endl;
    }

    return 0;
}`,
  },

  // ──────────────────────────────────────────────────────── 3. Thử ngay
  {
    id: 'l5-c3-sandbox',
    lessonId: 'l5',
    kind: 'sandbox',
    title: 'Thử ngay: đảo hai nhánh',
    story:
      'Bản mã của lâu đài bị ghi ngược: khi kho báu đầy thì nó báo "trống", khi trống thì báo "đầy". "Chỉ cần tráo hai dòng chữ," Byte nói, "nhưng phải tráo cho đúng chỗ."',
    instructions: [
      'Biến treasureCount đang bằng 8',
      'Kết quả hiện tại đang SAI về mặt ý nghĩa',
      'Sửa để chương trình in ra  Kho bau day ap',
      'Gợi ý: em có thể tráo hai dòng cout, hoặc đổi lại điều kiện',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int treasureCount = 8;

    if (treasureCount >= 5) {
        cout << "Kho bau trong rong" << endl;
    } else {
        cout << "Kho bau day ap" << endl;
    }

    return 0;
}`,
    expectedOutput: 'Kho bau day ap',
    requiredPatterns: ['stmt:if-else'],
    testCases: [
      {
        id: 'l5-c3-t1',
        name: 'Báo đúng trạng thái kho báu',
        kind: 'output',
        expectedOutput: 'Kho bau day ap',
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
          'treasureCount bằng 8, nên điều kiện `8 >= 5` cho kết quả đúng — vậy khối nào đang chạy? Dòng chữ trong khối đó có hợp lý không?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Khối `if` chạy khi kho báu NHIỀU, nên dòng chữ trong đó phải nói về việc kho đầy. Em tráo nội dung hai dòng cout cho nhau.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Sau khi sửa, khối if sẽ chứa dòng chữ về kho đầy:\n```cpp\nif (treasureCount >= 5) {\n    cout << "Kho bau day ap" << endl;\n} else {\n    cout << "___" << endl;\n}\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

int main() {
    int treasureCount = 8;

    if (treasureCount >= 5) {
        cout << "Kho bau day ap" << endl;
    } else {
        cout << "Kho bau trong rong" << endl;
    }

    return 0;
}`,
  },

  // ─────────────────────────────────── 4. Nhiệm vụ: if–else trong một hàm
  {
    id: 'l5-c4-mission',
    lessonId: 'l5',
    kind: 'mission',
    title: 'Người gác cân nhắc',
    story:
      'Mỗi vị khách tới lâu đài đều được cân nhắc theo cùng một quy tắc. "Viết quy tắc đó thành một hàm," Byte gợi ý, "rồi mỗi khách chỉ cần gọi hàm một lần."',
    instructions: [
      'Viết hàm checkVisitor(int power) chứa một cấu trúc if–else:',
      '   · Nếu power lớn hơn hoặc bằng 60  →  in  Duoc vao lau dai',
      '   · Ngược lại                       →  in  Chua du dieu kien',
      'Gọi hàm hai lần trong main, với giá trị 80 rồi 45',
      'Kết quả: Duoc vao lau dai  /  Chua du dieu kien',
    ],
    starterCode: `#include <iostream>
using namespace std;

// Viết hàm checkVisitor(int power) ở đây

int main() {
    // Gọi checkVisitor hai lần: 80 rồi 45

    return 0;
}`,
    expectedOutput: 'Duoc vao lau dai\nChua du dieu kien',
    requiredPatterns: [
      'decl:func:checkVisitor:params>=1',
      'decl:func:checkVisitor>stmt:if-else',
      'call:checkVisitor:count=2',
    ],
    testCases: [
      {
        id: 'l5-c4-t1',
        name: 'Hai vị khách nhận đúng hai kết quả khác nhau',
        kind: 'output',
        expectedOutput: 'Duoc vao lau dai\nChua du dieu kien',
        required: true,
        visible: true,
      },
      {
        id: 'l5-c4-t2',
        name: 'Quy tắc if–else nằm bên trong hàm checkVisitor',
        kind: 'structure',
        patterns: ['decl:func:checkVisitor>stmt:if-else'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'VAR_UNDECLARED',
        message:
          'Bên trong hàm, em phải dùng đúng tên tham số đã khai báo ở dòng đầu của hàm — ở đây là `power`.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Quy tắc kiểm tra giống nhau cho mọi vị khách, chỉ khác con số đưa vào. Vậy con số đó nên là gì của hàm?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Hàm có tham số: `void checkVisitor(int power) { ... }`. Bên trong đặt cả cấu trúc if–else, dùng biến `power` trong điều kiện. Gọi bằng `checkVisitor(80);`',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nvoid checkVisitor(int power) {\n    if (power >= ___) {\n        cout << "___" << endl;\n    } else {\n        cout << "___" << endl;\n    }\n}\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

void checkVisitor(int power) {
    if (power >= 60) {
        cout << "Duoc vao lau dai" << endl;
    } else {
        cout << "Chua du dieu kien" << endl;
    }
}

int main() {
    checkVisitor(80);
    checkVisitor(45);
    return 0;
}`,
  },

  // ───────────────────────────── 5. Nhiệm vụ: kết hợp for + if–else
  {
    id: 'l5-c5-mission',
    lessonId: 'l5',
    kind: 'mission',
    title: 'Đánh số bậc thang',
    story:
      'Cầu thang xoắn của lâu đài có 6 bậc. Bậc chẵn lát đá sáng, bậc lẻ lát đá tối. Em cần một chương trình đánh dấu từng bậc — và lần này thì vòng lặp phải bắt tay với if–else.',
    instructions: [
      'Dùng vòng lặp for chạy từ 1 tới 6',
      'Với mỗi bậc, dùng if–else để in ra:',
      '   · Nếu số bậc chia hết cho 2  →  Bac i: da sang',
      '   · Ngược lại                  →  Bac i: da toi',
      'Mẹo: phép  i % 2  cho ra số dư khi chia i cho 2',
      '   Số chẵn thì  i % 2  bằng 0',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Vòng lặp for kết hợp if-else ở đây

    return 0;
}`,
    expectedOutput:
      'Bac 1: da toi\nBac 2: da sang\nBac 3: da toi\nBac 4: da sang\nBac 5: da toi\nBac 6: da sang',
    requiredPatterns: ['stmt:for', 'stmt:for>stmt:if-else'],
    testCases: [
      {
        id: 'l5-c5-t1',
        name: 'Sáu bậc thang được đánh dấu đúng loại đá',
        kind: 'output',
        expectedOutput:
          'Bac 1: da toi\nBac 2: da sang\nBac 3: da toi\nBac 4: da sang\nBac 5: da toi\nBac 6: da sang',
        required: true,
        visible: true,
      },
      {
        id: 'l5-c5-t2',
        name: 'if–else nằm bên trong vòng lặp for',
        kind: 'structure',
        patterns: ['stmt:for>stmt:if-else'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'FOR_WRONG_COUNT',
        message:
          'Cầu thang có 6 bậc, đánh số từ 1. Em kiểm tra lại điều kiện của vòng lặp — với `i` bắt đầu từ 1 thì cần `i <= 6`.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em cần làm việc này 6 lần, và mỗi lần lại phải chọn một trong hai kết quả. Vậy cấu trúc nào nằm ngoài, cấu trúc nào nằm trong?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Vòng `for` nằm ngoài, khối `if–else` nằm bên trong thân vòng lặp. Điều kiện kiểm tra số chẵn viết là `i % 2 == 0` — chú ý dùng hai dấu bằng.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nfor (int i = 1; i <= 6; i++) {\n    if (i % 2 == 0) {\n        cout << "Bac " << i << ": da sang" << endl;\n    } else {\n        cout << "Bac " << i << ": ___" << endl;\n    }\n}\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 6; i++) {
        if (i % 2 == 0) {
            cout << "Bac " << i << ": da sang" << endl;
        } else {
            cout << "Bac " << i << ": da toi" << endl;
        }
    }

    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 6. Debug Challenge 1
  {
    id: 'l5-c6-debug',
    lessonId: 'l5',
    kind: 'debug',
    title: 'Cả hai cánh cửa cùng mở',
    story:
      'Chương trình này in ra CẢ HAI dòng, dù lẽ ra chỉ được chọn một. Byte nhìn qua là biết ngay: "Đây không phải if–else. Đây là hai khối if rời nhau — chúng chẳng liên quan gì tới nhau cả."',
    instructions: [
      'Chương trình đang in ra hai dòng, nhưng chỉ được phép in một',
      'Nguyên nhân: hai khối if độc lập, không phải một cấu trúc if–else',
      'Sửa thành cấu trúc if–else đúng chuẩn',
      'Với magicPower bằng 20, kết quả đúng chỉ có:  Phep thuat yeu',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int magicPower = 20;

    if (magicPower >= 50) {
        cout << "Phep thuat manh" << endl;
    }

    if (magicPower < 100) {
        cout << "Phep thuat yeu" << endl;
    }

    return 0;
}`,
    expectedOutput: 'Phep thuat yeu',
    requiredPatterns: ['stmt:if-else'],
    testCases: [
      {
        id: 'l5-c6-t1',
        name: 'Chỉ một kết luận được in ra',
        kind: 'output',
        expectedOutput: 'Phep thuat yeu',
        required: true,
        visible: true,
      },
      {
        id: 'l5-c6-t2',
        name: 'Đã dùng if–else thay cho hai khối if rời',
        kind: 'structure',
        patterns: ['stmt:if-else'],
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
          'Hai khối if hiện tại có liên quan gì tới nhau không? Nếu chúng độc lập, cả hai điều kiện cùng đúng thì chuyện gì xảy ra?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Muốn chỉ chạy một trong hai, em nối chúng lại: giữ khối `if` đầu tiên, rồi thay `}` + `if (...)` ở giữa bằng `} else {`. Điều kiện thứ hai không cần nữa.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code sau khi sửa:\n```cpp\nif (magicPower >= 50) {\n    cout << "Phep thuat manh" << endl;\n} else {\n    cout << "___" << endl;\n}\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

int main() {
    int magicPower = 20;

    if (magicPower >= 50) {
        cout << "Phep thuat manh" << endl;
    } else {
        cout << "Phep thuat yeu" << endl;
    }

    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 7. Debug Challenge 2
  {
    id: 'l5-c7-debug',
    lessonId: 'l5',
    kind: 'debug',
    title: 'Bốn vết cắn cuối cùng',
    story:
      'Trước phòng ngai vàng, một đàn Bug nhỏ đã cắn nát chương trình canh gác. Bốn lỗi, đủ mọi loại em từng gặp. Đây là bài kiểm tra tổng hợp trước khi gặp Bug King.',
    instructions: [
      'Chương trình có bốn lỗi khác nhau',
      'Gợi ý: một tên hàm gọi sai, một dấu ; bị thiếu,',
      '   một dấu = lẽ ra phải là ==, và một vòng lặp thiếu phần tăng biến đếm',
      'Sửa từng lỗi rồi bấm Chạy lại sau mỗi lần sửa',
      'Kết quả đúng gồm ba dòng:  Canh gac 1  /  Canh gac 2  /  Bao cao: an toan',
    ],
    starterCode: `#include <iostream>
using namespace std;

void reportStatus(int code) {
    if (code = 0) {
        cout << "Bao cao: an toan" << endl;
    } else {
        cout << "Bao cao: co bien" << endl
    }
}

int main() {
    for (int i = 1; i <= 2; ) {
        cout << "Canh gac " << i << endl;
        i++;
    }

    reportstatus(0);

    return 0;
}`,
    expectedOutput: 'Canh gac 1\nCanh gac 2\nBao cao: an toan',
    requiredPatterns: ['stmt:if-else', 'stmt:for', 'call:reportStatus'],
    testCases: [
      {
        id: 'l5-c7-t1',
        name: 'Canh gác hai vòng rồi báo cáo an toàn',
        kind: 'output',
        expectedOutput: 'Canh gac 1\nCanh gac 2\nBao cao: an toan',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'ASSIGN_IN_CONDITION',
        message:
          'Trong `if (code = 0)`, em cần `==` để so sánh. Với một dấu `=`, phép gán trả về 0 nên khối else luôn chạy.',
        hintLevel: 1,
      },
      {
        errorCode: 'FUNC_NAME_MISMATCH',
        message:
          'Em khai báo `reportStatus` (chữ S hoa) nhưng lại gọi `reportstatus` (chữ s thường). C++ phân biệt chữ hoa chữ thường rất nghiêm.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Bốn lỗi nghe thì nhiều, nhưng sửa từng cái một là xong. Em bấm Chạy, đọc thông báo, sửa đúng một lỗi, rồi lại bấm Chạy. Cứ lặp lại cho tới khi hết.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Bốn chỗ cần soi:\n1. Điều kiện trong `if` của hàm — một dấu bằng hay hai?\n2. Ký tự cuối dòng `cout` trong khối `else`\n3. Phần thứ ba trong ngoặc của vòng `for`\n4. Tên hàm ở dòng gọi trong main — chữ hoa chữ thường đã khớp chưa?',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Bốn chỗ cần sửa:\n```cpp\nif (code ___ 0) {                      // cần hai dấu bằng\ncout << "Bao cao: co bien" << endl___  // thiếu dấu ;\nfor (int i = 1; i <= 2; ___) {         // thiếu i++\n___(0);                                // tên hàm sai chữ hoa\n```\nLưu ý: nếu em thêm `i++` vào ngoặc for thì phải xoá dòng `i++;` bên trong thân vòng lặp, không thì nó tăng hai lần.',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

void reportStatus(int code) {
    if (code == 0) {
        cout << "Bao cao: an toan" << endl;
    } else {
        cout << "Bao cao: co bien" << endl;
    }
}

int main() {
    for (int i = 1; i <= 2; i++) {
        cout << "Canh gac " << i << endl;
    }

    reportStatus(0);

    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 8. Clean Code Check
  {
    id: 'l5-c8-cleancode',
    lessonId: 'l5',
    kind: 'cleancode',
    title: 'Dọn dẹp phòng ngai vàng',
    story:
      'Chương trình cuối cùng này chạy đúng, nhưng nó gom tất cả vào main, lặp code, và đặt tên biến kiểu chỉ mình tác giả hiểu. Trước khi đối đầu Bug King, em dọn nó cho tử tế đã.',
    instructions: [
      'Code chạy đúng rồi — kết quả in ra phải giữ nguyên',
      'Ba việc cần làm:',
      '   · Đổi tên biến  n  thành  torchCount',
      '   · Tách phần in ba dòng đuốc thành hàm lightTorches()',
      '   · Thụt lề đều và thêm khoảng trắng quanh các dấu phép tính',
      'Sau khi dọn, main chỉ nên còn vài dòng ngắn gọn',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
int n=3;
cout << "Thap duoc so 1" << endl;
cout << "Thap duoc so 2" << endl;
cout << "Thap duoc so 3" << endl;
cout << "Tong so duoc: " << n << endl;
return 0;
}`,
    expectedOutput:
      'Thap duoc so 1\nThap duoc so 2\nThap duoc so 3\nTong so duoc: 3',
    requiredPatterns: ['decl:func:lightTorches'],
    testCases: [
      {
        id: 'l5-c8-t1',
        name: 'Kết quả in ra vẫn đúng như cũ',
        kind: 'output',
        expectedOutput:
          'Thap duoc so 1\nThap duoc so 2\nThap duoc so 3\nTong so duoc: 3',
        required: true,
        visible: true,
      },
      {
        id: 'l5-c8-t2',
        name: 'Đã tách phần thắp đuốc thành hàm riêng',
        kind: 'structure',
        patterns: ['decl:func:lightTorches'],
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
          'Trong main đang có mấy nhóm việc khác nhau? Nhóm nào có thể tách ra thành một hàm có tên rõ nghĩa?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ba dòng thắp đuốc là một nhóm việc — cắt chúng ra, đặt vào hàm `void lightTorches()` phía trên main. Biến `n` nên đổi thành tên nói rõ nó đếm cái gì. Đừng quên thụt lề và khoảng trắng quanh dấu `=`.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code sạch:\n```cpp\nvoid lightTorches() {\n    // ba dòng cout thắp đuốc\n}\n\nint main() {\n    int torchCount = 3;\n\n    lightTorches();\n    cout << "Tong so duoc: " << torchCount << endl;\n\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: [
      { rule: 'indent', weight: 20 },
      { rule: 'meaningful-var', weight: 25 },
      { rule: 'extract-function', weight: 20 },
      { rule: 'action-verb-func', weight: 15 },
      { rule: 'spacing', weight: 20 },
    ],
    minCleanCodeScore: 85,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

void lightTorches() {
    cout << "Thap duoc so 1" << endl;
    cout << "Thap duoc so 2" << endl;
    cout << "Thap duoc so 3" << endl;
}

int main() {
    int torchCount = 3;

    lightTorches();
    cout << "Tong so duoc: " << torchCount << endl;

    return 0;
}`,
  },

  // ────────────────────────────────────────── 9. Boss cuối khoá — Bug King
  {
    id: 'l5-c9-boss',
    lessonId: 'l5',
    kind: 'boss',
    title: 'BOSS CUỐI — Bug King',
    story:
      'Bug King đứng chắn giữa phòng ngai vàng, ba lớp giáp dữ liệu bao quanh. Đây là trận cuối của cả hành trình: em phải dùng hàm, vòng lặp và if–else cùng lúc. Byte đứng cạnh, gật đầu: "Em đã đi qua bốn khu vực để tới đây. Làm được mà."',
    instructions: [
      'Sửa các lỗi có sẵn trong code',
      'Viết hàm attackOrCelebrate() chứa một cấu trúc if–else:',
      '   · Nếu getBugHp() lớn hơn 0  →  gọi attackBug()',
      '   · Ngược lại                 →  in ra  Bug King da bi danh bai!',
      'Trong main, dùng vòng lặp for gọi attackOrCelebrate() đúng 4 lần',
      'Bug King có 3 lớp giáp, nên đòn thứ 4 sẽ là lời tuyên bố chiến thắng',
      'Viết code sạch: thụt lề đều, tên hàm bắt đầu bằng động từ',
    ],
    starterCode: `#include <iostream>
using namespace std;

void attackOrCelebrate() {
    if (getBugHp() > 0) {
        attackBug()
    } else {
        // In ra lời tuyên bố chiến thắng ở đây
    }
}

int main() {
    // Dùng vòng lặp for gọi attackOrCelebrate() 4 lần

    return 0;
}`,
    expectedOutput: 'Bug King da bi danh bai!',
    requiredPatterns: [
      'decl:func:attackOrCelebrate',
      'decl:func:attackOrCelebrate>stmt:if-else',
      'stmt:for>call:attackOrCelebrate',
    ],
    forbiddenPatterns: ['call:attackOrCelebrate:count>=2'],
    world: {
      cols: 3,
      startCol: 0,
      goalCol: 2,
      props: [{ id: 'bug-king', type: 'bug', col: 2 }],
      initialState: { bugHp: 3, energy: 10 },
    },
    testCases: [
      {
        id: 'l5-c9-t1',
        name: 'Ba lớp giáp của Bug King bị phá hết',
        kind: 'world',
        expectedWorld: { bugHp: 0 },
        required: true,
        visible: true,
      },
      {
        id: 'l5-c9-t2',
        name: 'Tuyên bố chiến thắng được in ra',
        kind: 'output',
        expectedOutput: 'Bug King da bi danh bai!',
        required: true,
        visible: true,
      },
      {
        id: 'l5-c9-t3',
        name: 'Kết hợp đủ ba kiến thức: hàm, vòng lặp và if–else',
        kind: 'structure',
        patterns: [
          'decl:func:attackOrCelebrate',
          'stmt:for>call:attackOrCelebrate',
          'stmt:if-else',
        ],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Đòn tấn công chưa hoàn tất — dòng `attackBug()` còn thiếu dấu `;` ở cuối. Bug King vẫn đứng vững đấy!',
        hintLevel: 1,
      },
      {
        errorCode: 'PATTERN_FORBIDDEN',
        detect: 'call:attackOrCelebrate:count>=2',
        message:
          'Cách này cũng hạ được Bug King, nhưng trận cuối muốn em dùng đúng một lời gọi đặt trong vòng `for` — thể hiện trọn vẹn cả ba kiến thức đã học.',
        hintLevel: 2,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Bug King có 3 lớp giáp nhưng vòng lặp chạy 4 lần. Ba lần đầu làm gì, và lần thứ tư — khi giáp đã hết — thì khối nào của if–else sẽ chạy?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ba phần ghép lại:\n· Hàm `attackOrCelebrate()` chứa `if (getBugHp() > 0) { ... } else { ... }`\n· Trong main, vòng `for (int i = 0; i < 4; i++)`\n· Bên trong vòng lặp chỉ có đúng một dòng: gọi hàm đó\nĐừng quên rà lại dấu `;` ở mọi câu lệnh.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung phần còn thiếu:\n```cpp\n    } else {\n        cout << "___" << endl;\n    }\n}\n\nint main() {\n    for (int i = 0; i < ___; i++) {\n        attackOrCelebrate();\n    }\n    return 0;\n}\n```',
      },
    ],
    cleanCodeRules: CLEAN_CODE_WITH_FUNCTIONS,
    thinkingPrompt:
      'Chia bài toán ra ba loại việc: việc nào LẶP LẠI (dùng for), việc nào phải QUYẾT ĐỊNH (dùng if–else), nhóm việc nào ĐẶT TÊN ĐƯỢC (gói thành hàm). Rồi hỏi tiếp: cái nào nằm trong cái nào?',
    whyThisMatters:
      'Đây là bài cuối của cả hành trình, và nó kiểm tra đúng thứ quan trọng nhất: khả năng nhìn một bài toán lớn rồi tự chia thành các phần đã biết cách giải.',
    xpReward: 80,
    solution: `#include <iostream>
using namespace std;

void attackOrCelebrate() {
    if (getBugHp() > 0) {
        attackBug();
    } else {
        cout << "Bug King da bi danh bai!" << endl;
    }
}

int main() {
    for (int i = 0; i < 4; i++) {
        attackOrCelebrate();
    }

    return 0;
}`,
  },
];

const exitTicket: ExitTicket = {
  lessonId: 'l5',
  questions: [
    {
      id: 'l5-q1',
      type: 'knowledge',
      prompt: 'Khác biệt cơ bản giữa hai khối if rời nhau và một cấu trúc if–else là gì?',
      options: [
        'if–else luôn chạy đúng một trong hai khối; hai if rời có thể chạy cả hai hoặc không chạy khối nào',
        'if–else chạy nhanh hơn hai khối if',
        'Hai khối if rời không hợp lệ trong C++',
        'if–else chỉ dùng được bên trong vòng lặp for',
      ],
      correctIndex: 0,
      explanation:
        'Hai khối if độc lập với nhau nên cả hai điều kiện cùng đúng thì cả hai cùng chạy. Còn if–else thì hai nhánh loại trừ nhau, luôn chạy đúng một nhánh.',
    },
    {
      id: 'l5-q2',
      type: 'read-code',
      prompt: 'Đoạn code dưới đây in ra gì?',
      code: `for (int i = 1; i <= 3; i++) {
    if (i == 2) {
        cout << "X";
    } else {
        cout << "o";
    }
}`,
      options: ['oXo', 'ooo', 'XXX', 'oX'],
      correctIndex: 0,
      explanation:
        'i lần lượt là 1, 2, 3. Chỉ khi i bằng 2 thì nhánh if chạy và in X, hai lần còn lại nhánh else chạy và in o. Kết quả là oXo.',
    },
    {
      id: 'l5-q3',
      type: 'self-assess',
      prompt: 'Kết thúc cả hành trình, em thấy mình kết hợp hàm, vòng lặp và if–else ở mức nào?',
      options: [
        'Em tự ghép được cả ba vào một bài toán mà không cần xem lại ví dụ',
        'Em ghép được nhưng còn phải thử vài lần mới đúng',
        'Em làm được khi có gợi ý dẫn đường từng bước',
        'Em còn thấy khó, muốn được thầy giảng lại',
      ],
    },
  ],
  reflectionPrompt:
    'Hãy giải thích ngắn gọn bằng lời của em: chương trình đánh bại Bug King hoạt động thế nào? Vì sao vòng lặp cần chạy 4 lần trong khi Bug King chỉ có 3 lớp giáp?',
};

const meta = LESSONS_META.find((item) => item.id === 'l5')!;

export const lesson5: Lesson = {
  ...meta,
  conceptGuide: lesson5Guide,
  challenges,
  exitTicket,
};
