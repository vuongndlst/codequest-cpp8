import type { HandbookCard } from '@/types/content';

export const HANDBOOK_CARDS: HandbookCard[] = [
  { id:'program-structure', title:'Cấu trúc chương trình C++', introducedInLesson:'a0', syntax:'#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}', explanation:'`main` là nơi chương trình bắt đầu. CodeQuest dùng cú pháp C++ thật.', example:'int main() {\n    cout << "Hi";\n    return 0;\n}', commonMistakes:['Thiếu main','Thiếu ngoặc nhọn'], tip:'Đọc từ trên xuống và tìm main trước.', keywords:['main','program'] },
  { id:'cout', title:'Xuất dữ liệu với cout', introducedInLesson:'a0', syntax:'cout << "Noi dung" << endl;', explanation:'`cout` thuộc thư viện chuẩn C++, dùng để đưa dữ liệu ra Output.', example:'cout << "Byte" << endl;', commonMistakes:['Quên <<','Quên ngoặc kép','Quên dấu ;'], tip:'Nội dung văn bản luôn nằm trong ngoặc kép.', keywords:['cout','output','endl'] },
  { id:'common-errors', title:'Lỗi cú pháp thường gặp', introducedInLesson:'a0', syntax:'statement;', explanation:'Thông báo lỗi là manh mối. Hãy kiểm tra đúng dòng được chỉ ra và các ký hiệu gần đó.', example:'cout << "OK" << endl;', commonMistakes:['Thiếu ;','Thiếu ngoặc','Sai chữ hoa–thường'], tip:'Sửa một chỗ rồi chạy lại để biết thay đổi nào có tác dụng.', keywords:['debug','semicolon','error'] },
  { id:'robot-commands', title:'Game API điều khiển Byte', introducedInLesson:'a1', syntax:'moveRight();\nmoveLeft();\nmoveUp();\nmoveDown();', explanation:'Đây là hàm CodeQuest cung cấp. Chúng dùng cú pháp gọi hàm C++ nhưng không phải thư viện chuẩn C++.', example:'moveRight();\nmoveDown();', commonMistakes:['Quên ()','Sai thứ tự','Nhầm Game API với từ khóa C++'], tip:'Chia đường đi thành đoạn trước khi gõ.', keywords:['move','game api','sequence'] },
  { id:'function-call', title:'Lời gọi hàm', introducedInLesson:'a1', syntax:'tenHam();', explanation:'Tên hàm + cặp ngoặc tròn + dấu chấm phẩy yêu cầu chương trình thực hiện công việc đã đặt tên.', example:'moveRight();', commonMistakes:['Quên ngoặc tròn','Quên dấu ;'], tip:'Tên hàm cho biết hành động; thứ tự lời gọi cho biết thuật toán.', keywords:['call','function'] },
  { id:'variables', title:'Biến và kiểu dữ liệu', introducedInLesson:'a2', syntax:'int gems = 0;\ndouble speed = 1.5;\nbool open = true;\nstring hero = "Byte";', explanation:'Biến là vùng nhớ có tên. Kiểu quy định loại giá trị mà biến giữ.', example:'int gems = 2;\ngems = gems + 1;', commonMistakes:['Gán sai kiểu','Tên biến khó hiểu','Ghi đè khi muốn cộng thêm'], tip:'Sau mỗi statement, hãy tự hỏi giá trị biến bây giờ là bao nhiêu.', keywords:['int','double','bool','string','variable'] },
  { id:'assignment', title:'Gán và cập nhật', introducedInLesson:'a2', syntax:'gems = gems + 1;', explanation:'Vế phải được tính trước, sau đó kết quả mới được lưu vào biến bên trái.', example:'int gems = 1;\ngems = gems + 2;', commonMistakes:['Nhầm = với so sánh','Quên dùng giá trị cũ'], tip:'Đọc câu lệnh từ phải sang trái: tính trước, lưu sau.', keywords:['assignment','update'] },
];

/** Tìm theo tiêu đề, cú pháp và từ khoá; chuỗi rỗng trả về toàn bộ thẻ. */
export function searchHandbook(query: string): HandbookCard[] {
  const normalized = query.trim().toLocaleLowerCase('vi');
  if (!normalized) return HANDBOOK_CARDS;

  return HANDBOOK_CARDS.filter((card) =>
    [card.title, card.syntax, card.explanation, ...card.keywords]
      .join(' ')
      .toLocaleLowerCase('vi')
      .includes(normalized),
  );
}
