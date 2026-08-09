-- ============================================================================
-- CODEQUEST C++ 8 — Migration 0004
--
-- HOI DAP GIUA HOC SINH VA GIAO VIEN
--
-- Chay SAU 0003. Chay lai nhieu lan van an toan.
-- ============================================================================
--
-- PHAM VI CO Y GIOI HAN — day la san pham dung trong truong hoc:
--
--   · Hoc sinh CHI nhan tin duoc voi giao vien cua LOP MINH.
--   · KHONG co chat hoc sinh - hoc sinh. Mo ra la mo luon mot kenh bat nat
--     ma nha truong khong quan ly noi, va de bai khong he yeu cau.
--   · KHONG gui duoc anh hay tep. Chi co chu.
--   · Giao vien XOA duoc tin nhan trong lop minh — can co cong cu xu ly khi
--     hoc sinh viet bay.
--
-- MOI HOC SINH CO MOT LUONG HOI DAP, dinh danh bang cap (class_id, student_id).
-- Moi giao vien cua lop deu doc va tra loi duoc cung luong do — dung yeu cau
-- "mot lop co the co nhieu giao vien".
-- ============================================================================


create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),

  -- Cap (class_id, student_id) xac dinh MOT luong hoi dap
  class_id    uuid not null references public.classes(id)  on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,

  -- Nguoi viet: hoac chinh hoc sinh, hoac mot giao vien cua lop
  sender_id   uuid not null references public.profiles(id) on delete cascade,

  /*
    Ten va vai tro nguoi gui duoc CHEP LAI vao day thay vi noi sang profiles.

    Ly do: RLS cho hoc sinh doc DUNG ho so cua chinh minh. Neu khong chep ten
    sang day thi hoc sinh khong doc noi ten giao vien da tra loi — man hinh chi
    hien mot day ma uuid. Cach con lai la noi long quyen doc bang profiles, ma
    nhu vay thi mo rong quyen chi de hien mot cai ten: khong dang.

    Chep lai con dung ve mat y nghia: tin nhan nen hien ten LUC GUI.
  */
  sender_name text not null,
  sender_role text not null check (sender_role in ('student', 'teacher')),

  body        text not null check (char_length(trim(body)) between 1 and 1000),

  -- Danh dau da doc cho tung phia, de dem tin chua doc
  read_by_student boolean not null default false,
  read_by_teacher boolean not null default false,

  created_at  timestamptz not null default now()
);

comment on table public.messages is
  'Hoi dap giua hoc sinh va giao vien cua lop. Khong co chat hoc sinh - hoc sinh.';

-- Truy van chinh: lay ca luong theo thu tu thoi gian
create index if not exists idx_messages_thread
  on public.messages (class_id, student_id, created_at);

-- Truy van phu: dem tin chua doc cua mot hoc sinh
create index if not exists idx_messages_student_unread
  on public.messages (student_id, read_by_student);


-- ----------------------------------------------------------------------------
-- Dien nguoi gui tu phien dang nhap, KHONG lay tu du lieu client gui len
--
-- Neu tin client thi hoc sinh co the tu dat sender_role = 'teacher' va gia
-- danh thay co ngay trong lop minh.
-- ----------------------------------------------------------------------------
create or replace function public.set_message_sender()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text;
  v_role text;
begin
  if v_uid is null then
    raise exception 'Can dang nhap de gui tin nhan';
  end if;

  select full_name, role into v_name, v_role
  from public.profiles where id = v_uid;

  if v_name is null then
    raise exception 'Khong tim thay ho so nguoi gui';
  end if;

  new.sender_id   := v_uid;
  new.sender_name := v_name;
  new.sender_role := v_role;

  -- Nguoi viet thi coi nhu da doc chinh tin cua minh
  if v_role = 'teacher' then
    new.read_by_teacher := true;
    new.read_by_student := false;
  else
    new.read_by_student := true;
    new.read_by_teacher := false;
  end if;

  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists trg_messages_set_sender on public.messages;
create trigger trg_messages_set_sender
  before insert on public.messages
  for each row execute function public.set_message_sender();


-- ----------------------------------------------------------------------------
-- Danh dau ca luong la da doc
--
-- Dung RPC thay vi mo policy UPDATE: neu mo UPDATE cho hoc sinh, em sua duoc
-- luon `body` cua tin nhan da gui — sua ca tin cua thay co.
-- ----------------------------------------------------------------------------
create or replace function public.mark_thread_read(p_class_id uuid, p_student_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Can dang nhap';
  end if;

  if v_uid = p_student_id then
    -- Hoc sinh doc luong cua chinh minh
    update public.messages
    set read_by_student = true
    where class_id = p_class_id and student_id = p_student_id and read_by_student = false;

  elsif public.teaches_class(p_class_id) then
    -- Giao vien cua lop doc luong cua mot hoc sinh
    update public.messages
    set read_by_teacher = true
    where class_id = p_class_id and student_id = p_student_id and read_by_teacher = false;

  else
    raise exception 'Khong co quyen doc luong hoi dap nay';
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists messages_select_own     on public.messages;
drop policy if exists messages_select_teacher on public.messages;
drop policy if exists messages_insert_student on public.messages;
drop policy if exists messages_insert_teacher on public.messages;
drop policy if exists messages_delete_teacher on public.messages;

-- Hoc sinh doc dung luong cua minh
create policy messages_select_own on public.messages
  for select to authenticated
  using (student_id = auth.uid());

-- Giao vien doc moi luong cua lop minh day
create policy messages_select_teacher on public.messages
  for select to authenticated
  using (public.teaches_class(class_id));

/*
  Hoc sinh chi gui duoc vao luong CUA CHINH MINH, va chi trong lop MINH DANG HOC.

  Dieu kien `class_members` la phan quan trong nhat: khong co no thi hoc sinh
  doan mot uuid lop bat ky la gui tin vao lop khac duoc.
*/
create policy messages_insert_student on public.messages
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.class_members m
      where m.student_id = auth.uid() and m.class_id = messages.class_id
    )
  );

-- Giao vien tra loi vao luong cua hoc sinh trong lop minh
create policy messages_insert_teacher on public.messages
  for insert to authenticated
  with check (
    public.teaches_class(class_id)
    and exists (
      select 1 from public.class_members m
      where m.student_id = messages.student_id and m.class_id = messages.class_id
    )
  );

/*
  Giao vien xoa duoc tin nhan trong lop minh — cong cu xu ly khi hoc sinh viet
  bay. CO Y khong cho hoc sinh xoa: em xoa loi minh vua viet thi thay co mat
  luon bang chung de xu ly.
*/
create policy messages_delete_teacher on public.messages
  for delete to authenticated
  using (public.teaches_class(class_id));

-- CO Y khong co policy UPDATE cho bat ky ai: tin da gui thi khong sua duoc,
-- ca hai phia deu yen tam ve noi dung minh doc duoc.

grant select, insert, delete on public.messages to authenticated;
grant execute on function public.mark_thread_read(uuid, uuid) to authenticated;
