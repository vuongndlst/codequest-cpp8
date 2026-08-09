import type { HandbookCard } from '@/types/content';

/**
 * Sổ tay lệnh (mục 10 của đề bài) — 12 thẻ.
 *
 * Sổ tay CHỈ hỗ trợ học sinh nhớ cú pháp, KHÔNG chứa lời giải cho challenge nào.
 * Ví dụ trong sổ tay cố ý dùng ngữ cảnh khác với ngữ cảnh nhiệm vụ.
 */

export const HANDBOOK_CARDS: HandbookCard[] = [
  {
    id: 'program-structure',
    title: 'Cấu trúc chương trình',
    introducedInLesson: 'l1',
    syntax: `#include <iostream>
using namespace std;

int main() {
    // code của em ở đây
    return 0;
}`,
    explanation:
      'Mọi chương trình C++ đều có bộ khung này. Máy tính luôn bắt đầu chạy từ hàm main().',
    example: `#include <iostream>
using namespace std;

int main() {
    cout << "Chuong trinh dau tien" << endl;
    return 0;
}`,
    commonMistakes: [
      'Quên dòng #include <iostream> nên không dùng được cout',
      'Viết main() mà thiếu chữ int ở trước',
      'Quên dấu } đóng hàm main',
    ],
    tip: 'Nhớ theo thứ tự: khai báo thư viện → using namespace → hàm main → return 0.',
    keywords: ['include', 'iostream', 'main', 'namespace', 'khung', 'cấu trúc', 'bắt đầu'],
  },

  {
    id: 'cout',
    title: 'cout — In ra màn hình',
    introducedInLesson: 'l1',
    syntax: 'cout << giá_trị;\ncout << "chữ" << biến << endl;',
    explanation:
      'cout đưa thông tin ra màn hình. Dấu << giống như mũi tên đẩy dữ liệu đi ra. endl là xuống dòng.',
    example: `int energy = 7;
cout << "Nang luong: ";
cout << energy << endl;
cout << "Xin chao " << "ByteLand" << endl;`,
    commonMistakes: [
      'Viết một dấu < thay vì hai dấu <<',
      'Quên dấu nháy kép quanh dòng chữ',
      'Quên dấu ; ở cuối câu lệnh',
      'Viết Cout hoặc COUT — C++ phân biệt chữ hoa chữ thường',
    ],
    tip: 'Chữ thì cần dấu nháy kép, biến thì không. So sánh: cout << "score" in ra chữ score, còn cout << score in ra giá trị của biến.',
    keywords: ['cout', 'in', 'hiển thị', 'endl', 'xuống dòng', 'màn hình', 'xuất'],
  },

  {
    id: 'variables',
    title: 'Khai báo biến',
    introducedInLesson: 'l1',
    syntax: 'kiểu tênBiến = giá_trị;',
    explanation:
      'Biến là một ô nhớ có tên để cất giá trị. Phải khai báo kiểu dữ liệu trước khi dùng.',
    example: `int score = 0;        // số nguyên
double speed = 2.5;   // số thập phân
bool hasKey = true;   // đúng / sai
string name = "Byte"; // chuỗi chữ

score = score + 10;   // gán giá trị mới`,
    commonMistakes: [
      'Dùng biến mà chưa khai báo',
      'Viết tên biến lúc hoa lúc thường: score rồi lại Score',
      'Đặt tên biến quá ngắn như x, a — sau vài ngày chính em cũng quên nó là gì',
      'Quên dấu ; ở cuối dòng khai báo',
    ],
    tip: 'Đặt tên biến như đặt tên cho đồ vật: playerScore rõ hơn nhiều so với x.',
    keywords: ['biến', 'khai báo', 'int', 'double', 'bool', 'string', 'gán', 'kiểu dữ liệu'],
  },

  {
    id: 'function-declare',
    title: 'Hàm — Khai báo',
    introducedInLesson: 'l2',
    syntax: `void tênHàm() {
    // các câu lệnh
}`,
    explanation:
      'Hàm gói một nhóm việc lại và đặt cho nó một cái tên. void nghĩa là hàm không trả về giá trị nào.',
    example: `void printGreeting() {
    cout << "Xin chao Code Guardian!" << endl;
}

void showScore() {
    cout << "Diem cua ban" << endl;
}`,
    commonMistakes: [
      'Viết hàm bên trong hàm main — hàm phải nằm ngoài',
      'Quên cặp dấu ngoặc tròn () sau tên hàm',
      'Đặt dấu ; sau dấu } đóng hàm',
      'Viết hàm xong nhưng quên gọi nó',
    ],
    tip: 'Tên hàm nên là một động từ nói rõ hàm làm gì: openDoor, printScore, turnOnLight.',
    keywords: ['hàm', 'function', 'void', 'khai báo hàm', 'tách hàm'],
  },

  {
    id: 'function-call',
    title: 'Gọi hàm',
    introducedInLesson: 'l2',
    syntax: 'tênHàm();',
    explanation:
      'Viết hàm mới chỉ là "dạy" máy tính cách làm. Phải GỌI hàm thì máy mới thực sự làm.',
    example: `void printGreeting() {
    cout << "Xin chao!" << endl;
}

int main() {
    printGreeting();   // gọi lần 1
    printGreeting();   // gọi lần 2
    return 0;
}`,
    commonMistakes: [
      'Khai báo hàm nhưng không gọi trong main',
      'Gọi sai tên: khai báo openDoor nhưng gọi opendoor',
      'Quên cặp ngoặc tròn khi gọi: viết printGreeting; thay vì printGreeting();',
    ],
    tip: 'Tên khi gọi phải giống hệt tên khi khai báo — giống hệt từng chữ hoa chữ thường.',
    keywords: ['gọi hàm', 'call', 'sử dụng hàm', 'chạy hàm'],
  },

  {
    id: 'function-params',
    title: 'Hàm có tham số',
    introducedInLesson: 'l2',
    syntax: `void tênHàm(kiểu thamSố) {
    // dùng thamSố ở đây
}`,
    explanation:
      'Tham số giúp một hàm làm được nhiều việc khác nhau tuỳ theo giá trị em đưa vào.',
    example: `void printScore(int score) {
    cout << "Diem: " << score << endl;
}

int main() {
    printScore(10);
    printScore(25);
    return 0;
}`,
    commonMistakes: [
      'Quên ghi kiểu dữ liệu của tham số: viết (score) thay vì (int score)',
      'Gọi hàm mà quên truyền giá trị vào',
      'Truyền sai số lượng tham số',
    ],
    tip: 'Tham số giống như nguyên liệu em đưa cho đầu bếp — cùng một công thức, nguyên liệu khác thì món khác.',
    keywords: ['tham số', 'parameter', 'truyền giá trị', 'đối số'],
  },

  {
    id: 'for-loop',
    title: 'Vòng lặp for',
    introducedInLesson: 'l3',
    syntax: `for (khởi tạo; điều kiện; cập nhật) {
    // việc cần lặp
}`,
    explanation:
      'Vòng lặp for làm cùng một việc nhiều lần mà em chỉ phải viết một lần. Ba phần trong ngoặc ngăn cách bằng dấu ;',
    example: `// In ra 0 1 2 3 4
for (int i = 0; i < 5; i++) {
    cout << i << " ";
}

// Lặp 3 lần, không quan tâm số đếm
for (int i = 0; i < 3; i++) {
    printGreeting();
}`,
    commonMistakes: [
      'Quên phần tăng biến đếm i++ → vòng lặp chạy mãi không dừng',
      'Dùng dấu phẩy thay vì dấu ; giữa ba phần',
      'Lệch một đơn vị: i <= 5 chạy 6 lần, i < 5 mới chạy 5 lần',
      'Đặt dấu ; ngay sau for(...) → thân vòng lặp thành rỗng',
    ],
    tip: 'Muốn lặp N lần thì viết: for (int i = 0; i < N; i++). Nhớ công thức này là đủ dùng cho hầu hết bài tập.',
    keywords: ['for', 'vòng lặp', 'lặp', 'biến đếm', 'loop', 'lặp lại'],
  },

  {
    id: 'if',
    title: 'Câu lệnh if',
    introducedInLesson: 'l4',
    syntax: `if (điều kiện) {
    // chỉ chạy khi điều kiện đúng
}`,
    explanation:
      'if kiểm tra một điều kiện. Nếu điều kiện đúng thì chạy phần trong ngoặc nhọn, nếu sai thì bỏ qua.',
    example: `int energy = 8;

if (energy > 5) {
    cout << "Du suc di tiep" << endl;
}

if (hasKey == true) {
    openDoor();
}`,
    commonMistakes: [
      'Dùng một dấu = thay vì hai dấu == để so sánh',
      'Đặt dấu ; ngay sau if(...) → phần thân không bao giờ chạy',
      'Quên dấu ngoặc tròn quanh điều kiện',
    ],
    tip: 'Đọc if như tiếng Việt: "nếu năng lượng lớn hơn 5 thì…". Đọc thành lời giúp em phát hiện điều kiện viết sai.',
    keywords: ['if', 'nếu', 'điều kiện', 'kiểm tra', 'rẽ nhánh'],
  },

  {
    id: 'if-else',
    title: 'Cấu trúc if–else',
    introducedInLesson: 'l5',
    syntax: `if (điều kiện) {
    // khi điều kiện đúng
} else {
    // khi điều kiện sai
}`,
    explanation:
      'if–else cho hai hướng xử lý. Máy tính luôn chọn đúng một trong hai, không bao giờ cả hai.',
    example: `int energy = 3;

if (energy > 5) {
    cout << "Di tiep thoi!" << endl;
} else {
    cout << "Nghi mot chut da" << endl;
}`,
    commonMistakes: [
      'Đặt điều kiện sau else — else không có điều kiện',
      'Quên dấu ngoặc nhọn khi phần thân có nhiều câu lệnh',
      'Viết else nhưng phía trên không có if nào',
    ],
    tip: 'Cần nhiều hơn hai hướng thì nối thêm: if … else if … else.',
    keywords: ['if else', 'else', 'ngược lại', 'hai hướng', 'rẽ nhánh'],
  },

  {
    id: 'comparison-operators',
    title: 'Toán tử so sánh',
    introducedInLesson: 'l4',
    syntax: '==   !=   <   >   <=   >=',
    explanation:
      'Toán tử so sánh cho ra kết quả đúng hoặc sai, dùng làm điều kiện cho if và for.',
    example: `score == 10   // bằng 10 không?
score != 10   // khác 10 không?
score < 10    // nhỏ hơn 10
score > 10    // lớn hơn 10
score <= 10   // nhỏ hơn hoặc bằng
score >= 10   // lớn hơn hoặc bằng

// Kết hợp nhiều điều kiện
energy > 0 && hasKey    // cả hai đều đúng
energy > 8 || hasKey    // ít nhất một cái đúng`,
    commonMistakes: [
      'Nhầm = (gán) với == (so sánh) — lỗi phổ biến nhất',
      'Viết =< hoặc => thay vì <= và >=',
      'Dùng một dấu & hoặc | thay vì && và ||',
    ],
    tip: 'Một dấu = là ĐẶT giá trị vào biến. Hai dấu == là HỎI xem có bằng nhau không.',
    keywords: ['so sánh', 'toán tử', '==', '!=', 'lớn hơn', 'nhỏ hơn', 'and', 'or', '&&', '||'],
  },

  {
    id: 'common-errors',
    title: 'Các lỗi thường gặp',
    introducedInLesson: 'l1',
    syntax: '// Đọc kỹ thông báo lỗi — nó luôn cho biết dòng nào có vấn đề',
    explanation:
      'Ai học lập trình cũng gặp lỗi, kể cả lập trình viên đi làm nhiều năm. Biết lỗi thường gặp giúp em sửa nhanh hơn.',
    example: `cout << "Xin chao"   // ❌ thiếu dấu ;
cout << "Xin chao";  // ✅

if (score = 10)      // ❌ một dấu = là gán
if (score == 10)     // ✅ hai dấu = mới là so sánh

int score = 0;
cout << scores;      // ❌ thừa chữ s
cout << score;       // ✅`,
    commonMistakes: [
      'Thiếu dấu ; ở cuối câu lệnh',
      'Số dấu { không bằng số dấu }',
      'Tên biến viết không nhất quán',
      'Khai báo hàm nhưng quên gọi',
      'Nhầm = với ==',
      'Quên #include <iostream>',
    ],
    tip: 'Gặp lỗi, hãy nhìn dòng được báo TRƯỚC TIÊN, rồi nhìn dòng ngay phía trên nó. Nguyên nhân thường nằm ở một trong hai dòng đó.',
    keywords: ['lỗi', 'error', 'bug', 'sửa lỗi', 'debug', 'thường gặp'],
  },

  {
    id: 'clean-code',
    title: 'Quy tắc clean code',
    introducedInLesson: 'l1',
    syntax: '// Code chạy được là tốt. Code chạy được VÀ dễ đọc mới là giỏi.',
    explanation:
      'Clean code là viết sao cho người khác — và chính em ba tháng sau — đọc vào hiểu ngay.',
    example: `// ❌ Khó đọc
int x=0;for(int i=0;i<5;i++){x=x+1;cout<<x;}

// ✅ Dễ đọc
int stepCount = 0;

for (int i = 0; i < 5; i++) {
    stepCount = stepCount + 1;
    cout << stepCount << endl;
}`,
    commonMistakes: [
      'Viết nhiều câu lệnh dồn trên một dòng',
      'Không thụt lề phần code bên trong { }',
      'Đặt tên biến kiểu a, b, x1',
      'Khai báo biến rồi không dùng tới',
      'Chép code lặp đi lặp lại thay vì dùng vòng lặp',
    ],
    tip: 'Ba việc dễ làm nhất: thụt lề đều tay, mỗi câu lệnh một dòng, đặt tên biến có nghĩa.',
    keywords: ['clean code', 'thụt lề', 'đặt tên', 'dễ đọc', 'sạch', 'quy tắc'],
  },
];

/** Tìm kiếm không phân biệt dấu tiếng Việt và chữ hoa/thường. */
export function searchHandbook(query: string): HandbookCard[] {
  const normalized = normalizeVietnamese(query);
  if (!normalized) return HANDBOOK_CARDS;

  return HANDBOOK_CARDS.filter((card) => {
    const haystack = normalizeVietnamese(
      [card.title, card.explanation, card.syntax, ...card.keywords].join(' '),
    );
    return haystack.includes(normalized);
  });
}

export function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}
