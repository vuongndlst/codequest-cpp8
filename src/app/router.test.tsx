import { describe, expect, it } from 'vitest';
import { router } from './router';

/**
 * Test này canh một loại lỗi đã xảy ra thật một lần trong dự án: mọi thành
 * phần đều đúng, chỉ THIẾU SỢI DÂY NỐI giữa chúng.
 *
 * Lần trước là tài khoản giáo viên không có mục điều hướng nào dẫn sang khu
 * vực giáo viên. Lần này rủi ro tương tự nằm ở chuỗi phụ thuộc:
 *
 *     giáo viên tạo lớp → lấy mã lớp → học sinh nhập mã
 *
 * Thiếu bất kỳ route nào trong chuỗi là cả tính năng quản lý lớp thành vô
 * dụng, mà không có test đơn vị nào của từng trang phát hiện được.
 */
function collectPaths(): string[] {
  const paths: string[] = [];

  const walk = (routes: readonly { path?: string; children?: readonly unknown[] }[], prefix: string) => {
    for (const route of routes) {
      const segment = route.path ?? '';
      const full = segment.startsWith('/')
        ? segment
        : segment
          ? `${prefix.replace(/\/$/, '')}/${segment}`
          : prefix;

      paths.push(full);

      if (route.children) {
        walk(route.children as { path?: string; children?: readonly unknown[] }[], full);
      }
    }
  };

  walk(router.routes as { path?: string; children?: readonly unknown[] }[], '');
  return paths;
}

describe('Định tuyến — chuỗi quản lý lớp phải nối đủ', () => {
  const paths = collectPaths();

  it('có trang danh sách lớp của giáo viên', () => {
    expect(paths).toContain('/teacher/classes');
  });

  it('có trang chi tiết từng lớp', () => {
    expect(paths).toContain('/teacher/classes/:classId');
  });

  it('có trang nhập mã lớp cho học sinh đã có tài khoản', () => {
    expect(paths).toContain('/app/join-class');
  });

  it('vẫn giữ các trang cũ của học sinh', () => {
    for (const path of ['/app/profile', '/app/certificates', '/auth/register']) {
      expect(paths).toContain(path);
    }
  });
});
