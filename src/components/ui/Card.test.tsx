import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Award } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { StatTile } from './Card';

describe('StatTile có tương tác', () => {
  it('biến toàn bộ ô thành liên kết khi có trang đích', () => {
    render(
      <MemoryRouter>
        <StatTile label="Huy hiệu" value={5} icon={<Award />} to="/app/profile#badges" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Xem Huy hiệu' })).toHaveAttribute(
      'href',
      '/app/profile#badges',
    );
  });
});
