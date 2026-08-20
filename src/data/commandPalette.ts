import type { Challenge } from '@/types/content';

export interface PaletteCommand {
  label: string;
  snippet: string;
  hint: string;
  insertKind?: 'statement' | 'expression';
}

const COMMANDS: PaletteCommand[] = [
  { label: 'moveRight();', snippet: 'moveRight();', hint: 'Game API: đưa Byte sang phải một ô' },
  { label: 'moveLeft();', snippet: 'moveLeft();', hint: 'Game API: đưa Byte sang trái một ô' },
  { label: 'moveUp();', snippet: 'moveUp();', hint: 'Game API: đưa Byte lên trên một ô' },
  { label: 'moveDown();', snippet: 'moveDown();', hint: 'Game API: đưa Byte xuống dưới một ô' },
  { label: 'turnRight();', snippet: 'turnRight();', hint: 'Game API: quay Byte 90 độ sang phải mà không di chuyển' },
  { label: 'collectGem();', snippet: 'collectGem();', hint: 'Game API: nhặt ngọc tại ô Byte đang đứng' },
  { label: 'gemsCollected()', snippet: 'gemsCollected()', hint: 'Game API: đọc số ngọc đã nhặt', insertKind: 'expression' },
  { label: 'chargeMachine(value);', snippet: 'chargeMachine(energy);', hint: 'Game API: cấp giá trị năng lượng cho máy tại ô Byte đang đứng' },
  { label: 'setSwitch(condition);', snippet: 'setSwitch(ready);', hint: 'Game API: bật công tắc bằng một giá trị bool' },
  { label: 'collectKey();', snippet: 'collectKey();', hint: 'Game API: nhặt chìa khóa tại ô Byte đang đứng' },
  { label: 'hasKey()', snippet: 'hasKey()', hint: 'Game API: cảm biến trả về true khi Byte đang có chìa khóa', insertKind: 'expression' },
  { label: 'openDoor();', snippet: 'openDoor();', hint: 'Game API: mở cánh cửa ngay trước mặt Byte' },
  { label: 'getEnergy()', snippet: 'getEnergy()', hint: 'Game API: đọc mức năng lượng hiện tại của Byte', insertKind: 'expression' },
  { label: 'turnOnLight();', snippet: 'turnOnLight();', hint: 'Game API: thắp ngọn đèn tại ô Byte đang đứng' },
  { label: 'attackBug();', snippet: 'attackBug();', hint: 'Game API: khi đứng cạnh Boss, phá một lớp giáp' },
  { label: 'getBugHp()', snippet: 'getBugHp()', hint: 'Game API: đọc số lớp giáp Bug còn lại', insertKind: 'expression' },
  { label: 'cout << "..." << endl;', snippet: 'cout << "" << endl;', hint: 'C++: xuất dữ liệu ra màn hình' },
  { label: 'cin >> value;', snippet: 'cin >> energy;', hint: 'C++: đọc dữ liệu đầu vào vào một biến' },
  { label: 'if (condition) { ... }', snippet: 'if (ready) {\n    \n}', hint: 'C++: chỉ chạy khối lệnh khi điều kiện đúng' },
  { label: 'if (...) { ... } else { ... }', snippet: 'if (ready) {\n    \n} else {\n    \n}', hint: 'C++: chọn đúng một trong hai nhánh' },
  { label: 'for (int i = 0; i < count; i++) { ... }', snippet: 'for (int i = 0; i < count; i++) {\n    \n}', hint: 'C++: lặp khối lệnh với biến đếm i' },
  { label: 'void tenHam() { ... }', snippet: 'void tenHam() {\n    \n}', hint: 'C++: định nghĩa một hàm thực hiện hành động và không trả về dữ liệu' },
  { label: 'void tenHam(int value) { ... }', snippet: 'void tenHam(int value) {\n    \n}', hint: 'C++: định nghĩa hàm có một tham số nhận dữ liệu' },
  { label: 'return value;', snippet: 'return value;', hint: 'C++: gửi một giá trị từ hàm trở về nơi gọi' },
  { label: 'void tenHam(int &value) { ... }', snippet: 'void tenHam(int &value) {\n    \n}', hint: 'C++: tham chiếu cho phép hàm cập nhật biến đối số' },
  { label: 'int values[size] = { ... };', snippet: 'int values[4] = {0, 0, 0, 0};', hint: 'C++: tạo mảng một chiều gồm các số nguyên' },
  { label: 'values[index]', snippet: 'values[i]', hint: 'C++: đọc hoặc cập nhật phần tử ở một chỉ số', insertKind: 'expression' },
  { label: 'int ten = 0;', snippet: 'int gems = 0;', hint: 'C++: tạo biến lưu số nguyên' },
  { label: 'double ten = 0.0;', snippet: 'double speed = 0.0;', hint: 'C++: tạo biến lưu số thập phân' },
  { label: 'bool ten = false;', snippet: 'bool portalOpen = false;', hint: 'C++: tạo biến đúng–sai' },
  { label: 'string ten = "";', snippet: 'string hero = "";', hint: 'C++: tạo biến lưu văn bản' },
];

