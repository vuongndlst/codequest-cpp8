-- ============================================================================
-- CODEQUEST C++ 8 - CAI DAT DATABASE (chay MOT LAN duy nhat)
--
-- CACH CHAY:
--   1. Mo Supabase Dashboard cua thay
--   2. Vao muc SQL Editor o thanh ben trai
--   3. Bam New query
--   4. Dan TOAN BO file nay vao roi bam Run (hoac Ctrl + Enter)
--
-- File nay gop 3 file goc lai lam mot, theo dung thu tu:
--   0001_init_schema.sql  -> tao bang, ham, trigger, index
--   0002_rls_policies.sql -> bat Row Level Security va tao policy
--   seed.sql              -> nap 10 huy hieu va cai dat lop mau
--
-- Chay lai nhieu lan cung KHONG sao: moi lenh deu dung
-- if not exists / on conflict nen khong tao ban ghi trung.
--
-- Chay xong, thay chay tiep file supabase/tests/rls_checks.sql
-- de tu kiem chung phan bao mat.
-- ============================================================================

-- ============================================================================
-- CODEQUEST C++ 8 — Migration 0001: Schema
-- Hanh trinh giai cuu ByteLand
--
-- Cach chay: Supabase Dashboard -> SQL Editor -> New query -> dan toan bo -> Run
-- Chay file nay TRUOC 0002_rls_policies.sql
--
-- File nay CHI tao bang / ham / trigger / index.
-- Toan bo Row Level Security nam o 0002_rls_policies.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Ham tien ich dung chung
-- ----------------------------------------------------------------------------

-- Tu dong cap nhat cot updated_at moi khi ban ghi thay doi
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tinh cap do tu tong XP.
-- Cong thuc (docs/phase-1-architecture.md muc 5.3):
--   XP tich luy can de len cap L = 50 * (L-1) * L
--   => Lv2=100, Lv3=300, Lv4=600, Lv5=1000, Lv6=1500, Lv7=2100
-- Giai nguoc: L = floor( (50 + sqrt(2500 + 200*xp)) / 100 )
create or replace function public.calculate_level(p_xp integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor((50 + sqrt(2500 + 200 * greatest(p_xp, 0))) / 100)::integer);
$$;

comment on function public.calculate_level is
  'Tinh cap do nguoi choi tu tong XP. Lv2=100xp, Lv3=300xp, Lv4=600xp, Lv5=1000xp.';


-- ----------------------------------------------------------------------------
-- 1. profiles — ho so hoc sinh / giao vien
--    Lien ket 1-1 voi auth.users. KHONG BAO GIO luu mat khau o day.
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null check (char_length(trim(full_name)) between 1 and 80),
  class_name        text check (char_length(class_name) <= 20),
  student_code      text check (char_length(student_code) <= 30),
  avatar_id         text not null default 'guardian-cyan'
                      check (char_length(avatar_id) <= 40),
  role              text not null default 'student'
                      check (role in ('student', 'teacher')),

  -- Cache gamification: tranh phai tong hop lai moi lan mo dashboard
  total_xp          integer not null default 0 check (total_xp >= 0),
  level             integer not null default 1 check (level >= 1),
  streak_days       integer not null default 0 check (streak_days >= 0),
  last_active_date  date,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is
  'Ho so nguoi dung. Vai tro teacher KHONG duoc dat tu client - xem trigger profiles_guard_update.';

