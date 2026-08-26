import { getChallenge, getLesson, getRequiredChallengeIds } from '@/lessons';
import { analyzeChallenge } from '@/validators';
import { scoreCheckpoint } from '@/utils/checkpoint';
import type { CheckpointAnswer } from '@/types/content';

/** Pure entry point bundled for the Supabase Edge runtime. */
export function gradeChallengeCode(lessonId: string, challengeId: string, code: string) {
  const challenge = getChallenge(lessonId, challengeId);
  if (!challenge || challenge.lessonId !== lessonId) {
    throw new Error('NHIEM_VU_KHONG_TON_TAI');
  }
  if (typeof code !== 'string' || code.length === 0 || code.length > 10_000) {
    throw new Error('CODE_KHONG_HOP_LE');
  }
  return analyzeChallenge(code, challenge);
}

export function gradeCheckpointAnswers(
  lessonId: string,
  answers: Record<string, CheckpointAnswer>,
) {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error('KHU_VUC_KHONG_TON_TAI');
  return {
    ...scoreCheckpoint(lesson.exitTicket.questions, answers),
    requiredChallengeIds: getRequiredChallengeIds(lessonId),
  };
}
