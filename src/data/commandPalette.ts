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
  { label: 'collectGem();', snippet: 'collectGem();', hint: 'Game API: nhặt ngọc tại ô Byte đang đứng' },
  { label: 'gemsCollected()', snippet: 'gemsCollected()', hint: 'Game API: đọc số ngọc đã nhặt', insertKind: 'expression' },
  { label: 'cout << "..." << endl;', snippet: 'cout << "" << endl;', hint: 'C++: xuất dữ liệu ra màn hình' },
  { label: 'int ten = 0;', snippet: 'int gems = 0;', hint: 'C++: tạo biến lưu số nguyên' },
  { label: 'double ten = 0.0;', snippet: 'double speed = 0.0;', hint: 'C++: tạo biến lưu số thập phân' },
  { label: 'bool ten = false;', snippet: 'bool portalOpen = false;', hint: 'C++: tạo biến đúng–sai' },
  { label: 'string ten = "";', snippet: 'string hero = "";', hint: 'C++: tạo biến lưu văn bản' },
];

/**
 * Chỉ trả về lệnh thực sự liên quan đến màn hiện tại. CommandPalette còn yêu cầu
 * học sinh chủ động gõ ít nhất hai ký tự mới hiện nhắc cú pháp; không nút nào chèn code.
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
    if (command.label.startsWith('int ')) return /\bint\s+(?!main\b)[A-Za-z_]\w*\s*=/.test(signal);
    if (command.label.startsWith('double ')) return /\bdouble\s+[A-Za-z_]/.test(signal);
    if (command.label.startsWith('bool ')) return /\bbool\s+[A-Za-z_]/.test(signal);
    if (command.label.startsWith('string ')) return /\bstring\s+[A-Za-z_]/.test(signal);
    const functionName = command.label.replace(/[();].*$/, '');
    return new RegExp(`\\b${functionName}\\s*\\(`).test(signal);
  });
}
