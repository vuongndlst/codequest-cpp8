-- ============================================================================
-- CODEQUEST C++ 8 — Migration 0002: Row Level Security
--
-- Chay file nay SAU 0001_init_schema.sql
--
-- Nguyen tac (muc 14 + 22 cua de bai):
--   · Hoc sinh chi doc/ghi duoc du lieu CUA CHINH MINH
--   · Giao vien doc duoc du lieu hoc tap cua hoc sinh qua ham is_teacher()
--   · Khong bao gio tin cot `role` do client gui len
--   · Chung chi bat bien: khong co policy UPDATE/DELETE cho hoc sinh
--   · challenge_attempts INSERT-only: hoc sinh khong sua duoc lich su hoc tap
--
-- ⚠ Ham is_teacher() la SECURITY DEFINER (dinh nghia o 0001).
--   Neu thay bang truy van truc tiep public.profiles, Postgres se bao
--   "infinite recursion detected in policy for relation profiles".
-- ============================================================================

-- Bat RLS cho TAT CA bang co du lieu hoc sinh
alter table public.profiles           enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.code_drafts        enable row level security;
alter table public.certificates       enable row level security;
alter table public.badges             enable row level security;
alter table public.user_badges        enable row level security;
alter table public.exit_tickets       enable row level security;
alter table public.activity_events    enable row level security;
alter table public.class_settings     enable row level security;


-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------

drop policy if exists profiles_select_own     on public.profiles;
drop policy if exists profiles_select_teacher on public.profiles;
drop policy if exists profiles_insert_own     on public.profiles;
drop policy if exists profiles_update_own     on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

-- Giao vien xem duoc danh sach hoc sinh (muc 16)
create policy profiles_select_teacher on public.profiles
  for select to authenticated
  using (public.is_teacher());

-- Du profile duoc tao tu dong bang trigger, van giu policy nay lam luoi an toan
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- Hoc sinh sua duoc ho so cua minh.
-- Cot `role`, `total_xp`, `level` duoc khoa boi trigger profiles_guard_update.
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ----------------------------------------------------------------------------
-- lesson_progress
-- ----------------------------------------------------------------------------

drop policy if exists lesson_progress_select_own     on public.lesson_progress;
drop policy if exists lesson_progress_select_teacher on public.lesson_progress;
drop policy if exists lesson_progress_insert_own     on public.lesson_progress;
drop policy if exists lesson_progress_update_own     on public.lesson_progress;
drop policy if exists lesson_progress_delete_teacher on public.lesson_progress;

create policy lesson_progress_select_own on public.lesson_progress
  for select to authenticated
  using (auth.uid() = user_id);

create policy lesson_progress_select_teacher on public.lesson_progress
  for select to authenticated
  using (public.is_teacher());

create policy lesson_progress_insert_own on public.lesson_progress
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy lesson_progress_update_own on public.lesson_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Giao vien "Dat lai tien trinh" (muc 16)
create policy lesson_progress_delete_teacher on public.lesson_progress
  for delete to authenticated
  using (public.is_teacher());


-- ----------------------------------------------------------------------------
-- challenge_attempts  (INSERT-only voi hoc sinh)
-- ----------------------------------------------------------------------------

drop policy if exists attempts_select_own     on public.challenge_attempts;
drop policy if exists attempts_select_teacher on public.challenge_attempts;
drop policy if exists attempts_insert_own     on public.challenge_attempts;
drop policy if exists attempts_delete_teacher on public.challenge_attempts;

create policy attempts_select_own on public.challenge_attempts
  for select to authenticated
  using (auth.uid() = user_id);

create policy attempts_select_teacher on public.challenge_attempts
  for select to authenticated
  using (public.is_teacher());

create policy attempts_insert_own on public.challenge_attempts
  for insert to authenticated
  with check (auth.uid() = user_id);

-- CO Y KHONG co policy UPDATE cho hoc sinh: lich su hoc tap phai trung thuc.
create policy attempts_delete_teacher on public.challenge_attempts
  for delete to authenticated
  using (public.is_teacher());


