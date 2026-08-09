import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

/*
  jsdom không dựng bố cục nên không có `scrollIntoView`. Khung hội thoại dùng
  hàm này để cuộn xuống tin mới nhất.

  Đây là giới hạn của môi trường test, không phải lỗi sản phẩm — trình duyệt
  thật đã hỗ trợ hàm này từ rất lâu.
*/
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// jsdom chưa cài đặt sẵn matchMedia — nhiều component đọc prefers-reduced-motion
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