create index if not exists idx_profiles_class_name on public.profiles (class_name);
create index if not exists idx_profiles_role       on public.profiles (role);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- Tu dong tao profile khi co user moi dang ky.
-- SECURITY DEFINER vi trigger chay trong ngu canh cua auth.users.
-- ROLE LUON BI EP VE 'student' — client khong the tu chon lam giao vien (muc 13).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, class_name, student_code, avatar_id, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Code Guardian'),
    nullif(trim(new.raw_user_meta_data ->> 'class_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'student_code'), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'avatar_id'), ''), 'guardian-cyan'),
    'student'   -- <-- ep cung, bo qua moi gia tri client gui len
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Chan hoc sinh tu nang quyen hoac tu bom XP qua REST API.
-- RLS cho phep hoc sinh UPDATE ho so cua chinh minh, nen can trigger nay
-- de khoa cac cot nhay cam.
create or replace function public.profiles_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_teacher boolean;
begin
  -- Bo qua kiem tra khi chay bang service_role (script quan tri chay o may giao vien)
  if auth.uid() is null then
    new.level := public.calculate_level(new.total_xp);
    return new;
  end if;

  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'
  ) into v_is_teacher;

  -- 1. Chi giao vien moi doi duoc role (thuc te van nen doi truc tiep trong DB)
  if new.role is distinct from old.role and not v_is_teacher then
    new.role := old.role;
  end if;

  -- 2. XP chi duoc TANG, khong bao gio giam (muc 6: khong tru diem nang)
  if new.total_xp < old.total_xp then
    new.total_xp := old.total_xp;
  end if;

  -- 3. Chan bom XP bat thuong. Mot lan hoan thanh nhieu nhat ~90 XP (boss + bonus).
  --    Nguong 500 du rong cho dong bo offline nhieu challenge cung luc.
  if new.total_xp - old.total_xp > 500 then
    new.total_xp := old.total_xp + 500;
  end if;

  -- 4. level luon duoc tinh lai tu total_xp, khong tin gia tri client gui
  new.level := public.calculate_level(new.total_xp);

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_update on public.profiles;
create trigger trg_profiles_guard_update
  before update on public.profiles
  for each row execute function public.profiles_guard_update();


-- ----------------------------------------------------------------------------
-- 2. is_teacher() — ham kiem tra vai tro
--
--    ⚠ QUAN TRONG: phai la SECURITY DEFINER.
--    Neu viet policy giao vien bang cach truy van thang public.profiles,
--    Postgres se bao loi "infinite recursion detected in policy for relation profiles".
--    SECURITY DEFINER chay voi quyen owner -> bo qua RLS -> khong de quy.
-- ----------------------------------------------------------------------------

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

comment on function public.is_teacher is
  'Kiem tra nguoi dung hien tai co phai giao vien. SECURITY DEFINER de tranh de quy RLS.';


-- ----------------------------------------------------------------------------
-- 3. lesson_progress — tien trinh theo tung bai hoc
-- ----------------------------------------------------------------------------

create table if not exists public.lesson_progress (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  lesson_id             text not null check (char_length(lesson_id) <= 40),
  status                text not null default 'in_progress'
                          check (status in ('locked', 'in_progress', 'completed')),
  progress_percent      integer not null default 0 check (progress_percent between 0 and 100),
  stars                 integer not null default 0 check (stars between 0 and 3),
  xp                    integer not null default 0 check (xp >= 0),
  -- Danh sach id challenge da hoan thanh -> dung de mo khoa node ke tiep
  completed_challenges  text[] not null default '{}',
  started_at            timestamptz default now(),
  completed_at          timestamptz,
  updated_at            timestamptz not null default now(),

  constraint uq_lesson_progress_user_lesson unique (user_id, lesson_id)
);

create index if not exists idx_lesson_progress_user on public.lesson_progress (user_id);

create trigger trg_lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 4. challenge_attempts — moi lan hoc sinh bam "Chay code"
--    INSERT-only voi hoc sinh -> du lieu hoc tap trung thuc, giao vien tin duoc.
-- ----------------------------------------------------------------------------

create table if not exists public.challenge_attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  lesson_id         text not null check (char_length(lesson_id) <= 40),
  challenge_id      text not null check (char_length(challenge_id) <= 60),
  -- Gioi han do dai code gui len (muc 22)
  submitted_code    text not null check (char_length(submitted_code) <= 10000),
  is_correct        boolean not null default false,
  passed_tests      integer not null default 0 check (passed_tests >= 0),
  total_tests       integer not null default 0 check (total_tests >= 0),
  -- Ma loi thuong gap, vd. {'MISSING_SEMICOLON','VAR_TYPO'} -> thong ke cho giao vien
  error_types       text[] not null default '{}',
  hint_level_used   integer not null default 0 check (hint_level_used between 0 and 4),
  attempt_number    integer not null default 1 check (attempt_number >= 1),
  clean_code_score  integer check (clean_code_score between 0 and 100),
  created_at        timestamptz not null default now()
);

