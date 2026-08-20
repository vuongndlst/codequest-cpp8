import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChallengePage } from './ChallengePage';
import { playSound, setGameMusicActive } from '@/services/audio';

vi.mock('@/services/audio', () => ({ playSound:vi.fn(), setGameMusicActive:vi.fn(), setGameMusicScene:vi.fn() }));
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
  async function enterMission() {
    const button = screen.queryByRole('button', { name: /Đã hiểu · (?:Bắt đầu|Xem API mới)/i });
    if (button) await userEvent.click(button);
    const apiButton = screen.queryByRole('button', { name: /Đã hiểu · Vào bản đồ/i });
    if (apiButton) await userEvent.click(apiButton);
  }

  it('đi theo đúng trục Nhiệm vụ → Map lớn → Code mà không thêm tiêu đề map', () => {
    renderChallenge();
    const mission=screen.getByRole('heading',{name:'Nhiệm vụ'});
    const map=screen.getByTestId('map-workspace');
    const code=screen.getByRole('heading',{name:'Chương trình của em'});
    expect(screen.getByRole('dialog', { name: /Vòng qua hồ độc/i })).toContainElement(mission);
    expect(map.compareDocumentPosition(code)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('heading',{name:'Quan sát bản đồ'})).not.toBeInTheDocument();
    expect(screen.queryByText(/^Bước 1$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Bước 2$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Học trong game:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Dự đoán trước khi chạy:/i)).not.toBeInTheDocument();
  });

  it('đặt Run ngay dưới editor và chỉ có một nút Run', async () => {
    const user=userEvent.setup(); renderChallenge();
    const buttons=screen.getAllByRole('button',{name:'Chạy code'});
    expect(buttons).toHaveLength(1);
    expect(screen.getByTestId('run-control-bar')).toContainElement(buttons[0]);
    expect(screen.getByTestId('editor-workspace')).toContainElement(screen.getByTestId('run-control-bar'));
    expect(screen.getByTestId('map-workspace')).not.toContainElement(buttons[0]);
    await user.click(buttons[0]);
    expect(playSound).toHaveBeenCalledWith('click');
  });

  it('desktop kiểu CodeCombat: briefing mở đầu, sau đó map trái và editor phải', async () => {
    renderChallenge();
    expect(screen.getByRole('dialog', { name: /Vòng qua hồ độc/i })).toBeInTheDocument();
    await enterMission();
    expect(screen.queryByTestId('mission-sidebar')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-workspace')).toHaveClass('lg:col-start-1','lg:row-start-1');
    expect(screen.getByTestId('editor-workspace')).toHaveClass('lg:col-start-2','lg:row-start-1');
    expect(screen.getByTestId('game-canvas')).toHaveClass('h-full', 'w-full');
    expect(screen.getByText(/Đồng Cỏ Thuật Toán · Nhiệm vụ 3\/5/i)).toBeInTheDocument();
  });

  it('giới thiệu Game API mới trước khi vào bản đồ và không cung cấp nút chèn code', async () => {
    const user = userEvent.setup();
    renderChallenge();
    await user.click(screen.getByRole('button', { name: /Đã hiểu · Xem API mới/i }));
    const apiDialog = screen.getByRole('dialog', { name: /Game API mới/i });
    expect(apiDialog).toHaveTextContent('moveUp();');
    expect(apiDialog).toHaveTextContent(/tự gõ/i);
    expect(within(apiDialog).queryByRole('button', { name: /moveUp/i })).not.toBeInTheDocument();
    await user.click(within(apiDialog).getByRole('button', { name: /Vào bản đồ/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mở kiến thức trong popup và đóng lại không rời nhiệm vụ', async () => {
    const user=userEvent.setup(); renderChallenge();
    await enterMission();
    await user.click(screen.getByRole('button',{name:'Xem lại kiến thức'}));
    expect(screen.getByRole('dialog',{name:/Ra lệnh cho nhân vật/i})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Đóng phần kiến thức'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'Chương trình của em'})).toBeInTheDocument();
  });

  it('editor nằm trong workspace và không còn khung nhắc lệnh rời', () => {
    renderChallenge();
    const editor=screen.getByTestId('editor');
    expect(screen.getByTestId('editor-workspace')).toContainElement(editor);
    expect(screen.queryByRole('heading',{name:'Nhắc lệnh khi em gõ'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:/moveRight/i})).not.toBeInTheDocument();
  });

  it('gom công cụ và bốn cách chạy trong một thanh điều khiển', () => {
    renderChallenge();
    const toolbar = screen.getByTestId('run-control-bar');
    const speedButton = screen.getByRole('button', { name: /Cách chạy: Thường/i });
    expect(toolbar).not.toHaveTextContent('Dọn code');
    expect(screen.queryByRole('button', { name: 'Dọn code' })).not.toBeInTheDocument();
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Khôi phục code' }));
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Tra lệnh' }));
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Gợi ý' }));
    expect(toolbar).toContainElement(speedButton);
    expect(screen.getByRole('button',{name:'Khôi phục code'})).toBeInTheDocument();
    expect(screen.queryByText(/Gõ code, chọn cách chạy/i)).not.toBeInTheDocument();
  });

  it('luôn hiện trạng thái map và đặt nút nhiệm vụ, kiến thức dưới editor', async () => {
    renderChallenge();
    await enterMission();
    expect(screen.getByTestId('stage-status-bar')).toHaveTextContent('Nhiệm vụ');
    expect(screen.getByTestId('stage-status-bar')).toHaveClass('absolute', 'bottom-0');
    const toolbar = screen.getByTestId('run-control-bar');
    expect(within(toolbar).getByRole('button', { name: 'Xem nhiệm vụ' })).toBeInTheDocument();
    expect(within(toolbar).getByRole('button', { name: 'Xem lại kiến thức' })).toBeInTheDocument();
  });

  it('đổi biểu tượng theo cách chạy đã chọn', async () => {
    const user = userEvent.setup(); renderChallenge();
    await enterMission();
    const speedButton = screen.getByRole('button', { name: /Cách chạy: Thường/i });
    expect(speedButton.querySelector('.lucide-circle-gauge')).toBeInTheDocument();
    await user.click(speedButton);
    await user.click(screen.getByRole('menuitemradio', { name: 'Nhanh' }));
    expect(screen.getByRole('button', { name: /Cách chạy: Nhanh/i }).querySelector('.lucide-rabbit')).toBeInTheDocument();
  });

  it('mở menu cách chạy gọn và có đủ bốn chế độ', async () => {
    const user = userEvent.setup(); renderChallenge();
    await user.click(screen.getByRole('button', { name: /Cách chạy: Thường/i }));
    for (const label of ['Chậm', 'Thường', 'Nhanh', 'Từng bước · Debug']) {
      expect(screen.getByRole('menuitemradio', { name: label })).toBeInTheDocument();
    }
  });

  it('tắt nhạc khi rời stage', () => {
    const {unmount}=renderChallenge(); unmount();
    expect(setGameMusicActive).toHaveBeenCalledWith(false);
  });
});
