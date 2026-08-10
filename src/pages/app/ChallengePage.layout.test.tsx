import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChallengePage } from './ChallengePage';
import { playSound, setGameMusicActive } from '@/services/audio';

vi.mock('@/services/audio', () => ({ playSound:vi.fn(), setGameMusicActive:vi.fn() }));
vi.mock('@/components/editor/CodeEditor', () => ({ CodeEditor:() => <div data-testid="editor" /> }));
vi.mock('@/components/game/GameStage', () => ({ GameStage:() => <div data-testid="game-stage" /> }));
vi.mock('@/hooks/useChallengeSession', () => ({ useChallengeSession:() => ({
  code:'', setCode:vi.fn(), isRestoring:false, result:null, isRunning:false, run:vi.fn(), reset:vi.fn(), saveState:'idle',
  hintLevel:0, unlockNextHint:vi.fn(), attemptCount:0, canViewSolution:false, solutionVisible:false, showSolution:vi.fn(),
  highlightedLines:[], playKey:0, justCompleted:false, xpAwarded:0, gemsAwarded:0, newBadges:[], dismissBadges:vi.fn(), attemptsBeforeSolution:6,
}) }));

function renderChallenge() {
  return render(<MemoryRouter initialEntries={['/app/lesson/a1/challenge/a1-c3-obstacle-route']}><Routes>
    <Route path="/app/lesson/:lessonId/challenge/:challengeId" element={<ChallengePage />} />
  </Routes></MemoryRouter>);
}

describe('Stage chung cho mọi nhiệm vụ', () => {
  it('đi theo đúng trục Nhiệm vụ → Map lớn → Code', () => {
    renderChallenge();
    const mission=screen.getByRole('heading',{name:'Nhiệm vụ của em'});
    const map=screen.getByRole('heading',{name:'Quan sát bản đồ'});
    const code=screen.getByRole('heading',{name:'Chương trình của em'});
    expect(mission.compareDocumentPosition(map)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(map.compareDocumentPosition(code)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('đặt Run trên map và chỉ có một nút Run', async () => {
    const user=userEvent.setup(); renderChallenge();
    const buttons=screen.getAllByRole('button',{name:'Chạy code'});
    expect(buttons).toHaveLength(1);
    const board=screen.getByRole('heading',{name:'Quan sát bản đồ'}).closest('section');
    expect(board).toContainElement(buttons[0]);
    await user.click(buttons[0]);
    expect(playSound).toHaveBeenCalledWith('click');
  });

  it('editor nằm dưới map và coach không có nút chèn code', () => {
    renderChallenge();
    const editor=screen.getByTestId('editor');
    const palette=screen.getByRole('heading',{name:'Nhắc lệnh khi em gõ'});
    expect(editor.compareDocumentPosition(palette)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button',{name:/moveRight/i})).not.toBeInTheDocument();
  });

  it('có ba chế độ chạy và reset code tách riêng', () => {
    renderChallenge();
    for (const label of ['Thường','Nhanh','Từng bước']) expect(screen.getByRole('button',{name:label})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Khôi phục code'})).toBeInTheDocument();
  });

  it('tắt nhạc khi rời stage', () => {
    const {unmount}=renderChallenge(); unmount();
    expect(setGameMusicActive).toHaveBeenCalledWith(false);
  });
});