create index if not exists idx_attempts_user_challenge
  on public.challenge_attempts (user_id, challenge_id);
create index if not exists idx_attempts_user_created
  on public.challenge_attempts (user_id, created_at desc);
create index if not exists idx_attempts_lesson
  on public.challenge_attempts (lesson_id);
-- Ho tro dashboard giao vien: tong hop loi pho bien cua ca lop
create index if not exists idx_attempts_error_types
  on public.challenge_attempts using gin (error_types);


-- ----------------------------------------------------------------------------
-- 5. code_drafts — code dang lam do (auto-save)
--
--    Tach rieng khoi challenge_attempts vi:
--      - attempts la INSERT-only (lich su), draft can UPSERT lien tuc
--      - moi hoc sinh chi giu 1 ban nhap / challenge -> khong phinh bang
--    Yeu cau muc 7 ("Luu tu dong code dang lam") va muc 23.
-- ----------------------------------------------------------------------------

create table if not exists public.code_drafts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     text not null check (char_length(lesson_id) <= 40),
  challenge_id  text not null check (char_length(challenge_id) <= 60),
  code          text not null check (char_length(code) <= 10000),
  updated_at    timestamptz not null default now(),

  constraint uq_code_drafts_user_challenge unique (user_id, challenge_id)
);

create index if not exists idx_code_drafts_user on public.code_drafts (user_id);

create trigger trg_code_drafts_updated_at
  before update on public.code_drafts
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 6. certificates — chung chi
--    UNIQUE(user_id, lesson_id) chan cap trung o TANG DATABASE, khong chi o UI.
-- ----------------------------------------------------------------------------

create table if not exists public.certificates (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  lesson_id         text not null check (char_length(lesson_id) <= 40),
  -- Dinh dang: CPP8-[LESSON]-[USER6]-[TIMESTAMP], vd. CPP8-L3-7F3A21-1735689600
  certificate_code  text not null unique check (char_length(certificate_code) <= 60),
  issued_at         timestamptz not null default now(),
  xp_at_issue       integer not null default 0,
  stars_at_issue    integer not null default 0 check (stars_at_issue between 0 and 3),
  -- Chup lai ho ten / lop / ten bai tai thoi diem cap -> chung chi bat bien
  metadata          jsonb not null default '{}'::jsonb,

  constraint uq_certificates_user_lesson unique (user_id, lesson_id)
);

create index if not exists idx_certificates_user on public.certificates (user_id);

comment on table public.certificates is
  'Chung chi bat bien. Khong co policy UPDATE/DELETE cho hoc sinh - da cap la giu vinh vien.';


-- ----------------------------------------------------------------------------
-- 7. badges + user_badges — huy hieu
-- ----------------------------------------------------------------------------

create table if not exists public.badges (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (char_length(code) <= 40),
  name        text not null,
  description text not null,
  icon        text not null,
  tier        text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold')),
  sort_order  integer not null default 0
);

comment on table public.badges is
  'Bang cong khai (chi doc voi moi nguoi dung). Du lieu nap bang seed.sql, client khong ghi.';

create table if not exists public.user_badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  badge_id  uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),

  constraint uq_user_badges unique (user_id, badge_id)
);

create index if not exists idx_user_badges_user on public.user_badges (user_id);


-- ----------------------------------------------------------------------------
-- 8. exit_tickets
-- ----------------------------------------------------------------------------

