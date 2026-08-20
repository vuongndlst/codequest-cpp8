import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignalTowerStage } from './SignalTowerStage';
import type { WorldEvent } from '@/validators/world';
import { playSound } from '@/services/audio';

vi.mock('@/services/audio', () => ({ playSound: vi.fn() }));

const spec = {
  kind: 'signal-tower' as const,
  cols: 7,
  rows: 5,
  startCol: 1,
  startRow: 3,
  props: [
    { id: 'tree', type: 'tree', col: 0, row: 1 },
    { id: 'light-1', type: 'light', col: 4, row: 3 },
    { id: 'light-2', type: 'light', col: 5, row: 2 },
  ],
};

const printEvent = (index: number, text: string): WorldEvent => ({
  type: 'print', index, col: 1, row: 3, message: `In ${text}`, detail: { text },
});

describe('SignalTowerStage', () => {
  it('luôn hiển thị map, nhân vật, đường tín hiệu và các trạm lửa', () => {
    const { container } = render(<SignalTowerStage spec={spec} events={[]} playedCount={0} />);
    expect(screen.getByTestId('signal-game-map')).toHaveClass('h-full', 'w-full');
    expect(screen.getByLabelText('Nhân vật của em tại bàn phát tín hiệu')).toBeInTheDocument();
    expect(screen.getAllByTestId('signal-station')).toHaveLength(2);
    expect(container.querySelectorAll('[data-signal-path="true"]').length).not.toBe(0);
    expect(container.querySelectorAll('.cq-route-guide')).toHaveLength(
      container.querySelectorAll('[data-signal-path="true"]').length,
    );
  });

  it('mỗi sự kiện cout thắp đúng một trạm và hiện nội dung tín hiệu', () => {
    const events = [printEvent(0, 'He thong'), printEvent(1, 'san sang')];
    render(<SignalTowerStage spec={spec} events={events} playedCount={1} />);
    const stations = screen.getAllByTestId('signal-station');
    expect(stations[0]).toHaveAttribute('data-active', 'true');
    expect(stations[1]).toHaveAttribute('data-active', 'false');
    expect(screen.getByText('He thong')).toBeInTheDocument();
    expect(screen.getByText('1/2 trạm đã sáng')).toBeInTheDocument();
  });

  it('tín hiệu sai vẫn hiện trên map nhưng không thắp trạm hoặc mở cổng', () => {
    const securedSpec = {
      ...spec,
      props: [...spec.props, { id: 'gate', type: 'gate', col: 6, row: 2 }],
      initialState: { expectedSignals: ['BAT DAU', 'ONLINE'] },
    };
    render(<SignalTowerStage spec={securedSpec} events={[printEvent(0, 'bat dau')]} playedCount={1} />);

    expect(screen.getByText(/Chưa khớp: bat dau/)).toBeInTheDocument();
    expect(screen.getByLabelText('Cổng ByteLand đang khóa')).toHaveAttribute('data-active', 'false');
    expect(screen.getByText('0/2 trạm đã sáng')).toBeInTheDocument();
    expect(playSound).toHaveBeenCalledWith('error');
  });

  it('đủ tín hiệu đúng thì thắp trạm và mở cổng ByteLand', () => {
    const securedSpec = {
      ...spec,
      props: [...spec.props, { id: 'gate', type: 'gate', col: 6, row: 2 }],
      initialState: { expectedSignals: ['CODEQUEST', 'SYSTEM ONLINE'] },
    };
    const events = [printEvent(0, 'CODEQUEST'), printEvent(1, 'SYSTEM ONLINE')];
    render(<SignalTowerStage spec={securedSpec} events={events} playedCount={2} />);

    expect(screen.getByLabelText('Cổng ByteLand đã mở')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('2/2 trạm đã sáng')).toBeInTheDocument();
    expect(playSound).toHaveBeenLastCalledWith('door');
  });
});
