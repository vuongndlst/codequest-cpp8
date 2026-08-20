/**
 * Âm thanh của trò chơi.
 *
 * Phòng máy có nhiều học sinh nên hiệu ứng ngắn được bật sẵn ở âm lượng nhỏ,
 * còn nhạc nền mặc định tắt và chỉ chạy sau khi học sinh chủ động bật.
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

export const BACKGROUND_MUSIC_TRACKS = [
  'music/bytelands-01-flags.mp3',
  'music/bytelands-02-great-mission.mp3',
  'music/bytelands-03-spacetime.mp3',
  'music/bytelands-04-twists.mp3',
  'music/bytelands-05-warped.mp3',
  'music/bytelands-06-doomed.mp3',
  'music/bytelands-07-waking-the-devil.mp3',
] as const;

const BOSS_MUSIC_TRACK = BACKGROUND_MUSIC_TRACKS[6];
let enabled = true;
let unlocked = false;
let musicEnabled = false;
let gameMusicActive = false;
let musicTrack: HTMLAudioElement | null = null;
let selectedMusicFile: string = BACKGROUND_MUSIC_TRACKS[0];
let musicContext: AudioContext | null = null;
let musicTimer: number | null = null;
let musicMaster: GainNode | null = null;
let musicNoiseBuffer: AudioBuffer | null = null;
let nextBarTime = 0;
let musicBar = 0;
const musicSources = new Set<AudioScheduledSourceNode>();

const MUSIC_TEMPO = 112;
const EIGHTH_NOTE = 60 / MUSIC_TEMPO / 2;
const BAR_DURATION = EIGHTH_NOTE * 8;

// Dm – B♭ – F – C: màu sắc phiêu lưu, hào hùng nhưng không quá căng thẳng.
const EPIC_CHORDS = [
  { root: 146.83, notes: [293.66, 349.23, 440] },
  { root: 116.54, notes: [233.08, 293.66, 349.23] },
  { root: 174.61, notes: [261.63, 349.23, 440] },
  { root: 130.81, notes: [261.63, 329.63, 392] },
];

const EPIC_MELODIES = [
  [587.33, 698.46, 880, 698.46],
  [587.33, 698.46, 932.33, 880],
  [523.25, 698.46, 880, 1046.5],
  [659.25, 783.99, 880, 783.99],
];

function audioUrl(file: string): string {
  return `${import.meta.env.BASE_URL}audio/${file}`;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function setMusicEnabled(value: boolean): void {
  musicEnabled = value;
  if (value && unlocked && gameMusicActive) startBackgroundMusic();
  if (!value) stopBackgroundMusic();
}

/**
 * Tách route game khỏi sở thích đã lưu. Học sinh có thể giữ lựa chọn bật nhạc,
 * nhưng nhạc tuyệt đối không được chạy ở dashboard, hồ sơ hay trang giới thiệu.
 */
export function setGameMusicActive(value: boolean): void {
  gameMusicActive = value;
  if (value && musicEnabled && unlocked) startBackgroundMusic();
  if (!value) stopBackgroundMusic();
}

/**
 * Chọn soundtrack ổn định theo khu vực và nhiệm vụ. Hai nhiệm vụ liền nhau luôn
 * đổi bài; boss dùng riêng track cao trào. Không chọn ngẫu nhiên để học sinh có
 * thể ghi nhớ "màu âm thanh" của từng chặng và việc test không bị chập chờn.
 */
export function musicTrackForScene(
  lessonId: string,
  challengeId: string,
  isBoss = false,
): string {
  if (isBoss) return BOSS_MUSIC_TRACK;

  const area = Number.parseInt(lessonId.match(/\d+/)?.[0] ?? '0', 10);
  const challenge = Number.parseInt(challengeId.match(/-c(\d+)/)?.[1] ?? '1', 10);
  const regularTrackCount = BACKGROUND_MUSIC_TRACKS.length - 1;
  const index = ((area * 2 + challenge - 1) % regularTrackCount + regularTrackCount) % regularTrackCount;
  return BACKGROUND_MUSIC_TRACKS[index];
}