create table if not exists public.exit_tickets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     text not null check (char_length(lesson_id) <= 40),
  answers       jsonb not null default '{}'::jsonb,
  score         integer not null default 0 check (score between 0 and 100),
  reflection    text check (char_length(reflection) <= 1000),
  submitted_at  timestamptz not null default now(),

  constraint uq_exit_tickets_user_lesson unique (user_id, lesson_id)
);

create index if not exists idx_exit_tickets_user on public.exit_tickets (user_id);


-- ----------------------------------------------------------------------------
-- 9. activity_events — nhat ky hoat dong (append-only)
--    Dung cho "Thanh tich gan day" (HS) va "Hoat dong gan nhat" (GV).
-- ----------------------------------------------------------------------------

create table if not exists public.activity_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  event_type    text not null check (char_length(event_type) <= 40),
  lesson_id     text check (char_length(lesson_id) <= 40),
  challenge_id  text check (char_length(challenge_id) <= 60),
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_activity_user_created
  on public.activity_events (user_id, created_at desc);
create index if not exists idx_activity_type
  on public.activity_events (event_type);


-- ----------------------------------------------------------------------------
-- 10. class_settings — cai dat theo lop (giao vien dieu khien)
--     Can cho muc 16: "mo hoac khoa bai hoc", "bat hoac tat quyen xem dap an".
-- ----------------------------------------------------------------------------

create table if not exists public.class_settings (
  id                  uuid primary key default gen_random_uuid(),
  class_name          text not null unique check (char_length(class_name) <= 20),
  -- Bai hoc duoc mo them ngoai quy tac mo khoa tuan tu, vd. {'l1','l2'}
  unlocked_lessons    text[] not null default '{}',
  allow_solution_view boolean not null default false,
  updated_by          uuid references public.profiles(id) on delete set null,
  updated_at          timestamptz not null default now()
);

create trigger trg_class_settings_updated_at
  before update on public.class_settings
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 11. Quyen truy cap co ban
--     RLS moi la lop bao ve that su (xem 0002). GRANT chi mo "cua" cho vai tro.
-- ----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles          to authenticated;
grant select, insert, update on public.lesson_progress   to authenticated;
grant select, insert          on public.challenge_attempts to authenticated;
grant select, insert, update, delete on public.code_drafts to authenticated;
grant select, insert          on public.certificates     to authenticated;
grant select                  on public.badges           to authenticated, anon;
grant select, insert          on public.user_badges      to authenticated;
grant select, insert, update  on public.exit_tickets     to authenticated;
grant select, insert          on public.activity_events  to authenticated;
grant select, insert, update  on public.class_settings   to authenticated;

-- Giao vien can xoa attempt khi "Dat lai tien trinh mot challenge" (muc 16)
grant delete on public.challenge_attempts to authenticated;
grant delete on public.lesson_progress    to authenticated;

grant execute on function public.is_teacher()        to authenticated;
grant execute on function public.calculate_level(integer) to authenticated, anon;


-- ============================================================================
-- ============================================================================
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


-- ============================================================================
-- ============================================================================
-- ============================================================================
-- CODEQUEST C++ 8 — Dữ liệu khởi tạo
--
-- Chạy SAU 0001_init_schema.sql và 0002_rls_policies.sql
-- File này chạy lại nhiều lần được (idempotent) — dùng `on conflict do update`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 10 huy hiệu (mục 26 của đề bài)
--
-- Nguyên tắc thiết kế: KHÔNG có huy hiệu nào phạt học sinh.
-- "No Hint Hero" chỉ là phần thưởng phụ; "Persistent Coder" thưởng cho sự
-- KIÊN TRÌ (hoàn thành sau nhiều lần thử), không phải sự hoàn hảo.
-- `icon` = tên icon trong thư viện lucide-react (giấy phép ISC).
-- ----------------------------------------------------------------------------

