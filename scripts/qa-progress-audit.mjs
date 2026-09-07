// Doc-only audit: so sanh nhung gi MAY CHU dang giu voi nhung gi hoc sinh nhin thay.
// Khong ghi bat cu thu gi, khong in credentials.
//
// Dung khi mot em bao "da lam xong ma ban do van 0 sao":
//   node scripts/qa-progress-audit.mjs <mot phan ho ten hoac ma hoc sinh>
//   node scripts/qa-progress-audit.mjs Nghia-test
//   node scripts/qa-progress-audit.mjs --lop 8A7      (quet ca lop)
//   node scripts/qa-progress-audit.mjs --chan-doan    (kiem tra duong cham bai)
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const sweepClass = process.argv[2] === '--lop' ? process.argv[3] : null;
const diagnose = process.argv[2] === '--chan-doan';
const needle = sweepClass || diagnose ? null : process.argv[2];
if (!needle && !sweepClass && !diagnose) {
  console.error('Thieu tham so. Vi du: node scripts/qa-progress-audit.mjs Nghia-test');
  console.error('                hoac: node scripts/qa-progress-audit.mjs --lop 8A7');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()]),
);

const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const checked = async (task) => {
  const { data, error } = await task;
  if (error) throw error;
  return data;
};

/*
  Kiem tra tung mat xich cua duong cham bai, KHONG ghi gi:
   · khoa legacy: Edge Function dung SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
     do nen tang tu tiem vao. Neu hai khoa nay bi vo hieu (vd. sau khi doi sang
     khoa sb_publishable/sb_secret) thi moi bai nop se hong o tang duoi cung.
   · quyen goi RPC: goi voi tham so khong hop le, ham tra ve/nem loi TRUOC khi ghi.
*/
if (diagnose) {
  const ZERO = '00000000-0000-0000-0000-000000000000';
  const projectRef = env.VITE_SUPABASE_URL.split('//')[1].split('.')[0];
  console.log('--- Khoa API cua du an ---');
  try {
    // Lay khoa qua CLI: may nay khong goi thang api.supabase.com duoc.
    const raw = execFileSync(
      'npx',
      ['supabase', 'projects', 'api-keys', '--project-ref', projectRef, '--output', 'json'],
      { env: { ...process.env, SUPABASE_ACCESS_TOKEN: env.SUPABASE_ACCESS_TOKEN }, encoding: 'utf8', shell: true },
    );
    const parsed = JSON.parse(raw);
    const keys = Array.isArray(parsed) ? parsed : (parsed.keys ?? []);
    for (const key of keys) {
      // Chi in TRANG THAI, khong bao gio in gia tri khoa.
      const probe = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
        headers: { apikey: key.api_key, Authorization: `Bearer ${key.api_key}` },
      });
      console.log(`  ${key.name.padEnd(14)} (${key.type.padEnd(11)}) -> HTTP ${probe.status}${probe.ok ? ' con dung' : ' KHONG DUNG DUOC'}`);
    }
  } catch (error) {
    console.log('  Khong lay duoc danh sach khoa:', error.message.slice(0, 120));
  }

  console.log('--- Hoat dong cham bai gan nhat (toan he thong) ---');
  const latest = await checked(
    admin.from('challenge_attempts').select('created_at,lesson_id,challenge_id,user_id')
      .order('created_at', { ascending: false }).limit(5),
  );
  if (latest.length === 0) console.log('  (chua co lan nop nao)');
  for (const row of latest) console.log(`  ${row.created_at} ${row.lesson_id}/${row.challenge_id}`);

  /*
    submission_rate_limits duoc ghi o dong dau tien cua Edge Function, TRUOC khi
    cham va truoc khi ghi ket qua. Con dau thoi gian o day tach bach hai kha nang:
    yeu cau khong bao gio toi Edge Function, hay toi roi nhung hong o buoc sau.
  */
  console.log('--- Lan Edge Function duoc goi gan nhat ---');
  const limits = await checked(
    admin.schema('private').from('submission_rate_limits')
      .select('user_id,scope,window_started_at,request_count')
      .order('window_started_at', { ascending: false }).limit(5),
  ).catch((error) => { console.log('  (khong doc duoc:', error.message, ')'); return []; });
  if (limits.length === 0) console.log('  (bang rong - Edge Function chua tung chay den buoc nay)');
  for (const row of limits) console.log(`  ${row.window_started_at} ${row.scope} x${row.request_count}`);

  /*
    Ban nhap luu qua PostgREST, bai nop di qua Edge Function. Hai duong khac nhau:
    neu ban nhap MOI ma khong co lan nop nao thi may hoc sinh van noi duoc
    Supabase, chi rieng duong cham bai hong.
  */
  console.log('--- Ban nhap code moi nhat (duong PostgREST) ---');
  const drafts = await checked(
    admin.from('code_drafts').select('user_id,challenge_id,updated_at')
      .order('updated_at', { ascending: false }).limit(5),
  );
  if (drafts.length === 0) console.log('  (chua co ban nhap nao)');
  for (const row of drafts) console.log(`  ${row.updated_at} ${row.challenge_id}`);

  console.log('--- Su kien hoat dong moi nhat ---');
  const events = await checked(
    admin.from('activity_events').select('event_type,challenge_id,created_at')
      .order('created_at', { ascending: false }).limit(5),
  );
  if (events.length === 0) console.log('  (chua co su kien nao)');
  for (const row of events) console.log(`  ${row.created_at} ${row.event_type} ${row.challenge_id ?? ''}`);

  console.log('--- Quyen goi RPC (bang khoa secret) ---');
  const quota = await admin.rpc('consume_submission_quota', {
    p_user_id: ZERO, p_scope: 'challenge', p_limit: 0, p_window_seconds: 60,
  });
  console.log('  consume_submission_quota ->', quota.error ? `LOI: ${quota.error.message}` : `ok (tra ve ${quota.data})`);

  const record = await admin.rpc('record_authoritative_attempt', {
    p_user_id: ZERO, p_lesson_id: 'a0', p_challenge_id: 'a0-c1-first-program', p_code: '',
    p_run_ok: false, p_is_correct: false, p_passed_tests: 0, p_total_tests: 1,
    p_error_types: [], p_hint_level: 0, p_clean_code_score: null,
  });
  const expected = record.error?.message?.includes('TAI_KHOAN_KHONG_HOP_LE');
  console.log('  record_authoritative_attempt ->',
    expected ? 'ok (chan dung tai khoan khong hop le, khong ghi gi)'
      : record.error ? `LOI BAT THUONG: ${record.error.message}` : 'BAT THUONG: khong chan');
  process.exit(0);
}

