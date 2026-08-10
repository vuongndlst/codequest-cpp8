import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ZoneSceneStage } from './ZoneSceneStage';

describe('ZoneSceneStage', () => {
  it('keeps a concept node inside its game zone instead of showing an empty placeholder', () => {
    render(
      <ZoneSceneStage
        lessonId="l4"
        challengeKind="concept"
        challengeTitle="Cảm biến cổng"
        events={[]}
        playedCount={0}
        avatarId="guardian-cyan"
      />,
    );

    expect(screen.getByText('Cổng Quyết Định')).toBeInTheDocument();
    expect(screen.getByText('Hành lang cảm biến')).toBeInTheDocument();
    expect(screen.getByText('Cảm biến cổng')).toBeInTheDocument();
    expect(screen.getByText(/Khám phá lệnh mới/)).toBeInTheDocument();
  });
});
