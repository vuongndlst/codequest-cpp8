import { describe, expect, it } from 'vitest';
import { LESSONS } from './index';
import { analyzeChallenge } from '@/validators';
import { tokenize } from '@/validators/lexer';
import { parse } from '@/validators/parser';
import type { ExitTicketQuestion } from '@/types/content';

describe('Vertical slice Area 0–2', () => {
  it('có đúng ba khu vực đầu và 10–15 màn hoàn chỉnh', () => {
    expect(LESSONS.map((lesson) => lesson.id)).toEqual(['a0', 'a1', 'a2']);
    const total = LESSONS.reduce((sum, lesson) => sum + lesson.challenges.length, 0);
    expect(total).toBeGreaterThanOrEqual(10);
    expect(total).toBeLessThanOrEqual(15);
  });

  it('mỗi khu vực có tiến trình quan sát/khái niệm, thực hành, debug và boss', () => {
    for (const lesson of LESSONS) {
      const kinds = lesson.challenges.map((challenge) => challenge.kind);
      expect(kinds.some((kind) => kind === 'story' || kind === 'concept')).toBe(true);
      expect(kinds.some((kind) => kind === 'mission' || kind === 'sandbox')).toBe(true);
      expect(kinds).toContain('debug');
      expect(kinds).toContain('boss');
    }
  });
});

describe.each(LESSONS.map((lesson) => [lesson.id, lesson] as const))(
  'Nội dung khu vực %s',
  (_lessonId, lesson) => {
    it('có hướng dẫn tư duy đầy đủ', () => {
      const guide = lesson.conceptGuide;
      expect(guide.lessonId).toBe(lesson.id);
      expect(guide.bigQuestion).toContain('?');
      expect(guide.problem.painfulExample.length).toBeGreaterThan(20);
      expect(guide.solution.cleanExample.length).toBeGreaterThan(20);
      expect(guide.thinkingSteps.length).toBeGreaterThanOrEqual(4);
      expect(guide.misconceptions.length).toBeGreaterThanOrEqual(3);
    });

    it('checkpoint có 8–12 câu, ít nhất 5 dạng và có tự đánh giá', () => {
      const questions = lesson.exitTicket.questions;
      expect(questions.length).toBeGreaterThanOrEqual(8);
      expect(questions.length).toBeLessThanOrEqual(12);
      expect(new Set(questions.map((question) => question.type)).size).toBeGreaterThanOrEqual(5);
      expect(questions.some((question) => question.type === 'self-assess')).toBe(true);
      for (const question of questions.filter((item) => item.type !== 'self-assess')) {
        assertValidCheckpointAnswer(question);
      }
    });

    describe.each(lesson.challenges.map((challenge) => [challenge.id, challenge] as const))(
      'Màn %s',
      (_challengeId, challenge) => {
        it('có mục tiêu, phần thưởng và ba cấp gợi ý tăng dần', () => {
          expect(challenge.story.length).toBeGreaterThan(20);
          expect(challenge.instructions.length).toBeGreaterThan(0);
          expect(challenge.testCases.some((test) => test.required)).toBe(true);
          expect(challenge.xpReward).toBeGreaterThan(0);
          expect(challenge.hints.map((hint) => hint.level)).toEqual([1, 2, 3]);
          expect(challenge.hints.map((hint) => hint.type)).toEqual(['question', 'structure', 'skeleton']);
          expect(challenge.hints[0].content).not.toContain('```');
        });

        it('starter code phân tích được, trừ màn debug cú pháp có chủ đích', () => {
          let parsed = true;
          try { parse(tokenize(challenge.starterCode).tokens); } catch { parsed = false; }
          if (challenge.kind !== 'debug') expect(parsed).toBe(true);
        });

        it('đáp án mẫu thật sự vượt qua tất cả mục tiêu bắt buộc', () => {
          expect(challenge.solution).toBeTruthy();
          const result = analyzeChallenge(challenge.solution!, challenge);
          if (!result.isCorrect) {
            throw new Error(`${challenge.id}: ${result.diagnostics.map((item) => `[${item.code}] ${item.message}`).join('\n')}`);
          }
          expect(result.isCorrect).toBe(true);
          expect(result.cleanCode.score).toBeGreaterThanOrEqual(80);
        });

        it('starter code chưa vượt sẵn, trừ màn quan sát', () => {
          if (challenge.kind === 'story') return;
          expect(analyzeChallenge(challenge.starterCode, challenge).isCorrect).toBe(false);
        });
      },
    );
  },
);

function assertValidCheckpointAnswer(question: ExitTicketQuestion) {
  if (question.type === 'multiple-answer') {
    expect(question.correctIndices?.length).toBeGreaterThanOrEqual(2);
    return;
  }
  if (question.type === 'ordering') {
    expect(question.correctOrder).toHaveLength(question.options.length);
    return;
  }
  if (question.type === 'matching') {
    expect(question.matches?.length).toBeGreaterThan(0);
    return;
  }
  if (question.type === 'fill-code') {
    expect(question.acceptedAnswers?.length).toBeGreaterThan(0);
    return;
  }
  expect(question.correctIndex).toBeDefined();
}
