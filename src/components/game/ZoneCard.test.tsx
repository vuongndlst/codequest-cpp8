import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LESSONS_META } from '@/data/lessons.meta';
import { ZoneCard } from './ZoneCard';

function renderCard(preview = false) {
  return render(
    <MemoryRouter>
      <ol>
        <ZoneCard
          lesson={LESSONS_META[1]}
          lockState="locked"
          progressPercent={0}
          stars={0}
          preview={preview}
        />
      </ol>
    </MemoryRouter>,
  );
}

describe('Thẻ khu vực', () => {
  it('bản đồ cá nhân nói rõ điều kiện mở khóa', () => {
    renderCard();

    expect(screen.getByText('Hoàn thành Khu vực 1 để mở khoá')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-disabled', 'true');
  });

  it('bản đồ xem trước giới thiệu nội dung thay vì làm mờ như khu vực bị khóa', () => {
    renderCard(true);

    expect(screen.getByText(LESSONS_META[1].subtitle)).toBeInTheDocument();
    expect(screen.getByText('9 nhiệm vụ · khoảng 45 phút')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('listitem').className).not.toContain('opacity-60');
  });
});
