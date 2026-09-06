import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubmissionSyncStatus } from './SubmissionSyncStatus';
const mocks = vi.hoisted(() => ({ read: vi.fn(), retry: vi.fn() }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { id: 'u1' } }) }));
vi.mock('@/services/offlineQueue', () => ({ QUEUE_CHANGED_EVENT: 'queue-change', readQueue: mocks.read, retryCurrentUserQueue: mocks.retry }));
beforeEach(() => { mocks.read.mockReturnValue([]); mocks.retry.mockResolvedValue({}); });
describe('Thông báo bài chờ đồng bộ', () => {
  it('ẩn khi không có bài của học sinh hiện tại', () => {
    mocks.read.mockReturnValue([{ payload: { userId: 'u2' } }]);
    render(<SubmissionSyncStatus />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('cập nhật khi hàng đợi thay đổi và cho gửi lại bài bị giữ', async () => {
    render(<SubmissionSyncStatus />);
    mocks.read.mockReturnValue([{ payload: { userId: 'u1' }, blocked: true }]);
    act(() => window.dispatchEvent(new Event('queue-change')));
    expect(screen.getByRole('status')).toHaveTextContent('1 bài chờ xác nhận');
    fireEvent.click(screen.getByRole('button', { name: 'Đồng bộ lại' }));
    await waitFor(() => expect(mocks.retry).toHaveBeenCalled());
  });
});
