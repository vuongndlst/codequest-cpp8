import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CommandPalette } from './CommandPalette';

const commands = [
  {
    label: 'moveForward();',
    snippet: 'moveForward();',
    hint: 'Nhân vật tiến một ô theo hướng đang quay',
  },
  {
    label: 'turnRight();',
    snippet: 'turnRight();',
    hint: 'Quay sang phải và đứng yên tại chỗ',
  },
];

describe('CommandPalette', () => {
  it('không lộ cú pháp khi học sinh chưa gõ đủ hai ký tự', () => {
    render(<CommandPalette commands={commands} activeToken="m" />);

    expect(screen.queryByText('moveForward();')).not.toBeInTheDocument();
    expect(screen.getByText(/tự bắt đầu gõ/i)).toBeInTheDocument();
  });

  it('chỉ nhắc lệnh phù hợp với tiền tố học sinh đang gõ', () => {
    render(<CommandPalette commands={commands} activeToken="mov" />);

    expect(screen.getByText('moveForward();')).toBeInTheDocument();
    expect(screen.queryByText('turnRight();')).not.toBeInTheDocument();
  });

  it('hiển thị dạng đọc-only, không có nút chèn lệnh', () => {
    render(<CommandPalette commands={commands} activeToken="tu" />);

    expect(screen.getByText('turnRight();')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
