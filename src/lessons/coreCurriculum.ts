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

/** Chương trình có hàm do học sinh tự định nghĩa trước main. */
const cppWithFunctions = (functions: string, body: string) => `#include <iostream>
using namespace std;

${functions}

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
  initialState?: Record<string, unknown>;
}): WorldSpec => {
  /*
   * Các bài thực hành hiện dùng lõi 9×9 để tuyến lệnh ngắn, dễ suy luận. Ta mở
   * cảnh sang 16×9 bằng hai dải địa hình thật (không phải phông trang trí), rồi
   * dịch toàn bộ tọa độ cùng một lượng. Đường đi và đáp án vì thế không đổi,
   * nhưng viewport trên laptop có tỉ lệ ngang, gần với cách CodeCombat trình bày.
   */
  // Hai cánh chỉ mở rộng khung cảnh. Không dùng `=` tại đây vì `=` mang nghĩa
  // sư phạm là tuyến nhiệm vụ được phát sáng, không phải một tile trang trí.
  const leftWing = ['FFF', 'F..', 'F..', 'F..', 'F.^', 'F..', 'FF.', 'F..', 'FFF'];
  const rightWing = ['FFFF', '..^F', '...F', '~..F', '^..F', '...F', '.^^F', '...F', 'FFFF'];
  const shouldWiden = config.terrain.length === 9 && config.terrain.every((row) => row.length === 9);
  const offset = shouldWiden ? 3 : 0;
  const terrain = shouldWiden
    ? config.terrain.map((row, index) => `${leftWing[index]}${row}${rightWing[index]}`)
    : config.terrain;

  return {
  kind: 'map',
  cols: terrain[0].length,
  rows: terrain.length,
  startCol: config.start[0] + offset,
  startRow: config.start[1],
  startFacing: 'east',
  goalCol: config.goal[0] + offset,
  goalRow: config.goal[1],
  terrain,
  props: config.props?.map((prop) => ({ ...prop, col: prop.col + offset })),
  initialState: { ...config.initialState, energy: config.energy ?? 24 },
  };
};

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
    story: 'Một trận nhiễu dữ liệu đã làm Trạm Khởi Động mất liên lạc với ByteLand. Byte tìm thấy chương trình C++ cuối cùng của người gác trạm. Em hãy đọc nó như máy tính đọc: từ trên xuống dưới, rồi kiểm chứng tín hiệu đầu tiên.',
    instructions: ['Đọc dòng `cout` và xác định chính xác phần chữ nằm trong dấu ngoặc kép.', 'Trước khi chạy, dự đoán Output: `Xin chao ByteLand!`.', 'Bấm Chạy; quan sát luồng sáng đi tới đuốc tín hiệu và đối chiếu với dự đoán.'],
    starterCode: cpp('    cout << "Xin chao ByteLand!" << endl;'),
    requiredPatterns: ['stmt:cout'],
    testCases: [{ id: 'a0-c1-output', name: 'Đuốc số 1 nhận đúng `Xin chao ByteLand!`', kind: 'output', expectedOutput: 'Xin chao ByteLand!', required: true, visible: true }],
    commonMistakes: [],
    hints: hints('Dòng có `cout` đang gửi phần nào ra màn hình?', 'Đọc nội dung nằm giữa hai dấu ngoặc kép.', 'Hãy chạy nguyên chương trình đã cho và quan sát Output.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 10,
    world: {
      kind: 'signal-tower', cols: 14, rows: 7, startCol: 2, startRow: 4,
      props: [
        { id: 'a0-c1-tree-1', type: 'tree', col: 0, row: 1 },
        { id: 'a0-c1-tree-2', type: 'tree', col: 13, row: 5 },
        { id: 'a0-c1-fire', type: 'light', col: 9, row: 4 },
        { id: 'a0-c1-gate', type: 'gate', col: 12, row: 4 },
        { id: 'a0-c1-chest', type: 'chest', col: 11, row: 5 },
        { id: 'a0-c1-sign', type: 'sign', col: 4, row: 2 },
      ],
      initialState: { energy: 10, expectedSignals: ['Xin chao ByteLand!'] },
    },
    solution: cpp('    cout << "Xin chao ByteLand!" << endl;'),
    thinkingPrompt: 'Trước khi chạy, em ghi ra giấy chính xác dòng chữ mà em nghĩ máy sẽ in.',
    whyThisMatters: 'Dự đoán trước rồi kiểm chứng là vòng lặp học tập quan trọng nhất của cả hành trình.',
  },
  {
    id: 'a0-c2-cout', lessonId: 'a0', kind: 'sandbox', title: 'Mật khẩu của người gác trạm',
    story: 'Tín hiệu đầu tiên đã đánh thức Byte, nhưng cổng vẫn khóa vì chưa xác minh người điều khiển. Bảng đá cạnh bàn phát ghi mật khẩu `BAT DAU`. Em phải đặt dữ liệu ấy đúng vị trí trong câu lệnh C++.',
    instructions: ['Chỉ thay phần dữ liệu nằm giữa hai dấu ngoặc kép bằng `BAT DAU`.', 'Giữ nguyên toán tử `<<`, `endl` và dấu `;` vì đó là cú pháp của câu lệnh.', 'Chạy code; đuốc chỉ sáng khi nội dung và chữ hoa khớp chính xác.'],
    starterCode: cpp('    cout << "" << endl;'), requiredPatterns: ['stmt:cout'],
    testCases: [{ id: 'a0-c2-output', name: 'Trạm xác thực nhận đúng mật khẩu `BAT DAU`', kind: 'output', expectedOutput: 'BAT DAU', required: true, visible: true }],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Tín hiệu đã phát nhưng nội dung chưa khớp. Em kiểm tra chữ hoa và khoảng trắng nhé.' }],
    hints: hints('Nội dung cần in phải nằm ở đâu trong câu lệnh `cout`?', 'Giữ khung `cout << "..." << endl;` và chỉ thay phần nằm trong ngoặc kép.', '```cpp\ncout << "___" << endl;\n```\nĐiền chính xác mật khẩu nhiệm vụ vào chỗ trống.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 15,
    world: {
      kind: 'signal-tower', cols: 14, rows: 7, startCol: 2, startRow: 4,
      props: [
        { id: 'a0-c2-tree-1', type: 'tree', col: 0, row: 1 },
        { id: 'a0-c2-tree-2', type: 'tree', col: 13, row: 5 },
        { id: 'a0-c2-fire', type: 'light', col: 9, row: 4 },
        { id: 'a0-c2-gate', type: 'gate', col: 12, row: 4 },
        { id: 'a0-c2-sign', type: 'sign', col: 5, row: 2 },
        { id: 'a0-c2-machine', type: 'machine', col: 10, row: 5 },
      ],
      initialState: { expectedSignals: ['BAT DAU'] },
    }, solution: cpp('    cout << "BAT DAU" << endl;'),
    thinkingPrompt: 'Phần nào của câu lệnh là dữ liệu được in, phần nào là cú pháp C++?',
    whyThisMatters: '`cout` là công cụ chuẩn của C++ để em quan sát dữ liệu và kiểm tra chương trình.',
  },
  {
    id: 'a0-c3-debug-semicolon', lessonId: 'a0', kind: 'debug', title: 'Debug Lab: Dấu chấm phẩy thất lạc',
    story: 'Mật khẩu đã đúng, nhưng đường truyền phụ bị ngắt giữa hai thông báo trạng thái. Trình biên dịch dừng trước khi tín hiệu nào rời bàn phát. Em hãy dùng thông báo lỗi và phép so sánh hai dòng để tìm ký hiệu bị thiếu.',
    instructions: ['Đọc thông báo lỗi và xác định dòng đầu tiên máy không thể kết thúc.', 'So sánh phần cuối của hai câu lệnh `cout`; chỉ một dòng thiếu ký hiệu.', 'Thêm đúng một dấu `;`, rồi chạy từng bước để thấy hai đuốc sáng theo thứ tự.'],
    starterCode: cpp('    cout << "He thong" << endl\n    cout << "san sang" << endl;'), requiredPatterns: ['stmt:cout:count=2'],
    testCases: [{ id: 'a0-c3-output', name: 'Hai đuốc nhận lần lượt `He thong` và `san sang`', kind: 'output', expectedOutput: 'He thong\nsan sang', required: true, visible: true }],
    commonMistakes: [{ errorCode: 'MISSING_SEMICOLON', message: 'C++ cần dấu `;` để biết statement đầu tiên đã kết thúc.' }],
    hints: hints('Cuối hai dòng `cout` có gì khác nhau?', 'Mỗi statement C++ cần kết thúc bằng dấu `;`.', 'Thêm `;` ngay sau `endl` của dòng đầu.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 20,
    world: {
      kind: 'signal-tower', cols: 14, rows: 7, startCol: 2, startRow: 4,
      props: [
        { id: 'a0-c3-tree-1', type: 'tree', col: 0, row: 1 },
        { id: 'a0-c3-tree-2', type: 'tree', col: 13, row: 5 },
        { id: 'a0-c3-fire-1', type: 'light', col: 8, row: 4 },
        { id: 'a0-c3-fire-2', type: 'light', col: 10, row: 2 },
        { id: 'a0-c3-gate', type: 'gate', col: 12, row: 2 },
        { id: 'a0-c3-chest', type: 'chest', col: 11, row: 3 },
        { id: 'a0-c3-rock', type: 'rock', col: 5, row: 1 },
      ],
      initialState: { expectedSignals: ['He thong', 'san sang'] },
    }, solution: cpp('    cout << "He thong" << endl;\n    cout << "san sang" << endl;'),
    thinkingPrompt: 'Thông báo lỗi đang chỉ tới dòng nào, và ký hiệu cuối dòng đó khác dòng dưới ra sao?',
    whyThisMatters: 'Đọc lỗi theo vị trí và so sánh các dòng gần nhau là kỹ thuật debug có thể dùng trong mọi ngôn ngữ.',
  },
  {
    id: 'a0-c4-system-start', lessonId: 'a0', kind: 'boss', title: 'BOSS: Mở cổng ByteLand',
    story: 'Đường truyền đã được sửa. Cổng chính chỉ mở khi nhận đủ hai tín hiệu khởi động theo đúng thứ tự. Không còn code mẫu trong `main()`: đây là lần đầu em tự viết một chương trình hoàn chỉnh để đưa Byte vào hành trình.',
    instructions: ['Viết câu lệnh thứ nhất để in chính xác `CODEQUEST`.', 'Viết câu lệnh thứ hai để in chính xác `SYSTEM ONLINE`.', 'Mỗi câu lệnh `cout` nằm trên một dòng, kết thúc bằng `;`; chạy và quan sát hai đuốc mở khóa cổng.'],
    starterCode: cpp('    // Viết hai câu lệnh cout tại đây'), requiredPatterns: ['stmt:cout:count=2'],
    testCases: [
      { id: 'a0-c4-output', name: 'Cổng nhận `CODEQUEST` rồi `SYSTEM ONLINE`', kind: 'output', expectedOutput: 'CODEQUEST\nSYSTEM ONLINE', required: true, visible: true },
      { id: 'a0-c4-structure', name: 'Chương trình có đúng hai câu lệnh `cout`', kind: 'structure', patterns: ['stmt:cout:count=2'], required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Cổng đã nhận tín hiệu nhưng thứ tự hoặc chữ hoa chưa đúng. Em so từng dòng với mục tiêu.' }],
    hints: hints('Cổng cần nhận mấy dòng và dòng nào đến trước?', 'Viết hai câu lệnh `cout`, mỗi câu kết thúc bằng `endl;`.', '```cpp\ncout << "___" << endl;\ncout << "___" << endl;\n```\nĐiền hai tín hiệu theo đúng thứ tự đã nêu trong mục tiêu.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 30,
    world: {
      kind: 'signal-tower', cols: 14, rows: 7, startCol: 2, startRow: 4,
      props: [
        { id: 'a0-c4-tree-1', type: 'tree', col: 0, row: 1 },
        { id: 'a0-c4-tree-2', type: 'tree', col: 13, row: 5 },
        { id: 'a0-c4-fire-1', type: 'light', col: 8, row: 4 },
        { id: 'a0-c4-fire-2', type: 'light', col: 10, row: 2 },
        { id: 'a0-c4-portal', type: 'gate', col: 12, row: 2 },
        { id: 'a0-c4-chest', type: 'chest', col: 11, row: 3 },
        { id: 'a0-c4-machine', type: 'machine', col: 6, row: 5 },
        { id: 'a0-c4-sign', type: 'sign', col: 4, row: 1 },
      ],
      initialState: { expectedSignals: ['CODEQUEST', 'SYSTEM ONLINE'] },
    }, solution: cpp('    cout << "CODEQUEST" << endl;\n    cout << "SYSTEM ONLINE" << endl;'),
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
    testCases: [
      { id: 'a1-c1-gem', name: 'Thu được tinh thể trên đường', kind: 'world', expectedWorld: { collectedGems: 1 }, required: true, visible: true },
      { id: 'a1-c1-goal', name: 'Byte tới cổng năng lượng', kind: 'world', expectedWorld: { col: 7, row: 2 }, required: true, visible: true },
    ],
    commonMistakes: [], hints: hints('Mỗi lời gọi hàm làm Byte đổi vị trí bao nhiêu ô?', 'Ba lời gọi giống nhau tạo thành ba bước liên tiếp.', 'Chạy code đã cho rồi dùng chế độ Từng bước để quan sát.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 15,
    world: map({
      terrain: ['^^^FFF^^^','^..~~~..^','#=====^.#','#..~.^..#','F..~.^^^F','F..~....F','^^.~~~.^^','^...^...^','^^^FFF^^^'],
      start: [1,2], goal: [4,2],
      props: [
        { id: 'a1-c1-sign', type: 'sign', col: 1, row: 1, state: 'decorative' },
        { id: 'a1-c1-gem', type: 'trail-gem', col: 2, row: 2 },
        { id: 'a1-c1-well', type: 'well', col: 6, row: 5, state: 'decorative' },
        { id: 'a1-c1-flowers', type: 'flowers', col: 7, row: 1, state: 'decorative' },
        { id: 'a1-c1-chest', type: 'chest', col: 3, row: 7, state: 'decorative' },
      ],
    }),
    solution: cpp('    moveRight();\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Nếu dòng thứ hai chưa chạy, Byte đang ở cột nào?', whyThisMatters: 'Lời gọi hàm là cầu nối giữa một câu lệnh C++ và một hành động trong thế giới game.',
  },
  {
    id: 'a1-c2-change-direction', lessonId: 'a1', kind: 'concept', title: 'Rẽ xuống thung lũng',
    story: 'Đường đi không còn thẳng. Byte phải sang phải rồi đi xuống; thứ tự gọi hàm quyết định toàn bộ quỹ đạo.',
    instructions: ['Đi sang phải hai ô.', 'Đi xuống hai ô.', 'Dùng `moveRight()` và `moveDown()` theo đúng thứ tự.'],
    starterCode: cpp('    // Sang phải 2 ô, sau đó đi xuống 2 ô'), requiredPatterns: ['call:moveRight', 'call:moveDown'],
    testCases: [
      { id: 'a1-c2-gem', name: 'Thu tinh thể ở góc rẽ', kind: 'world', expectedWorld: { collectedGems: 1 }, required: true, visible: true },
      { id: 'a1-c2-goal', name: 'Byte tới đúng ô cổng', kind: 'world', expectedWorld: { col: 6, row: 4 }, required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Đường đi cần cả chuyển động ngang và dọc. Em đối chiếu từng đoạn trên bản đồ.' }],
    hints: hints('Bản đồ có mấy đoạn thẳng và mỗi đoạn đi theo hướng nào?', 'Viết hai `moveRight()` trước, rồi hai `moveDown()`.', '```cpp\nmoveRight();\nmoveRight();\n// Viết hai bước đi xuống tại đây\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 20,
    world: map({
      terrain: ['^^FFFFF^^','^..~~~..^','#===^...#','#^^=^~..#','#^^=^^..#','#..=....#','F..~.^^^F','^...^...^','^^FFFFF^^'],
      start: [1,2], goal: [3,4],
      props: [
        { id: 'a1-c2-sign', type: 'sign', col: 1, row: 1, state: 'decorative' },
        { id: 'a1-c2-gem', type: 'trail-gem', col: 3, row: 2 },
        { id: 'a1-c2-log', type: 'log', col: 6, row: 3, state: 'decorative' },
        { id: 'a1-c2-mushroom', type: 'mushroom', col: 5, row: 6, state: 'decorative' },
        { id: 'a1-c2-chest', type: 'chest', col: 2, row: 7, state: 'decorative' },
      ],
    }),
    solution: cpp('    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();'),
    thinkingPrompt: 'Ở bước thứ ba, Byte cần thay đổi tọa độ cột hay tọa độ hàng?', whyThisMatters: 'Tách đường đi thành các đoạn giúp em viết và kiểm tra thuật toán theo từng phần.',
  },
  {
    id: 'a1-c3-obstacle-route', lessonId: 'a1', kind: 'mission', title: 'Vòng qua hồ độc',
    story: 'Một hồ độc chắn đường trực tiếp tới cổng. Byte cần đi theo lối chữ U, không thể bước qua ô tường.',
    instructions: ['Đi xuống để tránh hồ.', 'Đi sang phải theo hành lang dưới.', 'Đi lên tới cổng.'],
    starterCode: cpp('    // Lập trình đường đi chữ U'), requiredPatterns: ['call:moveDown', 'call:moveRight', 'call:moveUp'],
    testCases: [
      { id: 'a1-c3-gems', name: 'Thu đủ hai tinh thể quanh hồ', kind: 'world', expectedWorld: { collectedGems: 2 }, required: true, visible: true },
      { id: 'a1-c3-goal', name: 'Byte vòng qua hồ và tới cổng', kind: 'world', expectedWorld: { col: 8, row: 2 }, required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Lối chữ U có ba đoạn: xuống, sang phải rồi lên.' }],
    hints: hints('Ô đầu tiên bên phải có đi được không? Lối trống bắt đầu theo hướng nào?', 'Đường đi gồm ba đoạn: xuống 2 ô → phải 4 ô → lên 2 ô.', '```cpp\n// Đoạn 1: xuống 2 ô\n___\n// Đoạn 2: sang phải 4 ô\n___\n// Đoạn 3: đi lên 2 ô\n___\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 25, parStatements: 8,
    world: map({
      terrain: ['^^^FFF^^^','^..~~~..^','#=~~~=..#','#=~~~=..#','#=====..#','#..^^...#','F.^..^.FF','^...^...^','^^FFFFF^^'],
      start: [1,2], goal: [5,2],
      props: [
        { id: 'a1-c3-warning', type: 'sign', col: 2, row: 1, state: 'decorative' },
        { id: 'a1-c3-gem-1', type: 'trail-gem', col: 1, row: 4 },
        { id: 'a1-c3-gem-2', type: 'trail-gem', col: 5, row: 4 },
        { id: 'a1-c3-enemy', type: 'enemy', col: 3, row: 3, state: 'decorative' },
        { id: 'a1-c3-mushroom-1', type: 'mushroom', col: 3, row: 2, state: 'decorative' },
        { id: 'a1-c3-mushroom-2', type: 'mushroom', col: 4, row: 3, state: 'decorative' },
        { id: 'a1-c3-chest', type: 'chest', col: 7, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();'),
    thinkingPrompt: 'Trước khi gõ, em chia đường chữ U thành ba đoạn và ghi số ô của từng đoạn.', whyThisMatters: 'Đây là bước đầu của phân rã bài toán: giải ba chặng nhỏ thay vì đoán cả đường đi cùng lúc.',
  },
  {
    id: 'a1-c4-debug-order', lessonId: 'a1', kind: 'debug', title: 'Debug Lab: Đúng lệnh, sai thứ tự',
    story: 'Các câu lệnh đều hợp lệ nhưng Byte va vào vách. Lỗi không nằm ở cú pháp; nó nằm ở thứ tự của kế hoạch.',
    instructions: ['Chạy ở chế độ Từng bước và tìm lần va vào bot.', 'Đi xuống hành lang dưới, sang phải rồi quay lên.', 'Thu hai tinh thể trước khi tới cổng.'],
    starterCode: cpp('    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveDown();\n    moveUp();\n    moveUp();'), requiredPatterns: ['call:moveDown:count=3', 'call:moveRight:count=4', 'call:moveUp:count=2'],
    testCases: [
      { id: 'a1-c4-gems', name: 'Thu đủ hai tinh thể sau khi debug', kind: 'world', expectedWorld: { collectedGems: 2 }, required: true, visible: true },
      { id: 'a1-c4-goal', name: 'Byte tới đích sau khi sửa thứ tự', kind: 'world', expectedWorld: { col: 8, row: 3 }, required: true, visible: true },
    ],
    commonMistakes: [], hints: hints('Dòng nào tạo ra lần va chạm đầu tiên trong Nhật ký chạy?', 'So code với ba đoạn an toàn: xuống 3, phải 4, lên 2. Chỉ một lệnh đang nằm sai đoạn.', 'Giữ nguyên tám lệnh đúng. Chuyển lệnh `moveDown()` đang đặt sau bốn bước sang phải lên cuối đoạn đi xuống.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 30, parStatements: 9,
    world: map({
      terrain: ['FF^^FFF^^','F..~~~..F','#==^^=..#','#=^^^=..#','#=~~~=..#','#=====..#','^^..^^.^^','^...^...^','^^FFFFF^^'],
      start: [1,2], goal: [5,3],
      props: [
        { id: 'a1-c4-bot', type: 'enemy', col: 2, row: 2, state: 'blocking' },
        { id: 'a1-c4-gem-1', type: 'trail-gem', col: 1, row: 5 },
        { id: 'a1-c4-gem-2', type: 'trail-gem', col: 5, row: 5 },
        { id: 'a1-c4-sign', type: 'sign', col: 5, row: 4, state: 'decorative' },
        { id: 'a1-c4-chest', type: 'chest', col: 6, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    moveDown();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();'),
    thinkingPrompt: 'Bước đầu tiên trong code có khớp với ô trống đầu tiên quanh Byte không?', whyThisMatters: 'Phân biệt lỗi cú pháp với lỗi logic giúp em chọn đúng cách sửa và không viết lại phần vốn đã đúng.',
  },
  {
    id: 'a1-c5-portal', lessonId: 'a1', kind: 'boss', title: 'BOSS: Cổng dịch chuyển',
    story: 'Cổng dịch chuyển cuối khu vực đang mở trong thời gian ngắn. Byte phải đi qua hành lang zíc-zắc bằng một chuỗi lệnh chính xác.',
    instructions: ['Lập kế hoạch theo bốn đoạn đường.', 'Không bước vào tường.', 'Tới đúng cổng dịch chuyển màu tím ở góc trên bên phải.'],
    starterCode: cpp('    // Viết chuỗi lệnh mở đường tới cổng dịch chuyển'), requiredPatterns: ['call:moveRight', 'call:moveDown', 'call:moveUp'],
    testCases: [
      { id: 'a1-c5-gems', name: 'Thu đủ ba tinh thể của Boss', kind: 'world', expectedWorld: { collectedGems: 3 }, required: true, visible: true },
      { id: 'a1-c5-goal', name: 'Byte bước vào cổng dịch chuyển', kind: 'world', expectedWorld: { col: 9, row: 1 }, required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Đường tới cổng dịch chuyển cần cả ba hướng phải, xuống và lên. Em chia bản đồ thành từng đoạn.' }],
    hints: hints('Đường đi đổi hướng ở những ô góc nào?', 'Bốn đoạn: phải 2 → xuống 3 → phải 3 → lên 3.', '```cpp\n// Đoạn 1: phải 2\n___\n// Đoạn 2: xuống 3\n___\n// Đoạn 3: phải 3\n___\n// Đoạn 4: lên 3\n___\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 40, parStatements: 11,
    world: map({
      terrain: ['^^FFFFFF^','#===^^=^#','#^^=^^=^#','#^^=^^=^#','#^^====^#','#..^^...#','F.^..^.FF','^...^...^','^^FFFFF^^'],
      start: [1,1], goal: [6,1],
      props: [
        { id: 'a1-c5-gem-1', type: 'trail-gem', col: 3, row: 1 },
        { id: 'a1-c5-gem-2', type: 'trail-gem', col: 3, row: 4 },
        { id: 'a1-c5-gem-3', type: 'trail-gem', col: 6, row: 2 },
        { id: 'portal-a1', type: 'portal', col: 6, row: 1 },
        { id: 'a1-c5-guardian', type: 'statue', col: 7, row: 3, state: 'decorative' },
        { id: 'a1-c5-sword', type: 'sword', col: 1, row: 6, state: 'decorative' },
        { id: 'a1-c5-shield', type: 'shield', col: 6, row: 6, state: 'decorative' },
        { id: 'a1-c5-chest', type: 'chest', col: 4, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();\n    moveUp();'),
    thinkingPrompt: 'Em hãy đánh dấu bốn ô đổi hướng trên bản đồ trước khi viết code.', whyThisMatters: 'Boss kiểm tra khả năng lập kế hoạch, dự đoán và debug cả một chuỗi hành động dài mà không thêm khái niệm mới.',
  },
];

const a2Challenges: Challenge[] = [
  {
    id: 'a2-c1-variable', lessonId: 'a2', kind: 'story', title: 'Chiếc hộp có tên',
    story: 'Hai tinh thể ký ức dẫn tới kho dữ liệu. Biến `gems` là một vùng nhớ có tên: nó giữ giá trị 2 trong khi Byte đi qua đúng hai tinh thể trên bản đồ.',
    instructions: ['Dự đoán kết quả đầu ra (Output) trước khi chạy.', 'Theo dõi Byte thu hai tinh thể dẫn đường.', 'So sánh số Gem trên bản đồ với giá trị đang lưu trong `gems`.'],
    starterCode: cpp('    int gems = 2;\n\n    moveRight();\n    moveRight();\n    moveRight();\n    cout << gems << endl;'), requiredPatterns: ['decl:var:int', 'stmt:cout'],
    testCases: [
      { id: 'a2-c1-world', name: 'Byte thu hai tinh thể và tới kho dữ liệu', kind: 'world', expectedWorld: { col: 7, row: 2, collectedGems: 2 }, required: true, visible: true },
      { id: 'a2-c1-output', name: 'In giá trị đang lưu trong gems', kind: 'output', expectedOutput: '2', required: true, visible: true },
    ],
    commonMistakes: [], hints: hints('Tên nào đang đại diện cho số 2?', 'Dòng khai báo tạo biến; các lệnh di chuyển đã được cho sẵn để em tập trung quan sát giá trị.', 'Theo dõi hai bằng chứng riêng: số được `cout` in ra và số Gem Byte thu trên bản đồ. Hai giá trị có khớp dự đoán của em không?'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 15,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F====^..F','F.^^.^..F','F..~.^^.F','F.^~....F','F..~.^..F','F...^^..F','FFFFFFFFF'],
      start: [1,2], goal: [4,2], energy: 18,
      props: [
        { id: 'a2-c1-gem-1', type: 'trail-gem', col: 2, row: 2 },
        { id: 'a2-c1-gem-2', type: 'trail-gem', col: 3, row: 2 },
        { id: 'a2-c1-sign', type: 'sign', col: 1, row: 1, state: 'decorative' },
        { id: 'a2-c1-potion', type: 'potion', col: 6, row: 5, state: 'decorative' },
        { id: 'a2-c1-chest', type: 'chest', col: 7, row: 6, state: 'decorative' },
      ],
    }), solution: cpp('    int gems = 2;\n\n    moveRight();\n    moveRight();\n    moveRight();\n    cout << gems << endl;'),
    thinkingPrompt: 'Nếu đổi `2` thành `5` mà không sửa dòng `cout`, Output sẽ là gì?', whyThisMatters: 'Biến giúp chương trình ghi nhớ trạng thái thay vì phải viết cứng mọi giá trị.',
  },
  {
    id: 'a2-c2-data-types', lessonId: 'a2', kind: 'concept', title: 'Bốn loại dữ liệu',
    story: 'Bảng kiểm kê của kho có bốn trường thông tin: số Gem, tốc độ, trạng thái cổng và tên nhân vật. Mỗi trường cần một kiểu dữ liệu phù hợp.',
    instructions: ['Đổi bốn giá trị mẫu thành `3`, `1.5`, `true` và `"Byte"`.', 'Giữ đúng kiểu `int`, `double`, `bool`, `string`.', 'Viết một câu `cout` để in `3 1.5 1 Byte`; đường tới cổng đã được cho sẵn.'],
    starterCode: cpp('    int gems = 0;\n    double speed = 0.0;\n    bool portalOpen = false;\n    string hero = "";\n\n    // Gán giá trị và in: 3 1.5 1 Byte\n\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();'),
    requiredPatterns: ['decl:var:int', 'decl:var:double', 'decl:var:bool', 'decl:var:string', 'stmt:cout'],
    testCases: [
      { id: 'a2-c2-world', name: 'Byte đi qua bốn trạm và tới cổng dịch chuyển', kind: 'world', expectedWorld: { col: 6, row: 3 }, required: true, visible: true },
      { id: 'a2-c2-output', name: 'Bốn dữ liệu có đúng giá trị', kind: 'output', expectedOutput: '3 1.5 1 Byte', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Em kiểm tra lại kiểu và giá trị: chuỗi cần ngoặc kép, `bool true` được `cout` in thành 1.' }],
    hints: hints('Giá trị nào là số nguyên, số thập phân, đúng–sai và văn bản?', 'Ghép mỗi giá trị với kiểu phù hợp; sau đó nối các biến bằng `<< " " <<` để tạo khoảng cách.', '```cpp\nint gems = ___;\ndouble speed = ___;\nbool portalOpen = ___;\nstring hero = "___";\n\ncout << gems << " " << ___ << " " << ___ << " " << ___ << endl;\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 25,
    world: map({
      terrain: ['FFFFFFFFF','F...^^..F','F.^.^^..F','F^^=^...F','F^^=^^..F','F===....F','F.^..^..F','F...^^..F','FFFFFFFFF'],
      start: [1,5], goal: [3,3], energy: 20,
      props: [
        { id: 'a2-c2-int', type: 'chest', col: 1, row: 4, state: 'decorative' },
        { id: 'a2-c2-double', type: 'potion', col: 3, row: 5, state: 'decorative' },
        { id: 'a2-c2-bool', type: 'key', col: 2, row: 3, state: 'decorative' },
        { id: 'a2-c2-string', type: 'sign', col: 4, row: 3, state: 'decorative' },
        { id: 'a2-c2-guardian', type: 'statue', col: 7, row: 5, state: 'decorative' },
      ],
    }), solution: cpp('    int gems = 3;\n    double speed = 1.5;\n    bool portalOpen = true;\n    string hero = "Byte";\n\n    cout << gems << " " << speed << " " << portalOpen << " " << hero << endl;\n\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();'),
    thinkingPrompt: 'Vì sao tên nhân vật không thể lưu bằng `int`, còn số Gem thì có thể?', whyThisMatters: 'Chọn đúng kiểu giúp trình biên dịch kiểm tra dữ liệu có thể được lưu và xử lý theo cách nào.',
  },
  {
    id: 'a2-c3-collect-count', lessonId: 'a2', kind: 'mission', title: 'Nhặt Gem và cập nhật',
    story: 'Hành lang đã đổi hướng. Byte phải đứng đúng ô Gem, nhặt vật phẩm, cập nhật biến rồi tiếp tục vòng qua phế tích tới cổng dịch chuyển.',
    instructions: ['Đi sang phải hai ô để tới Gem.', 'Gọi `collectGem()`, gán kết quả `gemsCollected()` vào `gems` rồi in.', 'Đi xuống hai ô và sang phải hai ô để tới cổng dịch chuyển.'],
    starterCode: cpp('    int gems = 0;\n\n    // Di chuyển, nhặt Gem, cập nhật gems, in và tới cổng'),
    requiredPatterns: ['decl:var:int', 'call:collectGem', 'call:gemsCollected', 'stmt:cout'],
    testCases: [
      { id: 'a2-c3-world', name: 'Nhặt một Gem và tới cổng', kind: 'world', expectedWorld: { col: 8, row: 4, collectedGems: 1 }, required: true, visible: true },
      { id: 'a2-c3-output', name: 'Báo cáo đúng số Gem', kind: 'output', expectedOutput: '1', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Số Gem trong thế giới đã đổi; em cần cập nhật biến trước khi in.' }],
    hints: hints('Biến `gems` được khởi tạo trước hay sau khi nhặt Gem?', 'Sau `collectGem()`, gán kết quả của `gemsCollected()` cho `gems`, rồi mới `cout`.', '```cpp\n// Đi tới Gem\n___\ncollectGem();\ngems = gemsCollected();\ncout << ___ << endl;\n// Đi tiếp tới cổng\n___\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 30,
    world: map({ terrain: ['FFFFFFFFF','F^^...^^F','F===^^..F','F^^=^~..F','F^^===..F','F.^...^.F','F..^^^..F','F.......F','FFFFFFFFF'], start: [1,2], goal: [5,4], props: [{ id: 'gem-a2-1', type: 'gem', col: 3, row: 2 }, { id: 'portal-a2-1', type: 'portal', col: 5, row: 4 }, { id: 'a2-c3-sign', type: 'sign', col: 1, row: 1, state: 'decorative' }, { id: 'a2-c3-guardian', type: 'statue', col: 6, row: 2, state: 'decorative' }, { id: 'a2-c3-potion', type: 'potion', col: 7, row: 1, state: 'decorative' }, { id: 'a2-c3-chest', type: 'chest', col: 7, row: 6, state: 'decorative' }] }),
    solution: cpp('    int gems = 0;\n\n    moveRight();\n    moveRight();\n    collectGem();\n    gems = gemsCollected();\n    cout << gems << endl;\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Ở thời điểm nào biến `gems` cần nhận giá trị mới từ thế giới?', whyThisMatters: 'Màn này nối trạng thái game với trạng thái chương trình: hành động làm thế giới đổi, phép gán làm dữ liệu trong code đổi.',
  },
  {
    id: 'a2-c4-debug-update', lessonId: 'a2', kind: 'debug', title: 'Debug Lab: Giá trị cũ',
    story: 'Byte đã có 1 mảnh ký ức và vừa nhặt thêm 2 Gem trên đường. Bảng điểm vẫn hiện 2 vì phép gán đã làm mất giá trị cũ và không đọc dữ liệu thật từ bản đồ.',
    instructions: ['Chạy Từng bước và theo dõi hai lần nhặt Gem.', 'Tìm dòng đang ghi đè giá trị 1 bằng số 2.', 'Sửa để cộng số Gem thật từ `gemsCollected()`, rồi in tổng bằng 3.'],
    starterCode: cpp('    int gems = 1;\n\n    moveRight();\n    moveRight();\n    collectGem();\n    moveDown();\n    moveDown();\n    moveDown();\n    collectGem();\n    moveRight();\n    moveRight();\n    moveRight();\n\n    gems = 2;\n    cout << gems << endl;'), requiredPatterns: ['decl:var:int', 'op:+', 'call:collectGem:count=2', 'call:gemsCollected', 'stmt:cout'],
    testCases: [
      { id: 'a2-c4-world', name: 'Nhặt thêm hai Gem và tới cổng', kind: 'world', expectedWorld: { col: 9, row: 5, collectedGems: 2 }, required: true, visible: true },
      { id: 'a2-c4-output', name: 'Tổng Gem tăng từ 1 lên 3', kind: 'output', expectedOutput: '3', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Vế phải cần giữ giá trị cũ và đọc số Gem thật bằng `gemsCollected()`.' }],
    hints: hints('Dòng `gems = 2` giữ lại hay thay thế số 1?', 'Vế phải cần cả giá trị cũ của `gems` và số Gem đã thu trên bản đồ.', 'Giữ nguyên vế trái. Ở vế phải, cộng `gems` với kết quả của hàm `gemsCollected()`.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 25,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F===^^..F','F^^=^^..F','F^^=^~..F','F^^====.F','F..~.^..F','F...^^..F','FFFFFFFFF'],
      start: [1,2], goal: [6,5], energy: 26,
      props: [
        { id: 'a2-c4-gem-1', type: 'gem', col: 3, row: 2 },
        { id: 'a2-c4-gem-2', type: 'gem', col: 3, row: 5 },
        { id: 'a2-c4-ruin', type: 'rock', col: 5, row: 3, state: 'blocking' },
        { id: 'a2-c4-potion', type: 'potion', col: 7, row: 1, state: 'decorative' },
        { id: 'a2-c4-chest', type: 'chest', col: 1, row: 6, state: 'decorative' },
      ],
    }), solution: cpp('    int gems = 1;\n\n    moveRight();\n    moveRight();\n    collectGem();\n    moveDown();\n    moveDown();\n    moveDown();\n    collectGem();\n    moveRight();\n    moveRight();\n    moveRight();\n\n    gems = gems + gemsCollected();\n    cout << gems << endl;'),
    thinkingPrompt: 'Phép gán `gems = 2` khác `gems = gems + gemsCollected()` ở hai điểm nào?', whyThisMatters: 'Cập nhật từ dữ liệu thật giúp chương trình vẫn đúng khi số vật phẩm trên bản đồ thay đổi, thay vì phụ thuộc vào một con số viết cứng.',
  },
  {
    id: 'a2-c5-vault', lessonId: 'a2', kind: 'boss', title: 'BOSS: Kho Gem ký ức',
    story: 'Kho ký ức chỉ mở khi Byte thu đủ hai Gem, báo cáo đúng tổng số và bước vào cổng dịch chuyển. Mỗi viên nằm ở một nhánh khác nhau.',
    instructions: ['Nhặt Gem ở nhánh bên phải.', 'Đi xuống rồi sang trái để nhặt Gem thứ hai.', 'Cập nhật biến từ trạng thái game, in `2`, sau đó đi tới cổng dịch chuyển.'],
    starterCode: cpp('    int gems = 0;\n\n    // Lập kế hoạch nhặt đủ 2 Gem và tới cổng'),
    requiredPatterns: ['decl:var:int', 'call:collectGem:count=2', 'call:gemsCollected', 'stmt:cout'],
    testCases: [
      { id: 'a2-c5-world', name: 'Nhặt đủ hai Gem và vào kho', kind: 'world', expectedWorld: { col: 8, row: 4, collectedGems: 2 }, required: true, visible: true },
      { id: 'a2-c5-output', name: 'Báo cáo tổng số Gem là 2', kind: 'output', expectedOutput: '2', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Kho chỉ mở khi biến được cập nhật sau khi đã nhặt cả hai Gem.' }],
    hints: hints('Sau mỗi lần nhặt, Byte đang ở tọa độ nào và cổng còn ở hướng nào?', 'Lộ trình gồm ba chặng: phải 2 và nhặt → xuống 2, trái 2 và nhặt → phải 4 tới cổng.', '```cpp\n// Chặng 1: tới Gem bên phải và nhặt\n___\n// Chặng 2: tới Gem phía dưới và nhặt\n___\ngems = gemsCollected();\ncout << ___ << endl;\n// Chặng 3: tới cổng\n___\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 45,
    world: map({ terrain: ['FFFFFFFFF','F^^...^^F','F===^^..F','F^^=^^..F','F=====..F','F.^...^.F','F..^^^..F','F.......F','FFFFFFFFF'], start: [1,2], goal: [5,4], props: [{ id: 'gem-a2-left', type: 'gem', col: 3, row: 2 }, { id: 'gem-a2-bottom', type: 'gem', col: 1, row: 4 }, { id: 'portal-a2-vault', type: 'portal', col: 5, row: 4 }, { id: 'a2-c5-sign', type: 'sign', col: 1, row: 1, state: 'decorative' }, { id: 'a2-c5-potion', type: 'potion', col: 7, row: 1, state: 'decorative' }, { id: 'a2-c5-statue', type: 'statue', col: 7, row: 4, state: 'decorative' }, { id: 'a2-c5-chest', type: 'chest', col: 7, row: 6, state: 'decorative' }, { id: 'a2-c5-guardian', type: 'statue', col: 6, row: 3, state: 'decorative' }] }),
    solution: cpp('    int gems = 0;\n\n    moveRight();\n    moveRight();\n    collectGem();\n    moveDown();\n    moveDown();\n    moveLeft();\n    moveLeft();\n    collectGem();\n    gems = gemsCollected();\n    cout << gems << endl;\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Hãy chia nhiệm vụ thành ba chặng: Gem 1, Gem 2, cổng; ghi trạng thái `gems` sau từng chặng.', whyThisMatters: 'Boss yêu cầu phối hợp kiểu dữ liệu, biến, phép gán, Game API và thuật toán đường đi trong một bài toán có trạng thái.',
  },
];

const a3Challenges: Challenge[] = [
  {
    id: 'a3-c1-forge-energy', lessonId: 'a3', kind: 'story', title: 'Mẻ năng lượng đầu tiên',
    story: 'Lò Toán Tử đã nguội lạnh. Mỗi tinh thể tạo ra 3 đơn vị năng lượng; Byte cần biến phép nhân trong code thành nguồn sáng cho cỗ máy đầu tiên.',
    instructions: ['Dự đoán giá trị của `energy` trước khi chạy.', 'Quan sát phép nhân `crystals * powerPerCrystal`.', 'Đi theo đường sáng, thu tinh thể và cấp đúng 6 năng lượng cho máy.'],
    starterCode: cpp('    int crystals = 2;\n    int powerPerCrystal = 3;\n    int energy = crystals * powerPerCrystal;\n\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();\n    chargeMachine(energy);\n    cout << energy << endl;'),
    requiredPatterns: ['decl:var:int', 'op:*', 'call:chargeMachine', 'stmt:cout'],
    testCases: [
      { id: 'a3-c1-machine', name: 'Máy đầu tiên nhận đúng 6 năng lượng', kind: 'world', expectedWorld: { col: 8, row: 2, machineCharges: [6], totalCharge: 6, collectedGems: 1 }, required: true, visible: true },
      { id: 'a3-c1-output', name: 'Bảng điều khiển báo 6', kind: 'output', expectedOutput: '6', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Mỗi tinh thể cho 3 năng lượng. Em tính `2 * 3` trước khi nhìn Output.' }],
    hints: hints('Có 2 nhóm, mỗi nhóm 3 đơn vị; phép toán nào mô tả đúng?', 'Tạo `energy` bằng phép nhân rồi truyền biến đó vào `chargeMachine(...)`.', 'Giữ nguyên code mẫu, dự đoán 6 rồi nhấn Chạy để quan sát.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 25,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F=====..F','F.^^^.^.F','F..~..^.F','F.^~.^..F','F..~....F','F...^^..F','FFFFFFFFF'],
      start: [1,2], goal: [5,2], energy: 20,
      props: [
        { id: 'a3-c1-gem', type: 'trail-gem', col: 3, row: 2 },
        { id: 'a3-machine-1', type: 'machine', col: 5, row: 2 },
        { id: 'a3-c1-sign', type: 'sign', col: 1, row: 1, state: 'decorative' },
        { id: 'a3-c1-enemy', type: 'enemy', col: 7, row: 4, state: 'decorative' },
        { id: 'a3-c1-chest', type: 'chest', col: 6, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    int crystals = 2;\n    int powerPerCrystal = 3;\n    int energy = crystals * powerPerCrystal;\n\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();\n    chargeMachine(energy);\n    cout << energy << endl;'),
    thinkingPrompt: 'Nếu có thêm một tinh thể nhưng năng lượng mỗi viên không đổi, kết quả sẽ tăng thêm bao nhiêu?',
    whyThisMatters: 'Toán tử biến dữ liệu đã lưu thành giá trị mới; Game API giúp em nhìn thấy giá trị đó tác động lên thế giới.',
  },
  {
    id: 'a3-c2-crystal-balance', lessonId: 'a3', kind: 'concept', title: 'Cân tinh thể',
    story: 'Mười một tinh thể cần chia thành từng cặp để vừa khay. Phép chia nguyên cho biết số cặp đầy, còn `%` cho biết số tinh thể còn dư.',
    instructions: ['Tính số cặp bằng `crystals / 2`.', 'Tính phần dư bằng `crystals % 2`.', 'Đi theo hành lang, cấp 5 năng lượng cho cân và in `5 1`.'],
    starterCode: cpp('    int crystals = 11;\n    int pairs = 0;\n    int leftover = 0;\n\n    // Tính pairs và leftover, sau đó đi tới cân năng lượng'),
    requiredPatterns: ['op:/', 'op:%', 'call:chargeMachine', 'stmt:cout'],
    testCases: [
      { id: 'a3-c2-machine', name: 'Cân nhận năng lượng của 5 cặp đầy', kind: 'world', expectedWorld: { col: 8, row: 4, machineCharges: [5], totalCharge: 5, collectedGems: 1 }, required: true, visible: true },
      { id: 'a3-c2-output', name: 'Báo đúng 5 cặp và dư 1', kind: 'output', expectedOutput: '5 1', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Với biến `int`, `11 / 2` là 5; phần còn lại được lấy bằng `11 % 2`.' }],
    hints: hints('Sau khi xếp 11 viên thành các cặp, có bao nhiêu cặp đầy và còn mấy viên?', 'Dùng `/ 2` cho `pairs`, `% 2` cho `leftover`; máy nhận giá trị `pairs`.', '```cpp\npairs = crystals / ___;\nleftover = crystals % ___;\n// Đi tới cân\n___\nchargeMachine(___);\ncout << pairs << " " << ___ << endl;\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 30,
    world: map({
      terrain: ['FFFFFFFFF','F.^^...^F','F===^^..F','F^^=^~..F','F^^===..F','F..~.^..F','F..^^...F','F...^...F','FFFFFFFFF'],
      start: [1,2], goal: [5,4], energy: 22,
      props: [
        { id: 'a3-c2-gem', type: 'trail-gem', col: 3, row: 3 },
        { id: 'a3-machine-2', type: 'machine', col: 5, row: 4 },
        { id: 'a3-c2-potion', type: 'potion', col: 7, row: 1, state: 'decorative' },
        { id: 'a3-c2-enemy', type: 'enemy', col: 1, row: 6, state: 'decorative' },
        { id: 'a3-c2-chest', type: 'chest', col: 7, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    int crystals = 11;\n    int pairs = crystals / 2;\n    int leftover = crystals % 2;\n\n    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    chargeMachine(pairs);\n    cout << pairs << " " << leftover << endl;'),
    thinkingPrompt: 'Vì sao `pairs` và `leftover` trả lời hai câu hỏi khác nhau dù cùng dùng 11 và 2?',
    whyThisMatters: 'Chia nguyên và phần dư thường đi cùng nhau khi ghép cặp, chia đội, kiểm tra chẵn–lẻ hoặc phân phối tài nguyên.',
  },
  {
    id: 'a3-c3-compare-switch', lessonId: 'a3', kind: 'mission', title: 'Công tắc ngưỡng an toàn',
    story: 'Công tắc chỉ được bật khi lò có ít nhất 8 năng lượng. So sánh không tạo thêm năng lượng; nó trả lời một câu hỏi đúng–sai để điều khiển thiết bị.',
    instructions: ['Tạo `bool enoughEnergy` bằng phép so sánh `energy >= 8`.', 'Truyền kết quả bool vào `setSwitch(...)`.', 'Bật công tắc, đi theo đường sáng và tới cổng.'],
    starterCode: cpp('    int energy = 9;\n    bool enoughEnergy = false;\n\n    // So sánh, bật công tắc và đi tới cổng'),
    requiredPatterns: ['decl:var:bool', 'op:>=', 'call:setSwitch', 'stmt:cout'],
    testCases: [
      { id: 'a3-c3-switch', name: 'Công tắc bật vì 9 đủ ngưỡng 8', kind: 'world', expectedWorld: { col: 8, row: 2, activeSwitchIds: ['a3-switch-3'], collectedGems: 2 }, required: true, visible: true },
      { id: 'a3-c3-output', name: 'Bảng điều khiển báo true dưới dạng 1', kind: 'output', expectedOutput: '1', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Đây là câu hỏi “có ít nhất 8 không?”, vì vậy cần dùng toán tử `>=`.' }],
    hints: hints('Cụm “ít nhất 8” bao gồm cả trường hợp đúng bằng 8 không?', 'Gán kết quả so sánh `energy >= 8` cho biến bool, rồi đưa biến đó vào `setSwitch`.', '```cpp\nenoughEnergy = energy ___ 8;\nsetSwitch(___);\ncout << enoughEnergy << endl;\n// Đi theo đường sáng tới cổng\n___\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 35,
    world: map({
      terrain: ['FFFFFFFFF','F..^^^..F','F^^===..F','F^^=^~..F','F^^=^^..F','F===^^..F','F.^....^F','F...^^..F','FFFFFFFFF'],
      start: [1,5], goal: [5,2], energy: 24,
      props: [
        { id: 'a3-switch-3', type: 'switch', col: 1, row: 5 },
        { id: 'a3-c3-gem-1', type: 'trail-gem', col: 3, row: 4 },
        { id: 'a3-c3-gem-2', type: 'trail-gem', col: 4, row: 2 },
        { id: 'a3-c3-bot', type: 'enemy', col: 6, row: 5, state: 'decorative' },
        { id: 'a3-c3-chest', type: 'chest', col: 7, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    int energy = 9;\n    bool enoughEnergy = energy >= 8;\n\n    setSwitch(enoughEnergy);\n    cout << enoughEnergy << endl;\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();\n    moveUp();\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Kết quả của `9 >= 8` thuộc kiểu dữ liệu nào, và `cout` sẽ hiển thị nó ra sao?',
    whyThisMatters: 'So sánh chuyển dữ liệu số thành trạng thái bool; đây là nguyên liệu trực tiếp cho câu lệnh `if` ở khu vực kế tiếp.',
  },
  {
    id: 'a3-c4-debug-logic', lessonId: 'a3', kind: 'debug', title: 'Debug Lab: Tinh thể bị đảo dấu',
    story: 'Byte có tinh thể và đủ năng lượng nhưng công tắc vẫn tắt. Một lỗi logic đã đặt dấu `!` trước `hasCrystal`, làm chương trình hiểu ngược trạng thái thật.',
    instructions: ['Chạy Từng bước và theo dõi hai biến bool.', 'Tìm toán tử đang đảo `hasCrystal`.', 'Sửa một ký hiệu để cả hai điều kiện cùng đúng, rồi tới công tắc.'],
    starterCode: cpp('    bool hasCrystal = true;\n    bool enoughEnergy = true;\n    bool gateReady = !hasCrystal && enoughEnergy;\n\n    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    setSwitch(gateReady);\n    cout << gateReady << endl;'),
    requiredPatterns: ['op:&&', 'call:setSwitch', 'stmt:cout'],
    forbiddenPatterns: ['op:!'],
    testCases: [
      { id: 'a3-c4-switch', name: 'Công tắc bật khi cả hai điều kiện đúng', kind: 'world', expectedWorld: { col: 9, row: 5, activeSwitchIds: ['a3-switch-4'], collectedGems: 2 }, required: true, visible: true },
      { id: 'a3-c4-output', name: 'Trạng thái sẵn sàng là 1', kind: 'output', expectedOutput: '1', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'PATTERN_FORBIDDEN', message: 'Dấu `!` đảo `true` thành `false`. Dữ liệu cho biết Byte đang có tinh thể nên không được phủ định biến này.' }],
    hints: hints('Dấu nào đứng trước `hasCrystal` làm giá trị của biến bị đảo?', '`&&` đã đúng vì cần đủ cả hai; chỉ bỏ toán tử phủ định không phù hợp.', 'Đổi `!hasCrystal && enoughEnergy` thành `hasCrystal && enoughEnergy`.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 40,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F===^^..F','F^^=^^..F','F^^=^~..F','F^^====.F','F..~.^..F','F...^^..F','FFFFFFFFF'],
      start: [1,2], goal: [6,5], energy: 26,
      props: [
        { id: 'a3-c4-gem-1', type: 'trail-gem', col: 3, row: 3 },
        { id: 'a3-c4-gem-2', type: 'trail-gem', col: 4, row: 5 },
        { id: 'a3-switch-4', type: 'switch', col: 6, row: 5 },
        { id: 'a3-c4-lock', type: 'rock', col: 5, row: 3, state: 'blocking' },
        { id: 'a3-c4-potion', type: 'potion', col: 7, row: 1, state: 'decorative' },
        { id: 'a3-c4-chest', type: 'chest', col: 1, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    bool hasCrystal = true;\n    bool enoughEnergy = true;\n    bool gateReady = hasCrystal && enoughEnergy;\n\n    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    setSwitch(gateReady);\n    cout << gateReady << endl;'),
    thinkingPrompt: 'Trước khi sửa, hãy ghi lần lượt giá trị của `hasCrystal`, `!hasCrystal`, `enoughEnergy` và cả biểu thức.',
    whyThisMatters: 'Debug biểu thức logic hiệu quả nhất khi tách từng điều kiện, thay vì đoán cả dòng dài cùng lúc.',
  },
  {
    id: 'a3-c5-triple-core', lessonId: 'a3', kind: 'boss', title: 'BOSS: Ba lõi năng lượng',
    story: 'Lò trung tâm có ba máy cần lần lượt 6, 8 và 10 năng lượng. Chỉ khi tổng bằng đúng 24, công tắc đồng bộ mới mở cổng trước khi hệ thống quá tải.',
    instructions: ['Từ `base = 3`, tính ba mức 6, 8 và 10 bằng biểu thức.', 'Đi qua ba máy, cấp đúng mức tương ứng và thu đủ ba tinh thể.', 'So sánh tổng với 24, bật công tắc đồng bộ rồi bước vào cổng dịch chuyển.'],
    starterCode: cpp('    int base = 3;\n    int powerA = 0;\n    int powerB = 0;\n    int powerC = 0;\n\n    // Tính năng lượng, cấp cho 3 máy và đồng bộ lò'),
    requiredPatterns: ['op:*', 'op:+', 'op:==', 'call:chargeMachine:count=3', 'call:setSwitch'],
    testCases: [
      { id: 'a3-c5-machines', name: 'Ba máy nhận đúng 6, 8 và 10 năng lượng', kind: 'world', expectedWorld: { col: 10, row: 2, machineCharges: [6,8,10], totalCharge: 24, activeSwitchIds: ['a3-switch-core'], collectedGems: 3 }, required: true, visible: true },
      { id: 'a3-c5-output', name: 'Bảng điều khiển báo tổng 24 và sẵn sàng', kind: 'output', expectedOutput: '24 1', required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Em kiểm tra riêng từng lõi trước: A = 6, B = 8, C = 10; sau đó tổng mới bằng 24.' }],
    hints: hints('Mỗi máy cần biểu thức nào từ `base = 3` để tạo 6, 8 và 10?', 'Tính ba lõi trước; sau đó cộng `total`, tạo biến bool bằng `total == 24` và dùng biến đó cho công tắc.', '```cpp\npowerA = base * ___;\npowerB = base + ___;\npowerC = base + base + ___;\n// Đi qua ba máy và gọi chargeMachine(...) tại mỗi máy\n___\nint total = ___ + ___ + ___;\nbool ready = total == ___;\n// Tới công tắc, bật và vào cổng\n___\n```'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 60, parStatements: 23,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F===^^==F','F^^=^^=^F','F^^=^~=^F','F^^====^F','F..~.^..F','F...^^..F','FFFFFFFFF'],
      start: [1,2], goal: [7,2], energy: 32,
      props: [
        { id: 'a3-machine-a', type: 'machine', col: 3, row: 2 },
        { id: 'a3-machine-b', type: 'machine', col: 3, row: 5 },
        { id: 'a3-machine-c', type: 'machine', col: 6, row: 5 },
        { id: 'a3-switch-core', type: 'switch', col: 6, row: 2 },
        { id: 'a3-c5-gem-1', type: 'trail-gem', col: 2, row: 2 },
        { id: 'a3-c5-gem-2', type: 'trail-gem', col: 3, row: 4 },
        { id: 'a3-c5-gem-3', type: 'trail-gem', col: 5, row: 5 },
        { id: 'a3-c5-reactor', type: 'statue', col: 7, row: 4, state: 'decorative' },
        { id: 'a3-c5-sword', type: 'sword', col: 1, row: 6, state: 'decorative' },
        { id: 'a3-c5-chest', type: 'chest', col: 7, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    int base = 3;\n    int powerA = base * 2;\n    int powerB = base + 5;\n    int powerC = base + base + 4;\n\n    moveRight();\n    moveRight();\n    chargeMachine(powerA);\n    moveDown();\n    moveDown();\n    moveDown();\n    chargeMachine(powerB);\n    moveRight();\n    moveRight();\n    moveRight();\n    chargeMachine(powerC);\n    int total = powerA + powerB + powerC;\n    bool ready = total == 24;\n    moveUp();\n    moveUp();\n    moveUp();\n    setSwitch(ready);\n    cout << total << " " << ready << endl;\n    moveRight();'),
    thinkingPrompt: 'Hãy lập bảng ba hàng gồm tên máy, biểu thức, kết quả và tổng lũy kế trước khi gõ code.',
    whyThisMatters: 'Thử thách tổng hợp biến, số học, so sánh, trạng thái bool và thuật toán đường đi thành một chương trình có nhiều bằng chứng đúng độc lập.',
  },
];

const a4Challenges: Challenge[] = [
  {
    id: 'a4-c1-first-if', lessonId: 'a4', kind: 'story', title: 'Công tắc biết nghe điều kiện',
    story: 'Cổng Quyết Định chỉ nối đường sáng khi năng lượng đạt ngưỡng. Lần đầu tiên Byte không làm mọi lệnh: khối bên trong `if` chỉ được thực hiện khi câu hỏi đúng.',
    instructions: ['Dự đoán `energy >= 6` là true hay false.', 'Dùng `if` để chỉ bật công tắc khi đủ năng lượng.', 'Theo đường tinh thể tới cổng quan sát.'],
    starterCode: cpp('    int energy = 7;\n    bool enough = energy >= 6;\n\n    // Nếu enough đúng, hãy bật công tắc\n\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();'),
    requiredPatterns: ['stmt:if', 'call:setSwitch'],
    testCases: [
      { id: 'a4-c1-world', name: 'Điều kiện đúng bật đường sáng và Byte tới cổng', kind: 'world', expectedWorld: { col: 8, row: 2, activeSwitchIds: ['a4-switch-1'], collectedGems: 1 }, required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Đừng bật công tắc vô điều kiện. Hãy đặt `setSwitch(true);` bên trong thân `if`.' }],
    hints: hints('Với energy bằng 7, câu hỏi “có ít nhất 6 không?” cho kết quả gì?', 'Viết `if (enough) { ... }` rồi đặt hành động vào giữa hai ngoặc nhọn.', 'if (___) {\n    setSwitch(___);\n}'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 30,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F=====..F','F.^.^^..F','F...~...F','F.^^..^.F','F..~....F','F...^^..F','FFFFFFFFF'],
      start: [1,2], goal: [5,2], energy: 16,
      props: [
        { id: 'a4-switch-1', type: 'switch', col: 1, row: 2 },
        { id: 'a4-c1-gem', type: 'trail-gem', col: 3, row: 2 },
        { id: 'a4-c1-statue', type: 'statue', col: 6, row: 5, state: 'decorative' },
        { id: 'a4-c1-torch', type: 'torch', col: 5, row: 1, state: 'decorative' },
        { id: 'a4-c1-chest', type: 'chest', col: 2, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    int energy = 7;\n    bool enough = energy >= 6;\n\n    if (enough) {\n        setSwitch(true);\n    }\n\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Nếu `enough` là false, dòng nào sẽ bị bỏ qua và Byte vẫn tiếp tục từ dòng nào?',
    whyThisMatters: '`if` nối kết quả bool với hành động: chương trình bắt đầu phản ứng theo trạng thái thay vì luôn làm một kịch bản cố định.',
  },
  {
    id: 'a4-c2-two-branches', lessonId: 'a4', kind: 'concept', title: 'Hai nhánh năng lượng',
    story: 'Trạm quét nhận năng lượng từ bảng điều khiển. Nếu đủ 8, nó mở đường; nếu thiếu, nó phải báo CHARGE thay vì im lặng.',
    instructions: ['Đọc `energy` bằng `cin`.', 'Dùng `if ... else` để in đúng một thông báo.', 'Chỉ bật công tắc trong nhánh đủ năng lượng, rồi đưa Byte tới cổng.'],
    starterCode: cpp('    int energy;\n    cin >> energy;\n    bool ready = energy >= 8;\n\n    // Viết hai nhánh OPEN và CHARGE tại đây\n\n    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();\n    moveRight();'),
    requiredPatterns: ['stmt:cin', 'stmt:if-else', 'op:>=', 'call:setSwitch', 'stmt:cout'],
    testCases: [
      { id: 'a4-c2-high', name: 'Năng lượng 9 chọn nhánh OPEN', kind: 'output', input: '9', expectedOutput: 'OPEN', required: true, visible: true },
      { id: 'a4-c2-low', name: 'Năng lượng 4 chọn nhánh CHARGE', kind: 'output', input: '4', expectedOutput: 'CHARGE', required: true, visible: true },
      { id: 'a4-c2-world', name: 'Dữ liệu đủ năng lượng mở tuyến trên bản đồ', kind: 'world', input: '9', expectedWorld: { col: 7, row: 4, activeSwitchIds: ['a4-switch-2'], collectedGems: 2 }, required: true, visible: true },
      { id: 'a4-c2-low-world', name: 'Dữ liệu thiếu năng lượng không bật công tắc', kind: 'world', input: '4', expectedWorld: { activeSwitchIds: [] }, required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Mỗi lần chạy chỉ được in một thông báo. Kiểm tra phần thân của `if` và `else`.' }],
    hints: hints('Khi `ready` đúng thì nhánh nào chạy? Khi sai thì nhánh nào chạy?', 'Trong nhánh if: bật công tắc và in OPEN. Trong nhánh else: chỉ in CHARGE.', 'if (___) {\n    setSwitch(___);\n    cout << "___" << endl;\n} else {\n    cout << "___" << endl;\n}'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 35,
    world: map({
      terrain: ['FFFFFFFFF','F.^...^.F','F===.^..F','F.^=.^..F','F..==...F','F^^..~..F','F...^^..F','F.~....^F','FFFFFFFFF'],
      start: [1,2], goal: [4,4], energy: 18,
      props: [
        { id: 'a4-switch-2', type: 'switch', col: 1, row: 2 },
        { id: 'a4-c2-gem-1', type: 'trail-gem', col: 3, row: 2 },
        { id: 'a4-c2-gem-2', type: 'trail-gem', col: 3, row: 4 },
        { id: 'a4-c2-statue', type: 'statue', col: 6, row: 3, state: 'decorative' },
        { id: 'a4-c2-potion', type: 'potion', col: 6, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    int energy;\n    cin >> energy;\n    bool ready = energy >= 8;\n\n    if (ready) {\n        setSwitch(true);\n        cout << "OPEN" << endl;\n    } else {\n        cout << "CHARGE" << endl;\n    }\n\n    moveRight();\n    moveRight();\n    moveDown();\n    moveDown();\n    moveRight();'),
    thinkingPrompt: 'Với hai đầu vào 9 và 4, hãy lập bảng gồm giá trị `ready`, nhánh chạy và output trước khi bấm Chạy.',
    whyThisMatters: '`cin` cho phép cùng một chương trình phản ứng đúng với nhiều dữ liệu; `else` đảm bảo luôn có phản hồi rõ ràng.',
  },
  {
    id: 'a4-c3-key-sensor', lessonId: 'a4', kind: 'mission', title: 'Chìa khóa biết trả lời',
    story: 'Một cánh cửa sắt chặn lối. Byte phải thay đổi thế giới trước bằng cách nhặt chìa, sau đó hỏi cảm biến `hasKey()` rồi mới quyết định mở cửa.',
    instructions: ['Đi hai ô sang phải và nhặt chìa khóa.', 'Đi lên tới trước cửa, dùng `hasKey()` làm điều kiện.', 'Chỉ gọi `openDoor()` trong thân `if`, rồi đi qua cửa tới cổng dịch chuyển.'],
    starterCode: cpp('    moveRight();\n    moveRight();\n\n    // Nhặt chìa và ghi nhớ cảm biến trước khi tới cửa\n\n    moveUp();\n    moveUp();\n    moveRight();\n\n    // Chỉ mở cửa khi cảm biến trả về true\n\n    moveRight();\n    moveRight();'),
    requiredPatterns: ['call:collectKey', 'call:hasKey', 'stmt:if', 'call:openDoor'],
    testCases: [
      { id: 'a4-c3-world', name: 'Byte nhặt chìa, mở đúng cửa và tới cổng dịch chuyển', kind: 'world', expectedWorld: { col: 9, row: 2, hasKey: true, openedDoors: ['a4-door-3'], collectedGems: 2 }, required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'PATTERN_MISSING', message: 'Thứ tự trạng thái rất quan trọng: `collectKey()` trước, `hasKey()` sau, rồi mới `openDoor()`.' }],
    hints: hints('Cảm biến sẽ trả về gì nếu em hỏi trước khi nhặt chìa?', 'Tại ô chìa khóa gọi collectKey. Trước cửa viết if với điều kiện hasKey().', 'collectKey();\n...\nif (___) {\n    ___;\n}'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 40,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F..====.F','F.^=^^..F','F===^...F','F.^.~.^.F','F...^^..F','F.~....^F','FFFFFFFFF'],
      start: [1,4], goal: [6,2], energy: 22,
      props: [
        { id: 'a4-key-3', type: 'key', col: 3, row: 4 },
        { id: 'a4-door-3', type: 'door', col: 5, row: 2 },
        { id: 'a4-c3-gem-1', type: 'trail-gem', col: 2, row: 4 },
        { id: 'a4-c3-gem-2', type: 'trail-gem', col: 4, row: 2 },
        { id: 'a4-c3-ruin', type: 'rock', col: 6, row: 5, state: 'blocking' },
        { id: 'a4-c3-torch', type: 'torch', col: 6, row: 1, state: 'decorative' },
        { id: 'a4-c3-chest', type: 'chest', col: 1, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    moveRight();\n    moveRight();\n    collectKey();\n\n    moveUp();\n    moveUp();\n    moveRight();\n\n    if (hasKey()) {\n        openDoor();\n    }\n\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Hãy viết chuỗi ba trạng thái của `hasKey()`: lúc bắt đầu, sau `collectKey()`, và sau khi mở cửa.',
    whyThisMatters: 'Một chương trình tương tác thường theo vòng “hành động → đọc trạng thái → quyết định”, đúng như cảm biến trong robot và game.',
  },
  {
    id: 'a4-c4-debug-equality', lessonId: 'a4', kind: 'debug', title: 'Debug Lab: Một dấu hay hai dấu',
    story: 'Trạm kiểm soát luôn báo OPEN, kể cả khi mã truy cập là 0. Lỗi nằm ngay trong điều kiện: một dấu bằng đã thay đổi dữ liệu thay vì đặt câu hỏi.',
    instructions: ['Chạy với mã 1 và mã 0, quan sát nhánh được chọn.', 'Tìm phép gán nằm trong điều kiện.', 'Sửa đúng một ký hiệu để so sánh, rồi kiểm tra lại cả hai dữ liệu.'],
    starterCode: cpp('    int access;\n    cin >> access;\n    bool allowed = false;\n\n    if (access = 1) {\n        allowed = true;\n        cout << "OPEN" << endl;\n    } else {\n        cout << "LOCKED" << endl;\n    }\n\n    setSwitch(allowed);\n    moveDown();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();'),
    requiredPatterns: ['stmt:cin', 'stmt:if-else', 'op:==', 'call:setSwitch'],
    forbiddenPatterns: ['assign-in-condition'],
    testCases: [
      { id: 'a4-c4-valid', name: 'Mã 1 được mở', kind: 'output', input: '1', expectedOutput: 'OPEN', required: true, visible: true },
      { id: 'a4-c4-invalid', name: 'Mã 0 bị khóa', kind: 'output', input: '0', expectedOutput: 'LOCKED', required: true, visible: true },
      { id: 'a4-c4-world', name: 'Mã hợp lệ bật trạm và hoàn thành đường kiểm tra', kind: 'world', input: '1', expectedWorld: { col: 8, row: 3, activeSwitchIds: ['a4-switch-4'], collectedGems: 2 }, required: true, visible: true },
      { id: 'a4-c4-invalid-world', name: 'Mã 0 không bật trạm kiểm soát', kind: 'world', input: '0', expectedWorld: { activeSwitchIds: [] }, required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'ASSIGN_IN_CONDITION', message: 'Trong điều kiện, `=` đang gán 1 vào access. Dùng `==` để hỏi access có bằng 1 hay không.' }],
    hints: hints('Dòng điều kiện đang thay đổi `access` hay đang so sánh nó?', 'Phép gán dùng một dấu bằng; phép so sánh bằng dùng hai dấu bằng.', 'Đổi `if (access = 1)` thành `if (access == 1)`.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 45,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F=.^....F','F=.^.=..F','F=^^.=^.F','F=====..F','F.^.~...F','F...^^..F','FFFFFFFFF'],
      start: [1,2], goal: [5,3], energy: 24,
      props: [
        { id: 'a4-switch-4', type: 'switch', col: 1, row: 2 },
        { id: 'a4-c4-gem-1', type: 'trail-gem', col: 1, row: 4 },
        { id: 'a4-c4-gem-2', type: 'trail-gem', col: 4, row: 5 },
        { id: 'a4-c4-ruin', type: 'rock', col: 6, row: 4, state: 'blocking' },
        { id: 'a4-c4-sword', type: 'sword', col: 2, row: 6, state: 'decorative' },
        { id: 'a4-c4-potion', type: 'potion', col: 7, row: 1, state: 'decorative' },
      ],
    }),
    solution: cpp('    int access;\n    cin >> access;\n    bool allowed = false;\n\n    if (access == 1) {\n        allowed = true;\n        cout << "OPEN" << endl;\n    } else {\n        cout << "LOCKED" << endl;\n    }\n\n    setSwitch(allowed);\n    moveDown();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();'),
    thinkingPrompt: 'Với access = 0, hãy mô tả khác biệt giữa `access = 1` và `access == 1` về giá trị biến lẫn nhánh được chạy.',
    whyThisMatters: 'Phân biệt gán với so sánh là kỹ năng debug nền tảng; lỗi chỉ một ký tự nhưng có thể làm mọi dữ liệu đi sai nhánh.',
  },
  {
    id: 'a4-c5-decision-gate', lessonId: 'a4', kind: 'boss', title: 'BOSS: Cổng kiểm định kép',
    story: 'Giám Hộ Cổng buộc Byte chứng minh cả hai điều kiện: đã có chìa khóa và năng lượng đầu vào ít nhất 8. Một chương trình duy nhất phải phản ứng đúng với cả lượt đủ và thiếu năng lượng.',
    instructions: ['Đọc năng lượng bằng `cin`, đi lấy chìa khóa và hỏi cảm biến.', 'Trước cửa, quay sang phải rồi dùng `&&` trong một `if ... else`: đủ cả hai thì mở cửa và báo PORTAL OPEN, thiếu thì báo LOW ENERGY.', 'Vượt tuyến 13 bước và thu đủ ba tinh thể trong lượt năng lượng cao.'],
    starterCode: cpp('    int energy;\n    cin >> energy;\n\n    moveRight();\n    moveRight();\n    collectKey();\n    moveDown();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();\n    moveUp();\n    turnRight();\n\n    // Kiểm tra đồng thời chìa khóa và năng lượng trước cánh cửa\n\n    moveRight();\n    moveRight();'),
    requiredPatterns: ['stmt:cin', 'stmt:if-else', 'call:collectKey', 'call:hasKey', 'op:&&', 'op:>=', 'call:turnRight', 'call:openDoor'],
    testCases: [
      { id: 'a4-c5-high', name: 'Năng lượng 9 cùng chìa khóa mở cổng dịch chuyển', kind: 'output', input: '9', expectedOutput: 'PORTAL OPEN', required: true, visible: true },
      { id: 'a4-c5-low', name: 'Năng lượng 4 bị từ chối an toàn', kind: 'output', input: '4', expectedOutput: 'LOW ENERGY', required: true, visible: true },
      { id: 'a4-c5-world', name: 'Lượt đủ điều kiện vượt cổng và thu ba tinh thể', kind: 'world', input: '9', expectedWorld: { col: 11, row: 2, hasKey: true, openedDoors: ['a4-door-boss'], collectedGems: 3 }, required: true, visible: true },
      { id: 'a4-c5-low-world', name: 'Lượt thiếu năng lượng dừng an toàn trước cửa', kind: 'world', input: '4', expectedWorld: { col: 9, row: 2, hasKey: true, openedDoors: [], collectedGems: 3 }, required: true, visible: true },
    ],
    commonMistakes: [{ errorCode: 'OUTPUT_MISMATCH', message: 'Hệ thống kiểm thử nhiều dữ liệu. Không ghi cứng output; hãy để kết quả của `hasKey() && energy >= 8` chọn nhánh.' }],
    hints: hints('Cổng cần một trong hai điều kiện hay cần đồng thời cả hai?', 'Tạo điều kiện `hasKey() && energy >= 8`; chỉ mở cửa trong nhánh đúng.', 'if (___ && ___) {\n    openDoor();\n    cout << "___" << endl;\n} else {\n    cout << "___" << endl;\n}'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 65, parStatements: 21,
    world: map({
      terrain: ['FFFFFFFFF','F..^^...F','F===^^==.','F.^=.^=.F','F^^=.^=.F','F.^====.F','F.~.^^..F','F...^...F','FFFFFFFFF'],
      start: [1,2], goal: [8,2], energy: 32,
      props: [
        { id: 'a4-key-boss', type: 'key', col: 3, row: 2 },
        { id: 'a4-door-boss', type: 'door', col: 7, row: 2 },
        { id: 'a4-c5-gem-1', type: 'trail-gem', col: 2, row: 2 },
        { id: 'a4-c5-gem-2', type: 'trail-gem', col: 3, row: 4 },
        { id: 'a4-c5-gem-3', type: 'trail-gem', col: 5, row: 5 },
        { id: 'a4-c5-guardian', type: 'statue', col: 7, row: 5, state: 'decorative' },
        { id: 'a4-c5-torch', type: 'torch', col: 6, row: 1, state: 'decorative' },
        { id: 'a4-c5-chest', type: 'chest', col: 1, row: 6, state: 'decorative' },
        { id: 'a4-c5-sword', type: 'sword', col: 7, row: 6, state: 'decorative' },
      ],
    }),
    solution: cpp('    int energy;\n    cin >> energy;\n\n    moveRight();\n    moveRight();\n    collectKey();\n    moveDown();\n    moveDown();\n    moveDown();\n    moveRight();\n    moveRight();\n    moveRight();\n    moveUp();\n    moveUp();\n    moveUp();\n    turnRight();\n\n    if (hasKey() && energy >= 8) {\n        openDoor();\n        cout << "PORTAL OPEN" << endl;\n    } else {\n        cout << "LOW ENERGY" << endl;\n    }\n\n    moveRight();\n    moveRight();'),
    thinkingPrompt: 'Lập bảng chân trị cho hai câu hỏi “có chìa?” và “đủ năng lượng?”; tổ hợp duy nhất nào được mở cửa?',
    whyThisMatters: 'Boss kiểm tra khả năng viết chương trình tổng quát: cùng một thuật toán phải đúng với nhiều đầu vào và nhiều trạng thái thế giới.',
  },
];

const a5Challenges: Challenge[] = [
  {
    id: 'a5-c1-first-loop', lessonId: 'a5', kind: 'story', title: 'Sáu nhịp trên đường vọng âm',
    story: 'Con đường đầu thung lũng có sáu ô giống hệt nhau. Viết sáu lời gọi riêng vẫn đúng, nhưng vòng lặp giúp Byte nói rõ “lặp hành động này sáu lần” bằng một cấu trúc duy nhất.',
    instructions: ['Dự đoán các giá trị của `i` từ 0 cho tới khi điều kiện sai.', 'Đặt `moveRight()` bên trong vòng `for` chạy đúng sáu lượt.', 'Quan sát Byte thu hai tinh thể và dừng đúng tại cổng dịch chuyển.'],
    starterCode: cpp('    int steps = 6;\n\n    for (int i = 0; i < steps; i++) {\n        // Mỗi lượt, gọi lệnh đưa Byte sang phải một ô\n    }'),
    requiredPatterns: ['stmt:for', 'stmt:for>call:moveRight'],
    testCases: [
      { id:'a5-c1-world', name:'Vòng lặp đưa Byte đi đúng sáu ô', kind:'world', expectedWorld:{ col:10, row:2, collectedGems:2 }, required:true, visible:true },
    ],
    commonMistakes: [{ errorCode:'FOR_WRONG_COUNT', message:'Hãy liệt kê i = 0, 1, 2, 3, 4, 5. Có đúng sáu giá trị trước khi i bằng 6.' }],
    hints: hints('Nếu `i` bắt đầu từ 0 và cần sáu lượt, giá trị cuối cùng của `i` trong thân là mấy?', 'Dùng ba phần: `int i = 0`, `i < steps`, `i++`.', 'for (int i = ___; i < ___; i++) {\n    ___;\n}'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 35, parStatements: 3,
    world: map({
      terrain:['FFFFFFFFF','F..^^...F','F=======F','F.^...^.F','F..~....F','F.^^..^.F','F....~..F','F..^....F','FFFFFFFFF'],
      start:[1,2], goal:[7,2], energy:18,
      props:[
        { id:'a5-c1-gem-1', type:'trail-gem', col:3, row:2 },
        { id:'a5-c1-gem-2', type:'trail-gem', col:6, row:2 },
        { id:'a5-c1-log', type:'log', col:2, row:4, state:'decorative' },
        { id:'a5-c1-mushroom', type:'mushroom', col:6, row:5, state:'decorative' },
        { id:'a5-c1-statue', type:'statue', col:7, row:6, state:'decorative' },
      ],
    }),
    solution: cpp('    int steps = 6;\n\n    for (int i = 0; i < steps; i++) {\n        moveRight();\n    }'),
    thinkingPrompt: 'Hãy viết toàn bộ giá trị của i xuất hiện trong thân vòng lặp và đếm xem `moveRight()` chạy bao nhiêu lần.',
    whyThisMatters: 'Vòng lặp mô tả quy luật lặp lại trực tiếp, giúp thuật toán ngắn hơn mà vẫn kiểm soát chính xác số hành động.',
  },
  {
    id: 'a5-c2-lantern-line', lessonId: 'a5', kind: 'concept', title: 'Dãy đèn theo từng lượt',
    story: 'Sáu đèn dọc vách đá cần được thắp lần lượt. Mỗi lượt lặp phải tạo hai bằng chứng nhìn thấy được: Byte tiến một ô và ngọn đèn tại ô đó sáng lên.',
    instructions: ['Đi lên một ô để vào đầu dãy đèn.', 'Trong mỗi lượt: đi sang phải rồi gọi `turnOnLight()`.', 'Lặp đúng sáu lần để thắp toàn bộ dãy và tới cổng dịch chuyển.'],
    starterCode: cpp('    moveUp();\n    int lights = 6;\n\n    // Mỗi lượt: tiến một ô rồi thắp đèn'),
    requiredPatterns: ['stmt:for', 'stmt:for>call:moveRight', 'stmt:for>call:turnOnLight'],
    testCases: [
      { id:'a5-c2-world', name:'Sáu lượt thắp đủ sáu đèn', kind:'world', expectedWorld:{ col:10, row:2, litLights:['a5-light-1','a5-light-2','a5-light-3','a5-light-4','a5-light-5','a5-light-6'], collectedGems:2 }, required:true, visible:true },
    ],
    commonMistakes: [{ errorCode:'PATTERN_MISSING', message:'Cả `moveRight()` và `turnOnLight()` phải nằm trong thân for để mỗi lượt tạo đúng một cặp hành động.' }],
    hints: hints('Một lượt lặp cần làm hai việc theo thứ tự nào để Byte đứng đúng ô đèn?', 'Đặt hai lời gọi trong cùng cặp ngoặc nhọn: di chuyển trước, thắp đèn sau.', 'for (int i = ___; i < ___; i++) {\n    ___;\n    ___;\n}'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 40, parStatements: 5,
    world: map({
      terrain:['FFFFFFFFF','F..^....F','F=======F','F=^^.^..F','F=...~..F','F.^^...^F','F..~....F','F....^..F','FFFFFFFFF'],
      start:[1,3], goal:[7,2], energy:20,
      props:[
        { id:'a5-light-1', type:'light', col:2, row:2 },
        { id:'a5-light-2', type:'light', col:3, row:2 },
        { id:'a5-light-3', type:'light', col:4, row:2 },
        { id:'a5-light-4', type:'light', col:5, row:2 },
        { id:'a5-light-5', type:'light', col:6, row:2 },
        { id:'a5-light-6', type:'light', col:7, row:2 },
        { id:'a5-c2-gem-1', type:'trail-gem', col:3, row:2 },
        { id:'a5-c2-gem-2', type:'trail-gem', col:6, row:2 },
        { id:'a5-c2-tree', type:'tree', col:2, row:6, state:'decorative' },
        { id:'a5-c2-target', type:'target', col:6, row:5, state:'decorative' },
      ],
    }),
    solution: cpp('    moveUp();\n    int lights = 6;\n\n    for (int i = 0; i < lights; i++) {\n        moveRight();\n        turnOnLight();\n    }'),
    thinkingPrompt: 'Sau lượt có i = 2, Byte đã đi thêm mấy ô và có tổng cộng bao nhiêu đèn sáng?',
    whyThisMatters: 'Thân vòng lặp có thể chứa nhiều statement; toàn bộ khối được xem là một hành động lặp có cấu trúc.',
  },
  {
    id: 'a5-c3-counter-trail', lessonId: 'a5', kind: 'mission', title: 'Biến đếm để lại dấu vết',
    story: 'Máy ghi hành trình yêu cầu báo số thứ tự từ 1 tới 6 trong khi Byte vượt đoạn đường dài. Biến đếm không chỉ giúp vòng lặp dừng; nó còn là dữ liệu của chính lượt đang chạy.',
    instructions: ['Đi lên ba ô để tới đầu đường tinh thể.', 'Cho `i` chạy từ 1 tới 6, mỗi lượt đi phải và in i.', 'Đối chiếu Output `1 2 3 4 5 6` với sáu bước trên map.'],
    starterCode: cpp('    moveUp();\n    moveUp();\n    moveUp();\n\n    // Lặp với i từ 1 tới 6; vừa đi vừa in i'),
    requiredPatterns: ['stmt:for', 'stmt:for>call:moveRight', 'stmt:for>stmt:cout'],
    testCases: [
      { id:'a5-c3-output', name:'Biến đếm báo đúng sáu lượt', kind:'output', expectedOutput:'1 2 3 4 5 6', required:true, visible:true },
      { id:'a5-c3-world', name:'Byte vượt chín bước và thu ba tinh thể', kind:'world', expectedWorld:{ col:10, row:2, collectedGems:3 }, required:true, visible:true },
    ],
    commonMistakes: [{ errorCode:'OUTPUT_MISMATCH', message:'Nếu bắt đầu i = 1 và dùng i <= 6, các giá trị trong thân phải là 1, 2, 3, 4, 5, 6.' }],
    hints: hints('Muốn in số 1 trước tiên, `i` nên khởi tạo bằng 0 hay 1?', 'Dùng điều kiện `i <= 6`; trong thân gọi `moveRight()` rồi in `i` và một dấu cách.', 'for (int i = ___; i <= ___; i++) {\n    ___;\n    cout << ___ << " ";\n}'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 45, parStatements: 6,
    world: map({
      terrain:['FFFFFFFFF','F..^^...F','F=======F','F=.^..^.F','F=^^....F','F=...~..F','F.^...^.F','F..~....F','FFFFFFFFF'],
      start:[1,5], goal:[7,2], energy:24,
      props:[
        { id:'a5-c3-gem-1', type:'trail-gem', col:1, row:3 },
        { id:'a5-c3-gem-2', type:'trail-gem', col:4, row:2 },
        { id:'a5-c3-gem-3', type:'trail-gem', col:7, row:2 },
        { id:'a5-c3-well', type:'well', col:3, row:6, state:'decorative' },
        { id:'a5-c3-mushroom', type:'mushroom', col:6, row:4, state:'decorative' },
        { id:'a5-c3-statue', type:'statue', col:7, row:6, state:'decorative' },
      ],
    }),
    solution: cpp('    moveUp();\n    moveUp();\n    moveUp();\n\n    for (int i = 1; i <= 6; i++) {\n        moveRight();\n        cout << i << " ";\n    }'),
    thinkingPrompt: 'Hai vòng `i = 0; i < 6` và `i = 1; i <= 6` đều chạy sáu lượt. Điểm khác nhau quan sát được là gì?',
    whyThisMatters: 'Biến đếm có thể trở thành dữ liệu hữu ích như số thứ tự, điểm, vị trí hoặc chỉ số phần tử.',
  },
  {
    id: 'a5-c4-debug-off-by-one', lessonId: 'a5', kind: 'debug', title: 'Debug Lab: Bước thứ bảy vô hình',
    story: 'Byte cần đi ngang đúng sáu ô nhưng bộ đếm báo bảy lượt. Lượt cuối đâm vào vách nên vị trí trông gần đúng; chỉ Output và nhật ký mới phơi bày lỗi off-by-one.',
    instructions: ['Theo dõi steps sau mỗi lượt và tìm giá trị thừa.', 'So sánh `i <= 6` với danh sách i bắt đầu từ 0.', 'Sửa một ký hiệu để vòng lặp chạy đúng sáu lượt và Output bằng 6.'],
    starterCode: cpp('    moveUp();\n    moveUp();\n    int steps = 0;\n\n    for (int i = 0; i <= 6; i++) {\n        moveRight();\n        steps = steps + 1;\n    }\n\n    moveDown();\n    moveDown();\n    moveDown();\n    cout << steps << endl;'),
    requiredPatterns: ['stmt:for', 'stmt:for>call:moveRight', 'op:<'],
    forbiddenPatterns: ['op:<='],
    testCases: [
      { id:'a5-c4-output', name:'Bộ đếm xác nhận đúng sáu lượt', kind:'output', expectedOutput:'6', required:true, visible:true },
      { id:'a5-c4-world', name:'Byte vượt tuyến mười một bước và thu ba tinh thể', kind:'world', expectedWorld:{ col:10, row:6, collectedGems:3 }, required:true, visible:true },
    ],
    commonMistakes: [{ errorCode:'FOR_WRONG_COUNT', message:'Bắt đầu từ 0 mà dùng `i <= 6` sẽ có bảy giá trị: 0 tới 6. Hãy loại bỏ giá trị cuối.' }],
    hints: hints('Hãy viết dãy i khi điều kiện là `i <= 6`. Có bao nhiêu số?', 'Giữ mốc 6 nhưng đổi điều kiện để i dừng trước 6.', 'Đổi `i <= 6` thành `i < 6`.'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 50,
    world: map({
      terrain:['FFFFFFFFF','F..^^...F','F=......F','F=======F','F=^^.^.=F','F=...~.=F','F.^...^=F','F..~....F','FFFFFFFFF'],
      start:[1,5], goal:[7,6], energy:26,
      props:[
        { id:'a5-c4-gem-1', type:'trail-gem', col:1, row:4 },
        { id:'a5-c4-gem-2', type:'trail-gem', col:4, row:3 },
        { id:'a5-c4-gem-3', type:'trail-gem', col:7, row:5 },
        { id:'a5-c4-rock', type:'rock', col:8, row:3, state:'blocking' },
        { id:'a5-c4-log', type:'log', col:3, row:6, state:'decorative' },
        { id:'a5-c4-ruin', type:'rock', col:5, row:5, state:'decorative' },
      ],
    }),
    solution: cpp('    moveUp();\n    moveUp();\n    int steps = 0;\n\n    for (int i = 0; i < 6; i++) {\n        moveRight();\n        steps = steps + 1;\n    }\n\n    moveDown();\n    moveDown();\n    moveDown();\n    cout << steps << endl;'),
    thinkingPrompt: 'Vì sao map gần như đúng dù vòng lặp thừa một lượt? Bằng chứng nào đáng tin hơn để phát hiện lượt bị chặn?',
    whyThisMatters: 'Off-by-one rất phổ biến vì kết quả có thể trông gần đúng. Biến đếm và test cụ thể giúp debug dựa trên bằng chứng.',
  },
  {
    id: 'a5-c5-armor-loop', lessonId: 'a5', kind: 'boss', title: 'BOSS: Năm lớp giáp vọng âm',
    story: 'Bug Gác Thung Lũng có đúng năm lớp giáp và chặn cổng cuối. Byte phải dùng các vòng lặp để vượt ba đoạn đường, phá chính xác năm lớp giáp, kiểm tra HP rồi mới mở cửa.',
    instructions: ['Dùng vòng lặp ba lượt cho từng đoạn xuống, phải và lên.', 'Khi Byte đã đứng cạnh Boss, lặp `attackBug()` đúng năm lần rồi quay sang phải.', 'Nếu `getBugHp() == 0`, mở cửa; sau đó lặp ba bước phải để tới cổng dịch chuyển.'],
    starterCode: cpp('    // Đi xuống 3, sang phải 3, rồi đi lên 3 bằng các vòng lặp\n\n    // Phá đúng 5 lớp giáp rồi turnRight() để nhìn về phía cửa\n\n    // Chỉ mở cửa khi HP của Bug bằng 0\n\n    // Đi sang phải 3 ô tới cổng dịch chuyển bằng vòng lặp'),
    requiredPatterns: ['stmt:for:count>=5', 'stmt:for>call:moveDown', 'stmt:for>call:moveRight', 'stmt:for>call:moveUp', 'stmt:for>call:attackBug', 'call:getBugHp', 'stmt:if', 'call:openDoor'],
    testCases: [
      { id:'a5-c5-output', name:'Bảng trạng thái báo Bug còn 0 giáp', kind:'output', expectedOutput:'0', required:true, visible:true },
      { id:'a5-c5-world', name:'Đúng năm đòn phá hết giáp, cửa mở và Byte tới cổng dịch chuyển', kind:'world', expectedWorld:{ col:10, row:2, bugHp:0, bugHits:5, openedDoors:['a5-door-boss'], collectedGems:3 }, required:true, visible:true },
    ],
    commonMistakes: [{ errorCode:'FOR_WRONG_COUNT', message:'Boss có năm lớp giáp: các giá trị `hit = 0, 1, 2, 3, 4` tạo đúng năm đòn. Byte cũng phải đứng cạnh Boss để `attackBug()` có hiệu lực.' }],
    hints: hints('Mỗi đoạn đường dài ba ô và Boss có năm lớp giáp; em cần những giới hạn lặp nào?', 'Dùng năm vòng lặp: bốn đoạn di chuyển giới hạn 3 và một vòng đánh giới hạn 5; đặt `openDoor()` trong `if`.', 'for (int hit = 0; hit < ___; hit++) {\n    ___;\n}\nif (___ == 0) {\n    ___;\n}'),
    cleanCodeRules: STANDARD_CLEAN_CODE, xpReward: 70, parStatements: 14,
    world: map({
      terrain:['FFFFFFFFF','F..^^...F','F=..====F','F=.^=^..F','F=^^=...F','F====...F','F.~.^^..F','F...^...F','FFFFFFFFF'],
      start:[1,2], goal:[7,2], energy:32, initialState:{ bugHp:5 },
      props:[
        { id:'a5-door-boss', type:'door', col:5, row:2 },
        { id:'a5-c5-boss', type:'boss', col:4, row:1, state:'decorative' },
        { id:'a5-c5-gem-1', type:'trail-gem', col:1, row:4 },
        { id:'a5-c5-gem-2', type:'trail-gem', col:3, row:5 },
        { id:'a5-c5-gem-3', type:'trail-gem', col:4, row:3 },
        { id:'a5-c5-shield', type:'shield', col:6, row:5, state:'decorative' },
        { id:'a5-c5-chest', type:'chest', col:1, row:6, state:'decorative' },
        { id:'a5-c5-target', type:'target', col:7, row:6, state:'decorative' },
      ],
    }),
    solution: cpp('    for (int i = 0; i < 3; i++) {\n        moveDown();\n    }\n    for (int i = 0; i < 3; i++) {\n        moveRight();\n    }\n    for (int i = 0; i < 3; i++) {\n        moveUp();\n    }\n\n    for (int hit = 0; hit < 5; hit++) {\n        attackBug();\n    }\n    turnRight();\n\n    if (getBugHp() == 0) {\n        openDoor();\n    }\n    cout << getBugHp() << endl;\n\n    for (int i = 0; i < 3; i++) {\n        moveRight();\n    }'),
    thinkingPrompt: 'Không chạy code, hãy tính tổng số lượt của năm vòng lặp và số lần mỗi Game API được gọi.',
    whyThisMatters: 'Boss kết hợp vòng lặp, cảm biến và điều kiện thành thuật toán nhiều giai đoạn nhưng vẫn dự đoán được từ từng khối nhỏ.',
  },
];

const a6Challenges: Challenge[] = [
  {
    id:'a6-c1-first-function', lessonId:'a6', kind:'story', title:'Mô-đun ánh sáng đầu tiên',
    story:'Trong Xưởng Hàm, một mô-đun là một nhóm lệnh được đặt tên. Byte cần tự chế tạo `activateLine()` rồi gọi mô-đun đó từ `main` để cả dãy đèn cùng vận hành.',
    instructions:['Khung vòng lặp sáu lượt đã có sẵn; hoàn thiện hai hành động trong thân `activateLine()`.', 'Mỗi lượt đi sang phải rồi thắp đèn tại ô mới.', 'Gọi `activateLine()` đúng một lần trong `main` và quan sát nhãn mô-đun lúc đi vào rồi trở về từ hàm.'],
    starterCode:cppWithFunctions('void activateLine() {\n    for (int i = 0; i < 6; i++) {\n        // Đi sang phải rồi thắp đèn tại ô mới\n    }\n}', '    // Gọi mô-đun activateLine tại đây'),
    requiredPatterns:['decl:func:activateLine', 'decl:func:activateLine>stmt:for', 'decl:func:activateLine>call:moveRight', 'decl:func:activateLine>call:turnOnLight', 'call:activateLine'],
    testCases:[
      { id:'a6-c1-structure', name:'Mô-đun được định nghĩa và gọi từ chương trình', kind:'structure', patterns:['decl:func:activateLine','decl:func:activateLine>stmt:for','call:activateLine'], required:true, visible:true },
      { id:'a6-c1-world', name:'Sáu đèn sáng, hai tinh thể được thu và Byte tới cổng dịch chuyển', kind:'world', expectedWorld:{ col:10, row:2, litLights:['a6-c1-light-1','a6-c1-light-2','a6-c1-light-3','a6-c1-light-4','a6-c1-light-5','a6-c1-light-6'], collectedGems:2 }, required:true, visible:true },
    ],
    commonMistakes:[{ errorCode:'FUNC_NOT_CALLED', message:'Định nghĩa hàm mới chỉ lắp mô-đun. Em còn phải gọi `activateLine();` trong `main` để máy chạy.' }],
    hints:hints('Phần nào mô tả mô-đun, phần nào thực sự ra lệnh cho mô-đun chạy?', 'Đặt vòng `for` trong thân `activateLine`, rồi gọi tên hàm kèm `();` trong `main`.', 'void activateLine() {\n    for (int i = ___; i < ___; i++) {\n        ___;\n        ___;\n    }\n}\n// Trong main: ___;'),
    cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:45, parStatements:6, handbookCards:['function-declare','function-call','for-loop'],
    world:map({
      terrain:['FFFFFFFFF','F..^^...F','F=======F','F.^...^.F','F..~....F','F.^^..^.F','F....~..F','F..^....F','FFFFFFFFF'],
      start:[1,2], goal:[7,2], energy:22,
      props:[
        ...Array.from({length:6},(_,i)=>({ id:`a6-c1-light-${i+1}`, type:'light', col:i+2, row:2 })),
        { id:'a6-c1-gem-1', type:'trail-gem', col:3, row:2 }, { id:'a6-c1-gem-2', type:'trail-gem', col:6, row:2 },
        { id:'a6-c1-machine', type:'machine', col:3, row:5, state:'decorative' }, { id:'a6-c1-switch', type:'switch', col:6, row:6, state:'decorative' },
      ],
    }),
    solution:cppWithFunctions('void activateLine() {\n    for (int i = 0; i < 6; i++) {\n        moveRight();\n        turnOnLight();\n    }\n}', '    activateLine();'),
    thinkingPrompt:'Nếu chỉ định nghĩa `activateLine` mà không gọi hàm, map sẽ có thay đổi nào? Em dự đoán thứ tự sự kiện khi lời gọi bắt đầu và kết thúc.',
    whyThisMatters:'Hàm đóng gói một thuật toán thành mô-đun có tên. Tên tốt giúp người đọc hiểu mục đích mà không phải đọc lại từng lệnh bên trong.',
  },
  {
    id:'a6-c2-parameters', lessonId:'a6', kind:'concept', title:'Một mô-đun, hai độ dài',
    story:'Hai băng chuyền dài khác nhau cần cùng một cơ chế di chuyển. Thay vì tạo hai hàm gần giống nhau, Byte truyền số bước vào tham số `steps` của một hàm duy nhất.',
    instructions:['Định nghĩa `moveRightMany(int steps)` và dùng `steps` làm giới hạn vòng lặp.', 'Gọi hàm với đối số 2 ở băng chuyền đầu.', 'Sau ba bước xuống, gọi lại cùng hàm với đối số 4 để tới cổng dịch chuyển.'],
    starterCode:cppWithFunctions('void moveRightMany(int steps) {\n    // Lặp theo giá trị của steps, không viết cứng số lượt\n}', '    moveRightMany(2);\n\n    for (int i = 0; i < 3; i++) {\n        moveDown();\n    }\n\n    moveRightMany(4);'),
    requiredPatterns:['decl:func:moveRightMany:params=1','decl:func:moveRightMany>stmt:for','decl:func:moveRightMany>call:moveRight','call:moveRightMany:count=2'],
    testCases:[
      { id:'a6-c2-structure', name:'Một hàm có tham số được tái sử dụng hai lần', kind:'structure', patterns:['decl:func:moveRightMany:params=1','call:moveRightMany:count=2'], required:true, visible:true },
      { id:'a6-c2-world', name:'Hai đối số tạo đúng hai đoạn ray và thu ba tinh thể', kind:'world', expectedWorld:{ col:10, row:5, collectedGems:3 }, required:true, visible:true },
    ],
    commonMistakes:[{ errorCode:'FOR_WRONG_COUNT', message:'Giới hạn vòng lặp phải là biến `steps`. Nếu viết cứng 2 hoặc 4, một trong hai lời gọi sẽ đi sai.' }],
    hints:hints('Điều gì thay đổi giữa hai lần dùng mô-đun: thuật toán hay chỉ số bước?', 'Tham số `steps` là tên dùng bên trong hàm; các số 2 và 4 là đối số ở nơi gọi.', 'void moveRightMany(int ___) {\n    for (int i = 0; i < ___; i++) {\n        ___;\n    }\n}'),
    cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:50, parStatements:8, handbookCards:['function-params','function-call','for-loop'],
    world:map({
      terrain:['FFFFFFFFF','F..^^...F','F===^...F','F.^=^...F','F..=^^..F','F..=====F','F.^...^.F','F..~....F','FFFFFFFFF'],
      start:[1,2], goal:[7,5], energy:24,
      props:[
        { id:'a6-c2-gem-1', type:'trail-gem', col:2,row:2 }, { id:'a6-c2-gem-2', type:'trail-gem', col:3,row:4 }, { id:'a6-c2-gem-3', type:'trail-gem', col:6,row:5 },
        { id:'a6-c2-machine-1', type:'machine', col:5,row:2,state:'decorative' }, { id:'a6-c2-machine-2', type:'machine', col:1,row:6,state:'decorative' },
        { id:'a6-c2-statue', type:'statue', col:6,row:3,state:'decorative' },
      ],
    }),
    solution:cppWithFunctions('void moveRightMany(int steps) {\n    for (int i = 0; i < steps; i++) {\n        moveRight();\n    }\n}', '    moveRightMany(2);\n\n    for (int i = 0; i < 3; i++) {\n        moveDown();\n    }\n\n    moveRightMany(4);'),
    thinkingPrompt:'Với hai lời gọi có đối số 2 và 4, hãy ghi giá trị của tham số `steps` ở từng lần và tổng số lần `moveRight()` chạy.',
    whyThisMatters:'Tham số làm một thuật toán thích nghi với nhiều dữ liệu, tránh tạo nhiều bản sao chỉ khác một con số.',
  },
  {
    id:'a6-c3-return-energy', lessonId:'a6', kind:'mission', title:'Giá trị trở về từ lõi tính toán',
    story:'Lõi cuối đường cần đúng 12 đơn vị năng lượng. Hàm `calculatePower` không điều khiển map; nó nhận dữ liệu, tính kết quả rồi gửi giá trị trở về nơi gọi bằng `return`.',
    instructions:['Hoàn thiện `calculatePower(int crystals, int powerEach)` để trả về tích của hai tham số.', 'Đi theo tuyến xuống 2, phải 4, lên 2 bằng các vòng lặp.', 'Lưu kết quả lời gọi vào `power`, in 12 và cấp đúng 12 cho máy tại cổng dịch chuyển.'],
    starterCode:cppWithFunctions('int calculatePower(int crystals, int powerEach) {\n    // Trả về tích số tinh thể và năng lượng mỗi tinh thể\n}', '    for (int i = 0; i < 2; i++) { moveDown(); }\n    for (int i = 0; i < 4; i++) { moveRight(); }\n    for (int i = 0; i < 2; i++) { moveUp(); }\n\n    int power = calculatePower(3, 4);\n    cout << power << endl;\n    chargeMachine(power);'),
    requiredPatterns:['decl:func:calculatePower:params=2','decl:func:calculatePower>stmt:return','decl:func:calculatePower>op:*','call:calculatePower','call:chargeMachine'],
    testCases:[
      { id:'a6-c3-output', name:'Hàm trả về đúng 12 đơn vị năng lượng', kind:'output', expectedOutput:'12', required:true, visible:true },
      { id:'a6-c3-world', name:'Byte thu ba tinh thể và cấp đúng năng lượng cho lõi', kind:'world', expectedWorld:{ col:8,row:2,collectedGems:3,totalCharge:12,chargedMachineIds:['a6-c3-core'] }, required:true, visible:true },
    ],
    commonMistakes:[{ errorCode:'OUTPUT_MISMATCH', message:'`cout` và `chargeMachine` đều cần nhận giá trị hàm trả về. Kiểm tra biểu thức sau `return` và biến `power`.' }],
    hints:hints('Hàm cần gửi dữ liệu nào trở lại nơi gọi?', 'Kiểu trả về là `int`; câu lệnh `return` phải tạo tích `crystals * powerEach`.', 'return ___ * ___;'),
    cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:55, parStatements:10, handbookCards:['function-return','function-params','energy-machines'],
    world:map({
      terrain:['FFFFFFFFF','F.^^....F','F=...=..F','F=.^.=..F','F=====^.F','F..^....F','F.~..^^.F','F...^...F','FFFFFFFFF'],
      start:[1,2], goal:[5,2], energy:26,
      props:[
        { id:'a6-c3-gem-1',type:'trail-gem',col:1,row:3 }, { id:'a6-c3-gem-2',type:'trail-gem',col:3,row:4 }, { id:'a6-c3-gem-3',type:'trail-gem',col:5,row:3 },
        { id:'a6-c3-core',type:'machine',col:5,row:2 }, { id:'a6-c3-switch',type:'switch',col:7,row:5,state:'decorative' }, { id:'a6-c3-chest',type:'chest',col:1,row:6,state:'decorative' },
      ],
    }),
    solution:cppWithFunctions('int calculatePower(int crystals, int powerEach) {\n    return crystals * powerEach;\n}', '    for (int i = 0; i < 2; i++) { moveDown(); }\n    for (int i = 0; i < 4; i++) { moveRight(); }\n    for (int i = 0; i < 2; i++) { moveUp(); }\n\n    int power = calculatePower(3, 4);\n    cout << power << endl;\n    chargeMachine(power);'),
    thinkingPrompt:'Phân biệt hai thời điểm: tham số nhận giá trị nào khi gọi hàm, và biểu thức `return` gửi giá trị nào trở về biến `power`?',
    whyThisMatters:'Hàm trả về giúp tách phần tính toán khỏi phần sử dụng kết quả; từng phần có thể được đọc và kiểm thử độc lập.',
  },
  {
    id:'a6-c4-debug-parameter', lessonId:'a6', kind:'debug', title:'Debug Lab: Tham số bị phớt lờ',
    story:'Mô-đun nhận `steps` nhưng thợ máy cũ lại viết cứng ba lượt trong thân hàm. Lần gọi đầu cần 2, lần sau cần 4 nên Byte trượt khỏi hai băng chuyền.',
    instructions:['Theo dõi lần gọi `moveRightMany(2)` và xác định vì sao Byte đi ba ô.', 'Sửa duy nhất giới hạn vòng lặp để dùng tham số `steps`.', 'Chạy từng bước và kiểm tra cùng một hàm đúng với cả đối số 2 lẫn 4.'],
    starterCode:cppWithFunctions('void moveRightMany(int steps) {\n    for (int i = 0; i < 3; i++) {\n        moveRight();\n    }\n}', '    moveRightMany(2);\n    for (int i = 0; i < 3; i++) { moveDown(); }\n    moveRightMany(4);'),
    requiredPatterns:['decl:func:moveRightMany:params=1','decl:func:moveRightMany>stmt:for','call:moveRightMany:count=2'],
    testCases:[{ id:'a6-c4-world', name:'Tham số điều khiển chính xác cả hai đoạn ray', kind:'world', expectedWorld:{ col:10,row:5,collectedGems:3 }, required:true, visible:true }],
    commonMistakes:[{ errorCode:'FOR_WRONG_COUNT', message:'Tên tham số đã có trong đầu hàm nhưng chưa được dùng. Hãy thay số viết cứng trong điều kiện bằng `steps`.' }],
    hints:hints('Trong thân hàm, phần nào vẫn luôn là 3 dù đối số thay đổi?', 'Giữ `i = 0` và `i++`; thay mốc dừng bằng tên tham số.', 'for (int i = 0; i < steps; i++) {\n    moveRight();\n}'),
    cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:60, handbookCards:['function-params','common-errors'],
    world:map({
      terrain:['FFFFFFFFF','F..^....F','F===^^..F','F.^=.^..F','F..=^^..F','F..=====F','F.^...^.F','F..~....F','FFFFFFFFF'],
      start:[1,2],goal:[7,5],energy:24,
      props:[
        { id:'a6-c4-gem-1',type:'trail-gem',col:2,row:2 }, { id:'a6-c4-gem-2',type:'trail-gem',col:3,row:4 }, { id:'a6-c4-gem-3',type:'trail-gem',col:6,row:5 },
        { id:'a6-c4-ruin',type:'rock',col:4,row:2,state:'decorative' }, { id:'a6-c4-machine',type:'machine',col:6,row:2,state:'decorative' }, { id:'a6-c4-target',type:'target',col:1,row:6,state:'decorative' },
      ],
    }),
    solution:cppWithFunctions('void moveRightMany(int steps) {\n    for (int i = 0; i < steps; i++) {\n        moveRight();\n    }\n}', '    moveRightMany(2);\n    for (int i = 0; i < 3; i++) { moveDown(); }\n    moveRightMany(4);'),
    thinkingPrompt:'Vì sao compiler không báo lỗi dù tham số `steps` bị bỏ quên? Test với hai đối số khác nhau đã cung cấp bằng chứng gì?',
    whyThisMatters:'Một hàm có thể đúng cú pháp nhưng sai ý nghĩa. Kiểm thử nhiều đối số giúp phát hiện giá trị bị viết cứng và tham số không thực sự được dùng.',
  },
  {
    id:'a6-c5-factory-core', lessonId:'a6', kind:'boss', title:'BOSS: Lõi Xưởng sáu lớp',
    story:'Bug Quản Đốc khóa lõi xưởng sau sáu lớp giáp. Byte phải điều phối hai mô-đun riêng: một mô-đun di chuyển theo số bước và một mô-đun phá đúng số lớp giáp.',
    instructions:['Tạo `moveRightMany(int steps)` và `breakArmor(int hits)`, mỗi hàm dùng một vòng `for`.', 'Vượt tuyến xuống 3, phải 3, lên 3; gọi `breakArmor(6)` rồi quay sang phải.', 'Khi HP bằng 0, mở cửa; gọi lại `moveRightMany(3)` để thu đủ ba tinh thể và tới cổng dịch chuyển.'],
    starterCode:cppWithFunctions('void moveRightMany(int steps) {\n    // Di chuyển sang phải theo steps\n}\n\nvoid breakArmor(int hits) {\n    // Tấn công Bug theo hits\n}', '    for (int i = 0; i < 3; i++) { moveDown(); }\n    moveRightMany(3);\n    for (int i = 0; i < 3; i++) { moveUp(); }\n\n    breakArmor(6);\n    turnRight();\n\n    if (getBugHp() == 0) {\n        openDoor();\n    }\n    cout << getBugHp() << endl;\n\n    moveRightMany(3);'),
    requiredPatterns:['decl:func:*:params=1:count>=2','decl:func:moveRightMany>stmt:for','decl:func:moveRightMany>call:moveRight','decl:func:breakArmor>stmt:for','decl:func:breakArmor>call:attackBug','call:moveRightMany:count=2','call:breakArmor','stmt:if','call:openDoor'],
    testCases:[
      { id:'a6-c5-output',name:'Bảng điều khiển xác nhận Boss còn 0 giáp',kind:'output',expectedOutput:'0',required:true,visible:true },
      { id:'a6-c5-world',name:'Hai mô-đun phối hợp đánh đúng sáu đòn, mở cửa và tới cổng dịch chuyển',kind:'world',expectedWorld:{ col:10,row:2,bugHp:0,bugHits:6,openedDoors:['a6-c5-door'],collectedGems:3 },required:true,visible:true },
    ],
    commonMistakes:[{ errorCode:'FUNC_NOT_CALLED', message:'Xưởng cần cả hai mô-đun. Kiểm tra mỗi hàm đã được định nghĩa, có vòng lặp bên trong và được gọi với đúng đối số; Byte phải đứng cạnh Boss và đánh đúng sáu đòn.' }],
    hints:hints('Mô-đun nào xử lý quãng đường, mô-đun nào xử lý số lớp giáp?', 'Cả hai hàm đều có cấu trúc `for` giống nhau nhưng hành động trong thân và tên tham số khác nhau.', 'void moveRightMany(int ___) {\n    for (int i = 0; i < ___; i++) { ___; }\n}\nvoid breakArmor(int ___) {\n    for (int i = 0; i < ___; i++) { ___; }\n}'),
    cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:80, parStatements:17, handbookCards:['function-declare','function-params','function-call','loop-game-api'],
    world:map({
      terrain:['FFFFFFFFF','F..^^...F','F=..====F','F=.^=^..F','F=^^=...F','F====...F','F.~.^^..F','F...^...F','FFFFFFFFF'],
      start:[1,2],goal:[7,2],energy:34,initialState:{bugHp:6},
      props:[
        { id:'a6-c5-door',type:'door',col:5,row:2 }, { id:'a6-c5-boss',type:'boss',col:4,row:1,state:'decorative' },
        { id:'a6-c5-gem-1',type:'trail-gem',col:1,row:4 }, { id:'a6-c5-gem-2',type:'trail-gem',col:3,row:5 }, { id:'a6-c5-gem-3',type:'trail-gem',col:6,row:2 },
        { id:'a6-c5-machine-1',type:'machine',col:6,row:5,state:'decorative' }, { id:'a6-c5-machine-2',type:'machine',col:1,row:6,state:'decorative' },
        { id:'a6-c5-switch',type:'switch',col:7,row:6,state:'decorative' }, { id:'a6-c5-sword',type:'sword',col:2,row:1,state:'decorative' },
      ],
    }),
    solution:cppWithFunctions('void moveRightMany(int steps) {\n    for (int i = 0; i < steps; i++) {\n        moveRight();\n    }\n}\n\nvoid breakArmor(int hits) {\n    for (int i = 0; i < hits; i++) {\n        attackBug();\n    }\n}', '    for (int i = 0; i < 3; i++) { moveDown(); }\n    moveRightMany(3);\n    for (int i = 0; i < 3; i++) { moveUp(); }\n\n    breakArmor(6);\n    turnRight();\n    if (getBugHp() == 0) { openDoor(); }\n    cout << getBugHp() << endl;\n    moveRightMany(3);'),
    thinkingPrompt:'Hãy lập sơ đồ lời gọi: `main` giao việc gì cho từng hàm, mỗi đối số đi vào tham số nào, và tổng cộng Game API nào chạy bao nhiêu lần?',
    whyThisMatters:'Phân rã giúp chương trình nhiều giai đoạn vẫn dễ hiểu: `main` kể kế hoạch lớn, còn mỗi hàm chịu trách nhiệm một công việc nhỏ có thể tái sử dụng.',
  },
];

const a3Guide: ConceptGuide = {
  lessonId: 'a3',
  bigQuestion: 'Làm sao biến những con số đang có thành năng lượng và tín hiệu điều khiển đúng?',
  problem: {
    title: 'Dữ liệu đứng yên chưa tạo ra kết quả mới',
    body: 'Biến giúp chương trình nhớ số tinh thể và năng lượng, nhưng bản thân các giá trị đó chưa trả lời được cần cấp bao nhiêu hoặc công tắc có nên bật không.',
    painfulExample: 'int crystals = 3;\nint powerPerCrystal = 2;\n// Máy vẫn chưa biết cần nhận bao nhiêu năng lượng.',
    punchline: 'Ta cần biểu thức để tính giá trị mới và tạo câu trả lời đúng–sai từ dữ liệu.',
  },
  solution: {
    title: 'Toán tử biến dữ liệu thành kết quả',
    body: 'Số học tạo ra số mới, so sánh tạo ra `bool`, còn logic ghép nhiều điều kiện. Kết quả ấy có thể được in ra hoặc gửi vào Game API để làm máy thay đổi.',
    cleanExample: 'int energy = crystals * powerPerCrystal;\nbool enough = energy >= 6;\nchargeMachine(energy);\nsetSwitch(enough);',
    whatChanged: 'Chương trình không còn giữ những số rời rạc: nó tính, kiểm tra rồi dùng kết quả vào đúng thiết bị.',
  },
  mentalModel: {
    analogy: 'Hãy xem biểu thức như một dây chuyền trong lò: dữ liệu đi vào, toán tử xử lý, một giá trị mới đi ra.',
    explanation: 'Mỗi biểu thức chỉ tạo một kết quả. Em có thể tự tính kết quả đó trên giấy, xác định kiểu của nó, rồi mới theo dõi nơi kết quả được lưu hoặc sử dụng.',
  },
  thinkingSteps: [
    { question: 'Dữ liệu đầu vào đang có giá trị và kiểu gì?', why: 'Không biết đầu vào thì không thể dự đoán phép tính hay so sánh.' },
    { question: 'Nhiệm vụ cần kết quả là một con số hay một câu trả lời đúng–sai?', why: 'Loại kết quả quyết định nhóm toán tử phù hợp.' },
    { question: 'Tự tính biểu thức từ trái sang phải theo đúng ưu tiên được kết quả nào?', why: 'Dự đoán trước tạo mốc để kiểm tra Output và animation.' },
    { question: 'Kết quả được lưu, in hay gửi tới thiết bị nào?', why: 'Một biểu thức đúng nhưng dùng sai chỗ vẫn không hoàn thành nhiệm vụ.' },
  ],
  whenToUse: ['Khi cần tính điểm, năng lượng, số phần hoặc phần dư.', 'Khi cần kiểm tra một ngưỡng hoặc hai giá trị có bằng nhau không.', 'Khi một thiết bị phụ thuộc vào nhiều điều kiện đúng–sai.'],
  whenNotToUse: ['Không thêm toán tử chỉ để code trông phức tạp.', 'Không ghép biểu thức dài trước khi hiểu từng phần nhỏ.', 'Không dùng `=` khi ý định là so sánh bằng `==`.'],
  misconceptions: [
    { wrong: '`/` luôn cho kết quả thập phân.', right: 'Khi cả hai toán hạng là `int`, phần thập phân bị bỏ.', why: '`11 / 2` cho 5; dùng `%` để biết còn dư 1.' },
    { wrong: '`=` và `==` đều có nghĩa là bằng nhau.', right: '`=` gán giá trị, còn `==` đặt câu hỏi hai giá trị có bằng nhau không.', why: 'Một toán tử làm dữ liệu đổi, toán tử kia tạo kết quả bool.' },
    { wrong: '`&&` và `||` có thể đổi cho nhau.', right: '`&&` cần tất cả điều kiện đúng; `||` chỉ cần ít nhất một điều kiện đúng.', why: 'Đổi toán tử logic có thể bật một thiết bị khi chưa đủ điều kiện an toàn.' },
  ],
};

const a4Guide: ConceptGuide = {
  lessonId: 'a4',
  bigQuestion: 'Làm sao để cùng một chương trình chọn hành động đúng khi dữ liệu hoặc thế giới thay đổi?',
  problem: {
    title: 'Chạy mọi hành động mọi lúc sẽ làm chương trình sai',
    body: 'Cánh cửa không nên mở khi Byte chưa có chìa khóa; trạm cũng không nên báo OPEN khi năng lượng thấp. Một chuỗi lệnh cố định không thể phản ứng đúng với hai trạng thái trái ngược.',
    painfulExample: 'openDoor();\ncout << "OPEN" << endl;\n// Hai dòng này vẫn chạy dù chưa đủ điều kiện.',
    punchline: 'Chương trình cần đặt một câu hỏi bool trước khi chọn hành động.',
  },
  solution: {
    title: '`if` và `if ... else` tạo nhánh quyết định',
    body: '`if` chạy thân khi điều kiện đúng. `else` cung cấp đường còn lại khi điều kiện sai. Cảm biến Game API như `hasKey()` tạo dữ liệu bool để C++ ra quyết định.',
    cleanExample: 'if (hasKey() && energy >= 8) {\n    openDoor();\n} else {\n    cout << "LOW ENERGY" << endl;\n}',
    whatChanged: 'Hành động không còn được chạy vô điều kiện; mỗi trạng thái đi đúng một đường đã thiết kế.',
  },
  mentalModel: {
    analogy: 'Hãy xem điều kiện như người gác cổng: người ấy đọc thẻ, trả lời đúng–sai rồi chỉ mở một lối tương ứng.',
    explanation: 'Máy tính tính toàn bộ biểu thức trong ngoặc thành `true` hoặc `false`. Nếu đúng, nó đi vào thân `if`; nếu sai, nó bỏ qua hoặc đi vào `else`. Sau đó hai luồng nhập lại và chương trình tiếp tục.',
  },
  thinkingSteps: [
    { question: 'Chương trình phải quan sát dữ liệu hoặc trạng thái nào?', why: 'Chọn đúng biến hay cảm biến giúp điều kiện phản ánh thế giới thật.' },
    { question: 'Biểu thức nào biến quan sát đó thành true hoặc false?', why: 'Điều kiện phải là một câu hỏi có thể tự tính trước khi chạy.' },
    { question: 'Khi đúng cần làm gì, khi sai cần làm gì?', why: 'Tách hai nhánh trên giấy tránh trộn hành động hoặc in cả hai thông báo.' },
    { question: 'Đã thử ít nhất một dữ liệu đúng và một dữ liệu sai chưa?', why: 'Một nhánh chưa được chạy thử vẫn là một phần chương trình chưa có bằng chứng.' },
  ],
  whenToUse: ['Khi hành động chỉ an toàn hoặc hợp lệ trong một trạng thái.', 'Khi cần chọn một trong hai thông báo hay chiến lược.', 'Khi cùng một chương trình phải xử lý nhiều dữ liệu đầu vào.'],
  whenNotToUse: ['Không dùng `if` khi hành động luôn phải chạy.', 'Không viết điều kiện bằng phép gán `=` khi muốn so sánh `==`.', 'Không lồng nhiều nhánh trước khi kiểm tra rõ từng điều kiện đơn.'],
  misconceptions: [
    { wrong: 'Thân `if` luôn chạy rồi mới kiểm tra.', right: 'Điều kiện được tính trước; thân chỉ chạy khi kết quả là true.', why: 'Vì vậy animation trong thân sẽ hoàn toàn không xuất hiện ở nhánh sai.' },
    { wrong: '`else` là một điều kiện thứ hai độc lập.', right: '`else` thuộc về `if` ngay trước nó và chạy khi điều kiện ấy sai.', why: 'Trong một cấu trúc if–else, đúng một nhánh được chọn.' },
    { wrong: '`=` và `==` đều có nghĩa “bằng”.', right: '`=` thay đổi dữ liệu; `==` tạo câu trả lời bool.', why: 'Dùng nhầm phép gán trong điều kiện có thể khiến mọi lượt chạy đi cùng một nhánh.' },
  ],
};

const a5Guide: ConceptGuide = {
  lessonId:'a5',
  bigQuestion:'Làm sao mô tả một công việc lặp lại sao cho ngắn gọn nhưng vẫn chính xác từng lượt?',
  problem:{
    title:'Chép lại cùng một lệnh làm thuật toán dài và khó sửa',
    body:'Một đường có sáu ô có thể viết sáu `moveRight()`, nhưng khi đường đổi thành mười ô ta phải đếm và sửa nhiều dòng. Những dòng giống nhau cũng che mất quy luật thật sự của bài toán.',
    painfulExample:'moveRight();\nmoveRight();\nmoveRight();\nmoveRight();\nmoveRight();\nmoveRight();',
    punchline:'Nếu biết hành động và số lượt, ta nên mô tả quy luật thay vì chép từng bản sao.',
  },
  solution:{
    title:'Vòng `for` quản lý khởi đầu, điều kiện và cập nhật',
    body:'Phần đầu tạo biến đếm một lần. Trước mỗi lượt, điều kiện quyết định có chạy tiếp không. Sau thân vòng lặp, phần cập nhật thay đổi biến đếm để tiến gần tới điểm dừng.',
    cleanExample:'for (int i = 0; i < 6; i++) {\n    moveRight();\n}',
    whatChanged:'Sáu dòng giống nhau trở thành một quy tắc có thể đọc, đếm, kiểm thử và thay đổi tại đúng một chỗ.',
  },
  mentalModel:{
    analogy:'Hãy hình dung i là số trên vòng đếm của một cánh cổng: nhìn số hiện tại, làm một lượt, bấm tăng rồi quay lại kiểm tra.',
    explanation:'Với `i = 0; i < 4; i++`, thân chạy khi i lần lượt là 0, 1, 2, 3. Khi i tăng thành 4, câu hỏi `4 < 4` sai và chương trình đi ra khỏi vòng lặp.',
  },
  thinkingSteps:[
    { question:'Hành động hoặc khối hành động nào đang lặp lại?', why:'Xác định thân vòng lặp trước giúp không đưa nhầm thao tác chỉ cần làm một lần vào trong.' },
    { question:'Cần chính xác bao nhiêu lượt?', why:'Số lượt quyết định mốc khởi đầu và điều kiện dừng.' },
    { question:'Biến đếm nhận những giá trị nào trong thân?', why:'Liệt kê giá trị là cách chắc chắn nhất để phát hiện lỗi off-by-one.' },
    { question:'Sau mỗi lượt, map hoặc dữ liệu phải thay đổi ra sao?', why:'Mỗi iteration cần một bằng chứng quan sát được để đối chiếu với dự đoán.' },
  ],
  whenToUse:['Khi một hành động giống nhau lặp số lần biết trước.', 'Khi cần dùng số thứ tự của từng lượt.', 'Khi nhiều thiết bị hoặc lớp giáp được xử lý theo cùng một quy luật.'],
  whenNotToUse:['Không dùng vòng lặp cho hành động chỉ xảy ra một lần.', 'Không lặp khi chưa xác định được điều kiện dừng.', 'Không dùng `<=` theo thói quen; phải liệt kê giá trị biến đếm.'],
  misconceptions:[
    { wrong:'`i < 5` chỉ chạy bốn lượt vì số cuối là 4.', right:'Bắt đầu từ 0, năm giá trị 0–4 tạo năm lượt.', why:'Số lượt là số lượng giá trị hợp lệ, không phải giá trị cuối.' },
    { wrong:'`i++` chạy trước thân vòng lặp.', right:'Phần cập nhật chạy sau khi thân hoàn tất.', why:'Ở lượt đầu, thân vẫn nhìn thấy đúng giá trị khởi tạo.' },
    { wrong:'`<` và `<=` gần như giống nhau.', right:'Chúng thường làm số lượt lệch đúng một.', why:'Với i bắt đầu từ 0, `i <= 5` có thêm lượt i = 5 so với `i < 5`.' },
  ],
};

const a6Guide: ConceptGuide = {
  lessonId:'a6',
  bigQuestion:'Làm sao biến một thuật toán đã biết thành mô-đun có thể gọi lại với nhiều dữ liệu khác nhau?',
  problem:{
    title:'Code dài trở lại khi mỗi nơi chép một bản của cùng thuật toán',
    body:'Vòng lặp đã làm một đoạn lặp ngắn hơn, nhưng một chương trình lớn vẫn có thể cần cùng đoạn di chuyển hoặc tấn công ở nhiều nơi. Chép cả khối sẽ khiến mỗi lần sửa phải tìm nhiều bản sao.',
    painfulExample:'for (int i = 0; i < 3; i++) { moveRight(); }\n// ... nhiều lệnh khác ...\nfor (int i = 0; i < 3; i++) { moveRight(); }',
    punchline:'Ta cần đặt tên cho thuật toán nhỏ, gọi nó khi cần và truyền vào phần dữ liệu thay đổi.',
  },
  solution:{
    title:'Hàm đóng gói công việc; tham số làm mô-đun linh hoạt',
    body:'Định nghĩa hàm nói mô-đun làm gì. Lời gọi hàm yêu cầu mô-đun chạy. Tham số nhận dữ liệu từ đối số, còn `return` gửi một kết quả về nơi gọi.',
    cleanExample:'void moveRightMany(int steps) {\n    for (int i = 0; i < steps; i++) {\n        moveRight();\n    }\n}\n\nmoveRightMany(3);',
    whatChanged:'Hai bản sao được thay bằng một định nghĩa có tên và các lời gọi ngắn thể hiện rõ ý định.',
  },
  mentalModel:{
    analogy:'Hãy xem hàm như một cỗ máy: tên là nhãn máy, tham số là khe đưa nguyên liệu vào, thân hàm là cơ chế bên trong, còn `return` là khay nhận sản phẩm.',
    explanation:'Định nghĩa chỉ lắp cỗ máy. Mỗi lời gọi tạo một lượt vận hành mới; đối số được gắn vào tham số riêng của lượt đó. Khi gặp `return`, giá trị đi về đúng nơi đã gọi hàm.',
  },
  thinkingSteps:[
    { question:'Khối lệnh nào có một nhiệm vụ rõ ràng và đáng đặt tên?', why:'Một hàm tốt nên có một trách nhiệm, để tên của nó mô tả được mục đích.' },
    { question:'Phần nào giữ nguyên, phần dữ liệu nào thay đổi giữa các lần dùng?', why:'Phần thay đổi nên trở thành tham số thay vì bị viết cứng trong thân hàm.' },
    { question:'Hàm chỉ thực hiện hành động hay cần gửi một giá trị về?', why:'Hàm hành động có thể dùng `void`; hàm tính toán cần kiểu trả về và `return` phù hợp.' },
    { question:'`main` sau khi tách hàm có kể được kế hoạch lớn theo thứ tự không?', why:'Mục tiêu của phân rã là làm chương trình dễ hiểu hơn, không chỉ ít dòng hơn.' },
  ],
  whenToUse:['Khi một chuỗi hành động xuất hiện nhiều lần.', 'Khi một công việc có tên và trách nhiệm rõ ràng.', 'Khi cùng thuật toán cần chạy với nhiều số bước, số đòn hoặc dữ liệu khác nhau.', 'Khi muốn tách tính toán khỏi phần sử dụng kết quả.'],
  whenNotToUse:['Không tạo hàm chỉ để bọc một dòng không mang thêm ý nghĩa.', 'Không viết nhiều hàm có tên mơ hồ như `doIt1` hoặc `thing`.', 'Không dùng biến toàn cục để thay cho tham số khi dữ liệu có thể truyền rõ ràng.', 'Không quên gọi hàm sau khi đã định nghĩa.'],
  misconceptions:[
    { wrong:'Định nghĩa hàm là hàm sẽ tự chạy.', right:'Hàm chỉ chạy khi có lời gọi tới nó.', why:'Định nghĩa giống bản thiết kế; lời gọi mới khởi động mô-đun.' },
    { wrong:'Tham số và đối số là cùng một vị trí trong code.', right:'Tham số nằm ở định nghĩa; đối số nằm ở lời gọi và cung cấp giá trị.', why:'`steps` là tên dùng trong mô-đun, còn `3` là dữ liệu của một lần gọi cụ thể.' },
    { wrong:'`return` chỉ dùng để kết thúc `main`.', right:'Trong hàm có kiểu trả về, `return` gửi một giá trị về nơi gọi.', why:'Giá trị ấy có thể được lưu vào biến, in ra hoặc truyền tiếp cho hàm khác.' },
  ],
};

const checkpoint = (lessonId: string, questions: ExitTicketQuestion[]): ExitTicket => ({
  lessonId,
  questions,
  reflectionPrompt: 'Điều gì em đã dự đoán đúng ngay từ đầu, và lần debug nào giúp em hiểu rõ nhất?',
});

const a0Checkpoint = checkpoint('a0', [
  { id:'a0-q1', type:'knowledge', prompt:'Trong một chương trình C++ thông thường, hàm nào là điểm bắt đầu thực thi?', options:['main()','cout','start()','run()'], correctIndex:0, explanation:'Hệ thống bắt đầu thực thi chương trình từ hàm `main()`.' },
  { id:'a0-q2', type:'read-code', prompt:'Sau khi câu lệnh sau được thực thi, Output hiển thị chính xác nội dung nào?', code:'cout << "Byte" << endl;', options:['Byte','"Byte"','endl','Không có dữ liệu'], correctIndex:0, explanation:'`cout` xuất các ký tự nằm trong chuỗi; hai dấu ngoặc kép không thuộc nội dung Output. `endl` kết thúc dòng.' },
  { id:'a0-q3', type:'multiple-answer', prompt:'Chọn tất cả nhận định đúng về chương trình C++ ở Trạm Khởi Động.', options:['`main()` là điểm bắt đầu thực thi chương trình','`cout` gửi dữ liệu tới luồng Output chuẩn','`//` bắt đầu chú thích đến hết dòng','Dấu `;` dùng để bắt đầu một khối lệnh'], correctIndices:[0,1,2], explanation:'`main()` là điểm vào; `cout` dùng để xuất dữ liệu; `//` tạo chú thích một dòng. Dấu `;` thường kết thúc một statement, không mở khối lệnh.' },
  { id:'a0-q4', type:'ordering', prompt:'Cổng yêu cầu nhận `KHOI DONG` trước và `SAN SANG` sau. Sắp xếp hai statement theo đúng thứ tự thực thi.', options:['cout << "SAN SANG" << endl;','cout << "KHOI DONG" << endl;'], correctOrder:['cout << "KHOI DONG" << endl;','cout << "SAN SANG" << endl;'], explanation:'Trong khối `main()`, các statement tuần tự được thực thi từ trên xuống dưới.' },
  { id:'a0-q5', type:'matching', prompt:'Ghép mỗi thành phần với vai trò chính xác trong câu lệnh `cout << "Byte" << endl;`.', options:['Đối tượng xuất dữ liệu','Toán tử đưa dữ liệu vào luồng','Kết thúc dòng Output','Kết thúc statement'], matches:[{left:'cout',right:'Đối tượng xuất dữ liệu'},{left:'<<',right:'Toán tử đưa dữ liệu vào luồng'},{left:'endl',right:'Kết thúc dòng Output'},{left:';',right:'Kết thúc statement'}], explanation:'Mỗi thành phần có một vai trò riêng; đọc được cấu trúc này giúp em tự viết và debug câu lệnh `cout`.' },
  { id:'a0-q6', type:'debugging', prompt:'Chương trình không biên dịch vì thiếu đúng một ký hiệu. Dòng nào cần sửa và sửa như thế nào?', code:'1  cout << "He thong" << endl\n2  cout << "san sang" << endl;', options:['Thêm `;` vào cuối dòng 1','Thêm `;` vào đầu dòng 2','Thêm `main()` giữa hai dòng','Xóa `endl` ở dòng 1'], correctIndex:0, explanation:'Statement ở dòng 1 chưa được kết thúc. Cần thêm dấu `;` ngay sau `endl`.' },
  { id:'a0-q7', type:'fill-code', prompt:'Điền tên đối tượng xuất dữ liệu còn thiếu: ___ << "Hi" << endl;', options:[], acceptedAnswers:['cout','std::cout'], explanation:'`cout` (hoặc tên đầy đủ `std::cout`) gửi dữ liệu tới luồng Output chuẩn.' },
  { id:'a0-q8', type:'scenario', prompt:'Chương trình biên dịch được nhưng cổng không mở vì Output là `System online`, trong khi nhiệm vụ yêu cầu `SYSTEM ONLINE`. Việc kiểm tra nào phù hợp nhất?', options:['Đối chiếu từng ký tự, chữ hoa và khoảng trắng của Output','Thêm ngẫu nhiên nhiều dấu `;`','Xóa toàn bộ chương trình rồi chạy lại','Bỏ qua vì chương trình đã biên dịch'], correctIndex:0, explanation:'Biên dịch thành công chỉ xác nhận cú pháp có thể thực thi. Kết quả vẫn phải khớp chính xác yêu cầu, kể cả chữ hoa và khoảng trắng.' },
  { id:'a0-q9', type:'self-assess', prompt:'Khi chương trình chưa đạt mục tiêu, em thường bắt đầu debug bằng hành động nào?', options:['Đọc thông báo lỗi hoặc so Output với yêu cầu','Xác định dòng đầu tiên khác dự đoán','Chạy từng bước và ghi lại bằng chứng','Em chưa có thói quen cố định'], explanation:'Câu này không chấm đúng–sai. Một quy trình debug tốt luôn bắt đầu từ bằng chứng cụ thể thay vì thay code ngẫu nhiên.' },
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

const a3Checkpoint = checkpoint('a3', [
  { id:'a3-q1', type:'knowledge', prompt:'Toán tử nào lấy phần dư của phép chia nguyên?', options:['%','/','*','=='], correctIndex:0, explanation:'`%` trả về phần dư.' },
  { id:'a3-q2', type:'code-prediction', prompt:'Code in gì?', code:'int energy = 3 * 2 + 1;\ncout << energy;', options:['6','7','9','32'], correctIndex:1, explanation:'Phép nhân thực hiện trước phép cộng: 6 + 1 = 7.' },
  { id:'a3-q3', type:'multiple-answer', prompt:'Biểu thức nào cho kết quả kiểu bool?', options:['energy >= 8','total == 24','crystals * 2','11 % 2'], correctIndices:[0,1], explanation:'So sánh tạo `true` hoặc `false`; số học tạo số.' },
  { id:'a3-q4', type:'ordering', prompt:'Xếp đúng luồng cấp năng lượng.', options:['chargeMachine(energy);','int energy = crystals * 3;','cout << energy;'], correctOrder:['int energy = crystals * 3;','cout << energy;','chargeMachine(energy);'], explanation:'Tính trước, có thể quan sát, rồi dùng kết quả.' },
  { id:'a3-q5', type:'matching', prompt:'Nối toán tử với ý nghĩa.', options:['Nhân','Phần dư','So sánh bằng','Và logic'], matches:[{left:'*',right:'Nhân'},{left:'%',right:'Phần dư'},{left:'==',right:'So sánh bằng'},{left:'&&',right:'Và logic'}], explanation:'Mỗi toán tử tạo một loại quan hệ rõ ràng.' },
  { id:'a3-q6', type:'debugging', prompt:'Cổng cần đủ cả chìa khoá và năng lượng. Dòng nào đúng?', options:['ready = hasKey && enough;','ready = hasKey || enough;','ready = !hasKey;','ready = energy + key;'], correctIndex:0, explanation:'`&&` yêu cầu cả hai điều kiện đúng.' },
  { id:'a3-q7', type:'fill-code', prompt:'Điền toán tử cho “ít nhất 8”: energy ___ 8', options:[], acceptedAnswers:['>='], explanation:'“Ít nhất” bao gồm cả bằng nên dùng `>=`.' },
  { id:'a3-q8', type:'scenario', prompt:'Có 11 tinh thể, mỗi khay chứa 2. Số tinh thể dư là bao nhiêu?', options:['0','1','5','5.5'], correctIndex:1, explanation:'`11 % 2` bằng 1.' },
  { id:'a3-q9', type:'self-assess', prompt:'Khi gặp biểu thức dài, em thường làm gì trước?', options:['Tách thành phần nhỏ','Tính nhẩm cả dòng','Bấm chạy để đoán','Chép kết quả'], explanation:'Tách nhỏ giúp dự đoán và debug có bằng chứng.' },
]);

const a4Checkpoint = checkpoint('a4', [
  { id:'a4-q1', type:'knowledge', prompt:'Thân `if` chạy khi nào?', options:['Khi điều kiện là true','Luôn luôn','Khi điều kiện là false','Chỉ khi có else'], correctIndex:0, explanation:'Điều kiện được tính trước; thân if chỉ chạy khi kết quả là true.' },
  { id:'a4-q2', type:'code-prediction', prompt:'Đầu vào là 4. Code in gì?', code:'int energy;\ncin >> energy;\nif (energy >= 8) { cout << "OPEN"; }\nelse { cout << "CHARGE"; }', options:['OPEN','CHARGE','OPENCHARGE','Không in'], correctIndex:1, explanation:'4 >= 8 là false nên nhánh else chạy.' },
  { id:'a4-q3', type:'multiple-answer', prompt:'Điều kiện nào tạo kết quả bool?', options:['energy >= 8','hasKey()','energy + 8','collectKey()'], correctIndices:[0,1], explanation:'So sánh và cảm biến hasKey() tạo true/false; hai lựa chọn còn lại không phải điều kiện bool.' },
  { id:'a4-q4', type:'ordering', prompt:'Xếp đúng quy trình mở cửa bằng cảm biến.', options:['if (hasKey()) { openDoor(); }','collectKey();','moveRight(); // tới chìa'], correctOrder:['moveRight(); // tới chìa','collectKey();','if (hasKey()) { openDoor(); }'], explanation:'Thế giới phải đổi trước rồi cảm biến mới đọc được trạng thái mới.' },
  { id:'a4-q5', type:'matching', prompt:'Nối cấu trúc với vai trò.', options:['Nhánh khi đúng','Nhánh khi sai','Đọc dữ liệu','So sánh bằng'], matches:[{left:'if',right:'Nhánh khi đúng'},{left:'else',right:'Nhánh khi sai'},{left:'cin',right:'Đọc dữ liệu'},{left:'==',right:'So sánh bằng'}], explanation:'Mỗi cấu trúc đảm nhiệm một phần riêng trong quyết định.' },
  { id:'a4-q6', type:'debugging', prompt:'Lỗi trong `if (access = 1)` là gì?', options:['Đang gán thay vì so sánh','Thiếu else','Thiếu cin','Số 1 không hợp lệ'], correctIndex:0, explanation:'Dùng `access == 1` để so sánh.' },
  { id:'a4-q7', type:'fill-code', prompt:'Cổng cần đồng thời có chìa và đủ năng lượng: hasKey() ___ energy >= 8', options:[], acceptedAnswers:['&&'], explanation:'`&&` chỉ true khi cả hai vế đều true.' },
  { id:'a4-q8', type:'scenario', prompt:'Cùng một chương trình đã đúng với năng lượng 9. Bước kiểm tra tiếp theo tốt nhất là gì?', options:['Chạy thêm dữ liệu thấp như 4','Chép output OPEN vào code','Xóa nhánh else','Không cần thử nữa'], correctIndex:0, explanation:'Cần ít nhất một dữ liệu cho mỗi nhánh để có bằng chứng chương trình tổng quát.' },
  { id:'a4-q9', type:'self-assess', prompt:'Trước khi chạy if–else, em có dự đoán cả hai nhánh không?', options:['Luôn dự đoán cả hai','Thường có','Đôi khi','Chưa, em sẽ thử'], explanation:'Tự dự đoán hai nhánh giúp việc chạy code trở thành kiểm chứng thay vì đoán mò.' },
]);

const a5Checkpoint = checkpoint('a5', [
  { id:'a5-q1', type:'knowledge', prompt:'Ba phần trong đầu vòng `for` có vai trò gì?', options:['Khởi tạo · điều kiện · cập nhật','Input · output · return','Đúng · sai · kết thúc','Hàm · biến · chuỗi'], correctIndex:0, explanation:'for gom khởi tạo, kiểm tra điều kiện và cập nhật biến đếm.' },
  { id:'a5-q2', type:'code-prediction', prompt:'`for (int i = 0; i < 3; i++) cout << i;` in gì?', options:['012','123','01','0123'], correctIndex:0, explanation:'Thân chạy với i = 0, 1, 2 rồi dừng khi i bằng 3.' },
  { id:'a5-q3', type:'multiple-answer', prompt:'Vòng nào chạy đúng năm lượt?', options:['i = 0; i < 5; i++','i = 1; i <= 5; i++','i = 0; i <= 5; i++','i = 1; i < 5; i++'], correctIndices:[0,1], explanation:'Hai dãy 0–4 và 1–5 đều có năm giá trị.' },
  { id:'a5-q4', type:'ordering', prompt:'Xếp thứ tự một lượt của vòng for.', options:['Cập nhật i','Chạy thân','Kiểm tra điều kiện'], correctOrder:['Kiểm tra điều kiện','Chạy thân','Cập nhật i'], explanation:'Sau cập nhật, chương trình quay lại kiểm tra điều kiện cho lượt tiếp theo.' },
  { id:'a5-q5', type:'matching', prompt:'Nối thành phần với ý nghĩa.', options:['Tạo biến đếm','Còn được lặp?','Tăng sau mỗi lượt','Hành động lặp'], matches:[{left:'int i = 0',right:'Tạo biến đếm'},{left:'i < 6',right:'Còn được lặp?'},{left:'i++',right:'Tăng sau mỗi lượt'},{left:'moveRight()',right:'Hành động lặp'}], explanation:'Đọc đúng vai trò từng phần giúp dự đoán vòng lặp.' },
  { id:'a5-q6', type:'debugging', prompt:'Cần sáu lượt từ i = 0 nhưng code dùng `i <= 6`. Sửa thế nào?', options:['Đổi thành i < 6','Đổi thành i <= 7','Bỏ i++','Bắt đầu i = 2'], correctIndex:0, explanation:'i < 6 cho sáu giá trị 0–5.' },
  { id:'a5-q7', type:'fill-code', prompt:'Điền phần cập nhật tăng i thêm một: for (int i = 0; i < 5; ___)', options:[], acceptedAnswers:['i++','++i','i = i + 1','i=i+1'], explanation:'Các cách này đều tăng i thêm một sau mỗi lượt.' },
  { id:'a5-q8', type:'scenario', prompt:'Boss có 5 lớp giáp, mỗi `attackBug()` phá 1 lớp. Giới hạn nào phù hợp khi hit bắt đầu từ 0?', options:['hit < 5','hit <= 5','hit < 4','hit == 5'], correctIndex:0, explanation:'hit nhận 0,1,2,3,4: đúng năm đòn.' },
  { id:'a5-q9', type:'self-assess', prompt:'Khi chưa chắc số lượt, em sẽ kiểm tra bằng cách nào?', options:['Liệt kê giá trị biến đếm','Chạy nhiều lần để đoán','Thêm lệnh ngẫu nhiên','Bỏ điều kiện'], explanation:'Liệt kê biến đếm biến dự đoán thành bằng chứng có thể kiểm tra.' },
]);

const a6Checkpoint = checkpoint('a6', [
  { id:'a6-q1', type:'knowledge', prompt:'Định nghĩa hàm và lời gọi hàm khác nhau thế nào?', options:['Định nghĩa mô tả công việc; lời gọi yêu cầu thực hiện','Hai cách viết hoàn toàn giống nhau','Lời gọi tạo tham số','Định nghĩa luôn tự chạy'], correctIndex:0, explanation:'Định nghĩa lắp mô-đun; lời gọi mới làm chương trình đi vào thân hàm.' },
  { id:'a6-q2', type:'code-prediction', prompt:'Code gọi `moveRightMany(2);` thì `steps` có giá trị nào trong lượt gọi?', code:'void moveRightMany(int steps) {\n    cout << steps;\n}\nmoveRightMany(2);', options:['2','0','steps','Không có giá trị'], correctIndex:0, explanation:'Đối số 2 được gắn cho tham số steps của lượt gọi.' },
  { id:'a6-q3', type:'multiple-answer', prompt:'Chọn tên hàm diễn tả hành động rõ ràng.', options:['calculatePower','breakArmor','doIt','x'], correctIndices:[0,1], explanation:'Tên động từ và mục tiêu giúp người đọc hiểu trách nhiệm của hàm.' },
  { id:'a6-q4', type:'ordering', prompt:'Xếp luồng của một hàm trả về.', options:['Lưu kết quả ở nơi gọi','Gắn đối số vào tham số','Tính biểu thức return'], correctOrder:['Gắn đối số vào tham số','Tính biểu thức return','Lưu kết quả ở nơi gọi'], explanation:'Dữ liệu đi vào qua tham số, được xử lý rồi trở về nơi gọi.' },
  { id:'a6-q5', type:'matching', prompt:'Nối thành phần với vai trò.', options:['Tên nhận dữ liệu','Giá trị truyền vào','Gửi kết quả về','Không trả về dữ liệu'], matches:[{left:'parameter',right:'Tên nhận dữ liệu'},{left:'argument',right:'Giá trị truyền vào'},{left:'return',right:'Gửi kết quả về'},{left:'void',right:'Không trả về dữ liệu'}], explanation:'Bốn thành phần mô tả giao diện vào–ra của hàm.' },
  { id:'a6-q6', type:'debugging', prompt:'Hàm nhận steps nhưng luôn đi 3 ô. Dòng nào cần sửa?', code:'void moveMany(int steps) {\n for (int i = 0; i < 3; i++) moveRight();\n}', options:['Đổi `i < 3` thành `i < steps`','Xóa tham số steps','Đổi moveRight thành cout','Đổi void thành int'], correctIndex:0, explanation:'Giới hạn phải dùng tham số để mỗi đối số điều khiển được số lượt.' },
  { id:'a6-q7', type:'fill-code', prompt:'Điền câu lệnh gửi tích hai tham số về nơi gọi.', code:'int power(int a, int b) {\n    ___ a * b;\n}', options:[], acceptedAnswers:['return','return '], explanation:'`return` gửi kết quả có kiểu int về nơi gọi.' },
  { id:'a6-q8', type:'scenario', prompt:'Cùng một chuỗi 5 lệnh xuất hiện ba lần. Cách cải tiến tốt nhất là gì?', options:['Tách thành hàm có tên rõ ràng và gọi lại','Chép thêm một bản dự phòng','Xóa chú thích','Viết tất cả trên một dòng'], correctIndex:0, explanation:'Tách hàm loại bỏ lặp và tập trung nơi cần sửa.' },
  { id:'a6-q9', type:'self-assess', prompt:'Khi gặp nhiệm vụ lớn, em chọn tên và trách nhiệm cho các hàm nhỏ bằng cách nào?', options:['Mỗi hàm một công việc rõ ràng','Tách theo số dòng ngẫu nhiên','Chỉ dùng tên f1, f2','Em sẽ thử phác thảo trước'], explanation:'Tự nhìn lại cách phân rã giúp em viết chương trình lớn mà vẫn kiểm soát được.' },
]);

export const CORE_LESSONS: Lesson[] = [
  {
    id:'a0', order:0, zoneName:'Trạm Khởi Động', title:'C++ bắt đầu từ đâu?', subtitle:'main · cout · statement · dấu ; · comment',
    intro:'Một trận nhiễu dữ liệu đã khóa cổng ByteLand. Em cùng Byte khôi phục đài tín hiệu qua bốn bước: đọc chương trình, gửi mật khẩu, sửa lỗi cú pháp và tự viết hai câu lệnh mở cổng.',
    objectives:['Nhận biết cấu trúc chương trình C++ đầu tiên','Dùng cout để xuất dữ liệu','Đọc và sửa lỗi dấu chấm phẩy'],
    learningObjectives: {
      know: ['Vai trò của `main()`, `cout`, chuỗi, chú thích và dấu `;`.'],
      understand: 'Máy tính thực hiện chính xác các câu lệnh C++ theo thứ tự; chạy được chưa có nghĩa là kết quả đã đúng.',
      do: ['Dự đoán kết quả đầu ra trước khi chạy.', 'Tự viết câu lệnh `cout` và sửa lỗi thiếu dấu `;`.'],
    },
    certificateCode:'cpp-starter', accent:'quest', icon:'terminal', estimatedMinutes:60,
    conceptGuide:guide('a0','Làm thế nào để một ý nghĩ trở thành chương trình C++ mà máy có thể chạy?','Mình muốn máy nói xin chào, nhưng chỉ nghĩ trong đầu thì màn hình vẫn trống.','cout << "Xin chao" << endl;','Statement biến ý định thành tín hiệu'),
    challenges:a0Challenges, exitTicket:a0Checkpoint,
  },
  {
    id:'a1', order:1, zoneName:'Đồng Cỏ Thuật Toán', title:'Ra lệnh cho nhân vật', subtitle:'function call · sequence · Game API',
    intro:'Em dùng lời gọi hàm C++ để điều khiển Byte trên bản đồ lớn. CodeQuest cung cấp Game API; còn cú pháp gọi hàm vẫn là C++ thật.',
    objectives:['Gọi hàm với tên, ngoặc tròn và dấu chấm phẩy','Lập chuỗi lệnh đúng thứ tự','Debug đường đi bằng chế độ từng bước'],
    learningObjectives: {
      know: ['Cú pháp lời gọi hàm và bốn lệnh di chuyển của Game API.'],
      understand: 'Thứ tự lời gọi hàm tạo ra quỹ đạo; cùng các lệnh nhưng sắp xếp khác nhau có thể cho kết quả khác.',
      do: ['Chia tuyến đường thành các đoạn rồi tự viết chuỗi lệnh.', 'Chạy từng bước để tìm hành động đầu tiên lệch khỏi kế hoạch.'],
    },
    certificateCode:'function-builder', accent:'verdant', icon:'map', estimatedMinutes:60,
    conceptGuide:guide('a1','Làm sao biến một đường đi trên bản đồ thành chuỗi lời gọi hàm đúng thứ tự?','Nếu chỉ nói “tới cổng đi”, Byte không biết bước đầu tiên là phải, trái, lên hay xuống.','moveRight();\nmoveDown();','Game API biến lời gọi hàm thành hành động'),
    challenges:a1Challenges, exitTicket:a1Checkpoint,
  },
  {
    id:'a2', order:2, zoneName:'Kho Dữ Liệu Pha Lê', title:'Ghi nhớ trạng thái', subtitle:'variable · data type · assignment · update',
    intro:'Thế giới bắt đầu thay đổi: ngọc được nhặt, cổng được mở và điểm số tăng. Biến giúp chương trình ghi nhớ các trạng thái đó.',
    objectives:['Khai báo biến với kiểu phù hợp','Gán và cập nhật giá trị','Kết nối dữ liệu trong code với trạng thái game'],
    learningObjectives: {
      know: ['Biến, phép gán và các kiểu `int`, `double`, `bool`, `string`.'],
      understand: 'Biến nối dữ liệu trong chương trình với trạng thái đang thay đổi của thế giới.',
      do: ['Khai báo, đọc và cập nhật biến.', 'Đối chiếu giá trị biến với Output và trạng thái bản đồ.'],
    },
    certificateCode:'data-keeper', accent:'mage', icon:'gem', estimatedMinutes:60,
    conceptGuide:guide('a2','Làm sao để chương trình ghi nhớ một giá trị và cập nhật nó khi thế giới thay đổi?','Nếu viết cứng số ngọc trong mọi câu lệnh, mỗi lần nhặt thêm ta phải sửa rất nhiều chỗ.','int gems = 0;\ngems = gems + 1;','Biến là chiếc hộp có tên và kiểu'),
    challenges:a2Challenges, exitTicket:a2Checkpoint,
  },
  {
    id:'a3', order:3, zoneName:'Lò Toán Tử', title:'Biến dữ liệu thành kết quả', subtitle:'arithmetic · comparison · logic · expression',
    intro:'Em đưa dữ liệu qua các phép tính, so sánh và logic để cấp năng lượng cho máy thật trên bản đồ. Mỗi biểu thức đều có kết quả dự đoán được trước khi chạy.',
    objectives:['Tính toán bằng +, -, *, / và %','Tạo giá trị bool bằng toán tử so sánh','Ghép điều kiện bằng &&, || và !','Dùng kết quả biểu thức để điều khiển thiết bị'],
    learningObjectives: {
      know: ['Toán tử số học, so sánh, logic và thứ tự thực hiện biểu thức.'],
      understand: 'Biểu thức biến dữ liệu thành một giá trị mới hoặc một câu trả lời đúng–sai có thể kiểm chứng.',
      do: ['Dự đoán rồi tính biểu thức.', 'Dùng kết quả để cấp năng lượng hoặc điều khiển thiết bị.'],
    },
    certificateCode:'operator-smith', accent:'treasure', icon:'zap', estimatedMinutes:60,
    conceptGuide:a3Guide,
    challenges:a3Challenges, exitTicket:a3Checkpoint,
  },
  {
    id:'a4', order:4, zoneName:'Cổng Quyết Định', title:'Cho chương trình biết lựa chọn', subtitle:'if · if-else · condition · sensor',
    intro:'Em bước vào pháo đài nơi mỗi cánh cửa phản ứng với dữ liệu thật. Hãy dùng điều kiện C++, cảm biến chìa khóa và nhiều bộ đầu vào để khiến Byte chọn đúng hành động trong mọi tình huống.',
    objectives:['Dùng if để thực hiện hành động có điều kiện','Dùng if–else để chọn đúng một trong hai nhánh','Đọc dữ liệu bằng cin và kiểm thử cả hai trường hợp','Kết hợp cảm biến Game API với điều kiện C++'],
    learningObjectives: {
      know: ['Cấu trúc `if`, `if-else`, điều kiện và dữ liệu đầu vào.'],
      understand: 'Cùng một chương trình có thể chọn hành động khác nhau khi dữ liệu hoặc trạng thái thay đổi.',
      do: ['Viết quyết định bằng điều kiện.', 'Dự đoán và kiểm thử cả nhánh đúng lẫn nhánh sai.'],
    },
    certificateCode:'decision-maker', accent:'alert', icon:'git-branch', estimatedMinutes:65,
    conceptGuide:a4Guide,
    challenges:a4Challenges, exitTicket:a4Checkpoint,
  },
  {
    id:'a5', order:5, zoneName:'Thung Lũng Lặp', title:'Biến việc lặp lại thành thuật toán', subtitle:'for · counter · iteration · off-by-one',
    intro:'Những con đường dài, dãy đèn và lớp giáp đều có quy luật lặp. Em sẽ dùng vòng `for` để viết quy luật gọn, theo dõi từng iteration và chứng minh số lượt chính xác bằng map lẫn Output.',
    objectives:['Viết vòng for với khởi tạo, điều kiện và cập nhật','Dùng biến đếm trong thân vòng lặp','Phát hiện và sửa lỗi off-by-one','Lặp nhiều hành động Game API có phản hồi trực quan'],
    learningObjectives: {
      know: ['Ba phần của vòng `for`, biến đếm và mỗi lượt lặp.'],
      understand: 'Điều kiện và cập nhật biến đếm quyết định chính xác thân vòng lặp chạy bao nhiêu lượt.',
      do: ['Viết vòng lặp `for`.', 'Lập bảng giá trị biến đếm và sửa lỗi lệch một lượt.'],
    },
    certificateCode:'loop-explorer', accent:'verdant', icon:'repeat-2', estimatedMinutes:65,
    conceptGuide:a5Guide,
    challenges:a5Challenges, exitTicket:a5Checkpoint,
  },
  {
    id:'a6', order:6, zoneName:'Xưởng Hàm', title:'Đóng gói thuật toán để tái sử dụng', subtitle:'function · parameter · argument · return · decomposition',
    intro:'Những thuật toán em đã học giờ trở thành các mô-đun có tên. Em sẽ truyền dữ liệu cho hàm, nhận kết quả trở về và điều phối một dây chuyền nhiều giai đoạn mà không chép lại code.',
    objectives:['Định nghĩa và gọi hàm do mình viết','Phân biệt tham số với đối số','Dùng return để trả về kết quả','Phân rã nhiệm vụ lớn thành các hàm một trách nhiệm'],
    learningObjectives: {
      know: ['Định nghĩa hàm, lời gọi, tham số, đối số, `void` và `return`.'],
      understand: 'Hàm tạo một mô-đun có trách nhiệm rõ ràng, dữ liệu đầu vào và kết quả đầu ra.',
      do: ['Tách thuật toán thành hàm có tên rõ ràng.', 'Truyền đối số, nhận kết quả và phối hợp nhiều hàm.'],
    },
    certificateCode:'function-engineer', accent:'treasure', icon:'blocks', estimatedMinutes:70,
    conceptGuide:a6Guide,
    challenges:a6Challenges, exitTicket:a6Checkpoint,
  },
];
