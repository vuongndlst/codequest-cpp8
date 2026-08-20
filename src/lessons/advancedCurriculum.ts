import type { Challenge, ConceptGuide, ExitTicket, ExitTicketQuestion, Lesson, WorldSpec } from '@/types/content';
import { CLEAN_CODE_WITH_FUNCTIONS, STANDARD_CLEAN_CODE } from './shared';

type Move = 'R' | 'L' | 'U' | 'D';
type Point = [number, number];

const cpp = (body: string, functions = '') => `#include <iostream>
using namespace std;

${functions}${functions ? '\n' : ''}int main() {
${body}
    return 0;
}`;

const moveCalls = (moves: string) => moves.split('').map((move) => ({
  R: '    moveRight();', L: '    moveLeft();', U: '    moveUp();', D: '    moveDown();',
}[move as Move])).join('\n');

function routeFrom(moves: string, start: Point = [1, 1]): Point[] {
  const route: Point[] = [[...start]];
  let [col, row] = start;
  for (const move of moves) {
    if (move === 'R') col += 1;
    if (move === 'L') col -= 1;
    if (move === 'U') row -= 1;
    if (move === 'D') row += 1;
    route.push([col, row]);
  }
  return route;
}

/** Mê cung 16:9: tuyến đúng sáng; nhánh mồi có quái canh gác và không được tính là tuyến. */
function advancedWorld(id: string, moves: string, decoration: 'crystal' | 'ruin' | 'machine' | 'archive'): WorldSpec {
  const route = routeFrom(moves);
  const routeKeys = new Set(route.map(([col, row]) => `${col},${row}`));
  const grid = Array.from({ length: 9 }, () => Array.from({ length: 16 }, () => '#'));
  for (const [col, row] of route) grid[row][col] = '=';

  const decoys: Point[] = [];
  for (const [col, row] of route.slice(2, -2)) {
    for (const [dc, dr] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as Point[]) {
      const next: Point = [col + dc, row + dr];
      const key = `${next[0]},${next[1]}`;
      if (next[0] > 0 && next[0] < 15 && next[1] > 0 && next[1] < 8 && !routeKeys.has(key)) {
        decoys.push(next);
        grid[next[1]][next[0]] = '.';
        break;
      }
    }
    if (decoys.length === 2) break;
  }

  const goal = route.at(-1)!;
  const gemCells = [route[Math.max(1, Math.floor(route.length / 3))], route[Math.max(2, Math.floor(route.length * 2 / 3))]];
  const decorationType = { crystal: 'crystal', ruin: 'torch', machine: 'machine', archive: 'sign' }[decoration];
  return {
    kind: 'map', cols: 16, rows: 9,
    startCol: route[0][0], startRow: route[0][1], startFacing: 'east',
    goalCol: goal[0], goalRow: goal[1], terrain: grid.map((row) => row.join('')),
    props: [
      ...gemCells.map(([col, row], index) => ({ id: `${id}-gem-${index + 1}`, type: 'trail-gem', col, row })),
      ...decoys.map(([col, row], index) => ({ id: `${id}-guard-${index + 1}`, type: 'enemy', col, row, state: 'blocking' })),
      { id: `${id}-portal`, type: 'portal', col: goal[0], row: goal[1], state: 'active' },
      { id: `${id}-scene`, type: decorationType, col: 14, row: 7 },
    ],
    initialState: { energy: Math.max(18, moves.length + 6) },
  };
}

const hints = (question: string, structure: string, skeleton: string) => [
  { level: 1, type: 'question' as const, content: question },
  { level: 2, type: 'structure' as const, content: structure },
  { level: 3, type: 'skeleton' as const, content: skeleton },
];

const tests = (id: string, moves: string, output: string) => {
  const goal = routeFrom(moves).at(-1)!;
  return [
    { id: `${id}-output`, name: `Bảng điều khiển nhận đúng ${output}`, kind: 'output' as const, expectedOutput: output, required: true, visible: true },
    { id: `${id}-goal`, name: 'Byte tới portal mà không bị quái phát hiện', kind: 'world' as const, expectedWorld: { col: goal[0], row: goal[1], dangerHits: 0 }, required: true, visible: true },
  ];
};

const guide = (lessonId: string, question: string, painful: string, clean: string, idea: string): ConceptGuide => ({
  lessonId,
  bigQuestion: question,
  problem: { title: 'Cách cũ đã chạm giới hạn', body: 'Khi dữ liệu và thuật toán lớn hơn, một mô hình quá đơn giản sẽ tạo code lặp, khó kiểm chứng hoặc không thể biểu diễn đúng ý định.', painfulExample: painful, punchline: 'Ta cần một mô hình dữ liệu hoặc thuật toán chính xác hơn, không phải thêm lệnh ngẫu nhiên.' },
  solution: { title: idea, body: 'Ý tưởng mới được dùng để biểu diễn đúng quan hệ dữ liệu, sau đó được kiểm chứng bằng Output, từng bước chạy và trạng thái trên bản đồ.', cleanExample: clean, whatChanged: 'Code giờ thể hiện rõ dữ liệu nào được chia sẻ, cách các phần tử được tổ chức và quy luật xử lý chúng.' },
  mentalModel: { analogy: 'Hãy xem chương trình như một đội thám hiểm: mỗi kho dữ liệu có địa chỉ, mỗi thuật toán là một kế hoạch có thể lần theo từng bước.', explanation: 'Trước khi chạy, em mô phỏng trên một ví dụ nhỏ, ghi lại trạng thái sau từng lệnh rồi dùng game để kiểm chứng mô hình.' },
  thinkingSteps: [
    { question: 'Dữ liệu nào đang có và dữ liệu nào cần tạo ra?', why: 'Xác định đầu vào–đầu ra trước khi chọn cú pháp.' },
    { question: 'Thứ tự hoặc cấu trúc nào của dữ liệu là quan trọng?', why: 'Vị trí và quan hệ giữa phần tử quyết định thuật toán.' },
    { question: 'Bất biến nào phải đúng sau mỗi bước?', why: 'Bất biến giúp chứng minh thuật toán thay vì chỉ thử vài trường hợp.' },
    { question: 'Trường hợp biên nhỏ nhất và lớn nhất là gì?', why: 'Kiểm tra biên phát hiện lỗi chỉ số và lỗi lệch một sớm nhất.' },
  ],
  whenToUse: ['Khi bài toán có nhiều dữ liệu cùng loại.', 'Khi cần thay đổi dữ liệu qua hàm hoặc xử lý theo quy luật.', 'Khi cần giải thích vì sao thuật toán đúng.'],
  whenNotToUse: ['Không dùng cấu trúc phức tạp nếu một biến đơn đã đủ.', 'Không truy cập vị trí chưa chứng minh là hợp lệ.', 'Không tối ưu trước khi có lời giải đúng và có kiểm thử.'],
  misconceptions: [
    { wrong: 'Chạy đúng một lần nghĩa là thuật toán luôn đúng.', right: 'Cần kiểm thử trường hợp thường, trường hợp biên và giải thích bất biến.', why: 'Một ví dụ không đại diện cho mọi dữ liệu.' },
    { wrong: 'Code càng ngắn càng tốt.', right: 'Code tốt trước hết phải đúng, rõ và kiểm chứng được.', why: 'Một dòng khó đọc có thể che lỗi logic.' },
    { wrong: 'Debug là đổi thử cho tới khi qua.', right: 'Debug là tìm bước đầu tiên trạng thái lệch khỏi dự đoán.', why: 'Bằng chứng giúp sửa nguyên nhân thay vì triệu chứng.' },
  ],
});

