import { describe, expect, it } from 'vitest';
import { relevantHandbookCards } from './challengeHandbook';
import { getChallenge } from '@/lessons';

describe('Sổ tay theo nhiệm vụ',()=>{
  it('màn cout mở đúng thẻ C++',()=>{ expect(relevantHandbookCards(getChallenge('a0','a0-c2-cout')!).map(c=>c.id)).toContain('cout'); });
  it('màn bản đồ phân biệt Game API',()=>{ expect(relevantHandbookCards(getChallenge('a1','a1-c3-obstacle-route')!).map(c=>c.id)).toContain('robot-commands'); });
  it('màn biến mở thẻ biến',()=>{ expect(relevantHandbookCards(getChallenge('a2','a2-c3-collect-count')!).map(c=>c.id)).toContain('variables'); });
  it('debug luôn có thẻ lỗi thường gặp',()=>{ expect(relevantHandbookCards(getChallenge('a0','a0-c3-debug-semicolon')!).map(c=>c.id)).toContain('common-errors'); });
});
