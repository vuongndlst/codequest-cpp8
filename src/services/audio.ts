/**
 * Âm thanh của trò chơi.
 *
 * BỐI CẢNH QUYẾT ĐỊNH THIẾT KẾ: đây là phần mềm dùng trong phòng máy, 40 học
 * sinh ngồi cạnh nhau. Bốn mươi máy cùng phát nhạc nền là một tiết học không
 * dạy được. Nên:
 *
 *   · Hiệu ứng ngắn (bước chân, nhặt ngọc): BẬT sẵn, âm lượng nhỏ
 *   · Nhạc nền: TẮT sẵn, học sinh tự bật nếu đeo tai nghe
 *   · Có nút tắt hết ở thanh điều hướng
 *
 * Trình duyệt cũng chặn phát âm thanh trước khi người dùng chạm vào trang, nên
 * mọi lời gọi trước tương tác đầu tiên đều bị bỏ qua trong im lặng — cố ý
 * không báo lỗi, vì đó là hành vi đúng chứ không phải sự cố.
 */

export type SoundName =
  | 'step'
  | 'bump'
  | 'gem'
  | 'door'
  | 'goal'
  | 'levelup'
  | 'error'
  | 'click';

const SOUND_FILES: Record<SoundName, string> = {
  step: 'step.ogg',
  bump: 'bump.ogg',
  gem: 'gem.ogg',
  door: 'door.ogg',
  goal: 'goal.ogg',
  levelup: 'levelup.ogg',
  error: 'error.ogg',
  click: 'click.ogg',
};

/**
 * Âm lượng riêng từng tiếng.
 *
 * Tiếng bước chân kêu rất nhiều lần trong một lần chạy nên phải nhỏ hơn hẳn,
 * còn tiếng tới đích chỉ kêu một lần nên để to cho đáng.
 */
const VOLUMES: Record<SoundName, number> = {
  step: 0.18,
  bump: 0.3,
  gem: 0.35,
  door: 0.3,
  goal: 0.45,
  levelup: 0.45,
  error: 0.25,
  click: 0.2,
};

const cache = new Map<SoundName, HTMLAudioElement>();
let enabled = true;
let unlocked = false;

function audioUrl(file: string): string {
  return `${import.meta.env.BASE_URL}audio/${file}`;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Đánh dấu người dùng đã tương tác với trang.
 *
 * Trình duyệt chỉ cho phát âm thanh sau lần chạm/bấm đầu tiên. Gọi hàm này từ
 * một sự kiện bấm thật; trước đó `playSound` không làm gì cả.
 */
export function unlockAudio(): void {
  unlocked = true;
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

/**
 * Phát một tiếng. Không bao giờ ném lỗi.
 *
 * Âm thanh hỏng thì cùng lắm là mất tiếng động — tuyệt đối không được làm gãy
 * màn hình nhiệm vụ mà học sinh đang làm dở.
 */
export function playSound(name: SoundName): void {
  if (!enabled || !unlocked) return;

  try {
    let audio = cache.get(name);
    if (!audio) {
      audio = new Audio(audioUrl(SOUND_FILES[name]));
      audio.preload = 'auto';
      cache.set(name, audio);
    }

    audio.volume = VOLUMES[name];
    // Tua về đầu: cùng một tiếng kêu liên tiếp (bước chân) thì không tự phát lại
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Trình duyệt từ chối — bỏ qua, không phải lỗi của học sinh
    });
  } catch {
    // Thiết bị không có audio, hoặc bị chính sách chặn — im lặng bỏ qua
  }
}

/** Nạp trước vài tiếng hay dùng để lần đầu bấm Chạy không bị trễ. */
export function preloadSounds(names: SoundName[] = ['step', 'bump', 'goal']): void {
  for (const name of names) {
    if (cache.has(name)) continue;
    try {
      const audio = new Audio(audioUrl(SOUND_FILES[name]));
      audio.preload = 'auto';
      cache.set(name, audio);
    } catch {
      // Không nạp được thì thôi, lúc phát sẽ thử lại
    }
  }
}

/** Chỉ dùng trong test. */
export function resetAudioForTest(): void {
  cache.clear();
  enabled = true;
  unlocked = false;
}