const checkpoint = (lessonId: string, questions: ExitTicketQuestion[]): ExitTicket => ({
  lessonId, questions,
  reflectionPrompt: 'Em đã dùng bằng chứng nào để tin rằng thuật toán đúng, không chỉ đúng với một ví dụ?',
});

const a7Moves = ['RRRDD', 'RRDRR', 'DDRRU', 'RRDDRRUURR'];
const a7Challenges: Challenge[] = [
  {
    id:'a7-c1-value-copy', lessonId:'a7', kind:'story', title:'Bản sao năng lượng',
    story:'Phòng Gương tạo một bản sao của viên pin trước khi thử nghiệm. Byte cần chứng minh rằng thay đổi bản sao trong hàm không làm viên pin gốc đổi giá trị.',
    instructions:['Dự đoán giá trị energy sau lời gọi `addFive(energy)`.','Chạy từng bước và quan sát tham số là một bản sao cục bộ.','Đưa Byte theo tuyến sáng, không bước vào nhánh có quái canh gác.'],
    starterCode:cpp(`    int energy = 4;\n    addFive(energy);\n    cout << energy << endl;\n${moveCalls(a7Moves[0])}`, 'void addFive(int energy) {\n    energy += 5;\n}'),
    requiredPatterns:['decl:func:addFive:params=1','call:addFive','stmt:cout'], testCases:tests('a7-c1',a7Moves[0],'4'), commonMistakes:[],
    hints:hints('Biến energy trong hàm có phải đúng ô nhớ của energy trong main không?','Tham trị sao chép giá trị đối số vào một tham số cục bộ.','```cpp\nvoid addFive(int energy) { energy += ___; }\n```'),
    cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:35, world:advancedWorld('a7-c1',a7Moves[0],'crystal'),
    solution:cpp(`    int energy = 4;\n    addFive(energy);\n    cout << energy << endl;\n${moveCalls(a7Moves[0])}`, 'void addFive(int energy) {\n    energy += 5;\n}'),
    thinkingPrompt:'Sau lời gọi, em dự đoán energy trong main là 4 hay 9? Vì sao?', whyThisMatters:'Tham trị bảo vệ dữ liệu của hàm gọi khỏi thay đổi ngoài ý muốn.',
  },
  {
    id:'a7-c2-reference-charge', lessonId:'a7', kind:'mission', title:'Kênh truyền chung',
    story:'Cổng thứ hai chỉ mở khi mô-đun sạc tác động trực tiếp lên viên pin gốc. Ký hiệu tham chiếu biến hai tên thành hai cách truy cập cùng một ô nhớ.',
    instructions:['Hoàn thiện khai báo tham chiếu `int &energy`.','Tăng năng lượng từ 4 lên 9 và in kết quả.','Đi theo tuyến sáng tới portal, tránh hai nhánh báo động.'],
    starterCode:cpp(`    int energy = 4;\n    charge(energy);\n    cout << energy << endl;\n    // Viết lệnh di chuyển`, 'void charge(int energy) {\n    energy += 5;\n}'),
    requiredPatterns:['decl:ref','call:charge','stmt:cout'], testCases:tests('a7-c2',a7Moves[1],'9'), commonMistakes:[],
    hints:hints('Muốn hàm thay đổi biến gốc thì tham số phải nhận bản sao hay cùng ô nhớ?','Đặt `&` giữa kiểu và tên tham số, rồi hoàn thiện tuyến đường.','```cpp\nvoid charge(int &energy) { energy += ___; }\n// R, R, D, R, R\n```'),
    cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:45, world:advancedWorld('a7-c2',a7Moves[1],'crystal'),
    solution:cpp(`    int energy = 4;\n    charge(energy);\n    cout << energy << endl;\n${moveCalls(a7Moves[1])}`, 'void charge(int &energy) {\n    energy += 5;\n}'),
    thinkingPrompt:'Dấu & làm thay đổi quan hệ giữa tham số và đối số như thế nào?', whyThisMatters:'Tham chiếu cho phép hàm cập nhật trạng thái có chủ đích và rõ ràng.',
  },
  {
    id:'a7-c3-debug-swap', lessonId:'a7', kind:'debug', title:'Debug Lab: Hai lõi chưa đổi chỗ',
    story:'Mạch cân bằng chạy nhưng hai lõi vẫn giữ nguyên vị trí. Thuật toán hoán đổi đúng; lỗi nằm ở cách dữ liệu đi vào hàm.',
    instructions:['Chạy và đối chiếu Output hiện tại với `9 4`.','Thêm tham chiếu cho cả hai tham số của `swapEnergy`.','Giữ nguyên thuật toán ba phép gán và hoàn thiện tuyến né quái.'],
    starterCode:cpp(`    int left = 4;\n    int right = 9;\n    swapEnergy(left, right);\n    cout << left << " " << right << endl;`, 'void swapEnergy(int left, int right) {\n    int temporary = left;\n    left = right;\n    right = temporary;\n}'),
    requiredPatterns:['decl:ref','call:swapEnergy','stmt:cout'], testCases:tests('a7-c3',a7Moves[2],'9 4'), commonMistakes:[],
    hints:hints('Thuật toán đổi chỗ đang sửa biến gốc hay hai bản sao?','Cả left và right đều cần là tham chiếu.','```cpp\nvoid swapEnergy(int &left, int &right) { /* giữ 3 phép gán */ }\n// D, D, R, R, U\n```'),
    cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:55, world:advancedWorld('a7-c3',a7Moves[2],'ruin'),
    solution:cpp(`    int left = 4;\n    int right = 9;\n    swapEnergy(left, right);\n    cout << left << " " << right << endl;\n${moveCalls(a7Moves[2])}`, 'void swapEnergy(int &left, int &right) {\n    int temporary = left;\n    left = right;\n    right = temporary;\n}'),
    thinkingPrompt:'Dòng đầu tiên nào cho thấy dữ liệu sau lời gọi chưa giống dự đoán?', whyThisMatters:'Hoán đổi là thao tác nền tảng của nhiều thuật toán sắp xếp.',
  },
  {
    id:'a7-c4-mirror-boss', lessonId:'a7', kind:'boss', title:'BOSS: Người Gác Phòng Gương',
    story:'Người Gác khóa portal sau mê cung phản chiếu. Em phải sửa lõi pin bằng tham chiếu, chứng minh giá trị mới trên bảng điều khiển rồi dẫn Byte qua tuyến không báo động.',
    instructions:['Viết `boostToSafe(int &energy)` để đưa năng lượng 6 lên 10.','In đúng giá trị 10 sau lời gọi.','Đi hết tuyến sáng; không thử bước vào ô quái canh gác.'],
    starterCode:cpp('    int energy = 6;\n    // Gọi mô-đun, in kết quả và lập tuyến né quái','void boostToSafe(int &energy) {\n    // Hoàn thiện\n}'),
    requiredPatterns:['decl:ref','decl:func:boostToSafe:params=1','call:boostToSafe','stmt:cout'], testCases:tests('a7-c4',a7Moves[3],'10'), commonMistakes:[],
    hints:hints('Năng lượng cần tăng thêm bao nhiêu và biến nào phải thay đổi thật?','Hàm tham chiếu cập nhật energy; main kiểm chứng rồi mới di chuyển.','```cpp\nvoid boostToSafe(int &energy) { energy += ___; }\n// R,R,D,D,R,R,U,U,R,R\n```'),
    cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:80, world:advancedWorld('a7-c4',a7Moves[3],'ruin'),
    solution:cpp(`    int energy = 6;\n    boostToSafe(energy);\n    cout << energy << endl;\n${moveCalls(a7Moves[3])}`, 'void boostToSafe(int &energy) {\n    energy += 4;\n}'),
    thinkingPrompt:'Em sẽ dùng Output và trạng thái nào trên map làm hai bằng chứng độc lập?', whyThisMatters:'Bài tổng hợp nối ngữ nghĩa bộ nhớ với thiết kế hàm và điều khiển game.',
  },
];