export function setGameMusicScene(
  lessonId: string,
  challengeId: string,
  isBoss = false,
): void {
  const nextFile = musicTrackForScene(lessonId, challengeId, isBoss);
  if (nextFile === selectedMusicFile) return;
  selectedMusicFile = nextFile;

  if (musicTrack || musicTimer !== null) {
    stopBackgroundMusic();
    if (musicEnabled && gameMusicActive && unlocked) startBackgroundMusic();
  }
}

export function isBackgroundMusicEnabled(): boolean {
  return musicEnabled;
}

/** Trình duyệt chỉ cho phát âm thanh sau một thao tác thật của người dùng. */
export function unlockAudio(): void {
  unlocked = true;
  if (musicEnabled && gameMusicActive) startBackgroundMusic();
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

/** Phát một hiệu ứng ngắn; lỗi audio không bao giờ được làm gãy màn học. */
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
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  } catch {
    // Thiết bị không hỗ trợ audio: trò chơi vẫn tiếp tục bình thường.
  }
}

function getAudioContext(): AudioContext | null {
  if (musicContext) return musicContext;
  try {
    const AudioContextCtor = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    musicContext = new AudioContextCtor();
    return musicContext;
  } catch {
    return null;
  }
}

function trackSource(source: AudioScheduledSourceNode): void {
  musicSources.add(source);
  source.addEventListener('ended', () => musicSources.delete(source), { once: true });
}

function createMusicMaster(context: AudioContext): GainNode {
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.72, context.currentTime + 0.8);
  master.connect(context.destination);
  musicMaster = master;
  return master;
}

function scheduleTone(
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType,
  filterFrequency = 1600,
): void {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const attack = Math.min(0.055, duration * 0.18);
  const releaseStart = start + Math.max(attack, duration * 0.7);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFrequency, start);
  filter.Q.setValueAtTime(0.7, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.setValueAtTime(volume, releaseStart);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  trackSource(oscillator);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (musicNoiseBuffer) return musicNoiseBuffer;
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  musicNoiseBuffer = buffer;
  return buffer;
}

function scheduleNoise(
  context: AudioContext,
  destination: AudioNode,
  start: number,
  duration: number,
  volume: number,
  filterType: BiquadFilterType,
  filterFrequency: number,
): void {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = getNoiseBuffer(context);
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFrequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  trackSource(source);
  source.start(start);
  source.stop(start + duration);
}

function scheduleKick(
  context: AudioContext,
  destination: AudioNode,
  start: number,
  volume: number,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(105, start);
  oscillator.frequency.exponentialRampToValueAtTime(44, start + 0.13);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
  oscillator.connect(gain);
  gain.connect(destination);
  trackSource(oscillator);
  oscillator.start(start);
  oscillator.stop(start + 0.2);
}

