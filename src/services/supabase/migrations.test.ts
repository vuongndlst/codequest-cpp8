import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Kiểm tra tĩnh trên file migration.
 *
 * Không thay thế được `supabase/tests/rls_checks.sql` (chạy thật trên database),
 * nhưng bắt được lỗi phổ biến nhất khi mở rộng schema: thêm một bảng chứa dữ
 * liệu học sinh mà QUÊN bật RLS. Lỗi đó im lặng và cực kỳ nguy hiểm — dữ liệu
 * cả lớp sẽ đọc được bởi bất kỳ ai có khoá publishable.
 */

const ROOT = join(process.cwd(), 'supabase');

const schemaSql = readFileSync(join(ROOT, 'migrations', '0001_init_schema.sql'), 'utf8');
const policySql = readFileSync(join(ROOT, 'migrations', '0002_rls_policies.sql'), 'utf8');
const identitySql = readFileSync(join(ROOT, 'migrations', '0005_lsts_student_identity.sql'), 'utf8');
const economySql = readFileSync(join(ROOT, 'migrations', '0006_single_player_economy.sql'), 'utf8');
const economyProgressionSql = readFileSync(join(ROOT, 'migrations', '0008_journey_and_equipment_progression.sql'), 'utf8');
const automaticCertificatesSql = readFileSync(join(ROOT, 'migrations', '0009_automatic_certificates.sql'), 'utf8');
const area6Sql = readFileSync(join(ROOT, 'migrations', '0011_area_6_function_workshop.sql'), 'utf8');
const advancedMigrationName = readdirSync(join(ROOT, 'migrations')).find((name) => name.endsWith('_advanced_cs_areas.sql'))!;
const advancedAreasSql = readFileSync(join(ROOT, 'migrations', advancedMigrationName), 'utf8');
const hardeningMigrationName = readdirSync(join(ROOT, 'migrations')).find((name) => name.endsWith('_harden_advanced_rpc_access.sql'))!;
const hardeningSql = readFileSync(join(ROOT, 'migrations', hardeningMigrationName), 'utf8');

/** Mọi bảng chứa dữ liệu gắn với một học sinh cụ thể. */
const STUDENT_DATA_TABLES = [
  'profiles',
  'lesson_progress',
  'challenge_attempts',
  'code_drafts',
  'certificates',
  'user_badges',
  'exit_tickets',
  'activity_events',
];

const ALL_TABLES = [...STUDENT_DATA_TABLES, 'badges', 'class_settings'];

describe('Migration schema', () => {
  it('tạo đủ mọi bảng theo thiết kế', () => {
    for (const table of ALL_TABLES) {
      expect(schemaSql).toContain(`create table if not exists public.${table}`);
    }
  });

  it('giới hạn độ dài code gửi lên database (mục 22)', () => {
    expect(schemaSql).toMatch(/char_length\(submitted_code\)\s*<=\s*10000/);
    expect(schemaSql).toMatch(/char_length\(code\)\s*<=\s*10000/);
  });

  it('chống cấp trùng chứng chỉ ngay ở tầng database', () => {
    expect(schemaSql).toContain('uq_certificates_user_lesson unique (user_id, lesson_id)');
  });

  it('ép vai trò student khi tạo tài khoản mới — client không tự chọn được', () => {
    expect(schemaSql).toContain('handle_new_user');
    // Giá trị 'student' được viết cứng trong câu insert của trigger
    expect(schemaSql).toMatch(/'student'\s*--/);
  });

  it('có trigger chặn học sinh tự nâng quyền và tự bơm XP', () => {
    expect(schemaSql).toContain('profiles_guard_update');
    expect(schemaSql).toContain('new.role := old.role');
    expect(schemaSql).toContain('new.total_xp := old.total_xp');
  });

  /**
   * Ham is_teacher() BẮT BUỘC phải là SECURITY DEFINER. Nếu không, policy giáo
   * viên trên bảng profiles sẽ truy vấn lại chính profiles và Postgres báo
   * "infinite recursion detected in policy for relation profiles".
   */
  it('is_teacher() là SECURITY DEFINER để tránh đệ quy RLS', () => {
    const match = /create or replace function public\.is_teacher\(\)[\s\S]*?\$\$/.exec(schemaSql);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('security definer');
  });
});

