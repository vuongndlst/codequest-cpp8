import type { Challenge, ExitTicket, Lesson } from '@/types/content';
import { LESSONS_META } from '@/data/lessons.meta';
import { lesson1Guide } from './guide';
import { STANDARD_CLEAN_CODE } from '../shared';

/**
 * KHU VỰC 1 — LÀNG KHỞI ĐỘNG
 * Cấu trúc chương trình C++ · main() · cout · biến · dấu ; · ngoặc { }
 *
 * Quy ước đặt tên (đã chốt ở Giai đoạn 1): code tiếng Anh, giải thích tiếng Việt.
 * Chuỗi in ra dùng tiếng Việt KHÔNG DẤU để học sinh khỏi vướng khi gõ.
 */

const challenges: Challenge[] = [
  // ─────────────────────────────────────────────────────────── 1. Quan sát
  {
    id: 'l1-c1-observe',
    lessonId: 'l1',
    kind: 'story',
    title: 'Ánh sáng đầu tiên',
    story:
      'Cổng làng Khởi Động tối om đã ba ngày. Byte đưa cho em một mẩu code còn sót lại từ trước khi Bug tấn công. "Thử chạy xem nó nói gì nhé — nhưng trước tiên, em đoán thử kết quả đi!"',
    instructions: [
      'Đọc kỹ đoạn code bên phải và tự đoán xem nó sẽ in ra gì',
      'Bấm "Chạy code" để kiểm tra dự đoán của em',
      'Chú ý: dòng nào làm việc in ra màn hình?',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Cong lang Khoi Dong da mo" << endl;
    return 0;
}`,
    expectedOutput: 'Cong lang Khoi Dong da mo',
    requiredPatterns: ['stmt:cout'],
    testCases: [
      {
        id: 'l1-c1-t1',
        name: 'Cổng làng sáng đèn trở lại',
        kind: 'output',
        expectedOutput: 'Cong lang Khoi Dong da mo',
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
          'Trong đoạn code này, dòng nào là dòng thực sự làm việc in chữ ra màn hình? Em thử tìm dòng có chữ `cout` xem.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Máy tính chạy code từ trên xuống dưới, bắt đầu từ bên trong `int main()`. Nó gặp `cout` thì in phần chữ nằm trong dấu nháy kép ra màn hình.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Bài này em chỉ cần bấm nút "Chạy code" thôi — không phải sửa gì cả. Cứ mạnh dạn bấm nhé!',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 10,
  },

  // ─────────────────────────────────────────────────── 2. Khám phá lệnh cout
  {
    id: 'l1-c2-concept',
    lessonId: 'l1',
    kind: 'concept',
    title: 'Khám phá lệnh cout',
    story:
      'Byte lấy ra một tấm bảng khắc: "cout là câu thần chú để nói chuyện với thế giới bên ngoài. Dấu << giống hai mũi tên đẩy chữ ra màn hình. Giờ em thử tự viết một câu chào đi."',
    instructions: [
      'Cú pháp: cout << "dòng chữ" << endl;',
      'Ý nghĩa: đưa nội dung ra màn hình. endl có nghĩa là xuống dòng',
      'Chữ thì cần dấu nháy kép, và câu lệnh nào cũng kết thúc bằng dấu ;',
      'Nhiệm vụ: in ra đúng dòng chữ  Xin chao ByteLand',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Viết lệnh cout của em ở dòng dưới

    return 0;
}`,
    expectedOutput: 'Xin chao ByteLand',
    requiredPatterns: ['stmt:cout'],
    testCases: [
      {
        id: 'l1-c2-t1',
        name: 'In đúng lời chào ByteLand',
        kind: 'output',
        expectedOutput: 'Xin chao ByteLand',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'COUT_SYNTAX',
        message:
          'Sau `cout` cần HAI dấu nhỏ hơn `<<` chứ không phải một. Em viết lại thành `cout << "Xin chao ByteLand";` nhé.',
        hintLevel: 2,
      },
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Ở Làng Khởi Động, mỗi câu lệnh đều phải kết thúc bằng dấu `;` thì cổng làng mới hiểu được. Em kiểm tra cuối dòng `cout` nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em cần in ra dòng chữ nào? Dòng chữ đó phải được đặt trong dấu gì để máy tính hiểu đó là chữ chứ không phải tên biến?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Cấu trúc là: `cout` rồi tới `<<` rồi tới dòng chữ trong dấu nháy kép, rồi `<< endl`, cuối cùng là dấu `;`',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Em điền vào chỗ trống:\n```cpp\ncout << "___" << endl;\n```\nChỗ trống là dòng chữ mà đề bài yêu cầu.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 10,
    solution: `#include <iostream>
using namespace std;

int main() {
    cout << "Xin chao ByteLand" << endl;
    return 0;
}`,
  },

  // ──────────────────────────────────────────────────────── 3. Thử ngay
  {
    id: 'l1-c3-sandbox',
    lessonId: 'l1',
    kind: 'sandbox',
    title: 'Thử ngay: hai dòng chữ',
    story:
      'Cổng làng cần hai dòng thông báo, không phải một. Byte nhắc: "Muốn xuống dòng thì dùng endl. Không có endl thì hai dòng dính liền vào nhau đấy."',
    instructions: [
      'Thêm một lệnh cout thứ hai',
      'Dòng 1 phải in ra:  Code Guardian da den',
      'Dòng 2 phải in ra:  San sang giai cuu ByteLand',
      'Nhớ endl ở cuối mỗi dòng để chúng không dính vào nhau',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Code Guardian da den" << endl;
    // Thêm dòng thứ hai ở đây

    return 0;
}`,
    expectedOutput: 'Code Guardian da den\nSan sang giai cuu ByteLand',
    requiredPatterns: ['stmt:cout'],
    testCases: [
      {
        id: 'l1-c3-t1',
        name: 'In đủ hai dòng, mỗi dòng một hàng',
        kind: 'output',
        expectedOutput: 'Code Guardian da den\nSan sang giai cuu ByteLand',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Câu lệnh `cout` mới em vừa thêm hình như còn thiếu dấu `;` ở cuối. Em kiểm tra lại nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Dòng đầu tiên đã có sẵn rồi. Em cần thêm bao nhiêu lệnh `cout` nữa để có đủ hai dòng?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Chép lại cấu trúc của dòng đầu tiên, chỉ đổi phần chữ bên trong dấu nháy kép. Nhớ giữ nguyên `<< endl;` ở cuối.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Dòng em cần thêm có dạng:\n```cpp\ncout << "___" << endl;\n```\nChỗ trống điền: San sang giai cuu ByteLand',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 15,
    solution: `#include <iostream>
using namespace std;

int main() {
    cout << "Code Guardian da den" << endl;
    cout << "San sang giai cuu ByteLand" << endl;
    return 0;
}`,
  },

  // ─────────────────────────────────────────────── 4. Nhiệm vụ: biến đầu tiên
  {
    id: 'l1-c4-mission',
    lessonId: 'l1',
    kind: 'mission',
    title: 'Ô nhớ năng lượng',
    story:
      'Cổng làng cần biết còn bao nhiêu năng lượng. "Máy tính cần một chỗ để cất con số," Byte giải thích. "Chỗ đó gọi là biến — em đặt tên cho nó, rồi bỏ giá trị vào."',
    instructions: [
      'Khai báo một biến kiểu int tên là energy, giá trị bằng 100',
      'In ra màn hình:  Nang luong: 100',
      'Lưu ý: phần chữ "Nang luong: " nằm trong nháy kép, còn energy thì không',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Khai báo biến energy ở đây

    cout << "Nang luong: ";
    // In giá trị của biến energy ở đây

    return 0;
}`,
    expectedOutput: 'Nang luong: 100',
    requiredPatterns: ['decl:var:int', 'stmt:cout'],
    testCases: [
      {
        id: 'l1-c4-t1',
        name: 'In đúng dòng năng lượng',
        kind: 'output',
        expectedOutput: 'Nang luong: 100',
        required: true,
        visible: true,
      },
      {
        id: 'l1-c4-t2',
        name: 'Có dùng biến chứ không viết thẳng số vào chuỗi',
        kind: 'structure',
        patterns: ['decl:var:int'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'VAR_UNDECLARED',
        message:
          'Em đang dùng một biến chưa được khai báo. Trước khi dùng, em cần viết `int energy = 100;` nhé.',
        hintLevel: 2,
      },
      {
        errorCode: 'VAR_TYPO',
        message:
          'Tên biến khi khai báo và khi dùng phải giống hệt nhau, kể cả chữ hoa chữ thường. Em so lại hai chỗ nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Để cất một số nguyên, em cần dùng kiểu dữ liệu nào? Và sau khi đã có biến rồi, làm sao in giá trị của nó ra mà không có dấu nháy kép?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Khai báo biến có dạng: `kiểu tênBiến = giá trị;`\nIn biến ra thì viết `cout << tênBiến;` — không có dấu nháy kép quanh tên biến.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nint energy = ___;\ncout << "Nang luong: ";\ncout << ___ << endl;\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 25,
    // Sân khấu Tháp Tín Hiệu: đèn sáng theo từng cout, tinh thể giữ giá trị biến
    world: { kind: 'signal-tower', cols: 0 },
    solution: `#include <iostream>
using namespace std;

int main() {
    int energy = 100;

    cout << "Nang luong: ";
    cout << energy << endl;

    return 0;
}`,
  },

  // ──────────────────────────────────────── 5. Nhiệm vụ: thẻ Code Guardian
  {
    id: 'l1-c5-mission',
    lessonId: 'l1',
    kind: 'mission',
    title: 'Thẻ Code Guardian',
    story:
      'Muốn qua cổng, em phải trình thẻ căn cước. Byte đưa mẫu thẻ: cần đủ tên, cấp độ và năng lượng. "Mỗi thông tin một biến, mỗi dòng một thông tin nhé."',
    instructions: [
      'Khai báo biến string guardianName với giá trị "Byte Guardian"',
      'Khai báo biến int level với giá trị 1',
      'In ra ba dòng, theo đúng thứ tự:',
      '   The Code Guardian',
      '   Ten: Byte Guardian',
      '   Cap do: 1',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    string guardianName = "Byte Guardian";
    // Khai báo biến level ở đây

    cout << "The Code Guardian" << endl;
    // In hai dòng còn lại ở đây

    return 0;
}`,
    expectedOutput: 'The Code Guardian\nTen: Byte Guardian\nCap do: 1',
    requiredPatterns: ['decl:var:int', 'decl:var:string'],
    testCases: [
      {
        id: 'l1-c5-t1',
        name: 'Thẻ hiện đủ ba dòng thông tin',
        kind: 'output',
        expectedOutput: 'The Code Guardian\nTen: Byte Guardian\nCap do: 1',
        required: true,
        visible: true,
      },
      {
        id: 'l1-c5-t2',
        name: 'Dùng biến để lưu tên và cấp độ',
        kind: 'structure',
        patterns: ['decl:var:int', 'decl:var:string'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Có một dòng khai báo biến hoặc `cout` còn thiếu dấu `;`. Em rà lại từ trên xuống nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Em cần in ra ba dòng. Mỗi dòng có phần chữ cố định và có thể có phần giá trị biến. Dòng "Ten: Byte Guardian" gồm mấy phần?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Một lệnh `cout` nối được nhiều phần bằng nhiều dấu `<<`:\n`cout << "chữ " << tenBien << endl;`',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code:\n```cpp\nint level = ___;\n\ncout << "The Code Guardian" << endl;\ncout << "Ten: " << ___ << endl;\ncout << "Cap do: " << ___ << endl;\n```',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

int main() {
    string guardianName = "Byte Guardian";
    int level = 1;

    cout << "The Code Guardian" << endl;
    cout << "Ten: " << guardianName << endl;
    cout << "Cap do: " << level << endl;

    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 6. Debug Challenge 1
  {
    id: 'l1-c6-debug',
    lessonId: 'l1',
    kind: 'debug',
    title: 'Bug săn dấu chấm phẩy',
    story:
      'Một con Bug nhỏ đã lẻn vào bảng điều khiển và gặm mất vài dấu chấm phẩy. Chương trình không chạy nổi. "Nhiệm vụ của em là tìm ra chỗ nó cắn," Byte nói.',
    instructions: [
      'Chương trình dưới đây có lỗi — hãy tìm và sửa',
      'Đọc kỹ thông báo lỗi, nó luôn cho biết dòng nào có vấn đề',
      'Kết quả đúng phải là hai dòng:  Dang khoi dong…  và  He thong san sang',
      'Đừng viết lại từ đầu — chỉ sửa đúng chỗ bị hỏng thôi',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Dang khoi dong..." << endl
    cout << "He thong san sang" << endl;
    return 0;
}`,
    expectedOutput: 'Dang khoi dong...\nHe thong san sang',
    requiredPatterns: ['stmt:cout'],
    testCases: [
      {
        id: 'l1-c6-t1',
        name: 'Chương trình chạy và in đủ hai dòng',
        kind: 'output',
        expectedOutput: 'Dang khoi dong...\nHe thong san sang',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'MISSING_SEMICOLON',
        message:
          'Đúng rồi, chính là lỗi thiếu dấu `;`! Con Bug đã cắn mất dấu `;` ở cuối dòng 5. Em thêm nó vào nhé.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Thông báo lỗi đang chỉ vào dòng nào? Em thử so dòng đó với dòng ngay bên dưới — hai dòng gần giống nhau, nhưng có một chỗ khác biệt nhỏ.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Mọi câu lệnh trong C++ đều phải kết thúc bằng dấu `;`. Em kiểm tra kỹ ký tự cuối cùng của từng dòng `cout`.',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Dòng 5 hiện đang là:\n```cpp\ncout << "Dang khoi dong..." << endl\n```\nNó còn thiếu một ký tự ở cuối cùng. Ký tự đó là dấu chấm phẩy.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

int main() {
    cout << "Dang khoi dong..." << endl;
    cout << "He thong san sang" << endl;
    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 7. Debug Challenge 2
  {
    id: 'l1-c7-debug',
    lessonId: 'l1',
    kind: 'debug',
    title: 'Ba vết cắn của Bug',
    story:
      'Con Bug này tham lam hơn: nó cắn tới ba chỗ khác nhau trong một chương trình. Byte xoa tay: "Bình tĩnh. Sửa từng lỗi một, chạy lại sau mỗi lần sửa. Đừng cố sửa hết cùng lúc."',
    instructions: [
      'Chương trình có ba lỗi khác nhau',
      'Gợi ý loại lỗi: một tên biến bị viết sai, một dấu ; bị thiếu, một dấu ngoặc bị thiếu',
      'Sửa từng lỗi rồi bấm Chạy — thông báo lỗi sẽ dẫn em tới lỗi tiếp theo',
      'Kết quả đúng:  Kho bau: 50 vien ngoc',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
    int gemCount = 50

    cout << "Kho bau: " << gemCounts << " vien ngoc" << endl;
    return 0;`,
    expectedOutput: 'Kho bau: 50 vien ngoc',
    requiredPatterns: ['decl:var:int', 'stmt:cout'],
    testCases: [
      {
        id: 'l1-c7-t1',
        name: 'Kho báu hiện đúng số ngọc',
        kind: 'output',
        expectedOutput: 'Kho bau: 50 vien ngoc',
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'UNBALANCED_BRACE',
        message:
          'Con Bug đã cắn mất dấu `}` đóng hàm `main`. Em thêm một dấu `}` ở cuối chương trình nhé.',
        hintLevel: 2,
      },
      {
        errorCode: 'VAR_TYPO',
        message:
          'Con Bug đã thêm một chữ `s` vào tên biến! Em khai báo là `gemCount` nhưng lúc dùng lại thành `gemCounts`.',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Sửa từng lỗi một nhé. Bắt đầu từ lỗi mà hệ thống đang báo. Sau khi sửa xong, bấm Chạy lại để xem lỗi tiếp theo là gì.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ba chỗ cần kiểm tra:\n1. Dòng khai báo `gemCount` — kết thúc bằng ký tự gì?\n2. Tên biến ở dòng `cout` — có giống hệt lúc khai báo không?\n3. Đếm số dấu `{` và số dấu `}` — chúng có bằng nhau không?',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Chương trình đúng có khung như sau:\n```cpp\nint main() {\n    int gemCount = 50;\n\n    cout << "Kho bau: " << gemCount << " vien ngoc" << endl;\n    return 0;\n}\n```\nEm so từng dòng với code hiện tại để tìm ra ba chỗ khác biệt.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    xpReward: 30,
    solution: `#include <iostream>
using namespace std;

int main() {
    int gemCount = 50;

    cout << "Kho bau: " << gemCount << " vien ngoc" << endl;
    return 0;
}`,
  },

  // ───────────────────────────────────────────────────── 8. Clean Code Check
  {
    id: 'l1-c8-cleancode',
    lessonId: 'l1',
    kind: 'cleancode',
    title: 'Dọn dẹp bảng điều khiển',
    story:
      'Chương trình này chạy đúng — nhưng nhìn vào thì rối mắt kinh khủng. Byte lắc đầu: "Code chạy được là tốt. Code chạy được VÀ dễ đọc mới là giỏi. Em dọn lại giúp mình nhé."',
    instructions: [
      'Code dưới đây CHẠY ĐÚNG rồi — em không cần sửa logic',
      'Việc của em là làm nó dễ đọc hơn:',
      '   · Đổi tên biến  a  thành một tên nói rõ nó chứa gì (ví dụ: villageEnergy)',
      '   · Tách các câu lệnh đang dồn trên một dòng ra thành nhiều dòng',
      '   · Thụt lề phần code bên trong dấu { } vào một cấp',
      '   · Thêm khoảng trắng hai bên dấu =',
      'Kết quả in ra phải giữ nguyên như cũ',
    ],
    starterCode: `#include <iostream>
using namespace std;

int main() {
int a=75;cout << "Nang luong lang: ";cout << a;cout << endl;
return 0;
}`,
    expectedOutput: 'Nang luong lang: 75',
    requiredPatterns: ['decl:var:int', 'stmt:cout'],
    testCases: [
      {
        id: 'l1-c8-t1',
        name: 'Kết quả in ra vẫn đúng như cũ',
        kind: 'output',
        expectedOutput: 'Nang luong lang: 75',
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
          'Nhìn dòng dài nhất trong chương trình: nó có mấy dấu `;`? Mỗi dấu `;` là kết thúc của một câu lệnh — vậy dòng đó đang chứa bao nhiêu câu lệnh?',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Ba việc cần làm:\n1. Mỗi câu lệnh xuống một dòng riêng\n2. Thụt vào 4 dấu cách cho phần bên trong `main()`\n3. Đổi `a` thành tên có nghĩa, nhớ đổi ở CẢ HAI chỗ: lúc khai báo và lúc dùng',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung code sạch:\n```cpp\nint main() {\n    int ___ = 75;\n\n    cout << "Nang luong lang: ";\n    cout << ___;\n    cout << endl;\n\n    return 0;\n}\n```\nHai chỗ trống điền cùng một tên biến mới.',
      },
    ],
    cleanCodeRules: [
      { rule: 'indent', weight: 25 },
      { rule: 'one-statement-per-line', weight: 30 },
      { rule: 'meaningful-var', weight: 30 },
      { rule: 'spacing', weight: 15 },
    ],
    // Ở node này, dọn code chính là nhiệm vụ — không có ngưỡng thì bấm Chạy là qua
    minCleanCodeScore: 85,
    xpReward: 25,
    solution: `#include <iostream>
using namespace std;

int main() {
    int villageEnergy = 75;

    cout << "Nang luong lang: ";
    cout << villageEnergy;
    cout << endl;

    return 0;
}`,
  },

  // ─────────────────────────────────────────────────────── 9. Boss Challenge
  {
    id: 'l1-c9-boss',
    lessonId: 'l1',
    kind: 'boss',
    title: 'BOSS — Kích hoạt lại cổng làng',
    story:
      'Bug Chúa Nhỏ đã phá nát chương trình điều khiển cổng làng: sáu lỗi rải khắp file, và một phần code còn bị xoá mất. Đây là thử thách cuối của Khu vực 1. "Em có đủ mọi thứ cần thiết rồi," Byte nói. "Bình tĩnh, sửa từng lỗi một."',
    instructions: [
      'Sửa toàn bộ lỗi để chương trình chạy được',
      'Bổ sung phần còn thiếu: khai báo biến gateCode với giá trị 8888',
      'Chương trình phải in ra đúng ba dòng:',
      '   LANG KHOI DONG',
      '   Ma cong: 8888',
      '   Cong da mo. Chao mung Code Guardian!',
      'Viết code sạch: thụt lề đều, mỗi câu lệnh một dòng, tên biến rõ nghĩa',
    ],
    starterCode: `#include <iostream>
using namespace std

int main() {
    // Khai báo biến gateCode ở đây

    cout < "LANG KHOI DONG" << endl;
    cout << "Ma cong: " << gatecode << endl
    cout << "Cong da mo. Chao mung Code Guardian!" << endl;
    return 0;
`,
    expectedOutput: 'LANG KHOI DONG\nMa cong: 8888\nCong da mo. Chao mung Code Guardian!',
    requiredPatterns: ['decl:var:int', 'stmt:cout'],
    testCases: [
      {
        id: 'l1-c9-t1',
        name: 'Cổng làng mở với đúng ba dòng thông báo',
        kind: 'output',
        expectedOutput: 'LANG KHOI DONG\nMa cong: 8888\nCong da mo. Chao mung Code Guardian!',
        required: true,
        visible: true,
      },
      {
        id: 'l1-c9-t2',
        name: 'Mã cổng được lưu trong một biến',
        kind: 'structure',
        patterns: ['decl:var:int'],
        required: true,
        visible: true,
      },
    ],
    commonMistakes: [
      {
        errorCode: 'COUT_SYNTAX',
        message:
          'Bug Chúa đã cắn mất một dấu nhỏ hơn! Dòng in "LANG KHOI DONG" đang dùng `<` thay vì `<<`.',
        hintLevel: 1,
      },
      {
        errorCode: 'VAR_TYPO',
        message:
          'Tên biến phải viết giống hệt nhau. Em khai báo `gateCode` (chữ C hoa) nhưng chỗ dùng lại là `gatecode` (chữ c thường).',
        hintLevel: 1,
      },
    ],
    hints: [
      {
        level: 1,
        type: 'question',
        content:
          'Bình tĩnh nhé — sáu lỗi nghe thì nhiều nhưng sửa từng cái một là xong. Em bấm Chạy, đọc thông báo, sửa đúng một lỗi, rồi lại bấm Chạy. Lặp lại tới khi hết.',
      },
      {
        level: 2,
        type: 'structure',
        content:
          'Danh sách chỗ cần kiểm tra:\n1. Dòng `using namespace std` — thiếu ký tự gì ở cuối?\n2. Chỗ khai báo biến `gateCode` — chưa có, em phải viết thêm\n3. Dòng in "LANG KHOI DONG" — `<` hay `<<`?\n4. Tên biến ở dòng "Ma cong" — chữ hoa chữ thường đã khớp chưa?\n5. Dòng "Ma cong" — có dấu `;` ở cuối chưa?\n6. Cuối chương trình — số dấu `{` và `}` có bằng nhau không?',
      },
      {
        level: 3,
        type: 'skeleton',
        content:
          'Khung chương trình đúng:\n```cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    int gateCode = ____;\n\n    cout << "LANG KHOI DONG" << endl;\n    cout << "Ma cong: " << ________ << endl;\n    cout << "Cong da mo. Chao mung Code Guardian!" << endl;\n\n    return 0;\n}\n```\nEm điền giá trị mã cổng và tên biến vào hai chỗ trống.',
      },
    ],
    cleanCodeRules: STANDARD_CLEAN_CODE,
    thinkingPrompt:
      'Sáu lỗi nghe thì đáng sợ, nhưng em không cần tìm hết cùng lúc. Câu hỏi duy nhất lúc này là: thông báo đang chỉ vào dòng nào, và dòng đó thiếu ký hiệu gì?',
    whyThisMatters:
      'Bài này rèn thói quen quan trọng nhất khi lập trình: sửa từng lỗi một rồi chạy lại, thay vì cố đoán hết mọi lỗi trong đầu. Lập trình viên đi làm cũng làm đúng như vậy.',
    xpReward: 80,
    solution: `#include <iostream>
using namespace std;

int main() {
    int gateCode = 8888;

    cout << "LANG KHOI DONG" << endl;
    cout << "Ma cong: " << gateCode << endl;
    cout << "Cong da mo. Chao mung Code Guardian!" << endl;

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
      prompt: 'Mọi chương trình C++ đều bắt đầu chạy từ đâu?',
      options: [
        'Từ hàm main()',
        'Từ dòng #include đầu tiên',
        'Từ dòng using namespace std;',
        'Từ dòng cuối cùng của file',
      ],
      correctIndex: 0,
      explanation:
        'Máy tính luôn tìm hàm main() và bắt đầu chạy từ đó. Các dòng #include và using namespace chỉ là phần chuẩn bị.',
    },
    {
      id: 'l1-q2',
      type: 'read-code',
      prompt: 'Đoạn code dưới đây in ra gì?',
      code: `int stepCount = 3;
cout << "Buoc: " << stepCount << endl;`,
      options: ['Buoc: 3', 'Buoc: stepCount', 'stepCount: 3', 'Buoc: "3"'],
      correctIndex: 0,
      explanation:
        'Phần trong dấu nháy kép được in nguyên văn, còn tên biến không có nháy kép nên được thay bằng giá trị của nó là 3.',
    },
    {
      id: 'l1-q3',
      type: 'self-assess',
      prompt: 'Sau bài này, em thấy mình hiểu cấu trúc chương trình C++ và lệnh cout tới mức nào?',
      options: [
        'Em tự viết được mà không cần nhìn lại ví dụ',
        'Em viết được nhưng thỉnh thoảng phải xem lại Sổ tay lệnh',
        'Em làm được khi có gợi ý dẫn đường',
        'Em còn thấy khó, muốn được thầy giảng lại',
      ],
    },
  ],
  reflectionPrompt:
    'Trong bài này, lỗi nào làm em mất nhiều thời gian nhất? Em đã tìm ra nó bằng cách nào?',
};

const meta = LESSONS_META.find((item) => item.id === 'l1')!;

export const lesson1: Lesson = {
  ...meta,
  conceptGuide: lesson1Guide,
  challenges,
  exitTicket,
};