function scheduleEpicBar(context: AudioContext, destination: AudioNode, start: number, bar: number): void {
  const chordIndex = bar % EPIC_CHORDS.length;
  const chord = EPIC_CHORDS[chordIndex];

  // Pad dài tạo chất orchestral nhưng vẫn đủ thoáng để học sinh đọc code.
  chord.notes.forEach((frequency) => {
    scheduleTone(context, destination, frequency, start, BAR_DURATION * 0.98, 0.014, 'triangle', 1050);
    scheduleTone(context, destination, frequency / 2, start, BAR_DURATION * 0.98, 0.008, 'sine', 720);
  });

  // Bass hành khúc, trống và arpeggio 8-bit tạo nhịp phiêu lưu.
  for (let beat = 0; beat < 4; beat += 1) {
    const beatStart = start + beat * EIGHTH_NOTE * 2;
    scheduleTone(context, destination, chord.root / 2, beatStart, EIGHTH_NOTE * 1.45, 0.04, 'triangle', 520);
    scheduleKick(context, destination, beatStart, beat === 0 ? 0.055 : 0.035);
  }

  const arpPattern = [0, 1, 2, 1, 0, 2, 1, 2];
  arpPattern.forEach((noteIndex, index) => {
    scheduleTone(
      context,
      destination,
      chord.notes[noteIndex] * 2,
      start + index * EIGHTH_NOTE,
      EIGHTH_NOTE * 0.72,
      0.012,
      'square',
      2300,
    );
    scheduleNoise(context, destination, start + index * EIGHTH_NOTE, 0.035, 0.006, 'highpass', 5200);
  });

  // Chỉ chơi lead ở bar chẵn để tránh âm nhạc chiếm hết sự chú ý.
  if (bar % 2 === 0) {
    EPIC_MELODIES[chordIndex].forEach((frequency, index) => {
      scheduleTone(
        context,
        destination,
        frequency,
        start + index * EIGHTH_NOTE * 2,
        EIGHTH_NOTE * 1.55,
        0.025,
        'sawtooth',
        1800,
      );
    });
  }

  scheduleNoise(context, destination, start + EIGHTH_NOTE * 2, 0.14, 0.018, 'bandpass', 1500);
  scheduleNoise(context, destination, start + EIGHTH_NOTE * 6, 0.14, 0.018, 'bandpass', 1500);
}

function scheduleMusicAhead(): void {
  if (!musicEnabled || !unlocked || typeof document === 'undefined') return;
  const context = getAudioContext();
  if (!context) return;
  if (document.hidden) {
    nextBarTime = 0;
    return;
  }

  try {
    void context.resume();
    const destination = musicMaster ?? createMusicMaster(context);
    if (nextBarTime < context.currentTime) nextBarTime = context.currentTime + 0.06;
    while (nextBarTime < context.currentTime + 0.55) {
      scheduleEpicBar(context, destination, nextBarTime, musicBar);
      nextBarTime += BAR_DURATION;
      musicBar += 1;
    }
  } catch {
    // Web Audio không khả dụng: game vẫn tiếp tục bình thường.
  }
}

export function startBackgroundMusic(): void {
  if (!musicEnabled || !gameMusicActive || !unlocked || musicTrack || musicTimer !== null) return;

  try {
    const track = new Audio(audioUrl(selectedMusicFile));
    track.preload = 'auto';
    track.loop = true;
    track.volume = 0.24;
    musicTrack = track;
    void track.play().catch(() => {
      // Một số thiết bị cũ không giải mã được MP3. Khi đó dùng bản nhạc Web Audio
      // nguyên bản để học sinh vẫn có âm thanh, không làm gãy màn nhiệm vụ.
      if (musicTrack === track) musicTrack = null;
      startSynthBackgroundMusic();
    });
  } catch {
    startSynthBackgroundMusic();
  }
}

export function stopBackgroundMusic(): void {
  if (musicTrack) {
    try {
      musicTrack.pause();
      musicTrack.currentTime = 0;
    } catch {
      // Audio đã bị trình duyệt thu hồi; chỉ cần bỏ tham chiếu.
    }
    musicTrack = null;
  }

  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }

  const context = musicContext;
  const master = musicMaster;
  if (context && master) {
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  }

  for (const source of musicSources) {
    try {
      source.stop((context?.currentTime ?? 0) + 0.2);
    } catch {
      // Nguồn đã tự kết thúc.
    }
  }
  musicSources.clear();
  musicMaster = null;
  nextBarTime = 0;
}

function startSynthBackgroundMusic(): void {
  if (!musicEnabled || !gameMusicActive || !unlocked || musicTimer !== null || musicTrack) return;
  scheduleMusicAhead();
  musicTimer = window.setInterval(scheduleMusicAhead, 180);
}