describe('Migration RLS', () => {
  it('bật Row Level Security cho TẤT CẢ các bảng', () => {
    // Chuẩn hoá khoảng trắng vì file SQL căn cột cho dễ đọc
    const normalized = policySql.replace(/\s+/g, ' ');

    for (const table of ALL_TABLES) {
      expect(normalized).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('mọi bảng dữ liệu học sinh đều có policy lọc theo auth.uid()', () => {
    const normalized = policySql.replace(/\s+/g, ' ');

    for (const table of STUDENT_DATA_TABLES) {
      const tablePolicies = normalized
        .split('create policy')
        .filter((chunk) => chunk.includes(`on public.${table} `));

      expect(tablePolicies.length).toBeGreaterThan(0);
      expect(tablePolicies.some((chunk) => chunk.includes('auth.uid()'))).toBe(true);
    }
  });

  /** Lịch sử học tập phải trung thực thì giáo viên mới tin được thống kê. */
  it('challenge_attempts KHÔNG có policy UPDATE cho học sinh', () => {
    const normalized = policySql.replace(/\s+/g, ' ');
    const attemptPolicies = normalized
      .split('create policy')
      .filter((chunk) => chunk.includes('on public.challenge_attempts '));

    expect(attemptPolicies.some((chunk) => chunk.includes('for update'))).toBe(false);
  });

  /** Chứng chỉ đã cấp là bất biến. */
  it('certificates KHÔNG có policy UPDATE hay DELETE', () => {
    const normalized = policySql.replace(/\s+/g, ' ');
    const certPolicies = normalized
      .split('create policy')
      .filter((chunk) => chunk.includes('on public.certificates '));

    expect(certPolicies.some((chunk) => chunk.includes('for update'))).toBe(false);
    expect(certPolicies.some((chunk) => chunk.includes('for delete'))).toBe(false);
  });

  /** Code nháp giữa chừng là chuyện riêng của học sinh. */
  it('code_drafts KHÔNG có policy nào cho giáo viên', () => {
    const normalized = policySql.replace(/\s+/g, ' ');
    const draftPolicies = normalized
      .split('create policy')
      .filter((chunk) => chunk.includes('on public.code_drafts '));

    expect(draftPolicies.length).toBeGreaterThan(0);
    expect(draftPolicies.some((chunk) => chunk.includes('is_teacher'))).toBe(false);
  });

  it('badges là bảng công khai chỉ đọc, không cho client ghi', () => {
    const normalized = policySql.replace(/\s+/g, ' ');
    const badgePolicies = normalized
      .split('create policy')
      .filter((chunk) => chunk.includes('on public.badges '));

    expect(badgePolicies.every((chunk) => chunk.includes('for select'))).toBe(true);
  });

  it('chỉ giáo viên mới sửa được cài đặt lớp', () => {
    const normalized = policySql.replace(/\s+/g, ' ');
    const settingPolicies = normalized
      .split('create policy')
      .filter((chunk) => chunk.includes('on public.class_settings '));

    const writePolicies = settingPolicies.filter(
      (chunk) => chunk.includes('for insert') || chunk.includes('for update'),
    );

    expect(writePolicies.length).toBeGreaterThan(0);
    expect(writePolicies.every((chunk) => chunk.includes('is_teacher'))).toBe(true);
  });
});

describe('Migration danh tính và kinh tế chơi đơn', () => {
  it('tự động cấp bù chứng chỉ và đồng bộ tên tiếng Việt theo hồ sơ hiện tại', () => {
    expect(automaticCertificatesSql).toContain('trg_issue_certificate_after_area_completion');
    expect(automaticCertificatesSql).toContain("where status = 'completed'");
    expect(automaticCertificatesSql).toContain("'studentName', p.full_name");
    expect(automaticCertificatesSql).toContain("'teacherName', 'Nguyễn Đình Vương'");
  });

  it('chuẩn hóa mã học sinh mới thành đúng 7 chữ số mà không xóa dữ liệu cũ', () => {
    expect(identitySql).toContain("new.student_code !~ '^[0-9]{7}$'");
    expect(identitySql).not.toMatch(/delete\s+from\s+public\.profiles/i);
  });

  it('mỗi nhiệm vụ chỉ thưởng Gem một lần', () => {
    expect(economySql).toContain('uq_challenge_gem_reward unique (user_id, challenge_id)');
    expect(economySql).toContain('on conflict (user_id, challenge_id) do nothing');
  });

  it('bảo vệ số dư Gem khỏi cập nhật trực tiếp từ client', () => {
    expect(economySql).toContain('new.gem_balance := old.gem_balance');
    expect(economySql).toContain("current_setting('app.codequest_gem_write'");
  });

  it('bật RLS cho toàn bộ bảng kinh tế', () => {
    for (const table of ['challenge_gem_rewards', 'equipment_catalog', 'user_equipment']) {
      expect(economySql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('gắn trang bị với đúng Area 0–5 và sửa thưởng Boss thành 12 Gem', () => {
    for (const lessonId of ['a0', 'a2', 'a3', 'a4', 'a5']) {
      expect(economyProgressionSql).toContain(`'${lessonId}'`);
    }
    expect(economyProgressionSql).toContain("'a5-c5-armor-loop'");
    expect(economyProgressionSql).toContain('then 12 else 3');
  });

  it('đồng bộ trang bị, Boss reward và chứng chỉ Area 6', () => {
    expect(area6Sql).toContain("'function-toolkit'");
    expect(area6Sql).toContain("'a6-c5-factory-core'");
    expect(area6Sql).toContain("when 'a6' then 'Function Engineer'");
    expect(area6Sql).toContain('Khu vực 6 — Xưởng Hàm');
  });

  it('đồng bộ trang bị, Boss reward và chứng chỉ Area 7–10', () => {
    for (const [lessonId, certificateName] of [['a7','Reference Navigator'],['a8','Array Cartographer'],['a9','Search Strategist'],['a10','Algorithm Architect']]) {
      expect(advancedAreasSql).toContain(`when '${lessonId}' then '${certificateName}'`);
    }
    for (const bossId of ['a7-c4-mirror-boss','a8-c4-route-array-boss','a9-c4-scout-boss','a10-c4-algorithm-core']) {
      expect(advancedAreasSql).toContain(`'${bossId}'`);
    }
    expect(advancedAreasSql).toContain("'algorithm-core'");
    expect(advancedAreasSql).toContain('Khu vực 10 — Thành Trì Thuật Toán');
  });

  it('không cho anon gọi RPC phần thưởng và chứng chỉ SECURITY DEFINER', () => {
    expect(hardeningSql).toContain('revoke execute on function public.award_challenge_gems(text) from anon');
    expect(hardeningSql).toContain('revoke execute on function public.ensure_area_certificate(uuid, text) from anon');
    expect(hardeningSql).toContain('grant execute on function public.ensure_area_certificate(uuid, text) to authenticated');
  });
});

describe('Không có khoá bí mật lọt vào mã nguồn', () => {
  it('file .env.example không chứa giá trị thật', () => {
    const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8');

    expect(envExample).toContain('VITE_SUPABASE_URL=');
    expect(envExample).toContain('VITE_SUPABASE_PUBLISHABLE_KEY=');

    // Chỉ xét các dòng KHAI BÁO BIẾN, bỏ qua dòng chú thích —
    // file này có một lời cảnh báo nhắc tới service_role, và đó là điều tốt
    const declarations = envExample
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    for (const line of declarations) {
      // Mọi biến đều phải để trống giá trị
      expect(line).toMatch(/^[A-Z_]+=$/);
      expect(line.toLowerCase()).not.toContain('service_role');
    }
  });

  it('.gitignore loại trừ file .env thật', () => {
    const gitignore = readFileSync(join(process.cwd(), '.gitignore'), 'utf8');
    expect(gitignore).toMatch(/^\.env$/m);
  });
});
