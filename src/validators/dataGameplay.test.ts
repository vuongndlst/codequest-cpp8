import { describe, expect, it } from 'vitest';
import { LESSONS } from '@/lessons';
import { analyzeChallenge } from './index';
import { interpret } from './interpreter';
import { parse } from './parser';
import { tokenize } from './lexer';

const wrap = (body: string) => `#include <iostream>\nusing namespace std;\nint main() { ${body} return 0; }`;
const area = LESSONS.find(lesson => lesson.id === 'a9')!;

describe('Nhập mảng và nhiệm vụ nhiều bộ dữ liệu', () => {
  it('cin nhập từng phần tử với chỉ số tính toán, nối chuỗi và chuyển kiểu int', () => {
    const code = wrap('int a[3]; int i = 0; cin >> a[i] >> a[i+1] >> a[2]; cout << a[0] << " " << a[1] << " " << a[2];');
    const result = interpret(parse(tokenize(code).tokens), { stdin: '2.9 -3 7' });
    expect(result.rawOutput).toBe('2 -3 7');
  });
  it('cin không được ghi quá cuối mảng', () => {
    const result = interpret(parse(tokenize(wrap('int a[2]; cin >> a[2];')).tokens), { stdin: '8' });
    expect(result.diagnostics.some(d => d.severity === 'error' && d.message.includes('ngoài mảng'))).toBe(true);
  });
  it('không chấp nhận cin vào cả mảng', () => {
    const result = interpret(parse(tokenize(wrap('int a[2]; cin >> a;')).tokens), { stdin: '8' });
    expect(result.diagnostics.some(d => d.severity === 'error')).toBe(true);
  });
  for (const challenge of area.challenges.slice(0, 2)) {
    it(`${challenge.id}: lời giải đạt cả tính toán lẫn máy cho từng Input`, () => {
      expect(analyzeChallenge(challenge.solution!, challenge).isCorrect).toBe(true);
      expect(new Set(challenge.testCases.map(test => test.input)).size).toBeGreaterThanOrEqual(4);
    });
    it(`${challenge.id}: in đúng nhưng nạp cố định không được qua`, () => {
      const code = challenge.solution!.replace(/chargeMachine\((total|strongest)\)/, 'chargeMachine(14)');
      expect(analyzeChallenge(code, challenge).isCorrect).toBe(false);
    });
    it(`${challenge.id}: bỏ nạp máy hoặc gọi nhầm vị trí không được qua`, () => {
      const noCharge = challenge.solution!.replace(/chargeMachine\((total|strongest)\);/, '');
      expect(analyzeChallenge(noCharge, challenge).isCorrect).toBe(false);
      const wrongLocation = noCharge.replace('int main() {', 'int main() { chargeMachine(14);');
      expect(analyzeChallenge(wrongLocation, challenge).isCorrect).toBe(false);
    });
  }
  it('in cố định 9 dù có vòng lặp/if giả không đạt bài max', () => {
    const challenge = area.challenges[1];
    const code = challenge.solution!.replace('i = 1; i < 5', 'i = 1; i < 1').replace('cout << strongest', 'cout << 9');
    expect(analyzeChallenge(code, challenge).isCorrect).toBe(false);
  });
  it('bằng chứng lỗi dùng Output của bộ Input bị lỗi, không dùng lần chạy chính', () => {
    const base = area.challenges[1];
    const challenge = { ...base, requiredPatterns: [], testCases: [
      { id: 'one', name: 'Một', kind: 'output' as const, input: '1', expectedOutput: '1', visible: true, required: true },
      { id: 'two', name: 'Hai', kind: 'output' as const, input: '2', expectedOutput: '3', visible: true, required: true },
    ] };
    const result = analyzeChallenge(wrap('int n; cin >> n; cout << n;'), challenge);
    expect(result.diagnostics.find(d => d.severity === 'error')?.message).toContain('Em đang in ra: "2"');
  });
  it('lỗi runtime ở Input phụ vẫn không được qua dù đã in đúng trước lỗi', () => {
    const base = area.challenges[1];
    const challenge = { ...base, requiredPatterns: [], testCases: [
      { id: 'one', name: 'Một', kind: 'output' as const, input: '0', expectedOutput: '5', visible: true, required: true },
      { id: 'two', name: 'Hai', kind: 'output' as const, input: '2', expectedOutput: '5', visible: true, required: true },
    ] };
    const result = analyzeChallenge(wrap('int a[1] = {0}; int i; cin >> i; cout << 5; a[i] = 1;'), challenge);
    expect(result.isCorrect).toBe(false);
    expect(result.testResults[1].message).toContain('ngoài mảng');
  });
});
