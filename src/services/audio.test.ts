import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isAudioUnlocked,
  isBackgroundMusicEnabled,
  playSound,
  playVictoryFanfare,
  resetAudioForTest,
  setSoundEnabled,
  setMusicEnabled,
  unlockAudio,
  type SoundName,
} from './audio';

const ALL_SOUNDS: SoundName[] = [
  'step',
  'bump',
  'gem',
  'door',
  'goal',
  'levelup',
  'error',
  'click',
];

/** Ghi lại mọi lần `play()` được gọi, để test biết có kêu hay không. */
function stubAudio() {
  const played: string[] = [];

  class FakeAudio {
    src: string;
    volume = 1;
    currentTime = 0;
    preload = '';
    loop = false;

    constructor(src: string) {
      this.src = src;
    }

    play() {
      played.push(this.src);
      return Promise.resolve();
    }

    pause() {}
  }

  vi.stubGlobal('Audio', FakeAudio);
  return played;
}

beforeEach(() => {
  resetAudioForTest();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Chính sách phát của trình duyệt', () => {
  /**
   * Trình duyệt chặn âm thanh trước lần tương tác đầu tiên. Gọi `play()` lúc
   * đó sinh ra một Promise bị từ chối; không bắt thì console đầy lỗi đỏ và
   * thầy cô tưởng website hỏng.
   */
  it('chưa ai chạm vào trang thì không phát gì cả', () => {
    const played = stubAudio();
    playSound('step');

    expect(isAudioUnlocked()).toBe(false);
    expect(played).toHaveLength(0);
  });

  it('sau lần tương tác đầu tiên thì phát bình thường', () => {
    const played = stubAudio();
    unlockAudio();
    playSound('step');

    expect(played).toHaveLength(1);
  });

  it('fanfare chiến thắng có hiệu ứng dự phòng khi Web Audio không khả dụng', () => {
    const played = stubAudio();
    unlockAudio();
    playVictoryFanfare();

    expect(played.some((source) => source.endsWith('/audio/goal.ogg'))).toBe(true);
  });
});

describe('Nút tắt tiếng', () => {
  it('tắt rồi thì không kêu nữa', () => {
    const played = stubAudio();
    unlockAudio();
    setSoundEnabled(false);
    playSound('goal');

    expect(played).toHaveLength(0);
  });

  it('bật lại thì kêu tiếp', () => {
    const played = stubAudio();
    unlockAudio();
    setSoundEnabled(false);
    playSound('goal');
    setSoundEnabled(true);
    playSound('goal');

    expect(played).toHaveLength(1);
  });
});

describe('Nhạc nền trong phòng máy', () => {
  it('mặc định tắt và chỉ bật khi học sinh chủ động chọn', () => {
    expect(isBackgroundMusicEnabled()).toBe(false);
    setMusicEnabled(true);
    expect(isBackgroundMusicEnabled()).toBe(true);
    setMusicEnabled(false);
    expect(isBackgroundMusicEnabled()).toBe(false);
  });

  it('phát tệp nhạc CC0 sau khi học sinh bật nhạc trong màn chơi', async () => {
    const played = stubAudio();
    const { setGameMusicActive } = await import('./audio');

    unlockAudio();
    setGameMusicActive(true);
    setMusicEnabled(true);

    expect(played.some((source) => source.endsWith('/audio/bytelands-arcanum.mp3'))).toBe(true);
    setGameMusicActive(false);
  });
});

describe('Không bao giờ làm gãy màn hình nhiệm vụ', () => {
  /**
   * Âm thanh hỏng thì cùng lắm là mất tiếng động. Tuyệt đối không được ném lỗi
   * ra ngoài — học sinh đang viết code dở mà trang trắng thì mất bài.
   */
  it('thiết bị không có Audio thì bỏ qua trong im lặng', () => {
    vi.stubGlobal('Audio', undefined);
    unlockAudio();

    expect(() => playSound('step')).not.toThrow();
  });

  it('trình duyệt từ chối phát thì cũng không ném lỗi', () => {
    // Khai báo trường rồi gán trong constructor: `erasableSyntaxOnly` của dự
    // án cấm cú pháp parameter property (`constructor(public src: string)`).
    class RejectingAudio {
      src: string;
      volume = 1;
      currentTime = 0;
      preload = '';

      constructor(src: string) {
        this.src = src;
      }

      play() {
        return Promise.reject(new Error('NotAllowedError'));
      }
    }
    vi.stubGlobal('Audio', RejectingAudio);
    unlockAudio();

    expect(() => playSound('step')).not.toThrow();
  });
});

/**
 * Tên tệp trong code và tệp thật trong `public/audio` phải khớp. Lệch một chữ
 * thì trình duyệt tải 404, âm thanh im lặng biến mất mà không có thông báo nào
 * — đúng loại lỗi không ai phát hiện cho tới lúc dạy thật.
 */
describe('Tệp âm thanh có thật', () => {
  const files = new Set(
    readdirSync(join(process.cwd(), 'public', 'audio')).filter((name) => name.endsWith('.ogg')),
  );

  it('mỗi tiếng khai báo trong code đều có tệp tương ứng', () => {
    for (const name of ALL_SOUNDS) {
      expect(files.has(`${name}.ogg`), `thiếu tệp ${name}.ogg`).toBe(true);
    }
  });

  it('không có tệp thừa nằm lại trong thư mục', () => {
    expect(files.size).toBe(ALL_SOUNDS.length);
  });

  it('có bản nhạc nền CC0 dùng trong game', () => {
    expect(
      readdirSync(join(process.cwd(), 'public', 'audio')).includes('bytelands-arcanum.mp3'),
    ).toBe(true);
  });
});
