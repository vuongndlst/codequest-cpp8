/**
 * Giao diện sáng / tối.
 *
 * Tách khỏi store Zustand vì đoạn script chống nháy màu trong `index.html`
 * cũng phải dùng đúng những hằng số này. Hai nơi lệch nhau một ký tự là trang
 * sẽ chớp một nhịp sai màu mỗi lần tải — lỗi khó lần ra nhất trong nhóm này.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'cq8:theme';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    // localStorage bị chặn (chế độ riêng tư) — coi như chưa chọn gì
    return 'system';
  }
}

export function systemTheme(): ResolvedTheme {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

/**
 * Ghi giao diện lên thẻ `<html>`.
 *
 * CSS chỉ nhìn thuộc tính `data-theme`; mọi biến màu được đặt lại từ đó.
 */
export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Theo máy',
  light: 'Sáng',
  dark: 'Tối',
};
