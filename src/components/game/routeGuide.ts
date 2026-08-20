import type { WorldSpec } from '@/types/content';

const DIRECTIONS = [
  { dCol: 0, dRow: -1 },
  { dCol: 1, dRow: 0 },
  { dCol: 0, dRow: 1 },
  { dCol: -1, dRow: 0 },
] as const;

const keyOf = (col: number, row: number) => `${col},${row}`;

/**
 * Chỉ trả về mạch `=` thật sự nối với ô xuất phát.
 *
 * Một ký hiệu đường nằm ở khu trang trí hoặc một đoạn bị khai báo rời sẽ không
 * được phát sáng. Ô đích cũng chỉ gia nhập mạch khi nó kề với tuyến hợp lệ; nhờ
 * vậy renderer không tự tạo một chấm sáng cô lập ở portal.
 */
export function connectedRouteCells(spec: WorldSpec): Set<string> {
  const routeGlyphs = new Set<string>();
  spec.terrain?.forEach((line, row) => {
    [...line].forEach((glyph, col) => {
      if (glyph === '=') routeGlyphs.add(keyOf(col, row));
    });
  });

  if (routeGlyphs.size === 0) return new Set();

  const startCol = spec.startCol ?? 0;
  const startRow = spec.startRow ?? 0;
  const goalCol = spec.goalCol ?? spec.cols - 1;
  const goalRow = spec.goalRow ?? 0;
  const startKey = keyOf(startCol, startRow);
  const goalKey = keyOf(goalCol, goalRow);
  const candidates = new Set(routeGlyphs);
  candidates.add(startKey);
  candidates.add(goalKey);

  const connected = new Set<string>();
  const queue: Array<[number, number]> = [[startCol, startRow]];

  while (queue.length > 0) {
    const [col, row] = queue.shift()!;
    const key = keyOf(col, row);
    if (connected.has(key) || !candidates.has(key)) continue;
    connected.add(key);

    for (const { dCol, dRow } of DIRECTIONS) {
      const nextCol = col + dCol;
      const nextRow = row + dRow;
      const nextKey = keyOf(nextCol, nextRow);
      if (!connected.has(nextKey) && candidates.has(nextKey)) queue.push([nextCol, nextRow]);
    }
  }

  return connected;
}
