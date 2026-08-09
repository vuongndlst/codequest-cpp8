import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { JoinClassPage } from './JoinClassPage';
import { useAuthStore } from '@/stores/authStore';
import { fetchMyClass, joinClassByCode, type ClassRow } from '@/services/supabase/classes.repo';

vi.mock('@/services/supabase/classes.repo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/supabase/classes.repo')>();
  return {
    ...actual,
    fetchMyClass: vi.fn(),
    joinClassByCode: vi.fn(),
  };
});

function makeClass(overrides: Partial<ClassRow> = {}): ClassRow {
  return {
    id: 'c1',
    name: '8A1',
    join_code: '8A1-K7MQ',
    school_year: null,
    note: null,
    is_open: true,
    created_by: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function renderPage(initialEntry = '/app/join-class') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <JoinClassPage />
    </MemoryRouter>,
  );
}

describe('Học sinh nhập mã lớp', () => {
  beforeEach(() => {
    vi.mocked(fetchMyClass).mockResolvedValue(null);
    vi.mocked(joinClassByCode).mockReset();
    // Nạp lại hồ sơ sau khi vào lớp — không cần gọi mạng thật trong test
    useAuthStore.setState({ refreshProfile: async () => {} });
  });

  it('vào lớp thành công thì báo rõ em đang ở lớp nào', async () => {
    const user = userEvent.setup();
    vi.mocked(joinClassByCode).mockResolvedValue(makeClass());

    renderPage();
    await user.type(await screen.findByLabelText(/mã lớp/i), '8A1-K7MQ');
    await user.click(screen.getByRole('button', { name: /vào lớp/i }));

    expect(await screen.findByText(/em đã vào lớp/i)).toBeInTheDocument();
    expect(screen.getByText('8A1')).toBeInTheDocument();
  });

  /**
   * Mã sai là tình huống xảy ra nhiều nhất trong lớp học thật — em chép nhầm
   * một chữ từ bảng. Thông báo phải nói được PHẢI LÀM GÌ tiếp theo, không phải
   * chỉ báo là sai.
   */
  it('mã sai thì báo bằng tiếng Việt và giữ em ở lại form', async () => {
    const user = userEvent.setup();
    vi.mocked(joinClassByCode).mockRejectedValue(
      new Error('Mã lớp không đúng. Em kiểm tra lại xem có gõ nhầm chữ nào không.'),
    );

    renderPage();
    await user.type(await screen.findByLabelText(/mã lớp/i), 'SAI-CODE');
    await user.click(screen.getByRole('button', { name: /vào lớp/i }));

    expect(await screen.findByText(/mã lớp không đúng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mã lớp/i)).toBeInTheDocument();
  });

  it('mã để trống thì không gọi lên máy chủ', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /vào lớp/i }));

    expect(await screen.findByText(/chưa nhập mã lớp/i)).toBeInTheDocument();
    expect(vi.mocked(joinClassByCode)).not.toHaveBeenCalled();
  });

  it('mã lớp tự chuyển thành chữ hoa để em khỏi phải giữ phím Shift', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByLabelText(/mã lớp/i);
    await user.type(input, '8a1-k7mq');

    expect(input).toHaveValue('8A1-K7MQ');
  });

  it('em đã có lớp thì được báo trước là sẽ chuyển lớp', async () => {
    vi.mocked(fetchMyClass).mockResolvedValue(makeClass({ name: '8A9' }));
    renderPage();

    expect(await screen.findByText(/em đang ở lớp/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chuyển sang lớp này/i })).toBeInTheDocument();
  });

  it('mở từ link mời thì mã đã điền sẵn', async () => {
    renderPage('/app/join-class?lop=8A1-K7MQ');
    expect(await screen.findByLabelText(/mã lớp/i)).toHaveValue('8A1-K7MQ');
  });
});
