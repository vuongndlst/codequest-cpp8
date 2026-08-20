import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WorldSpec } from '@/types/content';
import type { WorldEvent } from '@/validators/world';
import { TileMapStage } from './TileMapStage';

vi.mock('@/services/audio', () => ({ playSound: vi.fn() }));
vi.stubGlobal('ResizeObserver', class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
});

describe('TileMapStage route lighting', () => {
  const routeMap: WorldSpec = {
    kind: 'map',
    cols: 4,
    rows: 2,
    startCol: 0,
    startRow: 0,
    goalCol: 3,
    goalRow: 0,
    terrain: ['.==.', 'FFFF'],
    initialState: { energy: 10 },
  };

  it('connects start and goal to the highlighted route', () => {
    const { container } = render(<TileMapStage spec={routeMap} events={[]} playedCount={0} lessonId="a4" />);
    expect(container.querySelectorAll('[data-path-cell="true"]')).toHaveLength(4);
    expect(container.querySelectorAll('.cq-route-guide')).toHaveLength(4);
  });

  it('energizes visited cells without hiding the remaining route', () => {
    const move: WorldEvent = { type: 'move', index: 0, col: 1, row: 0, message: 'Move right' };
    const { container } = render(<TileMapStage spec={routeMap} events={[move]} playedCount={1} lessonId="a4" />);
    expect(container.querySelectorAll('.cq-route-guide--energized')).toHaveLength(2);
    expect(container.querySelectorAll('.cq-route-guide')).toHaveLength(4);
  });

  it('không làm sáng đoạn đường cô lập không nối với điểm xuất phát', () => {
    const disconnectedMap: WorldSpec = {
      kind: 'map',
      cols: 6,
      rows: 2,
      startCol: 0,
      startRow: 0,
      goalCol: 3,
      goalRow: 0,
      terrain: ['.==.F=', 'FFFFF='],
      initialState: { energy: 10 },
    };
    const { container } = render(<TileMapStage spec={disconnectedMap} events={[]} playedCount={0} lessonId="a4" />);

    expect(container.querySelectorAll('[data-path-cell="true"]')).toHaveLength(4);
    expect(
      [...container.querySelectorAll('[data-terrain="="]')].map((tile) => tile.getAttribute('data-path-cell')),
    ).toEqual(['true', 'true', null, null]);
  });
});

const bossMap: WorldSpec = {
  kind: 'map',
  cols: 5,
  rows: 3,
  startCol: 1,
  startRow: 1,
  goalCol: 3,
  goalRow: 1,
  terrain: ['FFFFF', 'F...F', 'FFFFF'],
  props: [{ id: 'loop-boss', type: 'boss', col: 2, row: 1, state: 'decorative' }],
  initialState: { bugHp: 5, energy: 20 },
};

const hit = (index: number, hp: number): WorldEvent => ({
  type: 'attack-bug',
  index,
  col: 1,
  row: 1,
  message: `Boss còn ${hp} lớp giáp`,
  detail: { hp, hits: index + 1 },
});

describe('TileMapStage Boss vòng lặp', () => {
  it('hiển thị số lớp giáp còn lại ngay trên map theo từng đòn đánh', () => {
    render(<TileMapStage spec={bossMap} events={[hit(0, 4)]} playedCount={1} lessonId="a5" />);
    expect(screen.getByLabelText('Giáp Boss còn 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Đã đánh 1 trên 5 đòn')).toHaveTextContent('Đòn 1/5');
  });

  it('ẩn Boss sau khi lớp giáp cuối cùng bị phá', () => {
    render(<TileMapStage spec={bossMap} events={[hit(0, 4), hit(1, 0)]} playedCount={2} lessonId="a5" />);
    expect(screen.queryByLabelText(/Giáp Boss còn/)).not.toBeInTheDocument();
  });
});

describe('TileMapStage Xưởng Hàm', () => {
  const callEvent: WorldEvent = {
    type: 'call-func', index: 0, col: 1, row: 1, message: 'Chạy máy moveRightMany',
    detail: { name: 'moveRightMany', args: ['4'] },
  };
  const returnEvent: WorldEvent = {
    type: 'return-func', index: 1, col: 1, row: 1, message: 'moveRightMany đã hoàn tất',
    detail: { name: 'moveRightMany', completed: true },
  };

  it('hiện mô-đun và đối số đang chạy ngay trên map', () => {
    render(<TileMapStage spec={bossMap} events={[callEvent]} playedCount={1} lessonId="a6" />);
    expect(screen.getByLabelText('Đang chạy mô-đun moveRightMany')).toHaveTextContent('moveRightMany(4)');
  });

  it('báo mô-đun đã hoàn tất khi luồng quay về main', () => {
    render(<TileMapStage spec={bossMap} events={[callEvent, returnEvent]} playedCount={2} lessonId="a6" />);
    expect(screen.getByLabelText('Mô-đun moveRightMany đã hoàn tất')).toHaveTextContent('moveRightMany hoàn tất');
  });
});
