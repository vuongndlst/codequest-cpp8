-- CodeQuest C++ 8 — authoritative grading and RLS hardening.
--
-- The browser is intentionally treated as untrusted. It may animate a local
-- result immediately, but only the Edge Function (service_role) can persist
-- attempts, progress, XP, Gems, badges and checkpoint results.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.challenge_catalog (
  lesson_id text not null,
  challenge_id text primary key,
  order_index integer not null check (order_index >= 0),
  xp_reward integer not null check (xp_reward between 0 and 500),
  is_required boolean not null default true,
  kind text not null,
  is_boss boolean not null default false,
  unique (lesson_id, order_index)
);

insert into private.challenge_catalog
  (lesson_id, challenge_id, order_index, xp_reward, is_required, kind, is_boss)
values
  ('a0', 'a0-c1-first-program', 0, 10, true, 'story', false),
  ('a0', 'a0-c2-cout', 1, 15, true, 'sandbox', false),
  ('a0', 'a0-c3-debug-semicolon', 2, 20, true, 'debug', false),
  ('a0', 'a0-c4-system-start', 3, 30, true, 'boss', true),
  ('a1', 'a1-c1-move-right', 0, 15, true, 'story', false),
  ('a1', 'a1-c2-change-direction', 1, 20, true, 'concept', false),
  ('a1', 'a1-c3-obstacle-route', 2, 25, true, 'mission', false),
  ('a1', 'a1-c4-debug-order', 3, 30, true, 'debug', false),
  ('a1', 'a1-c5-portal', 4, 40, true, 'boss', true),
  ('a2', 'a2-c1-variable', 0, 15, true, 'story', false),
  ('a2', 'a2-c2-data-types', 1, 25, true, 'concept', false),
  ('a2', 'a2-c3-collect-count', 2, 30, true, 'mission', false),
  ('a2', 'a2-c4-debug-update', 3, 25, true, 'debug', false),
  ('a2', 'a2-c5-vault', 4, 45, true, 'boss', true),
  ('a3', 'a3-c1-forge-energy', 0, 25, true, 'story', false),
  ('a3', 'a3-c2-crystal-balance', 1, 30, true, 'concept', false),
  ('a3', 'a3-c3-compare-switch', 2, 35, true, 'mission', false),
  ('a3', 'a3-c4-debug-logic', 3, 40, true, 'debug', false),
  ('a3', 'a3-c5-triple-core', 4, 60, true, 'boss', true),
  ('a4', 'a4-c1-first-if', 0, 30, true, 'story', false),
  ('a4', 'a4-c2-two-branches', 1, 35, true, 'concept', false),
  ('a4', 'a4-c3-key-sensor', 2, 40, true, 'mission', false),
  ('a4', 'a4-c4-debug-equality', 3, 45, true, 'debug', false),
  ('a4', 'a4-c5-decision-gate', 4, 65, true, 'boss', true),
  ('a5', 'a5-c1-first-loop', 0, 35, true, 'story', false),
  ('a5', 'a5-c2-lantern-line', 1, 40, true, 'concept', false),
  ('a5', 'a5-c3-counter-trail', 2, 45, true, 'mission', false),
  ('a5', 'a5-c4-debug-off-by-one', 3, 50, true, 'debug', false),
  ('a5', 'a5-c5-armor-loop', 4, 70, true, 'boss', true),
  ('a6', 'a6-c1-first-function', 0, 45, true, 'story', false),
  ('a6', 'a6-c2-parameters', 1, 50, true, 'concept', false),
  ('a6', 'a6-c3-return-energy', 2, 55, true, 'mission', false),
  ('a6', 'a6-c4-debug-parameter', 3, 60, true, 'debug', false),
  ('a6', 'a6-c5-factory-core', 4, 80, true, 'boss', true),
  ('a7', 'a7-c1-value-copy', 0, 35, true, 'story', false),
  ('a7', 'a7-c2-reference-charge', 1, 45, true, 'mission', false),
  ('a7', 'a7-c3-debug-swap', 2, 55, true, 'debug', false),
  ('a7', 'a7-c4-mirror-boss', 3, 80, true, 'boss', true),
  ('a8', 'a8-c1-indexed-vault', 0, 35, true, 'story', false),
  ('a8', 'a8-c2-repair-slot', 1, 45, true, 'mission', false),
  ('a8', 'a8-c3-debug-bound', 2, 55, true, 'debug', false),
  ('a8', 'a8-c4-route-array-boss', 3, 85, true, 'boss', true),
  ('a9', 'a9-c1-aggregate', 0, 40, true, 'story', false),
  ('a9', 'a9-c2-maximum', 1, 50, true, 'mission', false),
  ('a9', 'a9-c3-debug-search', 2, 60, true, 'debug', false),
  ('a9', 'a9-c4-scout-boss', 3, 90, true, 'boss', true),
  ('a10', 'a10-c1-bubble-pass', 0, 45, true, 'story', false),
  ('a10', 'a10-c2-select-min', 1, 55, true, 'mission', false),
  ('a10', 'a10-c3-debug-inner-bound', 2, 65, true, 'debug', false),
  ('a10', 'a10-c4-algorithm-core', 3, 100, true, 'boss', true)
