import { describe, expect, it } from 'vitest';
import { paletteForChallenge } from './commandPalette';
import { getChallenge } from '@/lessons';

describe('Coach nhắc lệnh theo ngữ cảnh',()=>{
  it('màn đường đi chỉ hiện đúng các hướng cần dùng',()=>{
    const labels=paletteForChallenge(getChallenge('a1','a1-c3-obstacle-route')!).map(c=>c.label);
    expect(labels).toEqual(expect.arrayContaining(['moveRight();','moveUp();','moveDown();']));
    expect(labels).not.toContain('cout << "..." << endl;');
  });
  it('màn biến chỉ hiện kiểu và API liên quan',()=>{
    const labels=paletteForChallenge(getChallenge('a2','a2-c3-collect-count')!).map(c=>c.label);
    expect(labels).toEqual(expect.arrayContaining(['int ten = 0;','collectGem();','gemsCollected()','cout << "..." << endl;']));
    expect(labels).not.toContain('double ten = 0.0;');
  });
  it('không trả nguyên cả bảng lệnh cho màn nhập môn',()=>{
    const labels=paletteForChallenge(getChallenge('a0','a0-c2-cout')!).map(c=>c.label);
    expect(labels).toContain('cout << "..." << endl;');
    expect(labels).not.toContain('moveRight();');
  });
});
