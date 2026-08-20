-- CodeQuest C++ 8 — Area 6: Xưởng Hàm.
-- Đồng bộ phần thưởng Boss, trang bị và chứng chỉ với curriculum a6.

insert into public.equipment_catalog
  (id, name, description, base_cost, max_level, unlock_lesson, sort_order)
values
  ('function-toolkit', 'Bộ Dụng Cụ Xưởng Hàm',
   'Làm nổi lời gọi hàm, dữ liệu tham số và nhịp phối hợp giữa các mô-đun.',
   24, 3, 'a6', 6)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_cost = excluded.base_cost,
  max_level = excluded.max_level,
  unlock_lesson = excluded.unlock_lesson,
  sort_order = excluded.sort_order;

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
  ) then raise exception 'NHIEM_VU_CHUA_HOAN_THANH'; end if;

  v_reward := case when p_challenge_id in (
    'a0-c4-system-start', 'a1-c5-portal', 'a2-c5-vault',
    'a3-c5-triple-core', 'a4-c5-decision-gate', 'a5-c5-armor-loop',
    'a6-c5-factory-core'
  ) then 12 else 3 end;

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

create or replace function public.ensure_area_certificate(p_user_id uuid, p_lesson_id text)
returns public.certificates
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_progress public.lesson_progress%rowtype;
  v_certificate public.certificates%rowtype;
  v_certificate_name text;
  v_lesson_title text;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Không thể cấp chứng chỉ cho tài khoản khác.' using errcode = '42501';
  end if;
  select * into v_certificate from public.certificates
  where user_id = p_user_id and lesson_id = p_lesson_id;
  if found then return v_certificate; end if;

  select * into v_profile from public.profiles where id = p_user_id;
  select * into v_progress from public.lesson_progress
  where user_id = p_user_id and lesson_id = p_lesson_id and status = 'completed';
  if v_profile.id is null or v_progress.id is null then
    raise exception 'Khu vực chưa hoàn thành nên chưa thể cấp chứng chỉ.' using errcode = 'P0001';
  end if;

  v_certificate_name := case p_lesson_id
    when 'a0' then 'C++ Starter' when 'a1' then 'Algorithm Navigator'
    when 'a2' then 'Data Keeper' when 'a3' then 'Operator Smith'
    when 'a4' then 'Decision Maker' when 'a5' then 'Loop Explorer'
    when 'a6' then 'Function Engineer' else 'CodeQuest Explorer' end;
  v_lesson_title := case p_lesson_id
    when 'a0' then 'Khu vực 0 — Trạm Khởi Động'
    when 'a1' then 'Khu vực 1 — Đồng Cỏ Thuật Toán'
    when 'a2' then 'Khu vực 2 — Kho Dữ Liệu Pha Lê'
    when 'a3' then 'Khu vực 3 — Lò Toán Tử'
    when 'a4' then 'Khu vực 4 — Cổng Quyết Định'
    when 'a5' then 'Khu vực 5 — Thung Lũng Lặp'
    when 'a6' then 'Khu vực 6 — Xưởng Hàm' else p_lesson_id end;

  insert into public.certificates
    (user_id, lesson_id, certificate_code, xp_at_issue, stars_at_issue, metadata)
  values (
    p_user_id, p_lesson_id,
    'CPP8-' || upper(regexp_replace(p_lesson_id, '[^a-z0-9]', '', 'gi')) || '-' ||
      upper(substr(replace(p_user_id::text, '-', ''), 1, 6)) || '-' ||
      extract(epoch from clock_timestamp())::bigint,
    coalesce(v_progress.xp, 0), coalesce(v_progress.stars, 0),
    jsonb_build_object(
      'studentName', v_profile.full_name, 'className', v_profile.class_name,
      'lessonTitle', v_lesson_title, 'certificateName', v_certificate_name,
      'teacherName', 'Nguyễn Đình Vương', 'courseName', 'CodeQuest C++ 8'
    )
  ) on conflict (user_id, lesson_id) do nothing returning * into v_certificate;
  if v_certificate.id is null then
    select * into v_certificate from public.certificates
    where user_id = p_user_id and lesson_id = p_lesson_id;
  end if;
  return v_certificate;
end;
$$;

revoke all on function public.ensure_area_certificate(uuid, text) from public;
grant execute on function public.ensure_area_certificate(uuid, text) to authenticated;