const a8Moves = ['DDDRR', 'RRDDRR', 'RRRDDDR', 'RRDDRRUU'];
const a8Challenges: Challenge[] = [
  {
    id:'a8-c1-indexed-vault', lessonId:'a8', kind:'story', title:'Kho ô đánh số',
    story:'Kho Dữ Liệu Nhiều Tầng không dùng từng biến rời. Năm viên rune cùng loại nằm trong các ô liên tiếp, được đánh số từ 0.',
    instructions:['Đọc giá trị tại chỉ số 0 và 3.','Dự đoán Output trước khi chạy.','Theo tuyến sáng và quan sát hai Gem được thu tự động.'],
    starterCode:cpp(`    int runes[5] = {3, 5, 2, 8, 6};\n    cout << runes[0] << " " << runes[3] << endl;\n${moveCalls(a8Moves[0])}`),
    requiredPatterns:['decl:array:int','access:array','stmt:cout'], testCases:tests('a8-c1',a8Moves[0],'3 8'), commonMistakes:[], hints:hints('Chỉ số đầu tiên của mảng C++ là bao nhiêu?','Tên mảng và chỉ số trong `[]` xác định đúng một phần tử.','```cpp\ncout << runes[___] << " " << runes[___];\n```'),
    cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:35, world:advancedWorld('a8-c1',a8Moves[0],'archive'),
    solution:cpp(`    int runes[5] = {3, 5, 2, 8, 6};\n    cout << runes[0] << " " << runes[3] << endl;\n${moveCalls(a8Moves[0])}`), thinkingPrompt:'Mảng năm phần tử có chỉ số hợp lệ nhỏ nhất và lớn nhất là gì?', whyThisMatters:'Chỉ số là cầu nối giữa vị trí dữ liệu và thuật toán.',
  },
  {
    id:'a8-c2-repair-slot', lessonId:'a8', kind:'mission', title:'Sửa ô rune hỏng',
    story:'Cảm biến báo ô thứ hai theo cách đếm của máy đang chứa 0. Em phải sửa đúng phần tử, không thay nhầm cả mảng.',
    instructions:['Gán 7 vào phần tử có chỉ số 1.','In toàn bộ ba giá trị để kiểm chứng `4 7 9`.','Dẫn Byte qua hành lang và tránh nhánh mồi.'],
    starterCode:cpp('    int runes[3] = {4, 0, 9};\n    // Sửa đúng một ô, in ba giá trị và lập tuyến'), requiredPatterns:['decl:array:int','access:array','op:=','stmt:cout'], testCases:tests('a8-c2',a8Moves[1],'4 7 9'), commonMistakes:[], hints:hints('“Ô thứ hai” tương ứng chỉ số nào khi bắt đầu từ 0?','Gán qua `runes[index]`, sau đó in từng phần tử.','```cpp\nrunes[___] = 7;\ncout << runes[0] << " " << ___ << " " << runes[2];\n```'), cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:45, world:advancedWorld('a8-c2',a8Moves[1],'archive'), solution:cpp(`    int runes[3] = {4, 0, 9};\n    runes[1] = 7;\n    cout << runes[0] << " " << runes[1] << " " << runes[2] << endl;\n${moveCalls(a8Moves[1])}`), thinkingPrompt:'Em đang sửa vị trí theo cách đếm của người hay chỉ số của máy?', whyThisMatters:'Gán phần tử cho phép cập nhật dữ liệu có cấu trúc mà vẫn giữ nguyên các ô khác.',
  },
  {
    id:'a8-c3-debug-bound', lessonId:'a8', kind:'debug', title:'Debug Lab: Bước khỏi mép kho',
    story:'Robot kiểm kê đọc đúng bốn ô rồi cố mở một ô thứ năm không tồn tại. Hệ thống dừng để bảo vệ bộ nhớ.',
    instructions:['Liệt kê các giá trị i của vòng lặp hiện tại.','Sửa điều kiện để chỉ số chỉ chạy từ 0 tới 3.','Hoàn thiện tuyến map sau khi Output bằng 10.'],
    starterCode:cpp('    int values[4] = {1, 2, 3, 4};\n    int total = 0;\n    for (int i = 0; i <= 4; i++) {\n        total += values[i];\n    }\n    cout << total << endl;'), requiredPatterns:['decl:array:int','stmt:for','access:array'], testCases:tests('a8-c3',a8Moves[2],'10'), commonMistakes:[], hints:hints('Mảng bốn phần tử có chỉ số 4 không?','Điều kiện đúng phải loại i = 4.','```cpp\nfor (int i = 0; i < ___; i++) total += values[i];\n// R,R,R,D,D,D,R\n```'), cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:55, world:advancedWorld('a8-c3',a8Moves[2],'machine'), solution:cpp(`    int values[4] = {1, 2, 3, 4};\n    int total = 0;\n    for (int i = 0; i < 4; i++) {\n        total += values[i];\n    }\n    cout << total << endl;\n${moveCalls(a8Moves[2])}`), thinkingPrompt:'Giá trị i đầu tiên làm truy cập không hợp lệ là bao nhiêu?', whyThisMatters:'Kiểm tra biên mảng là kỹ năng an toàn bộ nhớ cốt lõi trong C++.',
  },
  {
    id:'a8-c4-route-array-boss', lessonId:'a8', kind:'boss', title:'BOSS: Mê cung Mã Hướng',
    story:'Portal chỉ hiện khi Byte đọc đúng tám mã hướng lưu trong mảng. Mỗi phần tử phải được duyệt đúng một lần; quái canh gác chờ ở mọi nhánh sai.',
    instructions:['Duyệt đủ tám phần tử route bằng vòng `for`.','Quy ước 0 = lên, 1 = phải, 2 = xuống; chọn lời gọi tương ứng.','In số bước 8 và kết thúc tại portal với dangerHits bằng 0.'],
    starterCode:cpp('    int route[8] = {1, 1, 2, 2, 1, 1, 0, 0};\n    // Duyệt mảng, chọn hướng, rồi in 8'), requiredPatterns:['decl:array:int','stmt:for','access:array','stmt:if-else'], testCases:tests('a8-c4',a8Moves[3],'8'), commonMistakes:[], hints:hints('Mỗi mã hướng cần được đọc ở chỉ số nào của lượt i?','Trong vòng for, dùng if–else if để đổi mã thành hành động.','```cpp\nfor (int i = 0; i < ___; i++) {\n  if (route[i] == 0) ___;\n  else if (route[i] == 1) ___;\n  else ___;\n}\n```'), cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:85, world:advancedWorld('a8-c4',a8Moves[3],'machine'),
    solution:cpp('    int route[8] = {1, 1, 2, 2, 1, 1, 0, 0};\n    for (int i = 0; i < 8; i++) {\n        if (route[i] == 0) moveUp();\n        else if (route[i] == 1) moveRight();\n        else moveDown();\n    }\n    cout << 8 << endl;'), thinkingPrompt:'Trước khi chạy, em đổi dãy số thành chuỗi R/R/D/D/R/R/U/U ra sao?', whyThisMatters:'Mảng và vòng lặp cho phép dữ liệu điều khiển hành vi game thay vì viết cứng từng tuyến.',
  },
];