on conflict (challenge_id) do update set
  lesson_id = excluded.lesson_id,
  order_index = excluded.order_index,
  xp_reward = excluded.xp_reward,
  is_required = excluded.is_required,
  kind = excluded.kind,
  is_boss = excluded.is_boss;

-- Teacher accounts must be explicitly allow-listed before Auth creates them.
create table if not exists private.teacher_signup_allowlist (
  email text primary key check (email = lower(trim(email))),
  created_at timestamptz not null default now()
);

insert into private.teacher_signup_allowlist(email)
select lower(u.email)
from auth.users u
join public.profiles p on p.id = u.id and p.role = 'teacher'
where u.email is not null
on conflict do nothing;

-- Small fixed-window limiter for the CPU-heavy server grader. The table is in
-- a non-exposed schema and can only be mutated by the service-only function.
create table if not exists private.submission_rate_limits (
  user_id uuid not null,
  scope text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  primary key (user_id, scope)
);

create or replace function public.consume_submission_quota(
  p_user_id uuid,
  p_scope text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_user_id is null or p_scope not in ('challenge', 'checkpoint')
     or p_limit < 1 or p_limit > 100 or p_window_seconds < 10 or p_window_seconds > 3600 then
    return false;
  end if;

  insert into private.submission_rate_limits(user_id, scope, window_started_at, request_count)
  values (p_user_id, p_scope, now(), 1)
  on conflict (user_id, scope) do update set
    window_started_at = case
      when private.submission_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else private.submission_rate_limits.window_started_at
    end,
    request_count = case
      when private.submission_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else private.submission_rate_limits.request_count + 1
    end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;
revoke all on function public.consume_submission_quota(uuid,text,integer,integer)
  from public, anon, authenticated;
grant execute on function public.consume_submission_quota(uuid,text,integer,integer)
  to service_role;

-- Free-plan compatible Auth Hook: reject non-LSTS and inconsistent student IDs
-- before auth.users is created. Teachers are admitted only via the allow-list.
create or replace function public.hook_restrict_lsts_signup(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(trim(event->'user'->>'email'), ''));
  v_student_code text := coalesce(trim(event->'user'->'user_metadata'->>'student_code'), '');
  v_class_code text := upper(coalesce(trim(event->'user'->'user_metadata'->>'class_code'), ''));
begin
  if exists (select 1 from private.teacher_signup_allowlist where email = v_email) then
    return '{}'::jsonb;
  end if;

  if v_student_code !~ '^[0-9]{7}$'
     or v_email <> v_student_code || '@lsts.edu.vn' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'Tài khoản phải dùng đúng mã học sinh LSTS gồm 7 chữ số.'
    ));
  end if;

  if v_class_code = '' or not exists (
    select 1 from public.classes
    where upper(join_code) = v_class_code and is_open = true
  ) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'Mã lớp chưa đúng hoặc lớp đang tạm khóa đăng ký.'
    ));
  end if;

  return '{}'::jsonb;
