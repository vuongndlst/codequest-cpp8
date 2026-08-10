import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getChallenge } from '@/lessons';
import { FirstMissionWorkspace } from './FirstMissionWorkspace';

vi.mock('@/services/audio', () => ({ playSound: vi.fn() }));
vi.mock('@/components/game/GameStage', () => ({
  GameStage: () => <div data-testid="game-stage" />,
}));
vi.mock('@/components/game/MapSettingsMenu', () => ({
  MapSettingsMenu: () => <button type="button">Tùy chỉnh bản đồ</button>,
}));
vi.mock('@/components/learning/HintPanel', () => ({
  HintPanel: () => <button type="button">Gợi ý</button>,
}));
vi.mock('@/components/editor/CodeEditor', () => ({
  CodeEditor: ({ value, onChange, readOnly }: { value: string; onChange: (value: string) => void; readOnly: boolean }) => (
    <div data-testid="editor" data-readonly={String(readOnly)}>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(value.replace('    moveForward();\n', ''))}
      >
        Xóa một dòng thử nghiệm
      </button>
    </div>
  ),
}));

const challenge = getChallenge('l1', 'l1-c1-observe')!;

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    code: challenge.starterCode,
    setCode: vi.fn(),
    isRestoring: false,
    result: null,
    isRunning: false,
    run: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
    saveState: 'idle',
    hintLevel: 0,
    unlockNextHint: vi.fn(),
    attemptCount: 0,
    canViewSolution: false,
    solutionVisible: false,
    showSolution: vi.fn(),
    highlightedLines: [],
    playKey: 0,
    justCompleted: false,
    xpAwarded: 0,
    newBadges: [],
    dismissBadges: vi.fn(),
    attemptsBeforeSolution: 6,
    ...overrides,
  };
}

const idleReplay = {
  playedCount: 0,
  total: 0,
  isPlaying: false,
  isDone: false,
  stepForward: vi.fn(),
  skipToEnd: vi.fn(),
};

function workspace(session: ReturnType<typeof makeSession>, replay = idleReplay) {
  return (
    <MemoryRouter>
      <FirstMissionWorkspace
        challenge={challenge}
        session={session as never}
        replay={replay}
        replaySpeed="normal"
        onReplaySpeedChange={vi.fn()}
        avatarId="guardian-cyan"
        account={{ name: 'Minh An', level: 1, totalXp: 0 }}
        soundEnabled
        onToggleSound={vi.fn()}
        onAvatarChange={vi.fn()}
        accountHref="/app/profile"
        accountActionLabel="Mở hồ sơ"
      />
    </MemoryRouter>
  );
}

beforeEach(() => vi.clearAllMocks());

describe('Game workspace của nhiệm vụ đầu tiên', () => {
  it('briefing xuất hiện trước, sau đó bắt học sinh dự đoán mới được chạy', async () => {
    const user = userEvent.setup();
    const session = makeSession();
    render(workspace(session));

    expect(screen.getByRole('heading', { name: 'Byte không thể tự đi' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bắt đầu nhiệm vụ' }));

    const runButton = screen.getByRole('button', { name: 'Chạy và quan sát' });
    expect(runButton).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '2 ô' }));
    expect(runButton).toBeEnabled();
    await user.click(runButton);
    expect(session.run).toHaveBeenCalledOnce();
  });

  it('khóa editor ở lần quan sát đầu và chỉ mở sau khi hoạt ảnh kết thúc', async () => {
    const user = userEvent.setup();
    let session = makeSession();
    const rendered = render(workspace(session));

    await user.click(screen.getByRole('button', { name: 'Bắt đầu nhiệm vụ' }));
    expect(screen.getByTestId('editor')).toHaveAttribute('data-readonly', 'true');
    await user.click(screen.getByRole('button', { name: '3 ô' }));
    await user.click(screen.getByRole('button', { name: 'Chạy và quan sát' }));

    session = makeSession({
      playKey: 1,
      result: { isCorrect: true, worldEvents: [] },
    });
    rendered.rerender(workspace(session, { ...idleReplay, playedCount: 4, total: 4, isDone: true }));

    await waitFor(() => expect(screen.getByText(/Bây giờ xóa một dòng/)).toBeInTheDocument());
    expect(screen.getByTestId('editor')).toHaveAttribute('data-readonly', 'false');
  });

  it('buộc thử nghiệm xóa lệnh trước khi cho khôi phục và hoàn thành', async () => {
    const user = userEvent.setup();
    let session = makeSession();
    const rendered = render(workspace(session));

    await user.click(screen.getByRole('button', { name: 'Bắt đầu nhiệm vụ' }));
    await user.click(screen.getByRole('button', { name: '3 ô' }));
    await user.click(screen.getByRole('button', { name: 'Chạy và quan sát' }));

    session = makeSession({ playKey: 1, result: { isCorrect: true, worldEvents: [] } });
    const doneReplay = { ...idleReplay, playedCount: 4, total: 4, isDone: true };
    rendered.rerender(workspace(session, doneReplay));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Xóa một dòng thử nghiệm' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Xóa một dòng thử nghiệm' }));
    const shorterCode = challenge.starterCode.replace('    moveForward();\n', '');
    session = makeSession({ code: shorterCode, playKey: 1, result: { isCorrect: true, worldEvents: [] } });
    rendered.rerender(workspace(session, doneReplay));
    await user.click(screen.getByRole('button', { name: 'Chạy thử thay đổi' }));

    session = makeSession({ code: shorterCode, playKey: 2, result: { isCorrect: false, worldEvents: [] } });
    rendered.rerender(workspace(session, doneReplay));
    await waitFor(() => expect(screen.getByText(/Byte dừng sớm vì thiếu một lệnh/)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Khôi phục 3 lệnh' }));
    expect(session.reset).toHaveBeenCalledOnce();
  });
});
