import { create } from 'zustand';

const REDUCED_MOTION_KEY = 'cq8:reduced-motion';

function readStoredPreference(): boolean {
  try {
    return localStorage.getItem(REDUCED_MOTION_KEY) === 'true';
  } catch {
    return false;
  }
}

interface UiState {
  /** Học sinh tự bật chế độ giảm chuyển động (mục 17) */
  reducedMotion: boolean;
  /** Sổ tay lệnh đang mở dạng modal */
  handbookOpen: boolean;
  /** Trạng thái kết nối mạng */
  isOnline: boolean;

  setReducedMotion: (value: boolean) => void;
  toggleReducedMotion: () => void;
  setHandbookOpen: (value: boolean) => void;
  setOnline: (value: boolean) => void;
  initialize: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  reducedMotion: false,
  handbookOpen: false,
  isOnline: true,

  setReducedMotion: (value) => {
    set({ reducedMotion: value });
    try {
      localStorage.setItem(REDUCED_MOTION_KEY, String(value));
    } catch {
      // localStorage bị chặn (chế độ riêng tư) — bỏ qua, tính năng vẫn chạy trong phiên
    }
    document.documentElement.dataset.reducedMotion = String(value);
  },

  toggleReducedMotion: () => get().setReducedMotion(!get().reducedMotion),

  setHandbookOpen: (value) => set({ handbookOpen: value }),
  setOnline: (value) => set({ isOnline: value }),

  /** Đọc cài đặt đã lưu + lắng nghe sự kiện online/offline. Gọi một lần khi khởi động. */
  initialize: () => {
    const stored = readStoredPreference();
    set({ reducedMotion: stored, isOnline: navigator.onLine });
    document.documentElement.dataset.reducedMotion = String(stored);

    window.addEventListener('online', () => set({ isOnline: true }));
    window.addEventListener('offline', () => set({ isOnline: false }));
  },
}));
