-- ============================================================================
-- CODEQUEST C++ 8 — Kiểm thử Row Level Security
--
-- Cách chạy: Supabase Dashboard -> SQL Editor -> New query -> dán toàn bộ -> Run
--
-- Script này TỰ DỌN sau khi chạy (toàn bộ nằm trong một transaction rồi
-- ROLLBACK), nên chạy trên project thật cũng an toàn — không để lại dữ liệu rác.
--
-- Nếu một kiểm tra thất bại, script dừng ngay và in ra thông báo bằng tiếng Việt.
-- Chạy hết mà thấy dòng "TAT CA KIEM TRA RLS DEU DAT" là mọi thứ đúng.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Dựng dữ liệu thử: hai học sinh và một giáo viên
-- ----------------------------------------------------------------------------

create temporary table _rls_ids (
  label text primary key,
  id uuid not null
) on commit drop;

insert into _rls_ids (label, id) values
  ('student_a', '11111111-1111-4111-8111-111111111111'),
  ('student_b', '22222222-2222-4222-8222-222222222222'),
  ('teacher',   '33333333-3333-4333-8333-333333333333');

-- Tạo user trong auth.users (chạy với quyền của SQL Editor nên bỏ qua RLS)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at)
select
  r.id,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  r.label || '@rls-test.local',
  '',
  now(), now(), now()
from _rls_ids r
on conflict (id) do nothing;

-- Trigger handle_new_user đã tự tạo profile. Nâng một tài khoản lên giáo viên.
update public.profiles
set role = 'teacher', full_name = 'Giao vien kiem thu'
where id = (select id from _rls_ids where label = 'teacher');

update public.profiles
set full_name = 'Hoc sinh A', class_name = '8A1'
where id = (select id from _rls_ids where label = 'student_a');

update public.profiles
set full_name = 'Hoc sinh B', class_name = '8A1'
where id = (select id from _rls_ids where label = 'student_b');

-- Mỗi học sinh có một bản ghi tiến trình
insert into public.lesson_progress (user_id, lesson_id, status, progress_percent, xp)
select id, 'l1', 'in_progress', 40, 100 from _rls_ids where label in ('student_a', 'student_b')
on conflict (user_id, lesson_id) do nothing;

-- ----------------------------------------------------------------------------
-- Tiện ích: đóng vai một người dùng cụ thể
--
-- `set local role authenticated` bật RLS lên (vai trò mặc định của SQL Editor
-- bỏ qua RLS). `request.jwt.claims` là chỗ auth.uid() đọc ra id người dùng.
-- ----------------------------------------------------------------------------

create or replace function pg_temp.act_as(p_label text)
returns void language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from _rls_ids where label = p_label;
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create or replace function pg_temp.act_as_admin()
returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

create or replace function pg_temp.check_that(p_condition boolean, p_message text)
returns void language plpgsql as $$
begin
  if not p_condition then
    raise exception 'KIEM TRA THAT BAI: %', p_message;
  end if;
  raise notice 'DAT: %', p_message;
end $$;

-- ============================================================================
-- 1. profiles — học sinh chỉ đọc và sửa hồ sơ của chính mình
-- ============================================================================

select pg_temp.act_as('student_a');

select pg_temp.check_that(
  (select count(*) from public.profiles) = 1,
  'Hoc sinh chi doc duoc dung ho so cua chinh minh'
);

select pg_temp.check_that(
  (select full_name from public.profiles) = 'Hoc sinh A',
  'Ho so doc duoc dung la cua chinh minh'
);

-- Thử sửa hồ sơ người khác: RLS lọc hết nên không dòng nào bị ảnh hưởng
update public.profiles set full_name = 'Bi doi ten'
where id = (select id from _rls_ids where label = 'student_b');

select pg_temp.act_as_admin();
select pg_temp.check_that(
  (select full_name from public.profiles
   where id = (select id from _rls_ids where label = 'student_b')) = 'Hoc sinh B',
  'Hoc sinh KHONG sua duoc ho so cua ban khac'
);

