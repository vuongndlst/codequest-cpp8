import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  isThemePreference,
  readStoredTheme,
  resolveTheme,
} from './theme';

function mockSystemPrefersLight(prefersLight: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: prefersLight,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('Quy đổi lựa chọn giao diện', () => {
  it('chọn thẳng sáng hoặc tối thì giữ nguyên, không hỏi hệ điều hành', () => {
    mockSystemPrefersLight(true);
    expect(resolveTheme('dark')).toBe('dark');

    mockSystemPrefersLight(false);
    expect(resolveTheme('light')).toBe('light');
  });

  it('chọn "theo máy" thì đi theo cài đặt hệ điều hành', () => {
    mockSystemPrefersLight(true);
    expect(resolveTheme('system')).toBe('light');

    mockSystemPrefersLight(false);
    expect(resolveTheme('system')).toBe('dark');
  });

  /** Trình duyệt cũ không có `matchMedia` thì vẫn phải chạy, không được vỡ trang. */
  it('không có matchMedia thì lùi về giao diện tối', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(resolveTheme('system')).toBe('dark');
  });
});

describe('Đọc lựa chọn đã lưu', () => {
  it('chưa chọn lần nào thì mặc định theo máy', () => {
    expect(readStoredTheme()).toBe('system');
  });

  it('đọc lại đúng lựa chọn của lần trước', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(readStoredTheme()).toBe('light');
  });

  it('giá trị hỏng trong localStorage không làm vỡ trang', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'xanh-la');
    expect(readStoredTheme()).toBe('system');
  });

  it('nhận đúng ba lựa chọn hợp lệ', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('auto')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe('Ghi giao diện lên thẻ html', () => {
  it('đặt data-theme để CSS đổi toàn bộ biến màu', () => {
    mockSystemPrefersLight(false);
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

/**
 * `index.html` nạp một script chạy TRƯỚC React để trang không chớp sai màu lúc
 * tải. File riêng giúp CSP không phải cho phép inline script, nhưng vẫn phải
 * đọc đúng khoá localStorage mà `theme.ts` ghi vào.
 *
 * Hai nơi lệch nhau một ký tự thì lựa chọn của học sinh vẫn được lưu, vẫn được
 * đọc lại — nhưng mỗi lần mở trang sẽ chớp một nhịp màu ngược. Lỗi âm thầm,
 * không có thông báo nào, và rất khó lần ra nguyên nhân.
 */
describe('Script chống nháy màu trong index.html', () => {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const bootstrap = readFileSync(resolve(process.cwd(), 'public/theme-init.js'), 'utf8');

  it('dùng đúng khoá localStorage mà theme.ts ghi vào', () => {
    expect(bootstrap).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
  });

  it('nạp script đặt data-theme trong thẻ head, trước khi React chạy', () => {
    const headEnd = html.indexOf('</head>');
    const script = html.indexOf('<script src="./theme-init.js"></script>');

    expect(script).toBeGreaterThan(-1);
    expect(script).toBeLessThan(headEnd);
    expect(bootstrap).toContain('document.documentElement.dataset.theme');
  });

  it('hỏi hệ điều hành bằng cùng một câu truy vấn với theme.ts', () => {
    expect(bootstrap).toContain('(prefers-color-scheme: light)');
  });
});