const base = admin.from('profiles').select('id,full_name,student_code,class_name,role,total_xp,level,gem_balance');
const students = await checked(
  sweepClass
    ? base.eq('class_name', sweepClass).eq('role', 'student').order('full_name')
    : base.or(`full_name.ilike.%${needle}%,student_code.ilike.%${needle}%`),
);

if (students.length === 0) {
  console.log(`Khong tim thay hoc sinh nao khop "${sweepClass ?? needle}".`);
  process.exit(0);
}

/*
  Che do quet lop: may chu KHONG nhin thay duoc hang doi trong trinh duyet cua
  hoc sinh. Thu duy nhat no biet la "em nay da mo bai nhung chua co lan nop nao
  duoc xac nhan" — dong nghia hoac em chua lam gi, hoac bai dang ket trong may
  cua em. Thay doi chieu voi thuc te tren lop de biet la truong hop nao.
*/
if (sweepClass) {
  console.log(`Lop ${sweepClass} · ${students.length} hoc sinh`);
  console.log('');
  for (const student of students) {
    const progress = await checked(
      admin.from('lesson_progress').select('lesson_id,completed_challenges').eq('user_id', student.id),
    );
    const { count } = await admin
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', student.id);
    const started = progress.length;
    const done = progress.reduce((total, row) => total + row.completed_challenges.length, 0);
    const suspect = started > 0 && count === 0;
    console.log(
      `${suspect ? '!!' : '  '} ${(student.full_name ?? '—').padEnd(28)}` +
        ` xp=${String(student.total_xp).padStart(4)} · ${String(count).padStart(3)} lan nop` +
        ` · ${done} nhiem vu · ${started} khu vuc da mo`,
    );
  }
  console.log('');
  console.log('"!!" = da mo khu vuc nhung khong co lan nop nao toi may chu.');
  console.log('   Chua lam gi, hoac bai dang ket trong trinh duyet cua em do.');
  process.exit(0);
}

for (const student of students) {
  console.log('='.repeat(72));
  console.log(`${student.full_name} · ${student.student_code ?? '—'} · lop ${student.class_name ?? '—'} · ${student.role}`);
  console.log(`  total_xp=${student.total_xp}  level=${student.level}  gem=${student.gem_balance}`);

  const progress = await checked(
    admin
      .from('lesson_progress')
      .select('lesson_id,status,progress_percent,stars,xp,completed_challenges,updated_at')
      .eq('user_id', student.id)
      .order('lesson_id'),
  );

  if (progress.length === 0) console.log('  (chua co ban ghi lesson_progress nao)');
  for (const row of progress) {
    console.log(
      `  ${row.lesson_id.padEnd(4)} ${row.status.padEnd(12)} ${String(row.progress_percent).padStart(3)}%` +
        ` ${row.stars}sao ${String(row.xp).padStart(4)}xp` +
        ` · ${row.completed_challenges.length} nhiem vu · ${row.updated_at}`,
    );
    // Ba cot nay luon duoc RPC ghi trong cung mot cau UPDATE. Lech nhau nghia la
    // ban ghi den tu mot duong ghi khac (ban cu, hoac sua tay), khong phai tu grader.
    if (row.completed_challenges.length > 0 && row.stars === 0 && row.progress_percent === 0) {
      console.log('     ^^ BAT THUONG: co nhiem vu da xong nhung khong co sao/phan tram.');
    }
  }

  const attempts = await checked(
    admin
      .from('challenge_attempts')
      .select('lesson_id,challenge_id,is_correct,passed_tests,total_tests,created_at')
      .eq('user_id', student.id)
      .order('created_at', { ascending: false })
      .limit(15),
  );
  console.log(`  --- ${attempts.length} lan nop gan nhat (nguon: challenge_attempts) ---`);
  for (const attempt of attempts) {
    console.log(
      `  ${attempt.created_at} ${attempt.challenge_id.padEnd(24)}` +
        ` ${attempt.is_correct ? 'DUNG' : 'sai '} ${attempt.passed_tests}/${attempt.total_tests}`,
    );
  }
  // Khong co lan nop nao ma van co nhiem vu "da xong" => bai chua bao gio toi may chu:
  // chung dang nam trong hang doi cua trinh duyet (localStorage `cq8:outbox:v2:*`).
  if (attempts.length === 0 && progress.some((row) => row.completed_challenges.length > 0)) {
    console.log('  ^^ Khong co lan nop nao toi may chu. Kiem tra hang doi trong trinh duyet.');
  }
}
