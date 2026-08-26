import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(path) {
  const values = {};
  for (const rawLine of readFileSync(path, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return values;
}

const env = loadEnvFile(new URL('../.env', import.meta.url));
const url = env.VITE_SUPABASE_URL;
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const secretKey = env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  throw new Error('Thiếu cấu hình Supabase trong .env.');
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = 'TamThoi-KiemThu-2026!';
let temporaryUserId = null;

async function requireData(promise, label) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function findUnusedStudentCode() {
  for (let offset = 0; offset < 100; offset += 1) {
    const code = String(2900000 + ((Date.now() + offset) % 99999)).padStart(7, '0');
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('student_code', code)
      .maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  throw new Error('Không tìm được mã học sinh tạm chưa sử dụng.');
}

try {
  const classes = await requireData(
    admin.from('classes').select('id,name,join_code,is_open').eq('is_open', true).order('name'),
    'Không đọc được lớp đang mở',
  );
  const classroom = classes.find((item) => item.name === '8A11') ?? classes[0];
  if (!classroom) throw new Error('Không có lớp đang mở để kiểm thử tiến trình.');

  const studentCode = await findUnusedStudentCode();
  const email = `${studentCode}@lsts.edu.vn`;
  const created = await requireData(
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Học sinh kiểm thử tiến trình',
        class_name: '',
        class_code: classroom.join_code,
        student_code: studentCode,
        avatar_id: 'arin',
      },
    }),
    'Không tạo được học sinh tạm',
  );
  temporaryUserId = created.user.id;

  const student = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await requireData(student.auth.signInWithPassword({ email, password }), 'Không đăng nhập được');
  await requireData(
    student.rpc('join_class_by_code', { p_code: classroom.join_code }),
    'Không vào được lớp kiểm thử',
  );

  const station1 = await requireData(
    student.functions.invoke('submit-challenge', {
      body: {
        lessonId: 'a0',
        challengeId: 'a0-c1-first-program',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Xin chao ByteLand!" << endl;\n    return 0;\n}',
        hintLevelUsed: 0,
      },
    }),
    'Không nộp được trạm 1',
  );

  if (!station1.grade?.isCorrect) throw new Error('Máy chủ không chấm đúng trạm 1.');
  if (!station1.persistence?.progress?.completed_challenges?.includes('a0-c1-first-program')) {
    throw new Error('Phản hồi trạm 1 chưa chứa tiến trình vừa hoàn thành.');
  }
  if (station1.persistence.xpAwarded !== 10) {
    throw new Error(`Trạm 1 cộng sai XP: nhận ${station1.persistence.xpAwarded}, cần 10.`);
  }
  if (station1.persistence.gemsAwarded !== 3) {
    throw new Error(`Trạm 1 cộng sai Gem: nhận ${station1.persistence.gemsAwarded}, cần 3.`);
  }

  const persistedRows = await requireData(
    student.from('lesson_progress').select('*').eq('lesson_id', 'a0'),
    'Học sinh không đọc lại được tiến trình',
  );
  const persisted = persistedRows[0];
  if (!persisted?.completed_challenges?.includes('a0-c1-first-program')) {
    throw new Error('Database chưa lưu trạm 1 trước khi chuyển sang trạm 2.');
  }

  const profileAfterStation1 = await requireData(
    student.from('profiles').select('total_xp,gem_balance').eq('id', temporaryUserId).single(),
    'Không đọc được số dư sau trạm 1',
  );
  if (profileAfterStation1.total_xp !== 10 || profileAfterStation1.gem_balance !== 3) {
    throw new Error(
      `Số dư sau trạm 1 không đúng: ${profileAfterStation1.total_xp} XP, ${profileAfterStation1.gem_balance} Gem.`,
    );
  }

  const station1Replay = await requireData(
    student.functions.invoke('submit-challenge', {
      body: {
        lessonId: 'a0',
        challengeId: 'a0-c1-first-program',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Xin chao ByteLand!" << endl;\n    return 0;\n}',
        hintLevelUsed: 0,
      },
    }),
    'Không nộp lại được trạm 1',
  );
  if (station1Replay.persistence.xpAwarded !== 0 || station1Replay.persistence.gemsAwarded !== 0) {
    throw new Error('Làm lại trạm 1 vẫn cộng lặp XP hoặc Gem.');
  }

  const station2 = await requireData(
    student.functions.invoke('submit-challenge', {
      body: {
        lessonId: 'a0',
        challengeId: 'a0-c2-cout',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "BAT DAU" << endl;\n    return 0;\n}',
        hintLevelUsed: 0,
      },
    }),
    'Trạm 2 vẫn bị máy chủ khóa sau khi xong trạm 1',
  );

  if (!station2.grade?.isCorrect) throw new Error('Máy chủ không chấm đúng trạm 2.');
  if (station2.persistence.xpAwarded !== 15 || station2.persistence.gemsAwarded !== 3) {
    throw new Error(
      `Trạm 2 cộng sai thưởng: ${station2.persistence.xpAwarded} XP, ${station2.persistence.gemsAwarded} Gem.`,
    );
  }

  const profileAfterStation2 = await requireData(
    student.from('profiles').select('total_xp,gem_balance').eq('id', temporaryUserId).single(),
    'Không đọc được số dư sau trạm 2',
  );
  if (profileAfterStation2.total_xp !== 25 || profileAfterStation2.gem_balance !== 6) {
    throw new Error(
      `Số dư sau trạm 2 không đúng: ${profileAfterStation2.total_xp} XP, ${profileAfterStation2.gem_balance} Gem.`,
    );
  }

  console.log(JSON.stringify({
    ok: true,
    className: classroom.name,
    station1Persisted: true,
    station1Reward: { xp: 10, gems: 3 },
    replayReward: { xp: 0, gems: 0 },
    station2Accepted: true,
    finalBalance: profileAfterStation2,
    completedChallenges: station2.persistence.progress.completed_challenges,
  }, null, 2));
} finally {
  if (temporaryUserId) {
    const { error } = await admin.auth.admin.deleteUser(temporaryUserId);
    if (error) console.error(`Cảnh báo: chưa xóa được tài khoản tạm: ${error.message}`);
  }
}