-- ============================================================================
-- 2. Học sinh KHÔNG tự nâng mình lên giáo viên
--    (trigger profiles_guard_update chặn, không phải RLS)
-- ============================================================================

select pg_temp.act_as('student_a');
update public.profiles set role = 'teacher'
where id = (select id from _rls_ids where label = 'student_a');

select pg_temp.act_as_admin();
select pg_temp.check_that(
  (select role from public.profiles
   where id = (select id from _rls_ids where label = 'student_a')) = 'student',
  'Hoc sinh KHONG tu nang minh len giao vien duoc'
);

-- ============================================================================
-- 3. Học sinh KHÔNG tự bơm XP quá mức
-- ============================================================================

select pg_temp.act_as('student_a');
update public.profiles set total_xp = 999999
where id = (select id from _rls_ids where label = 'student_a');

select pg_temp.act_as_admin();
select pg_temp.check_that(
  (select total_xp from public.profiles
   where id = (select id from _rls_ids where label = 'student_a')) <= 500,
  'Hoc sinh KHONG bom XP vo han duoc (nguong 500 moi lan)'
);

-- XP không bao giờ bị giảm
select pg_temp.act_as_admin();
update public.profiles set total_xp = 300
where id = (select id from _rls_ids where label = 'student_a');

select pg_temp.act_as('student_a');
update public.profiles set total_xp = 0
where id = (select id from _rls_ids where label = 'student_a');

select pg_temp.act_as_admin();
select pg_temp.check_that(
  (select total_xp from public.profiles
   where id = (select id from _rls_ids where label = 'student_a')) = 300,
  'XP khong bao gio bi giam xuong'
);

-- ============================================================================
-- 4. lesson_progress — học sinh chỉ thấy tiến trình của mình
-- ============================================================================

select pg_temp.act_as('student_a');

select pg_temp.check_that(
  (select count(*) from public.lesson_progress) = 1,
  'Hoc sinh chi doc duoc tien trinh cua chinh minh'
);

-- ============================================================================
-- 5. challenge_attempts — INSERT-only, không sửa được lịch sử học tập
-- ============================================================================

select pg_temp.act_as('student_a');

insert into public.challenge_attempts
  (user_id, lesson_id, challenge_id, submitted_code, is_correct, passed_tests, total_tests)
values
  ((select id from _rls_ids where label = 'student_a'), 'l1', 'l1-c1-observe', 'int main(){}', false, 0, 1);

select pg_temp.check_that(
  (select count(*) from public.challenge_attempts) = 1,
  'Hoc sinh ghi duoc lan lam bai cua minh'
);

-- Thử ghi hộ người khác: WITH CHECK chặn lại
do $$
begin
  begin
    insert into public.challenge_attempts
      (user_id, lesson_id, challenge_id, submitted_code, is_correct, passed_tests, total_tests)
    values
      ((select id from _rls_ids where label = 'student_b'), 'l1', 'l1-c1-observe', 'x', true, 1, 1);
    raise exception 'KIEM TRA THAT BAI: Hoc sinh ghi duoc lan lam bai HO NGUOI KHAC';
  exception when insufficient_privilege then
    raise notice 'DAT: Hoc sinh KHONG ghi duoc lan lam bai ho nguoi khac';
  end;
end $$;

-- Không có policy UPDATE -> sửa cũng không ăn thua
update public.challenge_attempts set is_correct = true;

select pg_temp.check_that(
  (select bool_and(is_correct = false) from public.challenge_attempts),
  'Hoc sinh KHONG sua duoc lich su lam bai (INSERT-only)'
);

-- ============================================================================
-- 6. certificates — bất biến, không cấp trùng
-- ============================================================================

select pg_temp.act_as('student_a');

insert into public.certificates (user_id, lesson_id, certificate_code, xp_at_issue, stars_at_issue)
values ((select id from _rls_ids where label = 'student_a'), 'l1', 'CPP8-L1-111111-1', 300, 3);