end;
$$;
revoke all on function public.hook_restrict_lsts_signup(jsonb) from public, anon, authenticated;
grant execute on function public.hook_restrict_lsts_signup(jsonb) to supabase_auth_admin;

-- Helpers used by RLS. They bypass policy recursion but expose only booleans.
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'teacher'
  );
$$;

create or replace function public.teaches_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_teachers
    where class_id = p_class_id and teacher_id = (select auth.uid())
  );
$$;

create or replace function public.can_teach_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_teachers ct
    join public.class_members cm on cm.class_id = ct.class_id
    where ct.teacher_id = (select auth.uid())
      and cm.student_id = p_student_id
  );
$$;

revoke all on function public.is_teacher() from public, anon;
revoke all on function public.teaches_class(uuid) from public, anon;
revoke all on function public.can_teach_student(uuid) from public, anon;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.teaches_class(uuid) to authenticated;
grant execute on function public.can_teach_student(uuid) to authenticated;

-- Consolidate own/teacher read policies and remove all direct student writes to
-- authoritative learning records.
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_teacher on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_authorized on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.can_teach_student(id));
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists lesson_progress_select_own on public.lesson_progress;
drop policy if exists lesson_progress_select_teacher on public.lesson_progress;
drop policy if exists lesson_progress_insert_own on public.lesson_progress;
drop policy if exists lesson_progress_update_own on public.lesson_progress;
drop policy if exists lesson_progress_delete_teacher on public.lesson_progress;
create policy lesson_progress_select_authorized on public.lesson_progress for select to authenticated
  using ((select auth.uid()) = user_id or public.can_teach_student(user_id));

drop policy if exists attempts_select_own on public.challenge_attempts;
drop policy if exists attempts_select_teacher on public.challenge_attempts;
drop policy if exists attempts_insert_own on public.challenge_attempts;
drop policy if exists attempts_delete_teacher on public.challenge_attempts;
create policy attempts_select_authorized on public.challenge_attempts for select to authenticated
  using ((select auth.uid()) = user_id or public.can_teach_student(user_id));

drop policy if exists drafts_select_own on public.code_drafts;
drop policy if exists drafts_insert_own on public.code_drafts;
drop policy if exists drafts_update_own on public.code_drafts;
drop policy if exists drafts_delete_own on public.code_drafts;
create policy drafts_select_own on public.code_drafts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy drafts_insert_own on public.code_drafts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy drafts_update_own on public.code_drafts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy drafts_delete_own on public.code_drafts for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists certificates_select_own on public.certificates;
drop policy if exists certificates_select_teacher on public.certificates;
drop policy if exists certificates_insert_own on public.certificates;
create policy certificates_select_authorized on public.certificates for select to authenticated
  using ((select auth.uid()) = user_id or public.can_teach_student(user_id));

drop policy if exists user_badges_select_own on public.user_badges;
drop policy if exists user_badges_select_teacher on public.user_badges;
drop policy if exists user_badges_insert_own on public.user_badges;
create policy user_badges_select_authorized on public.user_badges for select to authenticated
  using ((select auth.uid()) = user_id or public.can_teach_student(user_id));

drop policy if exists exit_tickets_select_own on public.exit_tickets;
drop policy if exists exit_tickets_select_teacher on public.exit_tickets;
drop policy if exists exit_tickets_insert_own on public.exit_tickets;
drop policy if exists exit_tickets_update_own on public.exit_tickets;
create policy exit_tickets_select_authorized on public.exit_tickets for select to authenticated
  using ((select auth.uid()) = user_id or public.can_teach_student(user_id));

drop policy if exists activity_select_own on public.activity_events;
drop policy if exists activity_select_teacher on public.activity_events;
drop policy if exists activity_insert_own on public.activity_events;
create policy activity_select_authorized on public.activity_events for select to authenticated
  using ((select auth.uid()) = user_id or public.can_teach_student(user_id));
create policy activity_insert_hint_own on public.activity_events for insert to authenticated
  with check ((select auth.uid()) = user_id and event_type = 'hint_used');

