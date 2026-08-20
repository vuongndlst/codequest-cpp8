import { LESSONS } from '@/lessons';
import { paletteForChallenge, type PaletteCommand } from '@/data/commandPalette';
import type { Challenge, Hint, Lesson } from '@/types/content';

export interface ApiIntroduction {
  signature: string;
  description: string;
  insertKind: 'statement' | 'expression';
}

function isGameApi(command: PaletteCommand) {
  return command.hint.startsWith('Game API:');
}

function commandDescription(command: PaletteCommand) {
  return command.hint.replace(/^(?:Game API|C\+\+):\s*/, '').trim();
}

function apiKey(command: PaletteCommand) {
  return command.label.match(/^([A-Za-z_]\w*)/)?.[1] ?? command.label;
}

export function gameApiForChallenge(challenge: Challenge): PaletteCommand[] {
  return paletteForChallenge(challenge).filter(isGameApi);
}

/**
 * Chỉ giới thiệu một Game API ở lần đầu nó xuất hiện trong tiến trình chính.
 * Học sinh vì thế không phải đóng lại cùng một popup ở mọi màn, nhưng một API mới
 * sẽ không bao giờ xuất hiện âm thầm trong starter code hoặc yêu cầu.
 */
export function newGameApiForChallenge(
  challenge: Challenge,
  lessons: Lesson[] = LESSONS,
): ApiIntroduction[] {
  const seen = new Set<string>();
  let reachedCurrent = false;

  for (const lesson of [...lessons].sort((a, b) => a.order - b.order)) {
    for (const candidate of lesson.challenges) {
      if (candidate.id === challenge.id && candidate.lessonId === challenge.lessonId) {
        reachedCurrent = true;
        break;
      }
      for (const command of gameApiForChallenge(candidate)) seen.add(apiKey(command));
    }
    if (reachedCurrent) break;
  }

  return gameApiForChallenge(challenge)
    .filter((command) => !seen.has(apiKey(command)))
    .map((command) => ({
      signature: command.label,
      description: commandDescription(command),
      insertKind: command.insertKind ?? 'statement',
    }));
}

/**
 * Thêm một nấc "Nên dùng lệnh nào?" trước khung code. Nội dung lấy từ đúng
 * challenge hiện tại và vẫn chỉ để đọc: học sinh phải tự gõ trong editor.
 */
export function guidedHintsForChallenge(challenge: Challenge): Hint[] {
  const commands = paletteForChallenge(challenge);
  if (commands.length === 0 || challenge.hints.some((hint) => hint.type === 'command')) {
    return challenge.hints;
  }

  const authored = [...challenge.hints].sort((a, b) => a.level - b.level);
  const skeletonIndex = authored.findIndex((hint) => hint.type === 'skeleton');
  const insertAt = skeletonIndex >= 0 ? skeletonIndex : authored.length;
  const commandHint: Hint = {
    level: insertAt + 1,
    type: 'command',
    content: 'Đối chiếu nhiệm vụ với các lệnh dưới đây. Em chọn lệnh phù hợp, tự sắp xếp thứ tự rồi tự gõ trong editor.',
    commands: commands.map((command) => ({
      signature: command.label,
      description: commandDescription(command),
      category: isGameApi(command) ? 'Game API' : 'C++',
    })),
  };

  return [
    ...authored.slice(0, insertAt),
    commandHint,
    ...authored.slice(insertAt),
  ].map((hint, index) => ({ ...hint, level: index + 1 }));
}
