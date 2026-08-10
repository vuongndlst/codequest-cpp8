-- CODEQUEST C++ 8 — Migration 0006: Gem và trang bị chơi đơn

alter table public.profiles
  add column if not exists gem_balance integer not null default 0 check (gem_balance >= 0);

create table if not exists public.challenge_gem_rewards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  challenge_id  text not null check (char_length(challenge_id) <= 60),
  gems_awarded  integer not null check (gems_awarded between 1 and 20),
  awarded_at    timestamptz not null default now(),
  constraint uq_challenge_gem_reward unique (user_id, challenge_id)
);

create table if not exists public.equipment_catalog (
  id             text primary key,
  name           text not null,
  description    text not null,
  base_cost      integer not null check (base_cost >= 0),
  max_level      integer not null default 3 check (max_level between 1 and 5),
  unlock_lesson  text not null,
  sort_order     integer not null default 0
);

insert into public.equipment_catalog
  (id, name, description, base_cost, max_level, unlock_lesson, sort_order)
values
  ('navigator', 'Bộ điều hướng', 'Dùng các lệnh di chuyển trên bản đồ.', 0, 3, 'l1', 1),
  ('algorithm-sword', 'Kiếm thuật toán', 'Mở thao tác tấn công trong nhiệm vụ chiến đấu.', 45, 3, 'l3', 2),
  ('condition-shield', 'Khiên điều kiện', 'Tượng trưng cho quyết định if / else.', 45, 3, 'l4', 3)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_cost = excluded.base_cost,
  max_level = excluded.max_level,
  unlock_lesson = excluded.unlock_lesson,
  sort_order = excluded.sort_order;

create table if not exists public.user_equipment (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  equipment_id  text not null references public.equipment_catalog(id) on delete restrict,
  level         integer not null default 1 check (level between 1 and 5),
  equipped      boolean not null default false,
  acquired_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint uq_user_equipment unique (user_id, equipment_id)
);

create index if not exists idx_gem_rewards_user on public.challenge_gem_rewards(user_id);
create index if not exists idx_user_equipment_user on public.user_equipment(user_id);

drop trigger if exists trg_user_equipment_updated_at on public.user_equipment;
create trigger trg_user_equipment_updated_at
  before update on public.user_equipment
  for each row execute function public.set_updated_at();

-- Cấp miễn phí bộ điều hướng cho hồ sơ hiện có.
insert into public.user_equipment (user_id, equipment_id, level, equipped)
select id, 'navigator', 1, true from public.profiles
on conflict (user_id, equipment_id) do nothing;

create or replace function public.grant_starter_equipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_equipment (user_id, equipment_id, level, equipped)
  values (new.id, 'navigator', 1, true)
  on conflict (user_id, equipment_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_profiles_grant_starter_equipment on public.profiles;
create trigger trg_profiles_grant_starter_equipment
  after insert on public.profiles
  for each row execute function public.grant_starter_equipment();

-- Bảo vệ Gem giống XP: client không thể sửa trực tiếp số dư.
create or replace function public.profiles_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_teacher boolean;
begin
  if auth.uid() is null then return new; end if;

  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'
  ) into v_is_teacher;

  if new.role is distinct from old.role and not v_is_teacher then
    new.role := old.role;
  end if;

  new.total_xp := old.total_xp;
  new.level := old.level;

  if coalesce(current_setting('app.codequest_gem_write', true), '') <> 'on' then
    new.gem_balance := old.gem_balance;
  end if;

  return new;
end;
$$;

-- Thưởng một lần sau khi đã có ít nhất một attempt đúng của nhiệm vụ.
create or replace function public.award_challenge_gems(p_challenge_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reward integer;
  v_inserted integer;
begin
  if v_uid is null then raise exception 'CAN_DANG_NHAP'; end if;

  if not exists (
    select 1 from public.challenge_attempts
    where user_id = v_uid and challenge_id = p_challenge_id and is_correct = true
  ) then
    raise exception 'NHIEM_VU_CHUA_HOAN_THANH';
  end if;

  v_reward := case when p_challenge_id like '%-boss' then 12 else 3 end;

  insert into public.challenge_gem_rewards (user_id, challenge_id, gems_awarded)
  values (v_uid, p_challenge_id, v_reward)
  on conflict (user_id, challenge_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then return 0; end if;

  perform set_config('app.codequest_gem_write', 'on', true);
  update public.profiles set gem_balance = gem_balance + v_reward where id = v_uid;
  return v_reward;
end;
$$;

create or replace function public.purchase_or_upgrade_equipment(p_equipment_id text)
returns public.user_equipment
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.equipment_catalog;
  v_current public.user_equipment;
  v_next_level integer;
  v_cost integer;
  v_result public.user_equipment;
begin
  if v_uid is null then raise exception 'CAN_DANG_NHAP'; end if;
  select * into v_item from public.equipment_catalog where id = p_equipment_id;
  if v_item.id is null then raise exception 'TRANG_BI_KHONG_TON_TAI'; end if;

  select * into v_current from public.user_equipment
  where user_id = v_uid and equipment_id = p_equipment_id;

  v_next_level := coalesce(v_current.level, 0) + 1;
  if v_next_level > v_item.max_level then raise exception 'TRANG_BI_DA_TOI_DA'; end if;
  v_cost := v_item.base_cost * greatest(1, v_next_level);

  if (select gem_balance from public.profiles where id = v_uid) < v_cost then
    raise exception 'KHONG_DU_GEM';
  end if;

  perform set_config('app.codequest_gem_write', 'on', true);
  update public.profiles set gem_balance = gem_balance - v_cost where id = v_uid;

  insert into public.user_equipment (user_id, equipment_id, level, equipped)
  values (v_uid, p_equipment_id, v_next_level, v_current.id is null)
  on conflict (user_id, equipment_id) do update
    set level = excluded.level
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.equip_item(p_equipment_id text)
returns public.user_equipment
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result public.user_equipment;
begin
  if not exists (
    select 1 from public.user_equipment
    where user_id = v_uid and equipment_id = p_equipment_id
  ) then raise exception 'CHUA_SO_HUU_TRANG_BI'; end if;

  update public.user_equipment set equipped = false where user_id = v_uid;
  update public.user_equipment
    set equipped = true
    where user_id = v_uid and equipment_id = p_equipment_id
    returning * into v_result;
  return v_result;
end;
$$;

alter table public.challenge_gem_rewards enable row level security;
alter table public.equipment_catalog enable row level security;
alter table public.user_equipment enable row level security;

create policy gem_rewards_select_own on public.challenge_gem_rewards
  for select to authenticated using (user_id = auth.uid() or public.is_teacher());
create policy equipment_catalog_select on public.equipment_catalog
  for select to authenticated using (true);
create policy user_equipment_select_own on public.user_equipment
  for select to authenticated using (user_id = auth.uid() or public.is_teacher());

grant select on public.challenge_gem_rewards to authenticated;
grant select on public.equipment_catalog to authenticated;
grant select on public.user_equipment to authenticated;
grant execute on function public.award_challenge_gems(text) to authenticated;
grant execute on function public.purchase_or_upgrade_equipment(text) to authenticated;
grant execute on function public.equip_item(text) to authenticated;
