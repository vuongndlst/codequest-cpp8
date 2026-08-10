export type ConceptCategory = 'cpp-language' | 'game-api';
export interface LearningConcept { id:string; category:ConceptCategory; name:string; englishName:string; explanation:string; syntax:string; example:string; commonMistakes:string[]; introducedInLesson:string; }
export type MicroPractice =
  | { id:string; type:'single-choice'; prompt:string; code?:string; options:string[]; correctIndex:number; explanation:string }
  | { id:string; type:'ordering'; prompt:string; items:string[]; correctOrder:string[]; explanation:string }
  | { id:string; type:'fill-code'; prompt:string; code:string; acceptedAnswers:string[]; explanation:string };
export interface LessonLearningPath { lessonId:string; conceptIds:string[]; predictionPrompt:string; practices:MicroPractice[]; }

const concept = (id:string, lesson:string, category:ConceptCategory, name:string, englishName:string, explanation:string, syntax:string, example:string, commonMistakes:string[]):LearningConcept =>
  ({ id, introducedInLesson:lesson, category, name, englishName, explanation, syntax, example, commonMistakes });

export const CONCEPTS: Record<string, LearningConcept> = {
  program: concept('program','a0','cpp-language','Chương trình C++','program','Một chương trình là chuỗi chỉ dẫn đủ rõ để máy thực hiện theo thứ tự.','int main() {\n    return 0;\n}','int main() {\n    cout << "Hi";\n    return 0;\n}',['Bỏ hàm main','Nghĩ máy tự đoán ý']),
  main: concept('main','a0','cpp-language','Hàm main','entry point','`main` là điểm chương trình C++ bắt đầu thực thi.','int main() {\n    // statements\n    return 0;\n}','int main() { return 0; }',['Viết statement bên ngoài main','Thiếu cặp ngoặc nhọn']),
  cout: concept('cout','a0','cpp-language','Xuất dữ liệu với cout','standard output','`cout` đưa dữ liệu từ chương trình ra màn hình để ta quan sát.','cout << "Noi dung" << endl;','cout << "Byte" << endl;',['Quên <<','Quên ngoặc kép']),
  statement: concept('statement','a0','cpp-language','Câu lệnh','statement','Một statement mô tả một việc cụ thể và phần lớn kết thúc bằng dấu chấm phẩy.','lenh();','cout << "Hi";',['Quên dấu ;','Đặt ; sai vị trí']),
  comment: concept('comment','a0','cpp-language','Chú thích','comment','Chú thích giúp con người đọc code; máy không thực hiện nội dung sau `//`.','// Ghi chú','// In lời chào',['Nghĩ comment sẽ chạy','Quên //']),
  'function-call': concept('function-call','a1','cpp-language','Lời gọi hàm','function call','Tên hàm, cặp ngoặc tròn và dấu chấm phẩy tạo thành lời gọi hàm.','tenHam();','moveRight();',['Quên ()','Sai chữ hoa–thường']),
  'game-api': concept('game-api','a1','game-api','Game API CodeQuest','game API','Các hàm điều khiển Byte dùng cú pháp C++ thật nhưng do CodeQuest cung cấp, không thuộc thư viện chuẩn.','moveRight();','moveDown();',['Nhầm với từ khóa C++','Chép cả chuỗi lệnh thay vì lập kế hoạch']),
  sequence: concept('sequence','a1','cpp-language','Trình tự','sequence','C++ thực thi các statement từ trên xuống; đổi thứ tự có thể đổi kết quả.','buoc1();\nbuoc2();','moveRight();\nmoveDown();',['Đúng lệnh nhưng sai thứ tự','Không dự đoán trước']),
  variable: concept('variable','a2','cpp-language','Biến','variable','Biến là vùng nhớ có tên, kiểu và giá trị có thể thay đổi.','int gems = 0;','int score = 10;',['Tên biến khó hiểu','Dùng trước khi khai báo']),
  'data-type': concept('data-type','a2','cpp-language','Kiểu dữ liệu','data type','Kiểu cho C++ biết biến lưu số nguyên, số thập phân, đúng–sai hay văn bản.','int · double · bool · string','string hero = "Byte";',['Gán chuỗi cho int','Quên ngoặc kép của string']),
  assignment: concept('assignment','a2','cpp-language','Phép gán và cập nhật','assignment','Dấu `=` đặt giá trị mới vào biến; vế phải được tính trước rồi mới lưu.','gems = gems + 1;','score = score + 10;',['Nhầm = với so sánh','Ghi đè khi muốn cộng thêm']),
};

