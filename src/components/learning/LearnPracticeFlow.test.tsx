import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LearnPracticeFlow } from './LearnPracticeFlow';
import { LESSON_LEARNING_PATHS } from '@/data/curriculum';

describe('LearnPracticeFlow', () => {
  it('phân biệt rõ C++ language và Game API', () => {
    render(<LearnPracticeFlow path={LESSON_LEARNING_PATHS.l1} />);
    expect(screen.getAllByText('C++ language').length).toBeGreaterThan(0);
    expect(screen.getByText('Game API')).toBeInTheDocument();
  });

  it('phản hồi bằng giải thích sau khi học sinh tự trả lời', () => {
    render(<LearnPracticeFlow path={LESSON_LEARNING_PATHS.l2} />);
    fireEvent.click(screen.getByLabelText('Hàm không chạy'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Kiểm tra' })[0]);
    expect(screen.getByText(/Khai báo hàm chỉ mô tả công việc/)).toBeInTheDocument();
  });
});
