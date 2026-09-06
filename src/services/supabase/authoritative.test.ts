import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitChallengeRun } from './authoritative.repo';
import { isRetriableError } from '@/services/offlineQueue';

const invoke = vi.hoisted(() => vi.fn());
vi.mock('./client', () => ({ requireSupabase: () => ({ functions: { invoke } }) }));
const input = { lessonId: 'a0', challengeId: 'a0-c1', code: 'int main() {}', hintLevelUsed: 0 };
beforeEach(() => invoke.mockReset());
describe('Phân loại lỗi chấm bài để giữ bài chờ gửi', () => {
  for (const status of [429, 500, 502, 503, 504]) {
    it(`HTTP ${status} được phép gửi lại`, async () => {
      invoke.mockResolvedValue({ data: null, error: { context: new Response('{}', { status }) } });
      const error = await submitChallengeRun(input).catch(error => error);
      expect(isRetriableError(error)).toBe(true);
    });
  }
  it('khóa nhiệm vụ là lỗi quyền, không gửi liên tục', async () => {
    invoke.mockResolvedValue({ data: null, error: { context: new Response(JSON.stringify({ error: 'NHIEM_VU_CHUA_MO' }), { status: 403 }) } });
    const error = await submitChallengeRun(input).catch(error => error);
    expect(isRetriableError(error)).toBe(false);
    expect(error.message).toContain('Nhiệm vụ chưa mở');
  });
});
