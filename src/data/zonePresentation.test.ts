import { describe, expect, it } from 'vitest';
import { challengePhaseLabel, zonePresentation } from './zonePresentation';
describe('zonePresentation',()=>{
  it('có dữ liệu pixel cho ba Area',()=>{ for(const id of ['a0','a1','a2']) { const zone=zonePresentation(id); expect(zone.bossPhases).toHaveLength(3); expect(zone.props).toHaveLength(3); }});
  it('fallback an toàn và nhãn đúng',()=>{ expect(zonePresentation('unknown').name).toBe('Trạm Khởi Động'); expect(zonePresentation('a2').name).toBe('Kho Dữ Liệu Pha Lê'); expect(challengePhaseLabel('debug')).toBe('Debug Lab'); });
});
