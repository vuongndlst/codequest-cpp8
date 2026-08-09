-- ============================================================================
-- CODEQUEST C++ 8 — Migration 0003
--
-- Hai nhom thay doi:
--   A. Va lo hong XP: hoc sinh co the goi API nhieu lan de tu bom diem
--   B. Quan ly lop hoc bang MA LOP, mot lop co the co nhieu giao vien
--
-- Chay SAU 0001 va 0002. Chay lai nhieu lan van an toan.
-- ============================================================================


-- ############################################################################
-- PHAN A — VA LO HONG XP
--
-- Lo hong tim ra khi test tren ban chay that:
--   Trigger cu chi chan MOT lan cap nhat vuot qua 500 XP. Hoc sinh goi API
--   nhieu lan lien tiep thi moi lan lai duoc cong them 500:
--       500 -> 1000 -> 1500 -> 2000 -> ...
--   Chi can mot vong lap la len cap toi da.
--
-- CACH VA: total_xp khong con la con so client tu ghi nua. No duoc TINH LAI
-- tu tong xp cua bang lesson_progress — ma bang do lai bi rang buoc boi
-- completed_challenges. Muon co XP thi phai that su hoan thanh nhiem vu.
-- ############################################################################

-- Tinh lai tong XP cua mot hoc sinh tu du lieu tien trinh co that
create or replace function public.recalculate_total_xp(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  select coalesce(sum(xp), 0) into v_total
  from public.lesson_progress
  where user_id = p_user_id;

  update public.profiles
  set total_xp = v_total,
      level = public.calculate_level(v_total)
  where id = p_user_id;

  return v_total;
end;
$$;

comment on function public.recalculate_total_xp is
  'Tinh lai total_xp tu tong xp cac bai hoc. Nguon su that la lesson_progress.';

-- Moi khi tien trinh thay doi, tu dong tinh lai tong XP
create or replace function public.sync_total_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_total_xp(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_lesson_progress_sync_xp on public.lesson_progress;
create trigger trg_lesson_progress_sync_xp
  after insert or update or delete on public.lesson_progress
  for each row execute function public.sync_total_xp();

-- Chan hoan toan viec client tu ghi total_xp / level.
-- Thay the trigger guard cu.
create or replace function public.profiles_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_teacher boolean;
begin
  -- auth.uid() la NULL khi chay tu SQL Editor hoac tu trigger noi bo
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'
  ) into v_is_teacher;

  -- 1. Chi giao vien moi doi duoc role
  if new.role is distinct from old.role and not v_is_teacher then
    new.role := old.role;
  end if;

  -- 2. total_xp va level KHONG BAO GIO nhan tu client.
  --    Chung chi duoc doi qua recalculate_total_xp() (SECURITY DEFINER,
  --    chay voi auth.uid() = null nen di qua nhanh tren).
  new.total_xp := old.total_xp;
  new.level := old.level;

  return new;
end;
$$;

-- Dong bo lai cho moi hoc sinh dang co, don sach du lieu bi bom trong luc test
do $$
declare r record;
begin
  for r in select id from public.profiles loop
    perform public.recalculate_total_xp(r.id);
  end loop;
end $$;

grant execute on function public.recalculate_total_xp(uuid) to authenticated;


-- ############################################################################
-- PHAN B — QUAN LY LOP HOC
--
-- Truoc day "lop" chi la mot o chu tu do trong ho so hoc sinh. Hoc sinh go
-- "8A1", "8a1", "8 A1" la thanh ba lop khac nhau, va giao vien khong co cach
-- nao biet em nao thuc su thuoc lop minh.
--
-- Nay lop la mot thuc the that:
--   · Giao vien tao lop, he thong sinh MA LOP
--   · Hoc sinh nhap ma lop de vao dung lop
--   · Mot lop co the co NHIEU giao vien cung day
-- ############################################################################

create table if not exists public.classes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(trim(name)) between 1 and 40),
  -- Ma lop hoc sinh nhap de vao, vd. "8A1-K7M2"
  join_code    text not null unique check (char_length(join_code) between 4 and 20),
  school_year  text check (char_length(school_year) <= 20),
  note         text check (char_length(note) <= 200),
  -- Khoa lop lai khi khong muon nhan them hoc sinh
  is_open      boolean not null default true,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_classes_join_code on public.classes (join_code);

