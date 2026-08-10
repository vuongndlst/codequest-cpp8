import { create } from 'zustand';
import { preloadSounds, setSoundEnabled, unlockAudio } from '@/services/audio';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  readStoredTheme,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/utils/theme';

const REDUCED_MOTION_KEY = 'cq8:reduced-motion';
const SOUND_KEY = 'cq8:sound';

/**
 * Hiệu ứng âm thanh BẬT sẵn, nhưng âm lượng nhỏ.
 *
 * Bối cảnh là phòng máy 40 học sinh ngồi cạnh nhau. Tiếng động ngắn thì tạo
 * phản hồi tức thì mà không phá tiết học; nhạc nền dài thì có nút riêng và
 * TẮT sẵn — em nào đeo tai nghe mới bật.
 */
function readStoredSound(): boolean {
  try {
    const stored = localStorage.getItem(SOUND_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

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
  /** Lựa chọn giao diện: theo máy, sáng, hay tối */
  theme: ThemePreference;
  /** Giao diện đang thực sự hiển thị — `theme: 'system'` đã được quy đổi */
  resolvedTheme: ResolvedTheme;
  /** Hiệu ứng âm thanh của trò chơi */
  soundEnabled: boolean;
  /** Sổ tay lệnh đang mở dạng modal */
  handbookOpen: boolean;
  /** Trạng thái kết nối mạng */
  isOnline: boolean;

  setReducedMotion: (value: boolean) => void;
  toggleReducedMotion: () => void;
  setTheme: (value: ThemePreference) => void;
  toggleSound: () => void;
  setHandbookOpen: (value: boolean) => void;
  setOnline: (value: boolean) => void;
  initialize: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  reducedMotion: false,
  theme: 'system',
  resolvedTheme: 'dark',
  soundEnabled: true,
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

  setTheme: (value) => {
    const resolved = applyTheme(value);
    set({ theme: value, resolvedTheme: resolved });
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // localStorage bị chặn — giao diện vẫn đổi, chỉ là không nhớ cho lần sau
    }
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    setSoundEnabled(next);
    try {
      localStorage.setItem(SOUND_KEY, String(next));
    } catch {
      // localStorage bị chặn — vẫn tắt/bật được trong phiên này
    }
  },

  setHandbookOpen: (value) => set({ handbookOpen: value }),
  setOnline: (value) => set({ isOnline: value }),

  /** Đọc cài đặt đã lưu + lắng nghe sự kiện online/offline. Gọi một lần khi khởi động. */
  initialize: () => {
    const stored = readStoredPreference();
    const theme = readStoredTheme();
    const sound = readStoredSound();

    set({
      reducedMotion: stored,
      isOnline: navigator.onLine,
      theme,
      resolvedTheme: applyTheme(theme),
      soundEnabled: sound,
    });
    setSoundEnabled(sound);

    /*
      Trình duyệt chỉ cho phát âm thanh sau lần bấm đầu tiên của người dùng.
      Mở khoá ngay lần tương tác đầu, rồi tự gỡ người nghe — không cần theo dõi
      tiếp và cũng không giữ lại tham chiếu thừa.
    */
    const unlock = () => {
      unlockAudio();
      preloadSounds();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    document.documentElement.dataset.reducedMotion = String(stored);

    window.addEventListener('online', () => set({ isOnline: true }));
    window.addEventListener('offline', () => set({ isOnline: false }));

    /*
      Đang để "Theo máy" mà học sinh đổi cài đặt của Windows thì trang phải
      đổi theo ngay, không bắt tải lại. Nếu học sinh đã tự chọn Sáng hoặc Tối
      thì lựa chọn của em luôn thắng cài đặt máy.
    */
    try {
      window
        .matchMedia('(prefers-color-scheme: light)')
        .addEventListener('change', () => {
          if (get().theme !== 'system') return;
          set({ resolvedTheme: applyTheme('system') });
        });
    } catch {
      // Trình duyệt cũ không có addEventListener trên MediaQueryList — bỏ qua
    }
  },
}));

/** Dùng cho test và cho những nơi cần biết màu mà không đăng ký vào store. */
export { resolveTheme };