const a9Moves = ['RRRDD', 'DDRRRR', 'RRRDDDRR', 'RRDDRRUURRR'];
const a9Challenges: Challenge[] = [
  {
    id:'a9-c1-aggregate', lessonId:'a9', kind:'story', title:'Tổng năng lượng đoàn tàu', story:'Bốn toa năng lượng phải được cộng bằng một thuật toán duyệt chung, không phải bốn biểu thức viết tay riêng lẻ.', instructions:['Theo dõi total sau mỗi lượt.','Xác nhận hàm trả về 14.','Đưa Byte tới trạm cuối mà không chạm lính gác.'], starterCode:cpp(`    int cells[4] = {2, 5, 3, 4};\n    cout << sumEnergy(cells, 4) << endl;\n${moveCalls(a9Moves[0])}`, 'int sumEnergy(int values[], int size) {\n    int total = 0;\n    for (int i = 0; i < size; i++) total += values[i];\n    return total;\n}'), requiredPatterns:['decl:array:int','stmt:for','access:array','stmt:return'], testCases:tests('a9-c1',a9Moves[0],'14'), commonMistakes:[], hints:hints('total cần bắt đầu ở giá trị trung hòa nào của phép cộng?','Duyệt từ 0 đến size - 1 và tích lũy từng phần tử.','```cpp\nint total = ___;\nfor (...) total += values[___];\n```'), cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:40, world:advancedWorld('a9-c1',a9Moves[0],'crystal'), solution:cpp(`    int cells[4] = {2, 5, 3, 4};\n    cout << sumEnergy(cells, 4) << endl;\n${moveCalls(a9Moves[0])}`, 'int sumEnergy(int values[], int size) {\n    int total = 0;\n    for (int i = 0; i < size; i++) total += values[i];\n    return total;\n}'), thinkingPrompt:'Bất biến của total sau i lượt là gì?', whyThisMatters:'Tích lũy là mẫu thuật toán nền tảng trong xử lý dữ liệu.',
  },
  {
    id:'a9-c2-maximum', lessonId:'a9', kind:'mission', title:'Tìm lõi mạnh nhất', story:'Cửa chống nhiễu chỉ chấp nhận mức năng lượng lớn nhất trong dãy. Em phải quét từng phần tử và giữ ứng viên tốt nhất đã thấy.', instructions:['Khởi tạo strongest từ phần tử đầu tiên.','So sánh từng phần tử còn lại và cập nhật khi lớn hơn.','In 9 rồi hoàn thiện tuyến sáng.'], starterCode:cpp('    int cells[5] = {4, 9, 3, 7, 6};\n    // Tìm max, in kết quả và di chuyển'), requiredPatterns:['decl:array:int','stmt:for','stmt:if','access:array'], testCases:tests('a9-c2',a9Moves[1],'9'), commonMistakes:[], hints:hints('Ứng viên ban đầu nào chắc chắn thuộc mảng?','Bắt đầu strongest = cells[0], rồi duyệt từ chỉ số 1.','```cpp\nint strongest = cells[0];\nfor (int i = ___; i < 5; i++) if (cells[i] > strongest) ___;\n```'), cleanCodeRules:STANDARD_CLEAN_CODE, xpReward:50, world:advancedWorld('a9-c2',a9Moves[1],'crystal'), solution:cpp(`    int cells[5] = {4, 9, 3, 7, 6};\n    int strongest = cells[0];\n    for (int i = 1; i < 5; i++) {\n        if (cells[i] > strongest) strongest = cells[i];\n    }\n    cout << strongest << endl;\n${moveCalls(a9Moves[1])}`), thinkingPrompt:'Sau mỗi lượt, strongest đại diện cho phần nào của mảng?', whyThisMatters:'Giữ ứng viên tốt nhất là tư duy dùng trong tối ưu và tìm kiếm.',
  },
  {
    id:'a9-c3-debug-search', lessonId:'a9', kind:'debug', title:'Debug Lab: Máy quét quá giới hạn', story:'Máy quét tìm mã 7 nhưng tiếp tục đọc sau ô cuối. Em cần sửa biên mà không đổi ý tưởng tìm kiếm tuyến tính.', instructions:['Xác định chỉ số hợp lệ cuối của mảng năm phần tử.','Sửa đúng điều kiện vòng lặp.','Giữ `return i` khi tìm thấy và hoàn thiện đường map.'], starterCode:cpp('    int codes[5] = {8, 2, 5, 7, 1};\n    cout << findFirst(codes, 5, 7) << endl;', 'int findFirst(int values[], int size, int target) {\n    for (int i = 0; i <= size; i++) {\n        if (values[i] == target) return i;\n    }\n    return -1;\n}'), requiredPatterns:['stmt:for','stmt:if','access:array','stmt:return'], testCases:tests('a9-c3',a9Moves[2],'3'), commonMistakes:[], hints:hints('Khi i bằng size, đó còn là một ô hợp lệ không?','Chỉ duyệt khi i nhỏ hơn size.','```cpp\nfor (int i = 0; i ___ size; i++) {\n  if (values[i] == target) return i;\n}\n// R,R,R,D,D,D,R,R\n```'), cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:60, world:advancedWorld('a9-c3',a9Moves[2],'archive'), solution:cpp(`    int codes[5] = {8, 2, 5, 7, 1};\n    cout << findFirst(codes, 5, 7) << endl;\n${moveCalls(a9Moves[2])}`, 'int findFirst(int values[], int size, int target) {\n    for (int i = 0; i < size; i++) {\n        if (values[i] == target) return i;\n    }\n    return -1;\n}'), thinkingPrompt:'Thuật toán dừng sớm ở chỉ số nào, và vì sao không cần đọc phần còn lại?', whyThisMatters:'Tìm kiếm tuyến tính là mốc đầu để phân tích số phép so sánh.',
  },
  {
    id:'a9-c4-scout-boss', lessonId:'a9', kind:'boss', title:'BOSS: Mắt Quét Hư Không', story:'Mắt Quét giấu mã portal trong một dãy nhiễu. Em phải viết hàm tìm kiếm tổng quát, báo đúng chỉ số rồi dùng tuyến sáng tiếp cận lõi mà không kích hoạt lính gác.', instructions:['Viết `findFirst` nhận mảng, size và target.','Trả về chỉ số đầu tiên hoặc -1 nếu không thấy; dữ liệu này phải cho 3.','Sau khi kiểm chứng Output, dẫn Byte qua toàn tuyến.'], starterCode:cpp('    int codes[6] = {4, 1, 8, 6, 9, 2};\n    // Gọi hàm tìm 6, in chỉ số và di chuyển','int findFirst(int values[], int size, int target) {\n    // Hoàn thiện\n}'), requiredPatterns:['decl:func:findFirst:params=3','stmt:for','stmt:if','access:array','stmt:return'], testCases:tests('a9-c4',a9Moves[3],'3'), commonMistakes:[], hints:hints('Ở mỗi lượt chỉ cần hỏi phần tử hiện tại có bằng target không?','Duyệt từ trái sang phải; return ngay khi bằng, sau vòng lặp return -1.','```cpp\nfor (int i = 0; i < ___; i++) {\n  if (values[i] == ___) return i;\n}\nreturn ___;\n```'), cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:90, world:advancedWorld('a9-c4',a9Moves[3],'archive'), solution:cpp(`    int codes[6] = {4, 1, 8, 6, 9, 2};\n    cout << findFirst(codes, 6, 6) << endl;\n${moveCalls(a9Moves[3])}`, 'int findFirst(int values[], int size, int target) {\n    for (int i = 0; i < size; i++) {\n        if (values[i] == target) return i;\n    }\n    return -1;\n}'), thinkingPrompt:'Trường hợp xấu nhất cần bao nhiêu phép so sánh với mảng sáu phần tử?', whyThisMatters:'Bài Boss nối tính đúng đắn, dừng sớm và chi phí tuyến tính O(n).',
  },
];

