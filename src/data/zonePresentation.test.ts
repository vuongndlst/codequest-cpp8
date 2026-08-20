import { describe, expect, it } from 'vitest';
import { challengePhaseLabel, zonePresentation } from './zonePresentation';
describe('zonePresentation',()=>{
  it('có dữ liệu pixel riêng cho mười một Area',()=>{ for(const id of ['a0','a1','a2','a3','a4','a5','a6','a7','a8','a9','a10']) { const zone=zonePresentation(id); expect(zone.bossPhases).toHaveLength(3); expect(zone.props).toHaveLength(3); }});
  it('fallback an toàn và nhãn đúng',()=>{ expect(zonePresentation('unknown').name).toBe('Trạm Khởi Động'); expect(zonePresentation('a2').name).toBe('Kho Dữ Liệu Pha Lê'); expect(challengePhaseLabel('debug')).toBe('Debug Lab'); });
  it('Khu vực 5 dùng mỹ thuật thung lũng và nhịp Boss vòng lặp',()=>{
    const zone=zonePresentation('a5');
    expect(zone.name).toBe('Thung Lũng Lặp');
    expect(zone.ground).toBe('town');
    expect(zone.bossPhases).toEqual(['Đếm lớp giáp','Lặp đòn đánh','Mở cổng']);
  });
});