insert into public.badges (code, name, description, icon, tier, sort_order) values
  ('first-run',
   'First Run',
   'Em đã chạy chương trình C++ đầu tiên của mình. Hành trình bắt đầu!',
   'Play', 'bronze', 1),

  ('bug-hunter',
   'Bug Hunter',
   'Hoàn thành 5 Debug Challenge. Em đã có con mắt tinh tường với lỗi rồi!',
   'Bug', 'silver', 2),

  ('semicolon-saver',
   'Semicolon Saver',
   'Tự mình phát hiện và sửa lỗi thiếu dấu chấm phẩy 3 lần.',
   'Sparkles', 'bronze', 3),

  ('function-builder',
   'Function Builder',
   'Đánh bại Boss Khu vực 2 — Xưởng Phép Thuật. Em biết chia nhỏ nhiệm vụ rồi!',
   'Wrench', 'gold', 4),

  ('loop-explorer',
   'Loop Explorer',
   'Đánh bại Boss Khu vực 3 — Thung Lũng Lặp. Vòng lặp không làm khó em nữa.',
   'RefreshCw', 'gold', 5),

  ('decision-maker',
   'Decision Maker',
   'Đánh bại Boss Khu vực 4 — Cổng Quyết Định. Em đã biết cách ra quyết định trong code.',
   'GitBranch', 'gold', 6),

  ('clean-code-rookie',
   'Clean Code Rookie',
   'Lần đầu đạt điểm Clean Code từ 80 trở lên. Code của em dễ đọc lắm!',
   'Feather', 'bronze', 7),

  ('clean-code-guardian',
   'Clean Code Guardian',
   'Đạt Clean Code từ 90 trở lên ở cả 5 bài học. Một lập trình viên thật sự!',
   'ShieldCheck', 'gold', 8),

  ('no-hint-hero',
   'No Hint Hero',
   'Hoàn thành một Boss Challenge mà chưa cần gợi ý. Đây chỉ là phần thưởng vui thôi — dùng gợi ý là chuyện hoàn toàn bình thường nhé!',
   'Lightbulb', 'silver', 9),

  ('persistent-coder',
   'Persistent Coder',
   'Hoàn thành một nhiệm vụ sau nhiều lần thử. Kiên trì mới là điều quan trọng nhất!',
   'Heart', 'silver', 10)

on conflict (code) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  tier        = excluded.tier,
  sort_order  = excluded.sort_order;


-- ----------------------------------------------------------------------------
-- Cài đặt lớp học mẫu
--
-- Mặc định: chỉ mở Khu vực 1, các khu sau mở dần theo tiến trình.
-- `allow_solution_view = false` -> học sinh không xem được đáp án đầy đủ.
-- Thầy đổi tên lớp ở dòng dưới cho khớp với lớp thầy đang dạy.
-- ----------------------------------------------------------------------------

insert into public.class_settings (class_name, unlocked_lessons, allow_solution_view) values
  ('8A1', '{"l1"}', false),
  ('8A2', '{"l1"}', false),
  ('8A3', '{"l1"}', false)
on conflict (class_name) do nothing;


-- ----------------------------------------------------------------------------
-- HƯỚNG DẪN TẠO TÀI KHOẢN GIÁO VIÊN
--
-- Website KHÔNG cho phép chọn vai trò 'teacher' khi đăng ký (mục 13).
-- Cách làm an toàn:
--   1. Thầy đăng ký bình thường trên website bằng email của thầy
--   2. Vào Supabase Dashboard -> SQL Editor -> chạy lệnh dưới (bỏ dấu --)
--   3. Đăng xuất và đăng nhập lại để nhận vai trò mới
--
-- update public.profiles
-- set role = 'teacher'
-- where id = (select id from auth.users where email = 'email-cua-thay@gmail.com');
--
-- Kiểm tra lại:
-- select p.full_name, p.role, u.email
-- from public.profiles p join auth.users u on u.id = p.id
-- where p.role = 'teacher';
-- ----------------------------------------------------------------------------
