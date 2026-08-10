import { readFileSync } from 'node:fs';
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
