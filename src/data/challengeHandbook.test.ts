import { describe, expect, it } from 'vitest';
import { relevantHandbookCards } from './challengeHandbook';
import { getChallenge } from '@/lessons';

describe('Sổ tay theo nhiệm vụ',()=>{
  it('màn cout mở đúng thẻ C++',()=>{ expect(relevantHandbookCards(getChallenge('a0','a0-c2-cout')!).map(c=>c.id)).toContain('cout'); });
  it('màn bản đồ phân biệt Game API',()=>{ expect(relevantHandbookCards(getChallenge('a1','a1-c3-obstacle-route')!).map(c=>c.id)).toContain('robot-commands'); });
  it('màn biến mở thẻ biến',()=>{ expect(relevantHandbookCards(getChallenge('a2','a2-c3-collect-count')!).map(c=>c.id)).toContain('variables'); });
  it('debug luôn có thẻ lỗi thường gặp',()=>{ expect(relevantHandbookCards(getChallenge('a0','a0-c3-debug-semicolon')!).map(c=>c.id)).toContain('common-errors'); });
  it('màn cửa khóa mở đúng thẻ if và cảm biến thay vì thẻ gọi hàm chung',()=>{
    const ids=relevantHandbookCards(getChallenge('a4','a4-c3-key-sensor')!).map(c=>c.id);
    expect(ids).toEqual(expect.arrayContaining(['if','decision-sensors']));
    expect(ids).not.toContain('function-call');
  });
  it('Boss Khu vực 5 mở kiến thức vòng lặp và API chiến đấu',()=>{
    const ids=relevantHandbookCards(getChallenge('a5','a5-c5-armor-loop')!).map(c=>c.id);
    expect(ids).toEqual(expect.arrayContaining(['for-loop','loop-game-api','if']));
  });
  it('Khu vực 6 chỉ mở thẻ hàm, tham số và return liên quan',()=>{
    const ids=relevantHandbookCards(getChallenge('a6','a6-c3-return-energy')!).map(c=>c.id);
    expect(ids).toEqual(expect.arrayContaining(['function-return','function-params','energy-machines']));
  });
  it('tuyến nâng cao mở đúng thẻ tham chiếu, mảng và biên chỉ số',()=>{
    expect(relevantHandbookCards(getChallenge('a7','a7-c2-reference-charge')!).map(c=>c.id)).toContain('reference-parameter');
    expect(relevantHandbookCards(getChallenge('a8','a8-c3-debug-bound')!).map(c=>c.id)).toEqual(expect.arrayContaining(['one-dimensional-array','array-index-bounds']));
  });
});