const a10Moves = ['RRDRR', 'DDDRRR', 'RRRDDDRRR', 'RRDDRRUURRRR'];
const a10Challenges: Challenge[] = [
  {
    id:'a10-c1-bubble-pass', lessonId:'a10', kind:'story', title:'Một lượt đẩy nổi', story:'Ba khối dữ liệu nằm sai thứ tự. Một lượt so sánh các cặp kề nhau sẽ đẩy giá trị lớn nhất về cuối dãy.', instructions:['Mô phỏng hai lần so sánh trên giấy.','Quan sát thao tác swap dùng tham chiếu.','Xác nhận Output `2 4 7` rồi đi tới portal.'], starterCode:cpp(`    int values[3] = {7, 2, 4};\n    for (int i = 0; i < 2; i++) {\n        if (values[i] > values[i + 1]) swapValue(values[i], values[i + 1]);\n    }\n    cout << values[0] << " " << values[1] << " " << values[2] << endl;\n${moveCalls(a10Moves[0])}`, 'void swapValue(int &left, int &right) {\n    int temporary = left; left = right; right = temporary;\n}'), requiredPatterns:['decl:ref','decl:array:int','stmt:for','stmt:if','access:array'], testCases:tests('a10-c1',a10Moves[0],'2 4 7'), commonMistakes:[], hints:hints('Sau một lượt, phần tử lớn nhất chắc chắn ở đâu?','So sánh cặp i và i+1; nếu trái lớn hơn phải thì hoán đổi.','```cpp\nif (values[i] > values[i + 1]) swapValue(___, ___);\n```'), cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:45, world:advancedWorld('a10-c1',a10Moves[0],'machine'), solution:cpp(`    int values[3] = {7, 2, 4};\n    for (int i = 0; i < 2; i++) {\n        if (values[i] > values[i + 1]) swapValue(values[i], values[i + 1]);\n    }\n    cout << values[0] << " " << values[1] << " " << values[2] << endl;\n${moveCalls(a10Moves[0])}`, 'void swapValue(int &left, int &right) {\n    int temporary = left;\n    left = right;\n    right = temporary;\n}'), thinkingPrompt:'Bất biến sau một lượt từ trái sang phải là gì?', whyThisMatters:'Một lượt bubble cho thấy cách bất biến giúp giải thích thuật toán.',
  },
  {
    id:'a10-c2-select-min', lessonId:'a10', kind:'mission', title:'Chọn rune nhỏ nhất', story:'Bệ sắp xếp cần tìm phần tử nhỏ nhất của đoạn chưa xử lý rồi đưa nó về đầu đoạn. Đây là ý tưởng cốt lõi của selection sort.', instructions:['Tìm chỉ số minIndex trong mảng.','Hoán đổi phần tử nhỏ nhất với vị trí 0.','In `1 8 6 3` và hoàn thiện tuyến.'], starterCode:cpp('    int values[4] = {8, 1, 6, 3};\n    // Tìm minIndex, đổi với values[0], in và di chuyển','void swapValue(int &left, int &right) {\n    int temporary = left; left = right; right = temporary;\n}'), requiredPatterns:['decl:array:int','stmt:for','stmt:if','decl:ref','access:array'], testCases:tests('a10-c2',a10Moves[1],'1 8 6 3'), commonMistakes:[], hints:hints('Em cần lưu giá trị nhỏ nhất hay chỉ số của nó để còn hoán đổi?','Khởi tạo minIndex = 0, duyệt từ 1 rồi swap với vị trí 0.','```cpp\nint minIndex = 0;\nfor (int i = 1; i < 4; i++) if (values[i] < values[minIndex]) ___;\nswapValue(values[0], values[___]);\n```'), cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:55, world:advancedWorld('a10-c2',a10Moves[1],'machine'), solution:cpp(`    int values[4] = {8, 1, 6, 3};\n    int minIndex = 0;\n    for (int i = 1; i < 4; i++) {\n        if (values[i] < values[minIndex]) minIndex = i;\n    }\n    swapValue(values[0], values[minIndex]);\n    cout << values[0] << " " << values[1] << " " << values[2] << " " << values[3] << endl;\n${moveCalls(a10Moves[1])}`, 'void swapValue(int &left, int &right) {\n    int temporary = left;\n    left = right;\n    right = temporary;\n}'), thinkingPrompt:'Vì sao lưu minIndex hữu ích hơn chỉ lưu giá trị nhỏ nhất?', whyThisMatters:'Theo dõi chỉ số kết nối tìm kiếm với thao tác thay đổi cấu trúc dữ liệu.',
  },
  {
    id:'a10-c3-debug-inner-bound', lessonId:'a10', kind:'debug', title:'Debug Lab: Cặp cuối không tồn tại', story:'Thuật toán bubble sort chạy tới j = size - 1 rồi cố so sánh với values[size]. Hệ thống phát hiện truy cập vượt biên trước khi dữ liệu hỏng.', instructions:['Xác định giới hạn để `j + 1` luôn hợp lệ.','Sửa vòng trong và giữ nguyên vòng ngoài.','In dãy `1 2 4 5` rồi vượt mê cung.'], starterCode:cpp('    int values[4] = {5, 1, 4, 2};\n    for (int pass = 0; pass < 3; pass++) {\n        for (int j = 0; j < 4; j++) {\n            if (values[j] > values[j + 1]) swapValue(values[j], values[j + 1]);\n        }\n    }','void swapValue(int &left, int &right) {\n    int temporary = left; left = right; right = temporary;\n}'), requiredPatterns:['stmt:for:count>=2','stmt:if','decl:ref','access:array'], testCases:tests('a10-c3',a10Moves[2],'1 2 4 5'), commonMistakes:[], hints:hints('Nếu đọc values[j + 1], j lớn nhất được phép là bao nhiêu?','Vòng trong dừng trước size - 1 - pass.','```cpp\nfor (int j = 0; j < size - 1 - ___; j++) {\n  if (...) swapValue(...);\n}\n```'), cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:65, world:advancedWorld('a10-c3',a10Moves[2],'ruin'), solution:cpp(`    int values[4] = {5, 1, 4, 2};\n    for (int pass = 0; pass < 3; pass++) {\n        for (int j = 0; j < 3 - pass; j++) {\n            if (values[j] > values[j + 1]) swapValue(values[j], values[j + 1]);\n        }\n    }\n    cout << values[0] << " " << values[1] << " " << values[2] << " " << values[3] << endl;\n${moveCalls(a10Moves[2])}`, 'void swapValue(int &left, int &right) {\n    int temporary = left;\n    left = right;\n    right = temporary;\n}'), thinkingPrompt:'Tại sao sau mỗi pass vòng trong có thể ngắn đi một phần tử?', whyThisMatters:'Giới hạn vòng lặp vừa bảo vệ bộ nhớ vừa thể hiện bất biến của thuật toán.',
  },
  {
    id:'a10-c4-algorithm-core', lessonId:'a10', kind:'boss', title:'BOSS: Lõi Thuật Toán', story:'Lõi trung tâm chỉ nhận năm rune theo thứ tự tăng dần. Em phải hoàn thiện bubble sort, chứng minh dãy kết quả rồi dẫn Byte qua vành đai quái canh gác cuối cùng.', instructions:['Viết `bubbleSort(int values[], int size)` bằng hai vòng lặp.','Chỉ hoán đổi khi cặp kề sai thứ tự; in `1 3 6 8 9`.','Vượt tuyến portal với dangerHits bằng 0.'], starterCode:cpp('    int values[5] = {9, 3, 8, 1, 6};\n    // Gọi sort, in đủ năm phần tử và di chuyển','void swapValue(int &left, int &right) {\n    int temporary = left; left = right; right = temporary;\n}\n\nvoid bubbleSort(int values[], int size) {\n    // Hoàn thiện\n}'), requiredPatterns:['decl:func:bubbleSort:params=2','stmt:for:count>=2','stmt:if','decl:ref','access:array'], testCases:tests('a10-c4',a10Moves[3],'1 3 6 8 9'), commonMistakes:[], hints:hints('Sau pass đầu, phần tử lớn nhất đã cố định ở vị trí nào?','Dùng pass ở vòng ngoài và j ở vòng trong; so sánh values[j] với values[j+1].','```cpp\nfor (int pass = 0; pass < size - 1; pass++) {\n  for (int j = 0; j < size - 1 - ___; j++) {\n    if (values[j] > values[j + 1]) ___;\n  }\n}\n```'), cleanCodeRules:CLEAN_CODE_WITH_FUNCTIONS, xpReward:100, world:advancedWorld('a10-c4',a10Moves[3],'ruin'), solution:cpp(`    int values[5] = {9, 3, 8, 1, 6};\n    bubbleSort(values, 5);\n    for (int i = 0; i < 5; i++) {\n        cout << values[i];\n        if (i < 4) cout << " ";\n    }\n    cout << endl;\n${moveCalls(a10Moves[3])}`, 'void swapValue(int &left, int &right) {\n    int temporary = left;\n    left = right;\n    right = temporary;\n}\n\nvoid bubbleSort(int values[], int size) {\n    for (int pass = 0; pass < size - 1; pass++) {\n        for (int j = 0; j < size - 1 - pass; j++) {\n            if (values[j] > values[j + 1]) swapValue(values[j], values[j + 1]);\n        }\n    }\n}'), thinkingPrompt:'Em sẽ giải thích tính đúng của bubble sort bằng bất biến nào sau mỗi pass?', whyThisMatters:'Boss cuối đặt tính đúng, an toàn chỉ số và phân tích O(n²) vào cùng một thuật toán hoàn chỉnh.',
  },
];

