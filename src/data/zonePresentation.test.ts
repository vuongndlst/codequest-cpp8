import { describe, expect, it } from 'vitest';
import { challengePhaseLabel, zonePresentation } from './zonePresentation';

describe('zonePresentation', () => {
  it('gives every learning zone three boss phases and pixel props', () => {
    for (let order = 1; order <= 5; order += 1) {
      const zone = zonePresentation(`l${order}`);
      expect(zone.bossPhases).toHaveLength(3);
      expect(zone.props).toHaveLength(3);
      expect(zone.name.length).toBeGreaterThan(3);
    }
  });

  it('falls back safely and labels all challenge rhythms', () => {
    expect(zonePresentation('unknown').name).toBe('Làng Khởi Động');
    expect(zonePresentation('lesson-4').name).toBe('Cổng Quyết Định');
    expect(challengePhaseLabel('debug')).toBe('Tìm và sửa lỗi');
    expect(challengePhaseLabel('boss')).toBe('Thử thách tổng hợp');
  });
});
