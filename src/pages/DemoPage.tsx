import { ChallengePage } from '@/pages/app/ChallengePage';
import { useSearchParams } from 'react-router-dom';
import { getChallenge } from '@/lessons';

/** Demo mở thẳng vào cùng game workspace mà học sinh thật sử dụng. */
export function DemoPage() {
  const [searchParams] = useSearchParams();
  const requestedLesson = searchParams.get('lesson') ?? 'a0';
  const requestedChallenge = searchParams.get('challenge') ?? 'a0-c1-first-program';
  const challenge = getChallenge(requestedLesson, requestedChallenge);
  const lessonId = challenge?.lessonId ?? 'a0';
  const challengeId = challenge?.id ?? 'a0-c1-first-program';

  return <ChallengePage lessonIdOverride={lessonId} challengeIdOverride={challengeId} persist={false} demo />;
}
