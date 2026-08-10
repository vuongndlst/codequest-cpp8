import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ZoneSceneStage } from './ZoneSceneStage';
describe('ZoneSceneStage',()=>{ it('hiển thị đúng bối cảnh Area 0',()=>{
  render(<ZoneSceneStage lessonId="a0" challengeKind="concept" challengeTitle="Tín hiệu đầu tiên" events={[]} playedCount={0} avatarId="guardian-cyan"/>);
  expect(screen.getByText('Trạm Khởi Động')).toBeInTheDocument();
  expect(screen.getByText('Phòng điều khiển tín hiệu')).toBeInTheDocument();
  expect(screen.getByText('Tín hiệu đầu tiên')).toBeInTheDocument();
});});
