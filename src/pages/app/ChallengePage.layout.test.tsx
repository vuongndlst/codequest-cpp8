import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChallengePage } from './ChallengePage';
import { playSound, setGameMusicActive } from '@/services/audio';

vi.mock('@/services/audio', () => ({
  playSound: vi.fn(),
  setGameMusicActive: vi.fn(),
}));

vi.mock('@/components/editor/CodeEditor', () => ({
  CodeEditor: () => <div data-testid="editor" />,
}));
vi.mock('@/components/game/GameStage', () => ({
  GameStage: () => <div data-testid="game-stage" />,
}));

vi.mock('@/hooks/useChallengeSession', () => ({
  useChallengeSession: () => ({
    code: '',
    setCode: vi.fn(),
    isRestoring: false,
    result: null,
    isRunning: false,
    run: vi.fn(),
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
    attemptsBeforeSolution: 4,
  }),
}));

const LESSON_ID = 'l3';
const CHALLENGE_WITH_WORLD = 'l3-c4-mission';

function renderChallenge(lessonId = LESSON_ID, challengeId = CHALLENGE_WITH_WORLD) {
  return render(
    <MemoryRouter initialEntries={[`/app/lesson/${lessonId}/challenge/${challengeId}`]}>
      <Routes>
        <Route path="/app/lesson/:lessonId/challenge/:challengeId" element={<ChallengePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Bố cục màn hình làm nhiệm vụ', () => {
  it('tắt nhạc ngay khi rời khỏi màn chơi', () => {
    const { unmount } = renderChallenge();
    unmount();

    expect(setGameMusicActive).toHaveBeenCalledWith(false);
  });

  it('đi theo đúng một trục: nhiệm vụ → bản đồ → code', () => {
    renderChallenge();

    const map = screen.getByRole('heading', { name: 'Quan sát bản đồ' });
    const requirement = screen.getByRole('heading', { name: 'Nhiệm vụ của em' });
    const code = screen.getByRole('heading', { name: 'Viết code của em' });

    expect(requirement.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(map.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('bản đồ nằm trong bàn chơi lớn và có nút Chạy code ngay trên đó', () => {
    renderChallenge();

    const mapHeading = screen.getByRole('heading', { name: 'Quan sát bản đồ' });
    const board = mapHeading.closest('section');
    expect(board).not.toBeNull();
    expect(board?.contains(screen.getByRole('button', { name: 'Chạy code' }))).toBe(true);
  });

  it('phát âm thanh phản hồi ngay khi học sinh bấm Chạy code', async () => {
    const user = userEvent.setup();
    renderChallenge('l1', 'l1-c1-observe');

    await user.click(screen.getByRole('button', { name: 'Bắt đầu nhiệm vụ' }));
    await user.click(screen.getByRole('button', { name: '3 ô' }));
    await user.click(screen.getByRole('button', { name: 'Chạy và quan sát' }));
    expect(playSound).toHaveBeenCalledWith('click');
  });

  it('bảng lệnh nằm SAU editor và chỉ đóng vai trò thanh phím tắt', () => {
    renderChallenge();

    const editor = screen.getByTestId('editor');
    const palette = screen.getByRole('heading', { name: 'Lệnh cần cho nhiệm vụ' });

    expect(editor.compareDocumentPosition(palette) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('gợi ý nằm cùng khu vực code nhưng mặc định chỉ là một nút gọn', () => {
    const { container } = renderChallenge();

    const editorCard = screen.getByTestId('editor').closest('section.rounded-2xl');
    const hints = container.querySelector('[data-panel="hints"]');

    expect(hints).not.toBeNull();
    expect(editorCard?.contains(hints)).toBe(true);
    expect(screen.getByRole('button', { name: 'Gợi ý' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Byte gợi ý')).not.toBeInTheDocument();
  });

  it('có đủ ba chế độ Thường, Nhanh và Từng bước', () => {
    renderChallenge();

    for (const label of ['Thường', 'Nhanh', 'Từng bước']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('màn đầu tiên đặt map và code trong cùng game workspace, không còn bài giảng dọc', () => {
    const { unmount } = renderChallenge('l1', 'l1-c1-observe');

    const workspace = screen.getByRole('region', { name: 'Không gian nhiệm vụ đầu tiên' });
    const editor = screen.getByTestId('editor');
    const map = screen.getByTestId('game-stage');
    expect(workspace).toContainElement(map);
    expect(workspace).toContainElement(editor);
    expect(screen.getByRole('button', { name: 'Bắt đầu nhiệm vụ' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Khám phá lệnh đầu tiên' })).not.toBeInTheDocument();

    unmount();
    renderChallenge('l1', 'l1-c2-concept');
    expect(screen.getByRole('heading', { name: 'Viết code của em' })).toBeInTheDocument();
  });
});
