import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HintPanel } from './HintPanel';

describe('HintPanel', () => {
  it('hiển thị khung code đúng xuống dòng, số dòng và màu cú pháp như editor', () => {
    render(
      <HintPanel
        hints={[
          { level: 1, type: 'question', content: 'Em cần lặp điều gì?' },
          { level: 2, type: 'structure', content: 'Dùng vòng for.' },
          { level: 3, type: 'skeleton', content: 'void moveMany(int ___) {\n    for (int i = 0; i < ___; i++) {\n        ___;\n    }\n}' },
        ]}
        unlockedLevel={3}
        onUnlock={vi.fn()}
        canViewSolution={false}
        onViewSolution={vi.fn()}
        solutionVisible={false}
        attemptCount={0}
        open
      />,
    );

    const codeBlock = screen.getByText('C++ · Khung code').closest('figure');
    expect(codeBlock).not.toBeNull();
    expect(within(codeBlock!).getByText('void')).toHaveClass('text-cyan-300');
    expect(within(codeBlock!).getByText('for')).toHaveClass('text-violet-300');
    expect(within(codeBlock!).getByText('moveMany')).toHaveClass('text-cyan-400');
    expect(within(codeBlock!).getByText('0')).toHaveClass('text-amber-300');
    expect(within(codeBlock!).getAllByText('___')).toHaveLength(3);
    expect(within(codeBlock!).getByText('5')).toBeInTheDocument();
    expect(codeBlock).toHaveTextContent('for (int i = 0; i < ___; i++) {');
    expect(codeBlock!.querySelector('code')).toHaveClass('text-slate-200');
  });

  it('hiển thị tầng nên dùng lệnh nào như code chỉ đọc, không tạo nút chèn code', () => {
    render(
      <HintPanel
        hints={[{
          level: 1,
          type: 'command',
          content: 'Chọn lệnh phù hợp rồi tự gõ.',
          commands: [
            { signature: 'moveRight();', description: 'đưa Byte sang phải một ô', category: 'Game API' },
            { signature: 'for (int i = 0; i < count; i++) { ... }', description: 'lặp một khối lệnh', category: 'C++' },
          ],
        }]}
        unlockedLevel={1}
        onUnlock={vi.fn()}
        canViewSolution={false}
        onViewSolution={vi.fn()}
        solutionVisible={false}
        attemptCount={0}
        open
      />,
    );

    expect(screen.getByText(/Nên dùng lệnh nào/i)).toBeInTheDocument();
    expect(screen.getByText('C++ · Lệnh có thể cần')).toBeInTheDocument();
    expect(screen.getByText(/không chèn code vào editor/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /moveRight/i })).not.toBeInTheDocument();
  });
});
