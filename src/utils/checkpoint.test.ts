import { describe, expect, it } from 'vitest';
import type { ExitTicketQuestion } from '@/types/content';
import { canOpenCheckpoint, isQuestionCorrect, scoreCheckpoint } from './checkpoint';

const questions: ExitTicketQuestion[] = [
  {
    id: 'multi',
    type: 'multiple-answer',
    prompt: 'Chọn hai đáp án',
    options: ['A', 'B', 'C'],
    correctIndices: [0, 2],
  },
  {
    id: 'order',
    type: 'ordering',
    prompt: 'Sắp xếp',
    options: ['B', 'A'],
    correctOrder: ['A', 'B'],
  },
  {
    id: 'fill',
    type: 'fill-code',
    prompt: 'Điền code',
    options: [],
    acceptedAnswers: ['moveForward();'],
  },
  {
    id: 'reflect',
    type: 'self-assess',
    prompt: 'Tự đánh giá',
    options: ['Ổn', 'Cần ôn'],
  },
];

describe('checkpoint scoring', () => {
  it('chỉ mở checkpoint khi mọi nhiệm vụ bắt buộc đã hoàn thành', () => {
    expect(canOpenCheckpoint(['c1', 'c2'], ['c1', 'bonus'])).toBe(false);
    expect(canOpenCheckpoint(['c1', 'c2'], ['c2', 'c1', 'bonus'])).toBe(true);
  });

  it('chấm nhiều đáp án không phụ thuộc thứ tự chọn', () => {
    expect(isQuestionCorrect(questions[0], [2, 0])).toBe(true);
  });

  it('chấm ordering và fill-code sau khi chuẩn hoá khoảng trắng', () => {
    expect(isQuestionCorrect(questions[1], ['A', 'B'])).toBe(true);
    expect(isQuestionCorrect(questions[2], '  moveForward();  ')).toBe(true);
  });

  it('không tính câu tự đánh giá vào phần trăm', () => {
    expect(
      scoreCheckpoint(questions, {
        multi: [0, 2],
        order: ['A', 'B'],
        fill: 'moveForward();',
        reflect: 1,
      }),
    ).toEqual({ correct: 3, total: 3, percent: 100, passed: true });
  });
});
