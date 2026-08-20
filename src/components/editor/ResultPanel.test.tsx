import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emptyRunResult } from '@/types/runner';
import { ResultPanel } from './ResultPanel';

const incompleteResult = {
  ...emptyRunResult(),
  ok: true,
  testResults: [{ id: 'map', name: 'Byte tới cổng', passed: false, required: true, visible: true }],
  totalRequired: 1,
};

describe('ResultPanel phản hồi theo bằng chứng', () => {
  it('không nói Bug vẫn còn ở nhiệm vụ không có Boss', () => {
    render(<ResultPanel result={incompleteResult} isRunning={false} />);
    expect(screen.getByText('Chưa đạt mục tiêu')).toBeInTheDocument();
    expect(screen.queryByText(/Bug vẫn còn/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Chi tiết kiểm tra · 0\/1 mục tiêu đạt/i)).toBeInTheDocument();
  });

  it('không gợi ý cout khi nhiệm vụ chỉ điều khiển bản đồ', () => {
    render(<ResultPanel result={incompleteResult} isRunning={false} expectsOutput={false} />);
    expect(screen.getByText(/không yêu cầu in dữ liệu/i)).toBeInTheDocument();
  });

  it('nhắc đối chiếu cout khi nhiệm vụ có Output bắt buộc', () => {
    render(<ResultPanel result={incompleteResult} isRunning={false} expectsOutput />);
    expect(screen.getByText(/chưa in ra dữ liệu/i)).toBeInTheDocument();
  });
});