create trigger trg_classes_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- Mot lop co nhieu giao vien
create table if not exists public.class_teachers (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  -- 'owner' la nguoi tao lop; 'teacher' la giao vien duoc them vao
  role       text not null default 'teacher' check (role in ('owner', 'teacher')),
  added_at   timestamptz not null default now(),

  constraint uq_class_teachers unique (class_id, teacher_id)
);

create index if not exists idx_class_teachers_teacher on public.class_teachers (teacher_id);

-- Moi hoc sinh thuoc DUNG MOT lop. Nhap ma lop moi thi chuyen lop.
create table if not exists public.class_members (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),

  constraint uq_class_members_student unique (student_id)
);

create index if not exists idx_class_members_class on public.class_members (class_id);


-- ----------------------------------------------------------------------------
-- Sinh ma lop
--
-- Bo ky tu CO Y bo cac chu de nhin nham khi hoc sinh chep tay tu bang:
--   khong co 0/O, 1/I/L, 5/S, 8/B
-- ----------------------------------------------------------------------------
create or replace function public.generate_join_code(p_class_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alphabet constant text := 'ACDEFGHJKMNPQRTUVWXY2346789';
  v_prefix text;
  v_suffix text;
  v_code text;
  v_try integer := 0;
begin
  -- Tien to lay tu ten lop cho de nhan ra, vd. "8A1" -> "8A1"
  v_prefix := upper(regexp_replace(coalesce(p_class_name, ''), '[^A-Za-z0-9]', '', 'g'));
  v_prefix := substring(v_prefix from 1 for 4);
  if v_prefix = '' then v_prefix := 'LOP'; end if;

  loop
    v_suffix := '';
    for i in 1..4 loop
      v_suffix := v_suffix || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;

    v_code := v_prefix || '-' || v_suffix;
    exit when not exists (select 1 from public.classes where join_code = v_code);

    v_try := v_try + 1;
    if v_try > 50 then
      raise exception 'Khong sinh duoc ma lop moi sau 50 lan thu';
    end if;
  end loop;

  return v_code;
end;
$$;


-- ----------------------------------------------------------------------------
-- Giao vien tao lop
--
-- SECURITY DEFINER de vua tao lop vua tu them nguoi tao vao class_teachers
-- trong mot buoc. Van kiem tra vai tro giao vien ben trong.
-- ----------------------------------------------------------------------------
create or replace function public.create_class(
  p_name text,
  p_school_year text default null,
  p_note text default null
)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Can dang nhap de tao lop';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid and role = 'teacher') then
    raise exception 'Chi giao vien moi duoc tao lop';
  end if;

  insert into public.classes (name, join_code, school_year, note, created_by)
  values (trim(p_name), public.generate_join_code(p_name), p_school_year, p_note, v_uid)
  returning * into v_class;

  insert into public.class_teachers (class_id, teacher_id, role)
  values (v_class.id, v_uid, 'owner');

  return v_class;
end;
$$;


-- ----------------------------------------------------------------------------
-- Hoc sinh vao lop bang ma
--
-- Dung RPC thay vi cho client doc thang bang `classes`: neu mo quyen doc bang
-- do, bat ky ai cung liet ke duoc toan bo lop trong truong. RPC nay chi tra
-- loi dung mot cau hoi "ma nay co hop le khong", khong lo gi them.
-- ----------------------------------------------------------------------------
create or replace function public.join_class_by_code(p_code text)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Can dang nhap de vao lop';
  end if;

  select * into v_class
  from public.classes
  where upper(join_code) = upper(trim(p_code));

  if v_class.id is null then
    raise exception 'MA_LOP_KHONG_DUNG';
  end if;

  if not v_class.is_open then
    raise exception 'LOP_DA_KHOA';
  end if;

  -- Nhap ma lop moi thi chuyen lop, khong tao ban ghi thu hai
  insert into public.class_members (class_id, student_id)
  values (v_class.id, v_uid)
  on conflict (student_id) do update
    set class_id = excluded.class_id, joined_at = now();

  -- Dong bo ten lop sang ho so, de dashboard va CSV cu van chay
  update public.profiles set class_name = v_class.name where id = v_uid;

  return v_class;
end;
$$;


-- ----------------------------------------------------------------------------
-- Tien ich: nguoi dung hien tai co day lop nay khong
-- ----------------------------------------------------------------------------
create or replace function public.teaches_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.class_teachers
    where class_id = p_class_id and teacher_id = auth.uid()
  );