-- Class-scoped policies: a teacher sees only students in classes they teach.
drop policy if exists classes_select_teacher on public.classes;
drop policy if exists classes_select_member on public.classes;
create policy classes_select_authorized on public.classes for select to authenticated
  using (
    public.teaches_class(id)
    or exists (select 1 from public.class_members m
      where m.class_id = classes.id and m.student_id = (select auth.uid()))
  );

drop policy if exists class_teachers_select on public.class_teachers;
create policy class_teachers_select on public.class_teachers for select to authenticated
  using (teacher_id = (select auth.uid()) or public.teaches_class(class_id));

drop policy if exists class_members_select_own on public.class_members;
drop policy if exists class_members_select_teacher on public.class_members;
create policy class_members_select_authorized on public.class_members for select to authenticated
  using (student_id = (select auth.uid()) or public.teaches_class(class_id));

drop policy if exists messages_select_own on public.messages;
drop policy if exists messages_select_teacher on public.messages;
drop policy if exists messages_insert_student on public.messages;
drop policy if exists messages_insert_teacher on public.messages;
create policy messages_select_authorized on public.messages for select to authenticated
  using (student_id = (select auth.uid()) or public.teaches_class(class_id));
create policy messages_insert_authorized on public.messages for insert to authenticated
  with check (
    (
      student_id = (select auth.uid())
      and exists (select 1 from public.class_members m
        where m.student_id = (select auth.uid()) and m.class_id = messages.class_id)
    )
    or (
      public.teaches_class(class_id)
      and exists (select 1 from public.class_members m
        where m.student_id = messages.student_id and m.class_id = messages.class_id)
    )
  );

-- RLS init-plan improvements on the remaining policies flagged by Advisor.
drop policy if exists class_area_controls_select on public.class_area_controls;
drop policy if exists class_area_controls_insert_teacher on public.class_area_controls;
drop policy if exists class_area_controls_update_teacher on public.class_area_controls;
create policy class_area_controls_select on public.class_area_controls for select to authenticated
  using (
    public.teaches_class(class_id)
    or exists (select 1 from public.class_members m
      where m.class_id = class_area_controls.class_id
        and m.student_id = (select auth.uid()))
  );
create policy class_area_controls_insert_teacher on public.class_area_controls for insert to authenticated
  with check (public.teaches_class(class_id) and updated_by = (select auth.uid()));
create policy class_area_controls_update_teacher on public.class_area_controls for update to authenticated
  using (public.teaches_class(class_id))
  with check (public.teaches_class(class_id) and updated_by = (select auth.uid()));

drop policy if exists class_settings_select_all on public.class_settings;
drop policy if exists class_settings_insert_teacher on public.class_settings;
drop policy if exists class_settings_update_teacher on public.class_settings;
create policy class_settings_select_authorized on public.class_settings for select to authenticated
  using (exists (
    select 1 from public.classes c
    where c.name = class_settings.class_name
      and (
        public.teaches_class(c.id)
        or exists (select 1 from public.class_members m
          where m.class_id = c.id and m.student_id = (select auth.uid()))
      )
  ));
create policy class_settings_insert_teacher on public.class_settings for insert to authenticated
  with check (
    updated_by = (select auth.uid())
    and exists (select 1 from public.classes c
      where c.name = class_settings.class_name and public.teaches_class(c.id))
  );
create policy class_settings_update_teacher on public.class_settings for update to authenticated
  using (exists (select 1 from public.classes c
    where c.name = class_settings.class_name and public.teaches_class(c.id)))
  with check (
    updated_by = (select auth.uid())
    and exists (select 1 from public.classes c
      where c.name = class_settings.class_name and public.teaches_class(c.id))
  );

-- Starting a lesson is harmless but still server-controlled, so removing the
-- general UPDATE policy does not break the journey UI.
create or replace function public.ensure_lesson_started(p_lesson_id text)
returns public.lesson_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.lesson_progress%rowtype;
begin
  if v_uid is null then raise exception 'CAN_DANG_NHAP' using errcode = '42501'; end if;
  if not exists (select 1 from private.challenge_catalog where lesson_id = p_lesson_id) then
    raise exception 'KHU_VUC_KHONG_TON_TAI' using errcode = '22023';
  end if;

  insert into public.lesson_progress(user_id, lesson_id, status, started_at)
  values (v_uid, p_lesson_id, 'in_progress', now())
  on conflict (user_id, lesson_id) do nothing;

  select * into v_row from public.lesson_progress
  where user_id = v_uid and lesson_id = p_lesson_id;
  return v_row;
