// Cuu bai cua hoc sinh bi ket trong hang doi trinh duyet.
//
// Khi duong cham bai hong, bai nop nam lai trong localStorage cua may hoc sinh
// va giao vien khong voi toi duoc. Nhung ban nhap code thi van duoc luu len
// may chu qua mot duong khac. Script nay lay dung ban nhap do, cham bang DUNG
// bo cham cua he thong, roi ghi qua DUNG RPC ma Edge Function van dung.
//
// Diem so do bo cham quyet dinh. Script khong gan XP, sao hay gem cho ai:
// bai nao khong dat thi khong ghi.
//
//   node scripts/replay-stuck-drafts.mjs <ten hoc sinh> <ma khu vuc> [--that]
//
// Khong co --that thi chi CHAM THU va in ket qua, khong ghi gi.
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { createClient } from '@supabase/supabase-js';
import { gradeChallengeCode } from '../supabase/functions/_shared/grader.generated.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Noi dung bai hoc viet bang TypeScript nen Node khong nap thang duoc. Dong goi
// tam giong cach scripts/build-edge-grader.mjs van lam cho bo cham.
const bundled = path.join(tmpdir(), `cq8-lessons-${process.pid}.mjs`);
await build({
  entryPoints: [path.join(root, 'src/lessons/index.ts')],
  outfile: bundled,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  alias: { '@': path.join(root, 'src') },
  legalComments: 'none',
});
const { getLesson } = await import(pathToFileURL(bundled).href);

const [, , needle, lessonId, ...flags] = process.argv;
const commit = flags.includes('--that');
if (!needle || !lessonId) {
  console.error('Vi du: node scripts/replay-stuck-drafts.mjs Nghia-test a0');
  console.error('       node scripts/replay-stuck-drafts.mjs Nghia-test a0 --that');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()]),
);
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const checked = async (task) => {
  const { data, error } = await task;
  if (error) throw error;
  return data;
};

const students = await checked(
  db.from('profiles').select('id,full_name,class_name,total_xp,level,gem_balance').ilike('full_name', `%${needle}%`),
);
if (students.length !== 1) {
  console.error(`Can dung MOT hoc sinh, tim thay ${students.length}. Go ro ten hon.`);
  process.exit(1);
}
const student = students[0];
const lesson = getLesson(lessonId);
if (!lesson) {
  console.error(`Khong co khu vuc "${lessonId}".`);
  process.exit(1);
}

console.log(`${student.full_name} · lop ${student.class_name}`);
console.log(`TRUOC: xp=${student.total_xp} · cap ${student.level} · gem=${student.gem_balance}`);
console.log(commit ? '(CHE DO GHI THAT)' : '(cham thu, khong ghi gi — them --that de ghi)');

const drafts = await checked(
  db.from('code_drafts').select('challenge_id,code,updated_at').eq('user_id', student.id),
);
// So goi y da dung, lay tu nhat ky hoat dong. Truyen dung so nay de khong cap
// nham huy hieu "no-hint-hero" cho bai em ay co dung goi y.
const hintEvents = await checked(
  db.from('activity_events').select('challenge_id').eq('user_id', student.id).eq('event_type', 'hint_used'),
);
const hintsByChallenge = hintEvents.reduce((total, row) => {
  total[row.challenge_id] = (total[row.challenge_id] ?? 0) + 1;
  return total;
}, {});

for (const challenge of lesson.challenges) {
  // Bai "quan sat" thuong duoc chay nguyen code co san nen autosave khong luu gi.
  const code = drafts.find((row) => row.challenge_id === challenge.id)?.code ?? challenge.starterCode;
  const source = drafts.some((row) => row.challenge_id === challenge.id) ? 'ban nhap' : 'code co san';
  const grade = gradeChallengeCode(lessonId, challenge.id, code);

  if (!grade.isCorrect) {
    console.log(`  ${challenge.id.padEnd(24)} CHUA DAT ${grade.passedRequired}/${grade.totalRequired} (${source}) — khong ghi`);
    continue;
  }
  if (!commit) {
    console.log(`  ${challenge.id.padEnd(24)} DAT ${grade.passedRequired}/${grade.totalRequired} (${source}) — se ghi`);
    continue;
  }

  const { data, error } = await db.rpc('record_authoritative_attempt', {
    p_user_id: student.id,
    p_lesson_id: lessonId,
    p_challenge_id: challenge.id,
    p_code: code,
    p_run_ok: grade.ok,
    p_is_correct: grade.isCorrect,
    p_passed_tests: grade.passedRequired,
    p_total_tests: grade.totalRequired,
    p_error_types: grade.errorCodes,
    p_hint_level: Math.min(10, hintsByChallenge[challenge.id] ?? 0),
    p_clean_code_score: grade.cleanCode?.score ?? null,
  });
  if (error) {
    console.log(`  ${challenge.id.padEnd(24)} RPC LOI: ${error.message}`);
    break;
  }
  console.log(`  ${challenge.id.padEnd(24)} da ghi · +${data.xpAwarded}xp · +${data.gemsAwarded}gem` +
    ` · huy hieu: ${data.newBadgeCodes.length ? data.newBadgeCodes.join(',') : 'khong'}`);
}

const [after] = await checked(
  db.from('profiles').select('total_xp,level,gem_balance').eq('id', student.id),
);
const [progress] = await checked(
  db.from('lesson_progress').select('status,progress_percent,stars,completed_challenges')
    .eq('user_id', student.id).eq('lesson_id', lessonId),
);
console.log(`SAU:   xp=${after.total_xp} · cap ${after.level} · gem=${after.gem_balance}`);
if (progress) {
  console.log(`       ${lessonId}: ${progress.status} · ${progress.progress_percent}% · ${progress.stars} sao` +
    ` · ${progress.completed_challenges.length} nhiem vu`);
}
