import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LESSONS_META } from '@/data/lessons.meta';
import { ZoneCard } from './ZoneCard';
const renderCard=(preview=false)=>render(<MemoryRouter><ol><ZoneCard lesson={LESSONS_META[1]} lockState="locked" progressPercent={0} stars={0} preview={preview}/></ol></MemoryRouter>);
describe('Thẻ khu vực',()=>{
  it('nói rõ điều kiện mở khóa',()=>{renderCard(); expect(screen.getByText('Hoàn thành Khu vực 0 để mở khoá')).toBeInTheDocument(); expect(screen.getByRole('listitem')).toHaveAttribute('aria-disabled','true');});
  it('preview giới thiệu đúng quy mô mới',()=>{renderCard(true); expect(screen.getByText('5 nhiệm vụ · khoảng 60 phút')).toBeInTheDocument(); expect(screen.getByRole('listitem')).not.toHaveAttribute('aria-disabled');});
});
