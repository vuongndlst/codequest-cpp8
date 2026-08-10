import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CheckpointQuestionCard } from './CheckpointQuestionCard';
import type { ExitTicketQuestion } from '@/types/content';

describe('CheckpointQuestionCard', () => {
  it('cho học sinh tự chọn nhiều đáp án và không chèn code sẵn', () => {
    const onChange = vi.fn();
    const question: ExitTicketQuestion = {
      id: 'multi',
      type: 'multiple-answer',
      prompt: 'Chọn các statement hợp lệ',
      options: ['moveForward();', 'moveForward()', 'cout << "Hi";'],
      correctIndices: [0, 2],
      explanation: 'Statement cần dấu chấm phẩy.',
    };
    render(
      <CheckpointQuestionCard
        question={question}
        index={0}
        answer={[]}
        submitted={false}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('moveForward();'));
    expect(onChange).toHaveBeenCalledWith([0]);
    expect(screen.queryByRole('button', { name: /chèn|dùng lệnh/i })).not.toBeInTheDocument();
  });

  it('hiển thị feedback giải thích sau khi nộp câu nối cặp', () => {
    const question: ExitTicketQuestion = {
      id: 'match',
      type: 'matching',
      prompt: 'Nối vai trò',
      options: ['C++ language', 'Game API'],
      matches: [{ left: 'moveForward()', right: 'Game API' }],
      explanation: 'ByteLand cung cấp hàm điều khiển này.',
      misconception: 'Đây không phải hàm chuẩn trong mọi chương trình C++.',
    };
    render(
      <CheckpointQuestionCard
        question={question}
        index={1}
        answer={{ 'moveForward()': 'C++ language' }}
        submitted
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Đây không phải hàm chuẩn');
  });
});
