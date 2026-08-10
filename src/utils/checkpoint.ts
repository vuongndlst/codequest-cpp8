import type { CheckpointAnswer, ExitTicketQuestion } from '@/types/content';

export const CHECKPOINT_PASS_SCORE = 70;

export interface CheckpointScore {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
}

/** Một nguồn sự thật cho cả node bản đồ và route checkpoint trực tiếp. */
export function canOpenCheckpoint(requiredChallengeIds: string[], completedChallengeIds: string[]) {
  return requiredChallengeIds.every((challengeId) => completedChallengeIds.includes(challengeId));
}

export function isQuestionAnswered(
  question: ExitTicketQuestion,
  answer: CheckpointAnswer | undefined,
): boolean {
  if (answer === undefined) return false;
  if (typeof answer === 'string') return answer.trim().length > 0;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === 'number') return Number.isInteger(answer);
  return question.matches?.every((pair) => answer[pair.left]?.trim().length > 0) ?? false;
}

export function isQuestionCorrect(
  question: ExitTicketQuestion,
  answer: CheckpointAnswer | undefined,
): boolean {
  if (question.type === 'self-assess') return true;
  if (!isQuestionAnswered(question, answer)) return false;

  if (question.type === 'multiple-answer') {
    if (!Array.isArray(answer) || !answer.every((item) => typeof item === 'number')) return false;
    return sameSet(answer as number[], question.correctIndices ?? []);
  }

  if (question.type === 'ordering') {
    if (!Array.isArray(answer) || !answer.every((item) => typeof item === 'string')) return false;
    const expected = question.correctOrder ?? [];
    return expected.length === answer.length && expected.every((item, index) => answer[index] === item);
  }

  if (question.type === 'matching') {
    if (typeof answer !== 'object' || Array.isArray(answer)) return false;
    return (question.matches ?? []).every((pair) => answer[pair.left] === pair.right);
  }

  if (question.type === 'fill-code') {
    if (typeof answer !== 'string') return false;
    const normalized = normalizeCode(answer);
    return (question.acceptedAnswers ?? []).some((expected) => normalizeCode(expected) === normalized);
  }

  return typeof answer === 'number' && answer === question.correctIndex;
}

export function scoreCheckpoint(
  questions: ExitTicketQuestion[],
  answers: Record<string, CheckpointAnswer>,
): CheckpointScore {
  const scored = questions.filter((question) => question.type !== 'self-assess');
  const correct = scored.filter((question) => isQuestionCorrect(question, answers[question.id])).length;
  const percent = Math.round((correct / Math.max(1, scored.length)) * 100);
  return { correct, total: scored.length, percent, passed: percent >= CHECKPOINT_PASS_SCORE };
}

function normalizeCode(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function sameSet(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort((x, y) => x - y);
  const b = [...right].sort((x, y) => x - y);
  return a.every((value, index) => value === b[index]);
}
