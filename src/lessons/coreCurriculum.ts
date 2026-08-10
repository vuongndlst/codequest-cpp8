import type {
  Challenge,
  ConceptGuide,
  ExitTicket,
  ExitTicketQuestion,
  Hint,
  Lesson,
  WorldSpec,
} from '@/types/content';
import { STANDARD_CLEAN_CODE } from './shared';

const cpp = (body: string) => `#include <iostream>
using namespace std;

int main() {
${body}
    return 0;
}`;

const hints = (question: string, structure: string, skeleton: string): Hint[] => [
  { level: 1, type: 'question', content: question },
  { level: 2, type: 'structure', content: structure },
  { level: 3, type: 'skeleton', content: skeleton },
];

const map = (config: {
  terrain: string[];
  start: [number, number];
  goal: [number, number];
  props?: NonNullable<WorldSpec['props']>;
  energy?: number;
}): WorldSpec => ({
  kind: 'map',
  cols: config.terrain[0].length,
  rows: config.terrain.length,
  startCol: config.start[0],
  startRow: config.start[1],
  startFacing: 'east',
  goalCol: config.goal[0],
  goalRow: config.goal[1],
  terrain: config.terrain,
  props: config.props,
  initialState: { energy: config.energy ?? 24 },
});

const guide = (
  lessonId: string,
  bigQuestion: string,
  painfulExample: string,
  cleanExample: string,
  newIdea: string,
): ConceptGuide => ({
  lessonId,
  bigQuestion,
  problem: {
    title: 'Máy tính cần chỉ dẫn thật rõ',
    body: 'Ý định trong đầu chưa phải là chương trình. Máy tính chỉ có thể làm đúng những câu lệnh đã được viết bằng cú pháp mà nó hiểu.',
    painfulExample,
    punchline: 'Nếu không chỉ ra từng bước và kiểm tra kết quả, ta chỉ đang đoán chứ chưa lập trình.',
  },
  solution: {
    title: newIdea,
    body: 'Ta biến suy nghĩ thành các câu lệnh nhỏ, chạy chúng, quan sát bằng chứng rồi điều chỉnh khi kết quả chưa giống dự đoán.',
    cleanExample,
    whatChanged: 'Chương trình giờ có ý nghĩa rõ ràng: mỗi dòng tạo ra một thay đổi có thể quan sát và kiểm tra được.',
  },
  mentalModel: {
    analogy: 'Hãy hình dung em đang viết kịch bản cho một robot rất chăm chỉ nhưng không tự đoán ý.',
    explanation: 'Robot đọc từ trên xuống dưới, làm đúng từng câu lệnh và dừng tại chỗ nếu gặp điều nó không hiểu. Vì vậy thứ tự, cú pháp và dữ liệu đều là một phần của kế hoạch.',
  },
  thinkingSteps: [
    { question: 'Đích cuối cùng cần quan sát được là gì?', why: 'Xác định bằng chứng thành công giúp em không chạy code chỉ để xem thử một cách mơ hồ.' },
    { question: 'Từ trạng thái đầu tới đích cần những bước nhỏ nào?', why: 'Chia nhỏ giúp mỗi dòng code gắn với một hành động hoặc một thay đổi cụ thể.' },
    { question: 'Thứ tự nào khiến các bước đó hợp lý?', why: 'Cùng một tập lệnh nhưng đổi thứ tự có thể tạo ra một kết quả hoàn toàn khác.' },
    { question: 'Sau khi chạy, bằng chứng nào khác với dự đoán?', why: 'Debug dựa trên bằng chứng giúp em tìm đúng bước cần sửa thay vì thay đổi ngẫu nhiên.' },
  ],
  whenToUse: [
    'Khi cần biến một mục tiêu thành chương trình có thể chạy.',
    'Khi cần dự đoán kết quả trước khi bấm Chạy.',
    'Khi cần tìm bước đầu tiên làm kết quả lệch khỏi kế hoạch.',
  ],
  whenNotToUse: [
    'Không chép nguyên đáp án khi chưa tự dự đoán.',
    'Không thêm lệnh ngẫu nhiên chỉ vì chương trình chưa đạt mục tiêu.',
  ],
  misconceptions: [
    { wrong: 'Máy tính sẽ hiểu điều em muốn làm.', right: 'Máy tính chỉ thực hiện điều em viết.', why: 'Mọi ý định đều phải được biểu diễn bằng câu lệnh và dữ liệu cụ thể.' },
    { wrong: 'Chạy được nghĩa là chắc chắn đúng.', right: 'Chạy được mới chỉ cho biết cú pháp có thể thực thi.', why: 'Ta còn phải so kết quả thật với mục tiêu của nhiệm vụ.' },
    { wrong: 'Debug là dấu hiệu học chưa tốt.', right: 'Debug là một bước bình thường của lập trình.', why: 'Mỗi lần tìm được nguyên nhân là một lần mô hình tư duy trở nên chính xác hơn.' },
  ],
});