$$;


-- ----------------------------------------------------------------------------
-- Row Level Security cho ba bang moi
-- ----------------------------------------------------------------------------
alter table public.classes        enable row level security;
alter table public.class_teachers enable row level security;
alter table public.class_members  enable row level security;

drop policy if exists classes_select_teacher on public.classes;
drop policy if exists classes_select_member  on public.classes;
drop policy if exists classes_update_teacher on public.classes;

-- Giao vien thay lop MINH DAY (khong thay lop cua giao vien khac)
create policy classes_select_teacher on public.classes
  for select to authenticated
  using (public.teaches_class(id));

-- Hoc sinh thay dung lop cua minh
create policy classes_select_member on public.classes
  for select to authenticated
  using (exists (
    select 1 from public.class_members m
    where m.class_id = classes.id and m.student_id = auth.uid()
  ));

create policy classes_update_teacher on public.classes
  for update to authenticated
  using (public.teaches_class(id))
  with check (public.teaches_class(id));

-- CO Y khong co policy INSERT: tao lop bat buoc di qua create_class()
-- de bao dam lop nao cung co ma va co chu nhiem.

drop policy if exists class_teachers_select on public.class_teachers;
drop policy if exists class_teachers_insert on public.class_teachers;
drop policy if exists class_teachers_delete on public.class_teachers;

create policy class_teachers_select on public.class_teachers
  for select to authenticated
  using (teacher_id = auth.uid() or public.teaches_class(class_id));

-- Giao vien dang day lop duoc them dong nghiep vao cung day
create policy class_teachers_insert on public.class_teachers
  for insert to authenticated
  with check (public.teaches_class(class_id));

create policy class_teachers_delete on public.class_teachers
  for delete to authenticated
  using (public.teaches_class(class_id) and teacher_id <> auth.uid());

drop policy if exists class_members_select_own     on public.class_members;
drop policy if exists class_members_select_teacher on public.class_members;
drop policy if exists class_members_delete_teacher on public.class_members;

create policy class_members_select_own on public.class_members
  for select to authenticated
  using (student_id = auth.uid());

create policy class_members_select_teacher on public.class_members
  for select to authenticated
  using (public.teaches_class(class_id));

-- Giao vien go hoc sinh khoi lop khi xep nham
create policy class_members_delete_teacher on public.class_members
  for delete to authenticated
  using (public.teaches_class(class_id));

-- CO Y khong co policy INSERT: vao lop bat buoc di qua join_class_by_code()
-- de ma lop duoc kiem tra dung dan.

grant select, update on public.classes        to authenticated;
grant select, insert, delete on public.class_teachers to authenticated;
grant select, delete on public.class_members  to authenticated;

grant execute on function public.create_class(text, text, text)   to authenticated;
grant execute on function public.join_class_by_code(text)         to authenticated;
grant execute on function public.teaches_class(uuid)              to authenticated;
grant execute on function public.generate_join_code(text)         to authenticated;