function nineQuestions(lessonId: string, topic: 'reference' | 'array' | 'search' | 'sort'): ExitTicketQuestion[] {
  const banks = {
    reference: {
      knowledge:['Tham trị và tham chiếu khác nhau ở điểm cốt lõi nào?',['Tham trị sao chép; tham chiếu dùng chung ô nhớ','Cả hai luôn dùng chung ô nhớ','Tham chiếu không có kiểu','Tham trị luôn nhanh hơn'],0],
      code:['Code in gì?','int x = 3;\nvoid add(int &v) { v += 2; }\nadd(x); cout << x;',['3','5','2','Lỗi'],1],
      fill:['Điền ký hiệu để hàm có thể thay đổi biến gốc: `void charge(int ___energy)`',[],0],
      answer:'&', debug:'Hàm swap chạy nhưng biến gốc không đổi. Cần kiểm tra gì?', debugOptions:['Hai tham số có dấu & chưa','Có dùng cout không','Tên main có dài không','Có đủ comment không'], debugIndex:0,
    },
    array: {
      knowledge:['Mảng `int a[5]` có các chỉ số hợp lệ nào?',['0 đến 4','1 đến 5','0 đến 5','1 đến 4'],0],
      code:['Code in gì?','int a[3] = {4, 7, 2};\ncout << a[1];',['4','7','2','1'],1],
      fill:['Điền chỉ số phần tử cuối của `int a[6]`: `a[___]`',[],0],
      answer:'5', debug:'Vòng `i <= size` dùng để duyệt mảng có lỗi gì?', debugOptions:['Có thể đọc a[size] ngoài biên','Thiếu cout','Không tăng i','Không có kiểu dữ liệu'], debugIndex:0,
    },
    search: {
      knowledge:['Tìm kiếm tuyến tính kiểm tra dữ liệu theo cách nào?',['Lần lượt từng phần tử','Luôn bắt đầu ở giữa','Sắp xếp ngẫu nhiên','Chỉ kiểm tra phần tử cuối'],0],
      code:['Hàm trả gì khi target ở vị trí đầu?','for (int i=0;i<size;i++) if(a[i]==target) return i;',['0','1','-1','size'],0],
      fill:['Giá trị quy ước thường dùng khi không tìm thấy chỉ số: `return ___;`',[],0],
      answer:'-1', debug:'Tìm kiếm đọc quá cuối mảng. Sửa giới hạn nào?', debugOptions:['Dùng i < size','Dùng i <= size','Bỏ i++','Bắt đầu i = size'], debugIndex:0,
    },
    sort: {
      knowledge:['Sau một pass bubble từ trái sang phải, điều gì chắc chắn đúng?',['Phần tử lớn nhất đoạn đã nổi về cuối','Toàn bộ dãy luôn đã sắp xếp','Phần tử nhỏ nhất ở cuối','Không có phần tử nào đổi chỗ'],0],
      code:['Sau đoạn này a là gì?','int a[3]={3,1,2};\nif(a[0]>a[1]) swapValue(a[0],a[1]);',['1,3,2','3,1,2','1,2,3','3,2,1'],0],
      fill:['Với mảng size phần tử, số pass tối đa của bubble sort là `size - ___`.',[],0],
      answer:'1', debug:'Vì sao vòng trong phải bảo đảm j + 1 < size?', debugOptions:['Để không truy cập ngoài biên','Để cout chạy','Để tạo mảng mới','Để bỏ mọi phép so sánh'], debugIndex:0,
    },
  } as const;
  const bank = banks[topic];
  return [
    { id:`${lessonId}-q1`, type:'knowledge', prompt:bank.knowledge[0], options:[...bank.knowledge[1]], correctIndex:bank.knowledge[2], explanation:'Khái niệm này quyết định cách dữ liệu được lưu và xử lý.' },
    { id:`${lessonId}-q2`, type:'code-prediction', prompt:bank.code[0], code:bank.code[1], options:[...bank.code[2]], correctIndex:bank.code[3], explanation:'Mô phỏng từng dòng cho kết quả chính xác.' },
    { id:`${lessonId}-q3`, type:'multiple-answer', prompt:'Chọn các thói quen kiểm thử đúng.', options:['Dự đoán trước khi chạy','Kiểm tra trường hợp biên','Chỉ thử đúng một dữ liệu','Theo dõi trạng thái từng bước'], correctIndices:[0,1,3], explanation:'Dự đoán, biên và bằng chứng từng bước giúp tìm lỗi có hệ thống.' },
    { id:`${lessonId}-q4`, type:'ordering', prompt:'Sắp xếp quy trình giải một bài mảng.', options:['Chạy và đối chiếu','Xác định dữ liệu và chỉ số','Mô phỏng ví dụ nhỏ'], correctOrder:['Xác định dữ liệu và chỉ số','Mô phỏng ví dụ nhỏ','Chạy và đối chiếu'], explanation:'Mô hình đúng được tạo trước khi dùng máy kiểm chứng.' },
    { id:`${lessonId}-q5`, type:'matching', prompt:'Ghép thuật ngữ với vai trò.', options:['Vị trí phần tử','Dữ liệu đưa vào hàm','Điều luôn đúng sau mỗi bước'], matches:[{left:'index',right:'Vị trí phần tử'},{left:'argument',right:'Dữ liệu đưa vào hàm'},{left:'invariant',right:'Điều luôn đúng sau mỗi bước'}], explanation:'Thuật ngữ chính xác giúp diễn đạt và chứng minh thuật toán.' },
    { id:`${lessonId}-q6`, type:'debugging', prompt:bank.debug, options:[...bank.debugOptions], correctIndex:bank.debugIndex, explanation:'Kiểm tra bước đầu tiên có thể tạo trạng thái không hợp lệ.' },
    { id:`${lessonId}-q7`, type:'fill-code', prompt:bank.fill[0], options:[], acceptedAnswers:[bank.answer], explanation:'Đáp án hoàn thiện đúng cú pháp và ý nghĩa.' },
    { id:`${lessonId}-q8`, type:'scenario', prompt:'Chương trình đúng với dữ liệu mẫu. Việc tiếp theo có giá trị nhất là gì?', options:['Thử trường hợp rỗng/nhỏ nhất và biên lớn','Kết luận luôn đúng','Xóa kiểm thử','Làm code ngắn bằng mọi giá'], correctIndex:0, explanation:'Trường hợp biên kiểm tra các giả định dễ bị bỏ sót.' },
    { id:`${lessonId}-q9`, type:'self-assess', prompt:'Khi giải thuật toán mới, em đã có thể giải thích trạng thái sau từng bước chưa?', options:['Có, bằng bảng hoặc sơ đồ','Có phần lớn','Cần luyện thêm','Em sẽ bắt đầu từ ví dụ nhỏ'], explanation:'Tự đánh giá giúp chọn đúng chiến lược luyện tập tiếp theo.' },
  ];
}