export const LESSON_LEARNING_PATHS: Record<string, LessonLearningPath> = {
  a0: { lessonId:'a0', conceptIds:['program','main','cout','statement','comment'], predictionPrompt:'Trước khi chạy, em đọc từ trên xuống và ghi ra chính xác Output dự đoán.', practices:[
    { id:'a0-p1', type:'single-choice', prompt:'Chương trình bắt đầu ở đâu?', options:['main','cout','comment','include'], correctIndex:0, explanation:'`main` là điểm vào chương trình.' },
    { id:'a0-p2', type:'fill-code', prompt:'Điền ký hiệu kết thúc statement.', code:'cout << "Byte" << endl___', acceptedAnswers:[';'], explanation:'Dấu `;` kết thúc statement.' },
    { id:'a0-p3', type:'ordering', prompt:'Xếp để in A rồi B.', items:['cout << "B";','cout << "A";'], correctOrder:['cout << "A";','cout << "B";'], explanation:'C++ chạy từ trên xuống.' },
  ]},
  a1: { lessonId:'a1', conceptIds:['function-call','game-api','sequence'], predictionPrompt:'Em hãy chia đường đi thành các đoạn thẳng và dự đoán vị trí sau mỗi lời gọi hàm.', practices:[
    { id:'a1-p1', type:'single-choice', prompt:'`moveRight()` thuộc nhóm nào?', options:['Game API CodeQuest','Từ khóa C++','Biến','Comment'], correctIndex:0, explanation:'Game cung cấp hàm; cú pháp gọi vẫn là C++.' },
    { id:'a1-p2', type:'ordering', prompt:'Đi phải rồi xuống.', items:['moveDown();','moveRight();'], correctOrder:['moveRight();','moveDown();'], explanation:'Thứ tự code là thứ tự hành động.' },
    { id:'a1-p3', type:'fill-code', prompt:'Đi lên một ô.', code:'___;', acceptedAnswers:['moveUp()','moveUp();'], explanation:'Lời gọi hàm cần cặp ngoặc tròn.' },
  ]},
  a2: { lessonId:'a2', conceptIds:['variable','data-type','assignment'], predictionPrompt:'Trước mỗi bước, em ghi giá trị hiện tại của biến và giá trị mới sau câu lệnh.', practices:[
    { id:'a2-p1', type:'single-choice', prompt:'Kiểu phù hợp lưu số ngọc?', options:['int','string','bool','void'], correctIndex:0, explanation:'Số ngọc là số nguyên.' },
    { id:'a2-p2', type:'fill-code', prompt:'Điền kiểu dữ liệu văn bản.', code:'___ hero = "Byte";', acceptedAnswers:['string'], explanation:'`string` lưu văn bản.' },
    { id:'a2-p3', type:'ordering', prompt:'Nhặt, cập nhật, rồi báo cáo.', items:['cout << gems;','gems = gemsCollected();','collectGem();'], correctOrder:['collectGem();','gems = gemsCollected();','cout << gems;'], explanation:'Thế giới đổi trước, dữ liệu cập nhật sau.' },
  ]},
};

export const getLearningPath = (lessonId:string) => LESSON_LEARNING_PATHS[lessonId];
export const getConcept = (conceptId:string) => CONCEPTS[conceptId];
