-- Version matches the migration recorded by Supabase's migration API.
-- Apply the same area gate as the UI even for direct calls to the grader.
-- No existing progress, rewards or certificates are changed.
create or replace function private.enforce_area_submission_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous text;
begin
  if exists (select 1 from public.profiles where id = new.user_id and role = 'teacher') then
    return new;
  end if;

  if not exists (select 1 from private.challenge_catalog where lesson_id = new.lesson_id) then
    raise exception 'NHIEM_VU_CHUA_MO';
  end if;

  -- An explicit teacher lock takes precedence over every unlock.
  if exists (
    select 1 from public.class_members m
    join public.class_area_controls c on c.class_id = m.class_id
    where m.student_id = new.user_id and c.lesson_id = new.lesson_id and c.access_mode = 'locked'
  ) then
    raise exception 'NHIEM_VU_CHUA_MO';
  end if;

  if new.lesson_id = 'a0' or exists (
    select 1 from public.class_members m
    join public.class_area_controls c on c.class_id = m.class_id
    where m.student_id = new.user_id and c.lesson_id = new.lesson_id and c.access_mode = 'open'
  ) or exists (
    select 1 from public.class_members m
    join public.classes c on c.id = m.class_id
    join public.class_settings s on s.class_name = c.name
    where m.student_id = new.user_id and new.lesson_id = any(s.unlocked_lessons)
  ) then
    return new;
  end if;

  -- Catalog identifiers are a0..a10; numeric ordering avoids a10 before a2.
  select lesson_id into v_previous
  from private.challenge_catalog
  where lesson_id ~ '^a[0-9]+$'
    and substring(lesson_id from 2)::integer < substring(new.lesson_id from 2)::integer
  order by substring(lesson_id from 2)::integer desc
  limit 1;

  if v_previous is null or not exists (
    select 1 from public.lesson_progress
    where user_id = new.user_id and lesson_id = v_previous and status = 'completed'
  ) then
    raise exception 'NHIEM_VU_CHUA_MO';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_area_submission_access() from public, anon, authenticated;

create trigger enforce_attempt_area_access
before insert on public.challenge_attempts
for each row execute function private.enforce_area_submission_access();

create trigger enforce_checkpoint_area_access
before insert or update on public.exit_tickets
for each row execute function private.enforce_area_submission_access();
