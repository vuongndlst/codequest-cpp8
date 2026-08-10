import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BossMissionProgress } from './BossMissionProgress';

describe('BossMissionProgress', () => {
  it('uses the pedagogical phases of the current zone', () => {
    render(<BossMissionProgress lessonId="l5" playedCount={2} totalEvents={6} />);
    expect(screen.getByText('1. Phân tích Boss')).toBeInTheDocument();
    expect(screen.getByText('2. Chọn hành động')).toBeInTheDocument();
    expect(screen.getByText('3. Phá lớp giáp')).toBeInTheDocument();
    expect(screen.getByLabelText('Tiến độ thử thách Boss')).toBeInTheDocument();
  });
});
