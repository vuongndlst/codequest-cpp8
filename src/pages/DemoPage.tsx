import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChallenge } from '@/lessons';
import { useChallengeSession } from '@/hooks/useChallengeSession';
import { FirstMissionWorkspace } from '@/components/learning/FirstMissionWorkspace';
import { useStageReplay, type ReplaySpeed } from '@/components/game/useStageReplay';
import { VictoryPanel } from '@/components/game/VictoryPanel';
import { Button } from '@/components/ui/Button';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { useUiStore } from '@/stores/uiStore';
import { setGameMusicActive } from '@/services/audio';

const DEMO_LESSON_ID = 'l1';
const DEMO_CHALLENGE_ID = 'l1-c1-observe';
const NO_WORLD_EVENTS: never[] = [];

/** Demo mở thẳng vào cùng game workspace mà học sinh thật sử dụng. */
export function DemoPage() {
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>('normal');
  const [demoAvatarId, setDemoAvatarId] = useState('guardian-cyan');
  const soundEnabled = useUiStore((state) => state.soundEnabled);
  const toggleSound = useUiStore((state) => state.toggleSound);
  const musicEnabled = useUiStore((state) => state.musicEnabled);
  const toggleMusic = useUiStore((state) => state.toggleMusic);
  const challenge = getChallenge(DEMO_LESSON_ID, DEMO_CHALLENGE_ID);
  const session = useChallengeSession({ challenge: challenge!, persist: false });
  const replay = useStageReplay(
    session.result?.worldEvents ?? NO_WORLD_EVENTS,
    session.playKey,
    replaySpeed,
  );

  useEffect(() => {
    setGameMusicActive(true);
    return () => setGameMusicActive(false);
  }, []);

  if (!challenge) return <NotFoundPage />;

  return (
    <div className="px-2 py-2 sm:px-4 sm:py-3">
      <FirstMissionWorkspace
        challenge={challenge}
        session={session}
        replay={replay}
        replaySpeed={replaySpeed}
        onReplaySpeedChange={setReplaySpeed}
        avatarId={demoAvatarId}
        account={{
          name: 'Nhà thám hiểm Demo',
          level: 6,
          totalXp: 1420,
          gems: 320,
          isGuest: true,
        }}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        musicEnabled={musicEnabled}
        onToggleMusic={toggleMusic}
        onAvatarChange={setDemoAvatarId}
        accountHref="/auth/register"
        accountActionLabel="Tạo tài khoản miễn phí"
        demoAllAccess
        successPanel={
          <VictoryPanel
            challenge={challenge}
            result={session.result}
            xpAwarded={15}
            gemsAwarded={3}
            onNext={() => { window.location.hash = '#/auth/register'; }}
            nextLabel="Tạo tài khoản để tiếp tục"
            secondaryAction={
              <Link to="/">
                <Button variant="secondary">Về trang giới thiệu</Button>
              </Link>
            }
          />
        }
      />
    </div>
  );
}
