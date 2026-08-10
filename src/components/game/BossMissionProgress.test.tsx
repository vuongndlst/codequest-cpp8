import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BossMissionProgress } from './BossMissionProgress';
describe('BossMissionProgress',()=>{ it('dùng ba pha sư phạm của Area 2',()=>{
  render(<BossMissionProgress lessonId="a2" playedCount={2} totalEvents={6}/>);
  expect(screen.getByText('1. Thu thập')).toBeInTheDocument();
  expect(screen.getByText('2. Cập nhật dữ liệu')).toBeInTheDocument();
  expect(screen.getByText('3. Mở kho')).toBeInTheDocument();
  expect(screen.getByLabelText('Tiến độ thử thách Boss')).toBeInTheDocument();
});});
