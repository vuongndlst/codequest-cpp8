import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ChallengePage } from './ChallengePage';

/*
  Thay các thành phần nặng bằng bản giả: CodeMirror và sân khấu game đều cần
  đo đạc kích thước thật, jsdom không dựng nổi. Test này chỉ quan tâm THỨ TỰ và
  VỊ TRÍ của các khối trên trang, không quan tâm chúng vẽ ra cái gì.
*/
vi.mock('@/components/editor/CodeEditor', () => ({
  CodeEditor: () => <div data-testid="editor" />,
}));
vi.mock('@/components/game/WorldStage', () => ({
  WorldStage: () => <div data-testid="world-stage" />,
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

/** Nhiệm vụ CÓ sân khấu game — để kiểm tra được cả vị trí của sân khấu. */
const LESSON_ID = 'l3';
const CHALLENGE_WITH_WORLD = 'l3-c4-mission';

function renderChallenge(challengeId = CHALLENGE_WITH_WORLD) {
  return render(
    <MemoryRouter initialEntries={[`/app/lesson/${LESSON_ID}/challenge/${challengeId}`]}>
      <Routes>
        <Route path="/app/lesson/:lessonId/challenge/:challengeId" element={<ChallengePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * Bố cục màn hình làm nhiệm vụ.
 *
 * Test này ra đời từ phản ánh của thầy Vương: bảng gợi ý nằm cuối cột TRÁI,
 * dưới đề bài và sân khấu game, còn ô viết code ở cột PHẢI. Học sinh đang gõ
 * dở mà cần gợi ý thì phải cuộn xuống, liếc sang trái, rồi cuộn ngược lên tìm
 * lại chỗ đang viết.
 *
 * Đây là loại lỗi không có test nào bắt được — mọi thành phần đều hiển thị
 * đúng, chỉ nằm sai chỗ. Nên phải kiểm tra thẳng vào quan hệ vị trí.
 */
describe('Bố cục màn hình làm nhiệm vụ', () => {
  it('gợi ý phải nằm CÙNG CỘT với ô viết code', () => {
    const { container } = renderChallenge();

    const editor = screen.getByTestId('editor');
    const hintPanel = container.querySelector('[data-panel="hints"]');
    expect(hintPanel).not.toBeNull();

    /*
      "Cùng cột" = có chung một tổ tiên là khối cột phải. Kiểm tra bằng cách
      tìm khối cột gần nhất chứa editor, rồi khẳng định nó chứa cả gợi ý.
    */
    const workColumn = editor.closest('.lg\\:col-span-3');
    expect(workColumn).not.toBeNull();
    expect(workColumn?.contains(hintPanel!)).toBe(true);
  });

  it('gợi ý nằm SAU ô viết code, không phải trước', () => {
    const { container } = renderChallenge();

    const editor = screen.getByTestId('editor');
    const hintPanel = container.querySelector('[data-panel="hints"]')!;

    // Node.DOCUMENT_POSITION_FOLLOWING = 4 -> hintPanel đứng sau editor
    expect(editor.compareDocumentPosition(hintPanel) & Node.DOCUMENT_POSITION_FOLLOWING).
      toBeTruthy();
  });

  it('sân khấu game nằm cùng cột làm việc để em thấy ngay khi bấm Chạy', () => {
    const { container } = renderChallenge();

    const stage = screen.getByTestId('world-stage');
    const workColumn = container.querySelector('.lg\\:col-span-3');

    expect(workColumn?.contains(stage)).toBe(true);
  });

  it('cột đề bài dính theo màn hình để em khỏi cuộn ngược lên đọc lại', () => {
    const { container } = renderChallenge();

    const briefing = container.querySelector('.lg\\:col-span-2');
    expect(briefing?.className).toContain('lg:sticky');
  });
});
