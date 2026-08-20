-- ============================================================================
-- CODEQUEST C++ 8 — Migration 0010
-- Dieu phoi tien do lop hoc theo tung khu vuc.
--
-- access_mode:
--   sequence: mo theo lo trinh hoc tap mac dinh
--   open:     giao vien mo ngay, khong can xong khu vuc truoc
--   locked:   giao vien tam khoa, ke ca hoc sinh da du dieu kien tuan tu
--
-- due_date chi la han hoan thanh de nhac hoc sinh; qua han KHONG tu dong khoa.
-- Giao vien chu dong khoa khi can dieu chinh nhip do cua lop.
-- ============================================================================

create table if not exists public.class_area_controls (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes(id) on delete cascade,
  lesson_id   text not null check (lesson_id ~ '^a[0-9]+$'),
  access_mode text not null default 'sequence'
    check (access_mode in ('sequence', 'open', 'locked')),
  due_date    date,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint uq_class_area_controls unique (class_id, lesson_id)
);

create index if not exists idx_class_area_controls_class
  on public.class_area_controls (class_id);

drop trigger if exists trg_class_area_controls_updated_at on public.class_area_controls;
create trigger trg_class_area_controls_updated_at
  before update on public.class_area_controls
  for each row execute function public.set_updated_at();

alter table public.class_area_controls enable row level security;

drop policy if exists class_area_controls_select on public.class_area_controls;
drop policy if exists class_area_controls_insert_teacher on public.class_area_controls;
drop policy if exists class_area_controls_update_teacher on public.class_area_controls;
drop policy if exists class_area_controls_delete_teacher on public.class_area_controls;

-- Hoc sinh chi thay dieu khien cua lop minh; giao vien chi thay lop minh day.
create policy class_area_controls_select on public.class_area_controls
  for select to authenticated
  using (
    public.teaches_class(class_id)
    or exists (
      select 1
      from public.class_members m
      where m.class_id = class_area_controls.class_id
        and m.student_id = auth.uid()
    )
  );

create policy class_area_controls_insert_teacher on public.class_area_controls
  for insert to authenticated
  with check (public.teaches_class(class_id) and updated_by = auth.uid());

create policy class_area_controls_update_teacher on public.class_area_controls
  for update to authenticated
  using (public.teaches_class(class_id))
  with check (public.teaches_class(class_id) and updated_by = auth.uid());

create policy class_area_controls_delete_teacher on public.class_area_controls
  for delete to authenticated
  using (public.teaches_class(class_id));

grant select, insert, update, delete on public.class_area_controls to authenticated;