export const ADVANCED_LESSONS: Lesson[] = [
  {
    id:'a7', order:7, zoneName:'Phòng Gương Bộ Nhớ', title:'Kiểm soát dữ liệu qua lời gọi hàm', subtitle:'pass-by-value · reference · mutation · swap',
    intro:'Khu chuyên sâu đầu tiên mở mô hình bộ nhớ của hàm. Em phân biệt bản sao với cùng ô nhớ, sửa dữ liệu có chủ đích và dùng hoán đổi để chuẩn bị cho thuật toán sắp xếp.',
    objectives:['Phân biệt tham trị và tham chiếu','Dùng tham chiếu để cập nhật biến có chủ đích','Giải thích hoán đổi bằng trạng thái bộ nhớ'],
    learningObjectives:{ know:['Cú pháp tham số tham trị và `&` tham chiếu.'], understand:'Cách truyền tham số quyết định hàm thao tác trên bản sao hay đúng ô nhớ của biến ở nơi gọi.', do:['Dự đoán giá trị trước và sau lời gọi hàm.', 'Viết, kiểm thử hàm tham chiếu và thuật toán hoán đổi.'] },
    certificateCode:'reference-navigator', accent:'mage', icon:'split', estimatedMinutes:75,
    conceptGuide:guide('a7','Khi nào hàm nên nhận bản sao, khi nào cần thay đổi đúng biến của nơi gọi?','void charge(int energy) { energy += 5; } // biến gốc không đổi','void charge(int &energy) { energy += 5; }','Tham chiếu tạo liên kết có chủ đích'), challenges:a7Challenges, exitTicket:checkpoint('a7',nineQuestions('a7','reference')),
  },
  {
    id:'a8', order:8, zoneName:'Mê Cung Chỉ Số', title:'Tổ chức dữ liệu bằng mảng một chiều', subtitle:'array · index · bounds · traversal',
    intro:'Nhiều rune cùng loại được đặt trong một dãy có thứ tự. Em dùng chỉ số để đọc, cập nhật và biến cả dãy thành bản đồ hành động.',
    objectives:['Khai báo và khởi tạo mảng một chiều','Đọc và gán phần tử theo chỉ số','Duyệt mảng an toàn không vượt biên'],
    learningObjectives:{ know:['Cú pháp mảng, chỉ số bắt đầu từ 0 và miền chỉ số hợp lệ.'], understand:'Mảng lưu nhiều giá trị cùng kiểu theo vị trí liên tiếp; chỉ số hợp lệ là điều kiện an toàn bắt buộc.', do:['Khai báo, khởi tạo, đọc và cập nhật mảng.', 'Duyệt mảng bằng vòng lặp và sửa lỗi vượt biên.'] },
    certificateCode:'array-cartographer', accent:'quest', icon:'grid-3x3', estimatedMinutes:80,
    conceptGuide:guide('a8','Làm sao quản lý nhiều giá trị cùng loại mà không tạo hàng chục biến rời?','int rune1, rune2, rune3, rune4;','int runes[4] = {2, 4, 6, 8};','Mảng tổ chức dữ liệu theo chỉ số'), challenges:a8Challenges, exitTicket:checkpoint('a8',nineQuestions('a8','array')),
  },
  {
    id:'a9', order:9, zoneName:'Đài Quan Sát Dữ Liệu', title:'Tìm quy luật trong một dãy', subtitle:'traversal · aggregation · max · linear search · O(n)',
    intro:'Mảng trở thành nguồn dữ liệu cho thuật toán. Em cộng dồn, giữ ứng viên tốt nhất và tìm kiếm tuyến tính với bất biến rõ ràng.',
    objectives:['Tích lũy tổng khi duyệt mảng','Tìm giá trị lớn nhất','Viết tìm kiếm tuyến tính và giải thích O(n)'],
    learningObjectives:{ know:['Mẫu tích lũy, tìm cực trị, tìm kiếm tuyến tính và ký hiệu O(n) ở mức trực quan.'], understand:'Một vòng duyệt có thể rút ra thông tin từ cả dãy nếu trạng thái tích lũy giữ đúng bất biến sau mỗi lượt.', do:['Viết hàm nhận mảng và kích thước.', 'Mô phỏng, kiểm thử và giải thích số phép so sánh của tìm kiếm tuyến tính.'] },
    certificateCode:'search-strategist', accent:'verdant', icon:'scan-search', estimatedMinutes:85,
    conceptGuide:guide('a9','Làm sao rút ra tổng, cực trị hoặc vị trí mục tiêu từ cả một dãy dữ liệu?','cout << a[0] + a[1] + a[2] + a[3];','for (int i = 0; i < size; i++) total += a[i];','Duyệt mảng duy trì một bất biến'), challenges:a9Challenges, exitTicket:checkpoint('a9',nineQuestions('a9','search')),
  },
  {
    id:'a10', order:10, zoneName:'Thành Trì Thuật Toán', title:'Sắp xếp và đánh giá thuật toán', subtitle:'swap · bubble sort · selection idea · invariant · O(n²)',
    intro:'Khu Boss nâng cao yêu cầu biến một dãy hỗn độn thành thứ tự có thể kiểm chứng. Em dùng tham chiếu, mảng và vòng lặp lồng nhau trong một thuật toán hoàn chỉnh.',
    objectives:['Giải thích hoán đổi cặp phần tử','Viết và debug bubble sort','Dùng bất biến và O(n²) để đánh giá thuật toán'],
    learningObjectives:{ know:['Hoán đổi, bubble sort, ý tưởng selection sort, bất biến và chi phí bậc hai.'], understand:'Thuật toán sắp xếp đúng vì mỗi lượt cố định thêm một phần đã có thứ tự; vòng lặp lồng nhau tạo chi phí O(n²).', do:['Mô phỏng và cài đặt sắp xếp trên mảng.', 'Giải thích tính đúng, biên chỉ số và chi phí của thuật toán.'] },
    certificateCode:'algorithm-architect', accent:'alert', icon:'binary', estimatedMinutes:90,
    conceptGuide:guide('a10','Làm sao chứng minh một dãy đã được sắp xếp và ước lượng công sức thuật toán cần?','if (a[0] > a[1]) { /* mới sửa được một cặp */ }','for (int pass = 0; pass < size - 1; pass++) { /* đẩy phần tử lớn nhất */ }','Bất biến giải thích tính đúng của sắp xếp'), challenges:a10Challenges, exitTicket:checkpoint('a10',nineQuestions('a10','sort')),
  },
];
