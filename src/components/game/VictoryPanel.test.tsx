import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Challenge } from '@/types/content';
import { VictoryPanel } from './VictoryPanel';

vi.mock('@/services/audio', () => ({ playSound: vi.fn(), playVictoryFanfare: vi.fn() }));

const challenge: Challenge = {
  id: 'popup-test', lessonId: 'a0', kind: 'mission', title: 'Thắp đèn',
  story: '', instructions: [], starterCode: '', requiredPatterns: [], testCases: [],
  commonMistakes: [], hints: [], cleanCodeRules: [], xpReward: 15,
  whyThisMatters: 'Vòng lặp biến nhiều hành động giống nhau thành một thuật toán ngắn gọn.',
};

describe('VictoryPanel popup', () => {
  it('hiển thị dạng dialog modal và khóa cuộn trang nền', () => {
    const { unmount } = render(
      <VictoryPanel challenge={challenge} result={null} xpAwarded={15} gemsAwarded={3} nextLabel="Nhiệm vụ tiếp theo" onNext={vi.fn()} />,
    );
    expect(screen.getByRole('dialog', { name: 'Nhiệm vụ hoàn thành!' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('victory-modal-backdrop')).toHaveClass('fixed', 'inset-0');
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('chỉ chuyển màn khi học sinh bấm nút tiếp tục', async () => {
    const onNext = vi.fn();
    render(<VictoryPanel challenge={challenge} result={null} xpAwarded={15} nextLabel="Nhiệm vụ tiếp theo" onNext={onNext} />);
    expect(onNext).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Nhiệm vụ tiếp theo' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('nói rõ XP, mục đích của Gem, kiến thức vừa học và bước kế tiếp', () => {
    render(
      <VictoryPanel
        challenge={challenge}
        result={null}
        xpAwarded={15}
        gemsAwarded={3}
        totalXp={115}
        gemBalance={12}
        nextLabel="Tiếp tục"
        nextTitle="Nhiệm vụ kế tiếp"
        onNext={vi.fn()}
      />,
    );
    expect(screen.getByText('Phần thưởng vừa nhận')).toBeInTheDocument();
    expect(screen.getByText('XP mới')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText(/Cấp 2 · 115 XP/)).toBeInTheDocument();
    expect(screen.getByText(/Điểm kinh nghiệm giúp em lên cấp/)).toHaveTextContent('12 Gem');
    expect(screen.getByText('Em vừa mở khóa kiến thức')).toBeInTheDocument();
    expect(screen.getByText(/Nhiệm vụ kế tiếp/)).toBeInTheDocument();
  });

  it('không làm khối thưởng biến mất khi học sinh luyện tập lại', () => {
    render(
      <VictoryPanel
        challenge={challenge}
        result={null}
        xpAwarded={0}
        gemsAwarded={0}
        totalXp={115}
        gemBalance={12}
        nextLabel="Tiếp tục"
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByTestId('victory-rewards')).toBeInTheDocument();
    expect(screen.getByText('Phần thưởng đã nhận trước đó')).toBeInTheDocument();
    expect(screen.getByText(/Đây là lượt luyện tập lại/)).toBeInTheDocument();
    expect(screen.getByText('Tổng XP')).toBeInTheDocument();
    expect(screen.getByText('Gem hiện có')).toBeInTheDocument();
  });
});