end;
$$;
revoke all on function public.ensure_lesson_started(text) from public, anon;
grant execute on function public.ensure_lesson_started(text) to authenticated;

-- Teacher reset is one checked transaction instead of several forgeable client
-- writes. Earned XP/Gems/certificates are retained; only the selected node and
-- its attempt history are reopened for practice.
create or replace function public.teacher_reset_challenge(
  p_student_id uuid,
  p_lesson_id text,
  p_challenge_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_required_count integer;
  v_completed_count integer;
begin
  if not public.can_teach_student(p_student_id) then
    raise exception 'KHONG_CO_QUYEN_GIAO_VIEN' using errcode = '42501';
  end if;
  if not exists (select 1 from private.challenge_catalog
    where challenge_id = p_challenge_id and lesson_id = p_lesson_id) then
    raise exception 'NHIEM_VU_KHONG_TON_TAI' using errcode = '22023';
  end if;

  delete from public.challenge_attempts
  where user_id = p_student_id and lesson_id = p_lesson_id and challenge_id = p_challenge_id;

  select count(*) into v_required_count from private.challenge_catalog
  where lesson_id = p_lesson_id and is_required;

  update public.lesson_progress set
    completed_challenges = array_remove(completed_challenges, p_challenge_id),
    status = 'in_progress',
    completed_at = null,
    updated_at = now()
  where user_id = p_student_id and lesson_id = p_lesson_id;

  select count(*) into v_completed_count
  from private.challenge_catalog c
  join public.lesson_progress p on p.user_id = p_student_id and p.lesson_id = p_lesson_id
  where c.lesson_id = p_lesson_id and c.is_required
    and c.challenge_id = any(p.completed_challenges);

  update public.lesson_progress set
    progress_percent = floor(v_completed_count * 100.0 / greatest(1, v_required_count))
  where user_id = p_student_id and lesson_id = p_lesson_id;
end;
$$;
revoke all on function public.teacher_reset_challenge(uuid,text,text) from public, anon;
grant execute on function public.teacher_reset_challenge(uuid,text,text) to authenticated;

-- Atomic persistence endpoint. Only Edge Functions using service_role can call
-- this; correctness is recomputed in the Edge runtime, never accepted from UI.
create or replace function public.record_authoritative_attempt(
  p_user_id uuid,
  p_lesson_id text,
  p_challenge_id text,
  p_code text,
  p_run_ok boolean,
  p_is_correct boolean,
  p_passed_tests integer,
  p_total_tests integer,
  p_error_types text[],
  p_hint_level integer,
  p_clean_code_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_catalog private.challenge_catalog%rowtype;
  v_progress public.lesson_progress%rowtype;
  v_completed text[];
  v_already_done boolean := false;
  v_required_count integer;
  v_completed_count integer;
  v_attempt_number integer;
  v_xp_before integer := 0;
  v_xp_after integer := 0;
  v_xp_awarded integer := 0;
  v_gems integer := 0;
  v_candidate_codes text[] := '{}';
  v_new_badges text[] := '{}';
begin
  if p_user_id is null or not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'TAI_KHOAN_KHONG_HOP_LE' using errcode = '22023';
  end if;
  if char_length(p_code) > 10000 then raise exception 'CODE_QUA_DAI' using errcode = '22023'; end if;

  select * into v_catalog from private.challenge_catalog
  where challenge_id = p_challenge_id and lesson_id = p_lesson_id;
  if not found then raise exception 'NHIEM_VU_KHONG_TON_TAI' using errcode = '22023'; end if;

  insert into public.lesson_progress(user_id, lesson_id, status)
  values (p_user_id, p_lesson_id, 'in_progress')
  on conflict (user_id, lesson_id) do nothing;
  select * into v_progress from public.lesson_progress
  where user_id = p_user_id and lesson_id = p_lesson_id for update;

  -- A later node cannot be submitted before all required earlier nodes.
  if exists (
    select 1 from private.challenge_catalog c
    where c.lesson_id = p_lesson_id and c.is_required and c.order_index < v_catalog.order_index
      and not (c.challenge_id = any(v_progress.completed_challenges))
  ) then
    raise exception 'NHIEM_VU_CHUA_MO' using errcode = '42501';
  end if;

  select count(*) + 1 into v_attempt_number
  from public.challenge_attempts
  where user_id = p_user_id and challenge_id = p_challenge_id;

  insert into public.challenge_attempts(
    user_id, lesson_id, challenge_id, submitted_code, is_correct,
    passed_tests, total_tests, error_types, hint_level_used,
    attempt_number, clean_code_score
  ) values (
    p_user_id, p_lesson_id, p_challenge_id, left(p_code, 10000), p_is_correct,
    greatest(0, p_passed_tests), greatest(0, p_total_tests), coalesce(p_error_types, '{}'),
    greatest(0, least(10, p_hint_level)), v_attempt_number,
    case when p_clean_code_score is null then null else greatest(0, least(100, p_clean_code_score)) end
  );

  if p_is_correct then
    v_already_done := p_challenge_id = any(v_progress.completed_challenges);
    v_completed := case when v_already_done then v_progress.completed_challenges
      else array_append(v_progress.completed_challenges, p_challenge_id) end;
    v_xp_before := v_progress.xp;

    select count(*) into v_required_count from private.challenge_catalog
    where lesson_id = p_lesson_id and is_required;
    select count(*) into v_completed_count from private.challenge_catalog
    where lesson_id = p_lesson_id and is_required and challenge_id = any(v_completed);
    select coalesce(sum(xp_reward), 0) into v_xp_after from private.challenge_catalog
    where lesson_id = p_lesson_id and challenge_id = any(v_completed);
    v_xp_awarded := greatest(0, v_xp_after - v_xp_before);

    update public.lesson_progress set
      completed_challenges = v_completed,
      progress_percent = floor(v_completed_count * 100.0 / greatest(1, v_required_count)),
      stars = greatest(stars, case
        when v_completed_count * 100.0 / greatest(1, v_required_count) < 70 then 0
        when v_completed_count < v_required_count then 1 else 2 end),
      xp = v_xp_after,
      updated_at = now()
    where id = v_progress.id returning * into v_progress;

    insert into public.challenge_gem_rewards(user_id, challenge_id, gems_awarded)
    values (p_user_id, p_challenge_id, case when v_catalog.is_boss then 12 else 3 end)
    on conflict (user_id, challenge_id) do nothing;
    if found then
      v_gems := case when v_catalog.is_boss then 12 else 3 end;
      perform set_config('app.codequest_gem_write', 'on', true);
      update public.profiles set gem_balance = gem_balance + v_gems where id = p_user_id;
    end if;

    insert into public.activity_events(user_id, event_type, lesson_id, challenge_id, metadata)
    values (p_user_id, case when v_catalog.is_boss then 'boss_defeated' else 'challenge_passed' end,
      p_lesson_id, p_challenge_id, jsonb_build_object('xp', v_xp_awarded, 'kind', v_catalog.kind));
  end if;

  -- Derive badge eligibility exclusively from authoritative rows.
  if (select count(*) from public.challenge_attempts where user_id = p_user_id) = 1 then
    v_candidate_codes := array_append(v_candidate_codes, 'first-run');
  end if;
  if (select count(distinct a.challenge_id) from public.challenge_attempts a
      join private.challenge_catalog c on c.challenge_id = a.challenge_id
      where a.user_id = p_user_id and a.is_correct and c.kind = 'debug') >= 5 then
    v_candidate_codes := array_append(v_candidate_codes, 'bug-hunter');
  end if;
  if (select count(distinct bad.challenge_id) from public.challenge_attempts bad
      where bad.user_id = p_user_id and 'MISSING_SEMICOLON' = any(bad.error_types)
        and exists (select 1 from public.challenge_attempts good
          where good.user_id = p_user_id and good.challenge_id = bad.challenge_id and good.is_correct)) >= 3 then
    v_candidate_codes := array_append(v_candidate_codes, 'semicolon-saver');
  end if;
  if exists (select 1 from public.lesson_progress where user_id = p_user_id
      and lesson_id = 'a1' and 'a1-c5-portal' = any(completed_challenges)) then
    v_candidate_codes := array_append(v_candidate_codes, 'function-builder');
  end if;
  if exists (select 1 from public.lesson_progress where user_id = p_user_id
      and lesson_id = 'a2' and 'a2-c5-vault' = any(completed_challenges)) then
    v_candidate_codes := array_append(v_candidate_codes, 'data-keeper');
  end if;
  if exists (select 1 from public.lesson_progress where user_id = p_user_id
      and lesson_id = 'a4' and 'a4-c5-decision-gate' = any(completed_challenges)) then
    v_candidate_codes := array_append(v_candidate_codes, 'decision-maker');
  end if;
  if p_run_ok and coalesce(p_clean_code_score, 0) >= 80 then
    v_candidate_codes := array_append(v_candidate_codes, 'clean-code-rookie');
  end if;
  if not exists (
    select distinct c.lesson_id from private.challenge_catalog c
    where not exists (select 1 from public.challenge_attempts a
      where a.user_id = p_user_id and a.lesson_id = c.lesson_id
        and coalesce(a.clean_code_score, 0) >= 90)
  ) then
    v_candidate_codes := array_append(v_candidate_codes, 'clean-code-guardian');
  end if;
  if p_is_correct and v_catalog.is_boss and p_hint_level = 0 then
    v_candidate_codes := array_append(v_candidate_codes, 'no-hint-hero');
  end if;
  if p_is_correct and v_attempt_number >= 5 then
    v_candidate_codes := array_append(v_candidate_codes, 'persistent-coder');
  end if;

  with inserted as (
    insert into public.user_badges(user_id, badge_id)
    select p_user_id, b.id from public.badges b where b.code = any(v_candidate_codes)
    on conflict (user_id, badge_id) do nothing
    returning badge_id
  )
  select coalesce(array_agg(b.code), '{}') into v_new_badges
  from inserted i join public.badges b on b.id = i.badge_id;

  return jsonb_build_object(
    'attemptNumber', v_attempt_number,
    'progress', case when p_is_correct then to_jsonb(v_progress) else null end,
    'xpAwarded', v_xp_awarded,
    'gemsAwarded', v_gems,
    'newBadgeCodes', to_jsonb(v_new_badges)
  );
end;
$$;
revoke all on function public.record_authoritative_attempt(uuid,text,text,text,boolean,boolean,integer,integer,text[],integer,integer)
  from public, anon, authenticated;
grant execute on function public.record_authoritative_attempt(uuid,text,text,text,boolean,boolean,integer,integer,text[],integer,integer)
  to service_role;

create or replace function public.record_authoritative_checkpoint(
  p_user_id uuid,
  p_lesson_id text,
  p_answers jsonb,
  p_score integer,
  p_reflection text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_progress public.lesson_progress%rowtype;
  v_ticket public.exit_tickets%rowtype;
  v_certificate public.certificates%rowtype;
begin
  if p_score < 0 or p_score > 100 then raise exception 'DIEM_KHONG_HOP_LE' using errcode = '22023'; end if;
  if octet_length(coalesce(p_answers, '{}'::jsonb)::text) > 20000 then
    raise exception 'DAP_AN_QUA_DAI' using errcode = '22023';
  end if;

  select * into v_progress from public.lesson_progress
  where user_id = p_user_id and lesson_id = p_lesson_id for update;
  if not found or exists (
    select 1 from private.challenge_catalog c
    where c.lesson_id = p_lesson_id and c.is_required
      and not (c.challenge_id = any(v_progress.completed_challenges))
  ) then
    raise exception 'CHUA_HOAN_THANH_NHIEM_VU' using errcode = '42501';
  end if;

  insert into public.exit_tickets(user_id, lesson_id, answers, score, reflection, submitted_at)
  values (p_user_id, p_lesson_id, coalesce(p_answers, '{}'::jsonb), p_score,
    left(coalesce(p_reflection, ''), 1000), now())
  on conflict (user_id, lesson_id) do update set
    answers = excluded.answers, score = excluded.score,
    reflection = excluded.reflection, submitted_at = excluded.submitted_at
  returning * into v_ticket;

  if p_score >= 70 then
    update public.lesson_progress set status = 'completed', progress_percent = 100,
      stars = 3, completed_at = coalesce(completed_at, now()), updated_at = now()
    where id = v_progress.id returning * into v_progress;
    insert into public.activity_events(user_id, event_type, lesson_id, metadata)
    values (p_user_id, 'lesson_completed', p_lesson_id, jsonb_build_object('checkpointScore', p_score));
    select * into v_certificate from public.certificates
      where user_id = p_user_id and lesson_id = p_lesson_id;
  end if;

  return jsonb_build_object('ticket', to_jsonb(v_ticket), 'progress', to_jsonb(v_progress),
    'certificate', case when v_certificate.id is null then null else to_jsonb(v_certificate) end);
end;
$$;
revoke all on function public.record_authoritative_checkpoint(uuid,text,jsonb,integer,text)
  from public, anon, authenticated;
grant execute on function public.record_authoritative_checkpoint(uuid,text,jsonb,integer,text)
  to service_role;

-- Certificate creation remains callable by a student only for their own area,
-- and the function itself verifies authoritative completed progress.
revoke all on function public.award_challenge_gems(text) from public, anon, authenticated;
revoke all on function public.ensure_area_certificate(uuid,text) from public, anon;
grant execute on function public.ensure_area_certificate(uuid,text) to authenticated;

-- Restrict every SECURITY DEFINER RPC to the minimum role. Trigger functions
-- do not need Data API execute permission.
create or replace function public.profiles_guard_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Internal triggers/service-role maintenance has no end-user auth context.
  if auth.uid() is null then return new; end if;

  -- Identity and earned values never come from a browser UPDATE.
  new.role := old.role;
  new.student_code := old.student_code;
  new.total_xp := old.total_xp;
  new.level := old.level;
  new.streak_days := old.streak_days;
  new.last_active_date := old.last_active_date;
  new.created_at := old.created_at;

  if coalesce(current_setting('app.codequest_gem_write', true), '') <> 'on' then
    new.gem_balance := old.gem_balance;
  end if;

  -- join_class_by_code inserts membership first, so only that official class
  -- can be reflected into the compatibility class_name field.
  if new.class_name is distinct from old.class_name and not exists (
    select 1 from public.class_members m
    join public.classes c on c.id = m.class_id
    where m.student_id = old.id and c.name = new.class_name
  ) then
    new.class_name := old.class_name;
  end if;

  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.calculate_level(integer) from public, anon, authenticated;
revoke all on function public.recalculate_total_xp(uuid) from public, anon, authenticated;
revoke all on function public.sync_total_xp() from public, anon, authenticated;
revoke all on function public.profiles_guard_update() from public, anon, authenticated;
revoke all on function public.generate_join_code(text) from public, anon, authenticated;
revoke all on function public.grant_starter_equipment() from public, anon, authenticated;
revoke all on function public.issue_certificate_after_area_completion() from public, anon, authenticated;
revoke all on function public.set_message_sender() from public, anon, authenticated;
revoke all on function public.validate_lsts_student_code_change() from public, anon, authenticated;

revoke all on function public.create_class(text,text,text) from public, anon;
revoke all on function public.join_class_by_code(text) from public, anon;
revoke all on function public.mark_thread_read(uuid,uuid) from public, anon;
revoke all on function public.purchase_or_upgrade_equipment(text) from public, anon;
revoke all on function public.equip_item(text) from public, anon;
grant execute on function public.create_class(text,text,text) to authenticated;
grant execute on function public.join_class_by_code(text) to authenticated;
grant execute on function public.mark_thread_read(uuid,uuid) to authenticated;
grant execute on function public.purchase_or_upgrade_equipment(text) to authenticated;
grant execute on function public.equip_item(text) to authenticated;

-- Two Advisor warnings came from these legacy helpers lacking a fixed path.
alter function public.set_updated_at() set search_path = '';
alter function public.calculate_level(integer) set search_path = '';
