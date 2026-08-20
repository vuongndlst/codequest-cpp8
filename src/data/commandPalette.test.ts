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
  it('Khu vực 3 chỉ nhắc API năng lượng xuất hiện trong nhiệm vụ',()=>{
    const labels=paletteForChallenge(getChallenge('a3','a3-c3-compare-switch')!).map(c=>c.label);
    expect(labels).toContain('setSwitch(condition);');
    expect(labels).not.toContain('chargeMachine(value);');
    expect(labels).not.toContain('collectGem();');
  });
  it('Khu vực 4 chỉ nhắc cấu trúc nhánh và cảm biến đang cần',()=>{
    const labels=paletteForChallenge(getChallenge('a4','a4-c3-key-sensor')!).map(c=>c.label);
    expect(labels).toEqual(expect.arrayContaining(['collectKey();','hasKey()','openDoor();','if (condition) { ... }']));
    expect(labels).not.toContain('if (...) { ... } else { ... }');
    expect(labels).not.toContain('setSwitch(condition);');
  });
  it('màn hai nhánh chỉ hiện if-else thay vì đồng thời nhắc if một nhánh',()=>{
    const labels=paletteForChallenge(getChallenge('a4','a4-c2-two-branches')!).map(c=>c.label);
    expect(labels).toContain('if (...) { ... } else { ... }');
    expect(labels).toContain('cin >> value;');
    expect(labels).not.toContain('if (condition) { ... }');
  });
  it('Boss Khu vực 5 chỉ nhắc vòng for và API chiến đấu cần thiết',()=>{
    const labels=paletteForChallenge(getChallenge('a5','a5-c5-armor-loop')!).map(c=>c.label);
    expect(labels).toEqual(expect.arrayContaining([
      'for (int i = 0; i < count; i++) { ... }',
      'attackBug();',
      'getBugHp()',
      'openDoor();',
    ]));
    expect(labels).not.toContain('collectKey();');
    expect(labels).not.toContain('turnOnLight();');
  });
  it('Khu vực 6 nhắc cú pháp định nghĩa hàm và return theo đúng nhiệm vụ',()=>{
    const labels=paletteForChallenge(getChallenge('a6','a6-c3-return-energy')!).map(c=>c.label);
    expect(labels).toEqual(expect.arrayContaining(['return value;','chargeMachine(value);']));
    expect(labels).not.toContain('collectKey();');
  });
  it('Khu vực 7–10 nhắc tham chiếu và mảng theo đúng ngữ cảnh',()=>{
    const referenceLabels=paletteForChallenge(getChallenge('a7','a7-c2-reference-charge')!).map(c=>c.label);
    expect(referenceLabels).toContain('void tenHam(int &value) { ... }');
    const arrayLabels=paletteForChallenge(getChallenge('a8','a8-c4-route-array-boss')!).map(c=>c.label);
    expect(arrayLabels).toEqual(expect.arrayContaining(['int values[size] = { ... };','values[index]','for (int i = 0; i < count; i++) { ... }']));
  });
});