-- Cấp lần hai cho cùng bài học -> ràng buộc UNIQUE chặn
do $$
begin
  begin
    insert into public.certificates (user_id, lesson_id, certificate_code, xp_at_issue, stars_at_issue)
    values ((select id from _rls_ids where label = 'student_a'), 'l1', 'CPP8-L1-111111-2', 300, 3);
    raise exception 'KIEM TRA THAT BAI: Cap duoc chung chi TRUNG cho cung mot bai hoc';
  exception when unique_violation then
    raise notice 'DAT: Khong cap trung chung chi cho cung mot bai hoc';
  end;
end $$;

-- Không có policy UPDATE/DELETE -> chứng chỉ đã cấp là bất biến
update public.certificates set stars_at_issue = 0;
delete from public.certificates;

select pg_temp.check_that(
  (select count(*) from public.certificates) = 1
    and (select stars_at_issue from public.certificates) = 3,
  'Chung chi da cap la BAT BIEN, khong sua khong xoa duoc'
);

-- ============================================================================
-- 7. code_drafts — riêng tư, giáo viên KHÔNG đọc được
-- ============================================================================

select pg_temp.act_as('student_a');

insert into public.code_drafts (user_id, lesson_id, challenge_id, code)
values ((select id from _rls_ids where label = 'student_a'), 'l1', 'l1-c1-observe', 'code nhap');

select pg_temp.act_as('teacher');

select pg_temp.check_that(
  (select count(*) from public.code_drafts) = 0,
  'Giao vien KHONG doc duoc code nhap giua chung cua hoc sinh'
);

-- ============================================================================
-- 8. Giáo viên đọc được dữ liệu học tập của học sinh
-- ============================================================================

select pg_temp.act_as('teacher');

select pg_temp.check_that(
  (select count(*) from public.profiles) >= 3,
  'Giao vien doc duoc danh sach hoc sinh'
);

select pg_temp.check_that(
  (select count(*) from public.lesson_progress) = 2,
  'Giao vien doc duoc tien trinh cua ca lop'
);

select pg_temp.check_that(
  (select count(*) from public.challenge_attempts) >= 1,
  'Giao vien doc duoc lich su lam bai cua hoc sinh'
);

select pg_temp.check_that(
  (select count(*) from public.certificates) = 1,
  'Giao vien doc duoc chung chi da cap'
);

-- ============================================================================
-- 9. class_settings — ai cũng đọc, chỉ giáo viên sửa
-- ============================================================================

select pg_temp.act_as('teacher');

insert into public.class_settings (class_name, unlocked_lessons, allow_solution_view)
values ('RLS-TEST', '{"l1","l2"}', true)
on conflict (class_name) do update set allow_solution_view = true;

select pg_temp.act_as('student_a');

select pg_temp.check_that(
  (select count(*) from public.class_settings where class_name = 'RLS-TEST') = 1,
  'Hoc sinh DOC duoc cai dat lop (de biet bai nao dang mo)'
);

update public.class_settings set allow_solution_view = false where class_name = 'RLS-TEST';

select pg_temp.act_as_admin();
select pg_temp.check_that(
  (select allow_solution_view from public.class_settings where class_name = 'RLS-TEST') = true,
  'Hoc sinh KHONG sua duoc cai dat lop'
);

-- ============================================================================
-- 10. Mọi bảng có dữ liệu học sinh đều đã bật RLS
-- ============================================================================

select pg_temp.act_as_admin();

select pg_temp.check_that(
  not exists (
    select 1 from pg_tables
    where schemaname = 'public'
      and tablename in ('profiles', 'lesson_progress', 'challenge_attempts', 'code_drafts',
                        'certificates', 'badges', 'user_badges', 'exit_tickets',
                        'activity_events', 'class_settings')
      and rowsecurity = false
  ),
  'TAT CA bang deu da bat Row Level Security'
);

-- ============================================================================
-- Kết luận
-- ============================================================================

do $$
begin
  raise notice '';
  raise notice '=====================================';
  raise notice ' TAT CA KIEM TRA RLS DEU DAT';
  raise notice '=====================================';
end $$;

-- Không giữ lại bất kỳ dữ liệu thử nào
rollback;