/**
 * Fanfare nguyên bản khi qua màn. Đây là hiệu ứng nên tuân theo nút Tắt âm thanh,
 * không bắt buộc học sinh phải bật nhạc nền.
 */
export function playVictoryFanfare(isBoss = false): void {
  if (!enabled || !unlocked) return;
  const context = getAudioContext();
  if (!context) {
    playSound(isBoss ? 'levelup' : 'goal');
    return;
  }

  try {
    void context.resume();
    const now = context.currentTime + 0.035;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(isBoss ? 0.82 : 0.68, now + 0.06);
    master.gain.setValueAtTime(isBoss ? 0.82 : 0.68, now + 2.4);
    master.gain.exponentialRampToValueAtTime(0.0001, now + (isBoss ? 3.5 : 3.05));
    master.connect(context.destination);

    // Duck nhạc nền để câu chúc mừng nghe rõ, sau đó tự đưa về âm lượng cũ.
    if (musicTrack) {
      musicTrack.volume = 0.08;
      window.setTimeout(() => {
        if (musicTrack) musicTrack.volume = 0.24;
      }, 3200);
    }
    if (musicMaster) {
      musicMaster.gain.cancelScheduledValues(now);
      musicMaster.gain.setValueAtTime(Math.max(0.0001, musicMaster.gain.value), now);
      musicMaster.gain.exponentialRampToValueAtTime(0.18, now + 0.12);
      musicMaster.gain.exponentialRampToValueAtTime(0.72, now + 3.2);
    }

    const notes = [587.33, 739.99, 880, 1174.66, 880, 1174.66];
    const starts = [0, 0.27, 0.54, 0.86, 1.34, 1.68];
    const durations = [0.24, 0.24, 0.28, 0.42, 0.28, 1.25];
    notes.forEach((frequency, index) => {
      scheduleTone(context, master, frequency, now + starts[index], durations[index], 0.075, 'sawtooth', 2400);
      scheduleTone(context, master, frequency / 2, now + starts[index], durations[index], 0.035, 'triangle', 1500);
    });

    [293.66, 369.99, 440].forEach((frequency) => {
      scheduleTone(context, master, frequency, now + 1.9, isBoss ? 1.55 : 1.15, 0.035, 'triangle', 1750);
    });
    [0, 0.54, 0.86, 1.68].forEach((offset, index) => {
      scheduleKick(context, master, now + offset, index === 3 ? 0.09 : 0.06);
    });
    scheduleNoise(context, master, now + 1.68, 0.55, 0.045, 'highpass', 3400);

    if (isBoss) {
      scheduleTone(context, master, 1174.66, now + 2.02, 1.4, 0.045, 'square', 2800);
      scheduleTone(context, master, 146.83, now + 1.9, 1.5, 0.065, 'sine', 520);
    }
  } catch {
    playSound(isBoss ? 'levelup' : 'goal');
  }
}

/** Nạp trước vài hiệu ứng để lần đầu bấm Chạy không bị trễ. */
export function preloadSounds(names: SoundName[] = ['step', 'bump', 'goal']): void {
  for (const name of names) {
    if (cache.has(name)) continue;
    try {
      const audio = new Audio(audioUrl(SOUND_FILES[name]));
      audio.preload = 'auto';
      cache.set(name, audio);
    } catch {
      // Khi phát sẽ thử lại.
    }
  }
}

/** Chỉ dùng trong test. */
export function resetAudioForTest(): void {
  stopBackgroundMusic();
  void musicContext?.close().catch(() => undefined);
  musicContext = null;
  musicMaster = null;
  musicNoiseBuffer = null;
  musicEnabled = false;
  gameMusicActive = false;
  musicTrack = null;
  selectedMusicFile = BACKGROUND_MUSIC_TRACKS[0];
  nextBarTime = 0;
  musicBar = 0;
  musicSources.clear();
  cache.clear();
  enabled = true;
  unlocked = false;
}