-- ----------------------------------------------------------------------------
-- code_drafts  (rieng tu: giao vien KHONG xem code nhap do)
-- ----------------------------------------------------------------------------

drop policy if exists drafts_select_own on public.code_drafts;
drop policy if exists drafts_insert_own on public.code_drafts;
drop policy if exists drafts_update_own on public.code_drafts;
drop policy if exists drafts_delete_own on public.code_drafts;

create policy drafts_select_own on public.code_drafts
  for select to authenticated
  using (auth.uid() = user_id);

create policy drafts_insert_own on public.code_drafts
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy drafts_update_own on public.code_drafts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy drafts_delete_own on public.code_drafts
  for delete to authenticated
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- certificates  (bat bien: khong UPDATE, khong DELETE)
-- ----------------------------------------------------------------------------

drop policy if exists certificates_select_own     on public.certificates;
drop policy if exists certificates_select_teacher on public.certificates;
drop policy if exists certificates_insert_own     on public.certificates;

create policy certificates_select_own on public.certificates
  for select to authenticated
  using (auth.uid() = user_id);

create policy certificates_select_teacher on public.certificates
  for select to authenticated
  using (public.is_teacher());

create policy certificates_insert_own on public.certificates
  for insert to authenticated
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- badges  (bang cong khai, chi doc)
-- ----------------------------------------------------------------------------

drop policy if exists badges_select_all on public.badges;

create policy badges_select_all on public.badges
  for select to authenticated, anon
  using (true);

-- Khong co policy INSERT/UPDATE/DELETE: du lieu chi nap bang seed.sql / migration.


-- ----------------------------------------------------------------------------
-- user_badges
-- ----------------------------------------------------------------------------

drop policy if exists user_badges_select_own     on public.user_badges;
drop policy if exists user_badges_select_teacher on public.user_badges;
drop policy if exists user_badges_insert_own     on public.user_badges;

create policy user_badges_select_own on public.user_badges
  for select to authenticated
  using (auth.uid() = user_id);

create policy user_badges_select_teacher on public.user_badges
  for select to authenticated
  using (public.is_teacher());

create policy user_badges_insert_own on public.user_badges
  for insert to authenticated
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- exit_tickets
-- ----------------------------------------------------------------------------

drop policy if exists exit_tickets_select_own     on public.exit_tickets;
drop policy if exists exit_tickets_select_teacher on public.exit_tickets;
drop policy if exists exit_tickets_insert_own     on public.exit_tickets;
drop policy if exists exit_tickets_update_own     on public.exit_tickets;

create policy exit_tickets_select_own on public.exit_tickets
  for select to authenticated
  using (auth.uid() = user_id);

create policy exit_tickets_select_teacher on public.exit_tickets
  for select to authenticated
  using (public.is_teacher());

create policy exit_tickets_insert_own on public.exit_tickets
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Cho phep lam lai Exit Ticket (muc 6: thu lai khong gioi han)
create policy exit_tickets_update_own on public.exit_tickets
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- activity_events  (append-only)
-- ----------------------------------------------------------------------------

drop policy if exists activity_select_own     on public.activity_events;
drop policy if exists activity_select_teacher on public.activity_events;
drop policy if exists activity_insert_own     on public.activity_events;

create policy activity_select_own on public.activity_events
  for select to authenticated
  using (auth.uid() = user_id);

create policy activity_select_teacher on public.activity_events
  for select to authenticated
  using (public.is_teacher());

create policy activity_insert_own on public.activity_events
  for insert to authenticated
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- class_settings
--   Hoc sinh CAN doc de biet bai nao dang mo -> cho SELECT tat ca.
--   Chi giao vien moi sua.
-- ----------------------------------------------------------------------------

drop policy if exists class_settings_select_all     on public.class_settings;
drop policy if exists class_settings_insert_teacher on public.class_settings;
drop policy if exists class_settings_update_teacher on public.class_settings;

create policy class_settings_select_all on public.class_settings
  for select to authenticated
  using (true);

create policy class_settings_insert_teacher on public.class_settings
  for insert to authenticated
  with check (public.is_teacher());

create policy class_settings_update_teacher on public.class_settings
  for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());
