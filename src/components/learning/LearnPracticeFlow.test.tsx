import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LearnPracticeFlow } from './LearnPracticeFlow';
import { LESSON_LEARNING_PATHS } from '@/data/curriculum';

describe('LearnPracticeFlow', () => {
  it('phân biệt rõ C++ language và Game API', () => {
    render(<LearnPracticeFlow path={LESSON_LEARNING_PATHS.a1} />);
    expect(screen.getAllByText(/Game API/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/C\+\+ language/i).length).toBeGreaterThan(0);
  });
  it('Area 2 có micro-practice về dữ liệu', () => {
    render(<LearnPracticeFlow path={LESSON_LEARNING_PATHS.a2} />);
    expect(screen.getByText(/Kiểu phù hợp lưu số ngọc/i)).toBeInTheDocument();
  });
});