const a0Challenges: Challenge[] = [
  {
    id: 'a0-c1-first-program', lessonId: 'a0', kind: 'story', title: 'Tín hiệu đầu tiên',
    story: 'Trạm liên lạc ByteLand đang im lặng. Một chương trình C++ nhỏ đã sẵn sàng; em hãy dự đoán tín hiệu rồi cho máy chạy.',
    instructions: ['Đọc chương trình từ trên xuống dưới.', 'Dự đoán dòng chữ sẽ xuất hiện.', 'Bấm Chạy và đối chiếu với dự đoán của em.'],
    starterCode: cpp('    cout << "Xin chao ByteLand!" << endl;'),
    requiredPatterns: ['stmt:cout'],
    testCases: [{ id: 'a0-c1-output', name: 'Màn hình phát đúng tín hiệu', kind: 'output', expectedOutput: 'Xin chao ByteLand!', required: true, visible: true }],
    commonMistakes: [],
    hints: hints('Dòng có `cout` đang gửi phần nào ra màn hình?', 'Đọc nội dung nằm giữa hai dấu ngoặc kép.', 'Hãy chạy nguyên chương trình đã cho và quan sát Output.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 10,
    world: { kind: 'signal-tower', cols: 6, rows: 4, initialState: { energy: 10 } },
    solution: cpp('    cout << "Xin chao ByteLand!" << endl;'),
    thinkingPrompt: 'Trước khi chạy, em ghi ra giấy chính xác dòng chữ mà em nghĩ máy sẽ in.',
    whyThisMatters: 'Dự đoán trước rồi kiểm chứng là vòng lặp học tập quan trọng nhất của cả hành trình.',
  },
  {
    id: 'a0-c2-cout', lessonId: 'a0', kind: 'sandbox', title: 'Gửi lời chào cho Byte',
    story: 'Byte đã bắt được tín hiệu nhưng chưa biết ai đang điều khiển. Em hãy hoàn thành câu lệnh xuất để gửi đúng mật khẩu.',
    instructions: ['Đổi phần chữ trống thành `BAT DAU`.', 'Giữ nguyên dấu ngoặc kép, `<< endl` và dấu chấm phẩy.', 'Chạy code để kiểm tra Output.'],
    starterCode: cpp('    cout << "" << endl;'), requiredPatterns: ['stmt:cout'],
    testCases: [{ id: 'a0-c2-output', name: 'In đúng mật khẩu BAT DAU', kind: 'output', expectedOutput: 'BAT DAU', required: true, visible: true }],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Tín hiệu đã phát nhưng nội dung chưa khớp. Em kiểm tra chữ hoa và khoảng trắng nhé.' }],
    hints: hints('Nội dung cần in phải nằm ở đâu trong câu lệnh `cout`?', 'Giữ khung `cout << "..." << endl;` và chỉ thay ba dấu chấm.', '```cpp\ncout << "BAT DAU" << endl;\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 15,
    world: { kind: 'signal-tower', cols: 6, rows: 4 }, solution: cpp('    cout << "BAT DAU" << endl;'),
    thinkingPrompt: 'Phần nào của câu lệnh là dữ liệu được in, phần nào là cú pháp C++?',
    whyThisMatters: '`cout` là công cụ chuẩn của C++ để em quan sát dữ liệu và kiểm tra chương trình.',
  },
  {
    id: 'a0-c3-debug-semicolon', lessonId: 'a0', kind: 'debug', title: 'Debug Lab: Dấu chấm phẩy thất lạc',
    story: 'Một Bug đã lấy mất ký hiệu kết thúc câu lệnh. Máy chỉ đúng vị trí bị gián đoạn; nhiệm vụ của em là tìm và sửa đúng một chỗ.',
    instructions: ['Đọc thông báo lỗi.', 'Tìm câu lệnh chưa có ký hiệu kết thúc.', 'Sửa rồi chạy lại; không cần viết lại cả chương trình.'],
    starterCode: cpp('    cout << "He thong" << endl\n    cout << "san sang" << endl;'), requiredPatterns: ['stmt:cout:count=2'],
    testCases: [{ id: 'a0-c3-output', name: 'Phát đủ hai dòng trạng thái', kind: 'output', expectedOutput: 'He thong\nsan sang', required: true, visible: true }],
    commonMistakes: [{ errorCode: 'MISSING_SEMICOLON', message: 'C++ cần dấu `;` để biết statement đầu tiên đã kết thúc.' }],
    hints: hints('Cuối hai dòng `cout` có gì khác nhau?', 'Mỗi statement C++ cần kết thúc bằng dấu `;`.', 'Thêm `;` ngay sau `endl` của dòng đầu.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 20,
    world: { kind: 'signal-tower', cols: 6, rows: 4 }, solution: cpp('    cout << "He thong" << endl;\n    cout << "san sang" << endl;'),
    thinkingPrompt: 'Thông báo lỗi đang chỉ tới dòng nào, và ký hiệu cuối dòng đó khác dòng dưới ra sao?',
    whyThisMatters: 'Đọc lỗi theo vị trí và so sánh các dòng gần nhau là kỹ thuật debug có thể dùng trong mọi ngôn ngữ.',
  },
  {
    id: 'a0-c4-system-start', lessonId: 'a0', kind: 'boss', title: 'Thử thách: Khởi động hệ thống',
    story: 'Cổng vào thế giới ByteLand cần hai tín hiệu theo đúng thứ tự. Đây là lúc em tự viết các statement đầu tiên trong `main()`.',
    instructions: ['In `CODEQUEST` ở dòng thứ nhất.', 'In `SYSTEM ONLINE` ở dòng thứ hai.', 'Mỗi câu lệnh nằm trên một dòng và kết thúc bằng `;`.'],
    starterCode: cpp('    // Viết hai câu lệnh cout tại đây'), requiredPatterns: ['stmt:cout:count=2'],
    testCases: [
      { id: 'a0-c4-output', name: 'Hai tín hiệu đúng nội dung và thứ tự', kind: 'output', expectedOutput: 'CODEQUEST\nSYSTEM ONLINE', required: true, visible: true },
      { id: 'a0-c4-structure', name: 'Có đúng hai câu lệnh xuất', kind: 'structure', patterns: ['stmt:cout:count=2'], required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Cổng đã nhận tín hiệu nhưng thứ tự hoặc chữ hoa chưa đúng. Em so từng dòng với mục tiêu.' }],
    hints: hints('Cổng cần nhận mấy dòng và dòng nào đến trước?', 'Viết hai câu lệnh `cout`, mỗi câu kết thúc bằng `endl;`.', '```cpp\ncout << "CODEQUEST" << endl;\ncout << "SYSTEM ONLINE" << endl;\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 30,
    world: { kind: 'signal-tower', cols: 7, rows: 5 }, solution: cpp('    cout << "CODEQUEST" << endl;\n    cout << "SYSTEM ONLINE" << endl;'),
    thinkingPrompt: 'Em hãy dự đoán chính xác hai dòng Output trước khi bắt đầu gõ.',
    whyThisMatters: 'Màn này ghép cấu trúc `main`, statement, `cout`, chuỗi và dấu chấm phẩy thành một chương trình C++ hoàn chỉnh.',
  },
];

const a1Challenges: Challenge[] = [
  {
    id: 'a1-c1-move-right', lessonId: 'a1', kind: 'story', title: 'Ba bước sang phải',
    story: 'Byte đã vào Đồng cỏ Thuật toán. Cổng năng lượng nằm ba ô bên phải và chỉ phản hồi với lời gọi hàm của Game API.',
    instructions: ['Dự đoán Byte sẽ dừng ở đâu.', 'Chạy code và quan sát từng bước.', 'Nhớ: `moveRight()` là Game API của CodeQuest, không phải hàm chuẩn C++.'],
    starterCode: cpp('    moveRight();\n    moveRight();\n    moveRight();'), requiredPatterns: ['call:moveRight:count=3'],
    testCases: [{ id: 'a1-c1-goal', name: 'Byte tới cổng năng lượng', kind: 'world', expectedWorld: { col: 4, row: 2 }, required: true, visible: true }],
    commonMistakes: [], hints: hints('Mỗi lời gọi hàm làm Byte đổi vị trí bao nhiêu ô?', 'Ba lời gọi giống nhau tạo thành ba bước liên tiếp.', 'Chạy code đã cho rồi dùng chế độ Từng bước để quan sát.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 15,
    world: map({ terrain: ['########','########','#.....##','########','########'], start: [1,2], goal: [4,2] }),
    solution: cpp('    moveRight();\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Nếu dòng thứ hai chưa chạy, Byte đang ở cột nào?', whyThisMatters: 'Lời gọi hàm là cầu nối giữa một câu lệnh C++ và một hành động trong thế giới game.',
  },
  {
    id: 'a1-c2-change-direction', lessonId: 'a1', kind: 'concept', title: 'Rẽ xuống thung lũng',
    story: 'Đường đi không còn thẳng. Byte phải sang phải rồi đi xuống; thứ tự gọi hàm quyết định toàn bộ quỹ đạo.',
    instructions: ['Đi sang phải hai ô.', 'Đi xuống hai ô.', 'Dùng `moveRight()` và `moveDown()` theo đúng thứ tự.'],
    starterCode: cpp('    // Sang phải 2 ô, sau đó đi xuống 2 ô'), requiredPatterns: ['call:moveRight', 'call:moveDown'],
    testCases: [{ id: 'a1-c2-goal', name: 'Byte tới đúng ô cổng', kind: 'world', expectedWorld: { col: 3, row: 4 }, required: true, visible: true }],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Đường đi cần cả chuyển động ngang và dọc. Em đối chiếu từng đoạn trên bản đồ.' }],
    hints: hints('Bản đồ có mấy đoạn thẳng và mỗi đoạn đi theo hướng nào?', 'Viết hai `moveRight()` trước, rồi hai `moveDown()`.', '```cpp\nmoveRight();\nmoveRight();\nmoveDown();\nmoveDown();\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 20,
    world: map({ terrain: ['#######','#######','#...###','###.###','###.###','#######'], start: [1,2], goal: [3,4] }),
    solution: cpp('    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();'),
    thinkingPrompt: 'Ở bước thứ ba, Byte cần thay đổi tọa độ cột hay tọa độ hàng?', whyThisMatters: 'Tách đường đi thành các đoạn giúp em viết và kiểm tra thuật toán theo từng phần.',
  },
  {
    id: 'a1-c3-obstacle-route', lessonId: 'a1', kind: 'mission', title: 'Vòng qua hồ độc',
    story: 'Một hồ độc chắn đường trực tiếp tới cổng. Byte cần đi theo lối chữ U, không thể bước qua ô tường.',
    instructions: ['Đi xuống để tránh hồ.', 'Đi sang phải theo hành lang dưới.', 'Đi lên tới cổng.'],
    starterCode: cpp('    // Lập trình đường đi chữ U'), requiredPatterns: ['call:moveDown', 'call:moveRight', 'call:moveUp'],
    testCases: [{ id: 'a1-c3-goal', name: 'Byte vòng qua hồ và tới cổng', kind: 'world', expectedWorld: { col: 5, row: 2 }, required: true, visible: true }],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Lối chữ U có ba đoạn: xuống, sang phải rồi lên.' }],
    hints: hints('Ô đầu tiên bên phải có đi được không? Lối trống bắt đầu theo hướng nào?', 'Đường đi: xuống 2 ô → phải 4 ô → lên 2 ô.', 'Hãy viết 2 `moveDown()`, 4 `moveRight()`, rồi 2 `moveUp()`.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 25, parStatements: 8,
    world: map({ terrain: ['#######','#######','#.###.#','#.###.#','#.....#','#######'], start: [1,2], goal: [5,2] }),
    solution: cpp('    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();'),
    thinkingPrompt: 'Trước khi gõ, em chia đường chữ U thành ba đoạn và ghi số ô của từng đoạn.', whyThisMatters: 'Đây là bước đầu của phân rã bài toán: giải ba chặng nhỏ thay vì đoán cả đường đi cùng lúc.',
  },
  {
    id: 'a1-c4-debug-order', lessonId: 'a1', kind: 'debug', title: 'Debug Lab: Đúng lệnh, sai thứ tự',
    story: 'Các câu lệnh đều hợp lệ nhưng Byte va vào vách. Lỗi không nằm ở cú pháp; nó nằm ở thứ tự của kế hoạch.',
    instructions: ['Chạy ở chế độ Từng bước.', 'Tìm bước đầu tiên Byte bị chặn.', 'Đổi thứ tự các lệnh để đi xuống trước rồi mới sang phải.'],
    starterCode: cpp('    moveRight();\n    moveDown();\n    moveRight();'), requiredPatterns: ['call:moveDown', 'call:moveRight:count=2'],
    testCases: [{ id: 'a1-c4-goal', name: 'Byte tới ô đích sau khi sửa thứ tự', kind: 'world', expectedWorld: { col: 3, row: 3 }, required: true, visible: true }],
    commonMistakes: [], hints: hints('Sự kiện đầu tiên trong Nhật ký chạy cho biết điều gì?', 'Ô bên phải lúc đầu là tường, vì vậy bước xuống phải xảy ra trước.', 'Thứ tự đúng là `moveDown();` rồi hai lần `moveRight();`.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 25,
    world: map({ terrain: ['######','######','#.####','#...##','######'], start: [1,2], goal: [3,3] }),
    solution: cpp('    moveDown();\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Bước đầu tiên trong code có khớp với ô trống đầu tiên quanh Byte không?', whyThisMatters: 'Phân biệt lỗi cú pháp với lỗi logic giúp em chọn đúng cách sửa và không viết lại phần vốn đã đúng.',
  },
  {
    id: 'a1-c5-portal', lessonId: 'a1', kind: 'boss', title: 'BOSS: Cổng dịch chuyển',
    story: 'Cổng portal cuối khu vực đang mở trong thời gian ngắn. Byte phải đi qua hành lang zíc-zắc bằng một chuỗi lệnh chính xác.',
    instructions: ['Lập kế hoạch theo bốn đoạn đường.', 'Không bước vào tường.', 'Tới đúng portal màu tím ở góc trên bên phải.'],
    starterCode: cpp('    // Viết chuỗi lệnh mở đường tới portal'), requiredPatterns: ['call:moveRight', 'call:moveDown', 'call:moveUp'],
    testCases: [{ id: 'a1-c5-goal', name: 'Byte bước vào portal', kind: 'world', expectedWorld: { col: 6, row: 1 }, required: true, visible: true }],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Đường tới portal cần cả ba hướng phải, xuống và lên. Em chia bản đồ thành từng đoạn.' }],
    hints: hints('Đường đi đổi hướng ở những ô góc nào?', 'Bốn đoạn: phải 2 → xuống 2 → phải 3 → lên 2.', 'Viết lần lượt 2 `moveRight()`, 2 `moveDown()`, 3 `moveRight()`, 2 `moveUp()`.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 40, parStatements: 9,
    world: map({ terrain: ['########','#...##.#','###.##.#','###....#','########'], start: [1,1], goal: [6,1], props: [{ id: 'portal-a1', type: 'portal', col: 6, row: 1 }] }),
    solution: cpp('    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();'),
    thinkingPrompt: 'Em hãy đánh dấu bốn ô đổi hướng trên bản đồ trước khi viết code.', whyThisMatters: 'Boss kiểm tra khả năng lập kế hoạch, dự đoán và debug cả một chuỗi hành động dài mà không thêm khái niệm mới.',
  },
];

const a2Challenges: Challenge[] = [
  {
    id: 'a2-c1-variable', lessonId: 'a2', kind: 'story', title: 'Chiếc hộp có tên',
    story: 'Kho báu cần ghi nhớ số ngọc hiện có. Biến `gems` là một chiếc hộp có tên, kiểu dữ liệu và giá trị.',
    instructions: ['Dự đoán Output.', 'Chạy code và quan sát Nhật ký dữ liệu.', 'Đổi giá trị khởi tạo rồi chạy lại để thấy dữ liệu thay đổi.'],
    starterCode: cpp('    int gems = 2;\n    cout << gems << endl;'), requiredPatterns: ['decl:var:int', 'stmt:cout'],
    testCases: [{ id: 'a2-c1-output', name: 'In giá trị đang lưu trong gems', kind: 'output', expectedOutput: '2', required: true, visible: true }],
    commonMistakes: [], hints: hints('Tên nào đang đại diện cho số 2?', 'Dòng đầu khai báo và gán; dòng sau đọc giá trị để in.', 'Chạy code đã cho rồi thử đổi `2` thành một số khác.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 15,
    world: { kind: 'workshop', cols: 7, rows: 4 }, solution: cpp('    int gems = 2;\n    cout << gems << endl;'),
    thinkingPrompt: 'Nếu đổi `2` thành `5` mà không sửa dòng `cout`, Output sẽ là gì?', whyThisMatters: 'Biến giúp chương trình ghi nhớ trạng thái thay vì phải viết cứng mọi giá trị.',
  },
  {
    id: 'a2-c2-data-types', lessonId: 'a2', kind: 'concept', title: 'Bốn loại dữ liệu',
    story: 'Kho lưu trữ nhận bốn loại thông tin khác nhau: số nguyên, số thập phân, đúng–sai và văn bản.',
    instructions: ['Điền giá trị phù hợp cho bốn biến.', 'Giữ đúng kiểu `int`, `double`, `bool`, `string`.', 'In bốn biến trên một dòng theo đúng thứ tự.'],
    starterCode: cpp('    int gems = 0;\n    double speed = 0.0;\n    bool portalOpen = false;\n    string hero = "";\n\n    // Gán giá trị rồi in: 3 1.5 1 Byte'),
    requiredPatterns: ['decl:var:int', 'decl:var:double', 'decl:var:bool', 'decl:var:string', 'stmt:cout'],
    testCases: [{ id: 'a2-c2-output', name: 'Bốn dữ liệu có đúng giá trị', kind: 'output', expectedOutput: '3 1.5 1 Byte', required: true, visible: true }],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Em kiểm tra lại kiểu và giá trị: chuỗi cần ngoặc kép, `bool true` được `cout` in thành 1.' }],
    hints: hints('Giá trị nào là số, đúng–sai và văn bản?', 'Gán lần lượt `3`, `1.5`, `true`, `"Byte"`, rồi nối các biến bằng `<< " " <<`.', 'Hãy giữ bốn khai báo, sửa giá trị và thêm một câu `cout` bên dưới.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 25,
    world: { kind: 'workshop', cols: 8, rows: 5 }, solution: cpp('    int gems = 3;\n    double speed = 1.5;\n    bool portalOpen = true;\n    string hero = "Byte";\n\n    cout << gems << " " << speed << " " << portalOpen << " " << hero << endl;'),
    thinkingPrompt: 'Vì sao tên nhân vật không thể lưu bằng `int`, còn số ngọc thì có thể?', whyThisMatters: 'Chọn đúng kiểu giúp chương trình hiểu dữ liệu có thể được sử dụng và thay đổi như thế nào.',
  },
  {
    id: 'a2-c3-collect-count', lessonId: 'a2', kind: 'mission', title: 'Nhặt ngọc và đếm',
    story: 'Một viên ngọc nằm giữa đường. Byte phải đứng đúng ô, nhặt ngọc, lưu số lượng vào biến rồi báo cáo.',
    instructions: ['Đi sang phải hai ô để tới viên ngọc.', 'Gọi `collectGem()` đúng tại ô có ngọc.', 'Gán `gemsCollected()` vào biến `gems`, in biến rồi đi tới portal.'],
    starterCode: cpp('    int gems = 0;\n\n    // Di chuyển, nhặt ngọc, cập nhật gems, in và tới portal'),
    requiredPatterns: ['decl:var:int', 'call:collectGem', 'call:gemsCollected', 'stmt:cout'],
    testCases: [
      { id: 'a2-c3-world', name: 'Nhặt một viên ngọc và tới portal', kind: 'world', expectedWorld: { col: 5, row: 2, collectedGems: 1 }, required: true, visible: true },
      { id: 'a2-c3-output', name: 'Báo cáo đúng số ngọc', kind: 'output', expectedOutput: '1', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Số ngọc trong thế giới đã đổi; em cần cập nhật biến trước khi in.' }],
    hints: hints('Biến `gems` được khởi tạo trước hay sau khi nhặt ngọc?', 'Sau `collectGem()`, gán `gems = gemsCollected();` rồi mới `cout`.', 'Đi phải 2 → nhặt → cập nhật biến → in → đi phải 2.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 30,
    world: map({ terrain: ['#######','#######','#.....#','#######'], start: [1,2], goal: [5,2], props: [{ id: 'gem-a2-1', type: 'gem', col: 3, row: 2 }, { id: 'portal-a2-1', type: 'portal', col: 5, row: 2 }] }),
    solution: cpp('    int gems = 0;\n\n    moveRight();\n    moveRight();\n    collectGem();\n    gems = gemsCollected();\n    cout << gems << endl;\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Ở thời điểm nào biến `gems` cần nhận giá trị mới từ thế giới?', whyThisMatters: 'Màn này nối trạng thái game với trạng thái chương trình: hành động làm thế giới đổi, phép gán làm dữ liệu trong code đổi.',
  },
  {
    id: 'a2-c4-debug-update', lessonId: 'a2', kind: 'debug', title: 'Debug Lab: Giá trị cũ',
    story: 'Bảng điểm vẫn hiện 1 dù Byte vừa nhận thêm 2 ngọc. Cú pháp không lỗi; phép cập nhật đang dùng sai toán tử.',
    instructions: ['Dự đoán giá trị hiện tại của `gems`.', 'Tìm dòng làm biến mất giá trị cũ.', 'Sửa để cộng thêm 2 rồi in kết quả.'],
    starterCode: cpp('    int gems = 1;\n    gems = 2;\n    cout << gems << endl;'), requiredPatterns: ['decl:var:int', 'op:+', 'stmt:cout'],
    testCases: [{ id: 'a2-c4-output', name: 'Số ngọc tăng từ 1 lên 3', kind: 'output', expectedOutput: '3', required: true, visible: true }],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Em cần dùng phép cộng để giữ giá trị cũ rồi thêm 2.' }],
    hints: hints('Dòng `gems = 2` giữ lại hay thay thế số 1?', 'Vế phải cần đọc giá trị cũ của `gems` rồi cộng thêm 2.', 'Đổi thành `gems = gems + 2;`.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 25,
    world: { kind: 'workshop', cols: 7, rows: 4 }, solution: cpp('    int gems = 1;\n    gems = gems + 2;\n    cout << gems << endl;'),
    thinkingPrompt: 'Phép gán `gems = 2` khác `gems = gems + 2` ở chỗ nào?', whyThisMatters: 'Hiểu cập nhật giá trị là nền móng cho điểm số, bộ đếm, năng lượng và các vòng lặp ở khu vực sau.',
  },
  {
    id: 'a2-c5-vault', lessonId: 'a2', kind: 'boss', title: 'BOSS: Kho ngọc ký ức',
    story: 'Kho ngọc chỉ mở khi Byte thu đủ hai viên, báo cáo đúng tổng số và bước vào portal. Mỗi viên nằm ở một nhánh khác nhau.',
    instructions: ['Nhặt viên ngọc bên phải.', 'Đi xuống rồi sang trái để nhặt viên thứ hai.', 'Cập nhật biến, in `2`, sau đó đi tới portal.'],
    starterCode: cpp('    int gems = 0;\n\n    // Lập kế hoạch nhặt đủ 2 ngọc và tới portal'),
    requiredPatterns: ['decl:var:int', 'call:collectGem:count=2', 'call:gemsCollected', 'stmt:cout'],
    testCases: [
      { id: 'a2-c5-world', name: 'Nhặt đủ hai ngọc và vào kho', kind: 'world', expectedWorld: { col: 5, row: 4, collectedGems: 2 }, required: true, visible: true },
      { id: 'a2-c5-output', name: 'Báo cáo tổng số ngọc là 2', kind: 'output', expectedOutput: '2', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Kho chỉ mở khi biến được cập nhật sau khi đã nhặt cả hai viên ngọc.' }],
    hints: hints('Sau mỗi lần nhặt, Byte đang ở tọa độ nào và portal còn ở hướng nào?', 'Lộ trình: phải 2 nhặt → xuống 2 → trái 2 nhặt → phải 4 tới portal.', 'Cập nhật `gems = gemsCollected();` sau lần nhặt thứ hai, rồi mới in.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 45,
    world: map({ terrain: ['#######','#######','#...###','###.###','#.....#','#######'], start: [1,2], goal: [5,4], props: [{ id: 'gem-a2-left', type: 'gem', col: 3, row: 2 }, { id: 'gem-a2-bottom', type: 'gem', col: 1, row: 4 }, { id: 'portal-a2-vault', type: 'portal', col: 5, row: 4 }] }),
    solution: cpp('    int gems = 0;\n\n    moveRight();\n    moveRight();\n    collectGem();\n    moveDown();\n    moveDown();\n    moveLeft();\n    moveLeft();\n    collectGem();\n    gems = gemsCollected();\n    cout << gems << endl;\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Hãy chia nhiệm vụ thành ba chặng: ngọc 1, ngọc 2, portal; ghi trạng thái `gems` sau từng chặng.', whyThisMatters: 'Boss yêu cầu phối hợp kiểu dữ liệu, biến, phép gán, Game API và thuật toán đường đi trong một bài toán có trạng thái.',
  },
];

const checkpoint = (lessonId: string, questions: ExitTicketQuestion[]): ExitTicket => ({
  lessonId,
  questions,
  reflectionPrompt: 'Điều gì em đã dự đoán đúng ngay từ đầu, và lần debug nào giúp em hiểu rõ nhất?',
});

const a0Checkpoint = checkpoint('a0', [
  { id:'a0-q1', type:'knowledge', prompt:'Hàm nào là điểm bắt đầu của chương trình C++?', options:['main','cout','start','run'], correctIndex:0, explanation:'Chương trình bắt đầu thực thi trong `main`.' },
  { id:'a0-q2', type:'read-code', prompt:'Code này in gì?', code:'cout << "Byte" << endl;', options:['Byte','"Byte"','endl','Không in'], correctIndex:0, explanation:'Dấu ngoặc kép đánh dấu chuỗi, không xuất hiện trong kết quả.' },
  { id:'a0-q3', type:'multiple-answer', prompt:'Chọn các nhận định đúng.', options:['Statement thường kết thúc bằng ;','// tạo chú thích một dòng','cout là Game API','main có thể bỏ'], correctIndices:[0,1], explanation:'`cout` thuộc thư viện chuẩn; `main` là điểm vào chương trình.' },
  { id:'a0-q4', type:'ordering', prompt:'Xếp hai tín hiệu đúng thứ tự.', options:['cout << "B" << endl;','cout << "A" << endl;'], correctOrder:['cout << "A" << endl;','cout << "B" << endl;'], explanation:'C++ thực hiện statement từ trên xuống.' },
  { id:'a0-q5', type:'matching', prompt:'Nối thành phần với ý nghĩa.', options:['Xuất dữ liệu','Kết thúc statement','Chú thích'], matches:[{left:'cout',right:'Xuất dữ liệu'},{left:';',right:'Kết thúc statement'},{left:'//',right:'Chú thích'}], explanation:'Mỗi ký hiệu đảm nhiệm một vai trò riêng.' },
  { id:'a0-q6', type:'debugging', prompt:'Dòng nào thiếu ký hiệu?', code:'cout << "A" << endl\ncout << "B" << endl;', options:['Dòng 1 thiếu ;','Dòng 2 thiếu ;','Thiếu main','Không lỗi'], correctIndex:0, explanation:'Statement đầu chưa có dấu chấm phẩy.' },
  { id:'a0-q7', type:'fill-code', prompt:'Điền từ khóa xuất dữ liệu: ___ << "Hi";', options:[], acceptedAnswers:['cout'], explanation:'`cout` gửi dữ liệu ra luồng output.' },
  { id:'a0-q8', type:'self-assess', prompt:'Khi thấy lỗi cú pháp, em thường làm gì trước?', options:['Đọc dòng được chỉ ra','Xóa toàn bộ code','Bấm chạy liên tục','Xin đáp án ngay'], explanation:'Không có đáp án đúng–sai; hãy quan sát thói quen của mình.' },
]);

const a1Checkpoint = checkpoint('a1', [
  { id:'a1-q1', type:'knowledge', prompt:'`moveRight()` là gì?', options:['Game API của CodeQuest','Từ khóa C++ chuẩn','Một biến','Một comment'], correctIndex:0, explanation:'Nó dùng cú pháp gọi hàm C++ nhưng do game cung cấp.' },
  { id:'a1-q2', type:'code-prediction', prompt:'Byte đi mấy ô sang phải?', code:'moveRight();\nmoveRight();', options:['0','1','2','3'], correctIndex:2, explanation:'Mỗi lời gọi tạo một bước.' },
  { id:'a1-q3', type:'multiple-answer', prompt:'Điều gì giúp debug đường đi?', options:['Chạy từng bước','So vị trí với dòng lệnh','Thêm lệnh ngẫu nhiên','Bỏ qua vật cản'], correctIndices:[0,1], explanation:'Debug cần quan sát bằng chứng từng bước.' },
  { id:'a1-q4', type:'ordering', prompt:'Đi phải rồi đi xuống.', options:['moveDown();','moveRight();'], correctOrder:['moveRight();','moveDown();'], explanation:'Thứ tự câu lệnh là thứ tự hành động.' },
  { id:'a1-q5', type:'matching', prompt:'Nối hàm với hướng.', options:['Phải','Trái','Lên','Xuống'], matches:[{left:'moveRight()',right:'Phải'},{left:'moveLeft()',right:'Trái'},{left:'moveUp()',right:'Lên'},{left:'moveDown()',right:'Xuống'}], explanation:'Tên hàm mô tả trực tiếp hướng di chuyển.' },
  { id:'a1-q6', type:'debugging', prompt:'Ô phải là tường, ô dưới trống. Dòng đầu nên là gì?', options:['moveDown();','moveRight();','cout;','return;'], correctIndex:0, explanation:'Chọn hành động phù hợp với trạng thái bản đồ.' },
  { id:'a1-q7', type:'fill-code', prompt:'Đi lên một ô: ___;', options:[], acceptedAnswers:['moveUp()','moveUp();'], explanation:'Lời gọi cần cặp ngoặc tròn.' },
  { id:'a1-q8', type:'self-assess', prompt:'Trước bản đồ mới, em có chia đường đi thành đoạn không?', options:['Luôn luôn','Thỉnh thoảng','Chưa thử','Em có cách khác'], explanation:'Đây là câu tự nhìn lại chiến lược.' },
]);

const a2Checkpoint = checkpoint('a2', [
  { id:'a2-q1', type:'knowledge', prompt:'Kiểu nào phù hợp lưu số ngọc nguyên?', options:['int','string','bool','double luôn bắt buộc'], correctIndex:0, explanation:'`int` lưu số nguyên.' },
  { id:'a2-q2', type:'code-prediction', prompt:'Code in gì?', code:'int gems = 1;\ngems = gems + 2;\ncout << gems;', options:['1','2','3','12'], correctIndex:2, explanation:'Giá trị cũ 1 được cộng thêm 2.' },
  { id:'a2-q3', type:'multiple-answer', prompt:'Chọn khai báo hợp lệ.', options:['int score = 5;','bool open = true;','string name = "Byte";','int hero = "Byte";'], correctIndices:[0,1,2], explanation:'Giá trị phải phù hợp với kiểu.' },
  { id:'a2-q4', type:'ordering', prompt:'Xếp vòng đời dữ liệu.', options:['cout << gems;','gems = gemsCollected();','collectGem();'], correctOrder:['collectGem();','gems = gemsCollected();','cout << gems;'], explanation:'Thế giới đổi trước, biến cập nhật sau, rồi mới báo cáo.' },
  { id:'a2-q5', type:'matching', prompt:'Nối kiểu với dữ liệu.', options:['Số nguyên','Số thập phân','Đúng–sai','Văn bản'], matches:[{left:'int',right:'Số nguyên'},{left:'double',right:'Số thập phân'},{left:'bool',right:'Đúng–sai'},{left:'string',right:'Văn bản'}], explanation:'Kiểu mô tả loại dữ liệu mà biến giữ.' },
  { id:'a2-q6', type:'debugging', prompt:'Muốn cộng thêm 2 nhưng code là `gems = 2;`. Sửa thế nào?', options:['gems = gems + 2;','int = gems;','gems == 2;','cout = gems;'], correctIndex:0, explanation:'Vế phải đọc giá trị cũ rồi cộng thêm.' },
  { id:'a2-q7', type:'fill-code', prompt:'Điền kiểu: ___ hero = "Byte";', options:[], acceptedAnswers:['string'], explanation:'Văn bản được lưu bằng `string`.' },
  { id:'a2-q8', type:'self-assess', prompt:'Em có theo dõi giá trị biến sau từng bước không?', options:['Có, bằng nhật ký','Có, bằng giấy','Đôi khi','Chưa thử'], explanation:'Tự theo dõi trạng thái giúp debug chính xác hơn.' },
]);

export const CORE_LESSONS: Lesson[] = [
  {
    id:'a0', order:0, zoneName:'Trạm Khởi Động', title:'C++ bắt đầu từ đâu?', subtitle:'main · cout · statement · dấu ; · comment',
    intro:'Em đánh thức hệ thống bằng chương trình C++ thật. Mỗi màn chỉ thêm một mảnh kiến thức nhỏ và luôn cho em dự đoán trước khi chạy.',
    objectives:['Nhận biết cấu trúc chương trình C++ đầu tiên','Dùng cout để xuất dữ liệu','Đọc và sửa lỗi dấu chấm phẩy'],
    certificateCode:'cpp-starter', accent:'quest', icon:'terminal', estimatedMinutes:60,
    conceptGuide:guide('a0','Làm thế nào để một ý nghĩ trở thành chương trình C++ mà máy có thể chạy?','Mình muốn máy nói xin chào, nhưng chỉ nghĩ trong đầu thì màn hình vẫn trống.','cout << "Xin chao" << endl;','Statement biến ý định thành tín hiệu'),
    challenges:a0Challenges, exitTicket:a0Checkpoint,
  },
  {
    id:'a1', order:1, zoneName:'Đồng Cỏ Thuật Toán', title:'Ra lệnh cho nhân vật', subtitle:'function call · sequence · Game API',
    intro:'Em dùng lời gọi hàm C++ để điều khiển Byte trên bản đồ lớn. CodeQuest cung cấp Game API; còn cú pháp gọi hàm vẫn là C++ thật.',
    objectives:['Gọi hàm với tên, ngoặc tròn và dấu chấm phẩy','Lập chuỗi lệnh đúng thứ tự','Debug đường đi bằng chế độ từng bước'],
    certificateCode:'function-builder', accent:'verdant', icon:'map', estimatedMinutes:60,
    conceptGuide:guide('a1','Làm sao biến một đường đi trên bản đồ thành chuỗi lời gọi hàm đúng thứ tự?','Nếu chỉ nói “tới cổng đi”, Byte không biết bước đầu tiên là phải, trái, lên hay xuống.','moveRight();\nmoveDown();','Game API biến lời gọi hàm thành hành động'),
    challenges:a1Challenges, exitTicket:a1Checkpoint,
  },
  {
    id:'a2', order:2, zoneName:'Kho Dữ Liệu Pha Lê', title:'Ghi nhớ trạng thái', subtitle:'variable · data type · assignment · update',
    intro:'Thế giới bắt đầu thay đổi: ngọc được nhặt, cổng được mở và điểm số tăng. Biến giúp chương trình ghi nhớ các trạng thái đó.',
    objectives:['Khai báo biến với kiểu phù hợp','Gán và cập nhật giá trị','Kết nối dữ liệu trong code với trạng thái game'],
    certificateCode:'data-keeper', accent:'mage', icon:'gem', estimatedMinutes:60,
    conceptGuide:guide('a2','Làm sao để chương trình ghi nhớ một giá trị và cập nhật nó khi thế giới thay đổi?','Nếu viết cứng số ngọc trong mọi câu lệnh, mỗi lần nhặt thêm ta phải sửa rất nhiều chỗ.','int gems = 0;\ngems = gems + 1;','Biến là chiếc hộp có tên và kiểu'),
    challenges:a2Challenges, exitTicket:a2Checkpoint,
  },
];