/**
 * Chỉ trả về lệnh thực sự liên quan đến màn hiện tại. Editor yêu cầu học sinh
 * chủ động gõ ít nhất hai ký tự mới hiện tooltip cú pháp ngay cạnh con trỏ;
 * tooltip chỉ đọc và không có nút chèn code.
 */
export function paletteForChallenge(challenge: Challenge): PaletteCommand[] {
  const signal = [
    challenge.solution ?? '',
    challenge.starterCode,
    challenge.instructions.join('\n'),
    challenge.requiredPatterns.join('\n'),
  ].join('\n');

  return COMMANDS.filter((command) => {
    if (command.label.startsWith('cout')) return /\bcout\b/.test(signal);
    if (command.label.startsWith('cin')) return /\bcin\s*>>/.test(signal) || /stmt:cin/.test(signal);
    if (command.label.startsWith('if (...)')) return /\belse\b/.test(signal) || /stmt:if-else/.test(signal);
    if (command.label.startsWith('if (condition)')) {
      const isTwoBranch = /\belse\b/.test(signal) || /stmt:if-else/.test(signal);
      return !isTwoBranch && (/\bif\s*\(/.test(signal) || /stmt:if(?!-else)/.test(signal));
    }
    if (command.label.startsWith('for ')) return /\bfor\s*\(/.test(signal) || /stmt:for/.test(signal);
    if (command.label.startsWith('void tenHam(int &')) return /decl:ref/.test(signal) || /\bint\s*&/.test(signal);
    if (command.label.startsWith('void tenHam(int')) return /\bvoid\s+\w+\s*\(\s*int\s+/.test(signal) || /decl:func:[^:]+:params/.test(signal);
    if (command.label.startsWith('int values[size]')) return /decl:array/.test(signal) || /\bint\s+\w+\s*\[/.test(signal);
    if (command.label.startsWith('values[index]')) return /access:array/.test(signal) || /\w+\s*\[[^\]]+\]/.test(signal);
    if (command.label.startsWith('void tenHam()')) return /\bvoid\s+\w+\s*\(\s*\)/.test(signal) || /decl:func/.test(signal);
    if (command.label.startsWith('return ')) return /\breturn\s+(?!0\s*;)/.test(signal) || /stmt:return/.test(signal);
    if (command.label.startsWith('int ')) return /\bint\s+(?!main\b)[A-Za-z_]\w*\s*=/.test(signal);
    if (command.label.startsWith('double ')) return /\bdouble\s+[A-Za-z_]/.test(signal);
    if (command.label.startsWith('bool ')) return /\bbool\s+[A-Za-z_]/.test(signal);
    if (command.label.startsWith('string ')) return /\bstring\s+[A-Za-z_]/.test(signal);
    const functionName = command.label.replace(/[();].*$/, '');
    return new RegExp(`\\b${functionName}\\s*\\(`).test(signal);
  });
}
