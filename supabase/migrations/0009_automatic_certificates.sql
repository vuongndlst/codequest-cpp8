-- Chứng chỉ là phần thưởng mặc định khi hoàn thành một khu vực.
-- Migration này vừa sửa dữ liệu cũ, vừa bảo đảm mọi lần hoàn thành sau này
-- được cấp tự động ở database, kể cả khi client đóng tab ngay sau checkpoint.

create or replace function public.ensure_area_certificate(
  p_user_id uuid,
  p_lesson_id text
)
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

  select * into v_certificate
  from public.certificates
  where user_id = p_user_id and lesson_id = p_lesson_id;
  if found then return v_certificate; end if;

  select * into v_profile from public.profiles where id = p_user_id;
  select * into v_progress
  from public.lesson_progress
  where user_id = p_user_id and lesson_id = p_lesson_id and status = 'completed';

  if v_profile.id is null or v_progress.id is null then
    raise exception 'Khu vực chưa hoàn thành nên chưa thể cấp chứng chỉ.' using errcode = 'P0001';
  end if;

  v_certificate_name := case p_lesson_id
    when 'a0' then 'C++ Starter'
    when 'a1' then 'Algorithm Navigator'
    when 'a2' then 'Data Keeper'
    when 'a3' then 'Operator Smith'
    when 'a4' then 'Decision Maker'
    when 'a5' then 'Loop Explorer'
    else 'CodeQuest Explorer'
  end;

  v_lesson_title := case p_lesson_id
    when 'a0' then 'Khu vực 0 — Làng Khởi Động'
    when 'a1' then 'Khu vực 1 — Đồng cỏ Thuật toán'
    when 'a2' then 'Khu vực 2 — Kho Dữ Liệu Pha Lê'
    when 'a3' then 'Khu vực 3 — Lò Toán Tử'
    when 'a4' then 'Khu vực 4 — Rừng Quyết Định'
    when 'a5' then 'Khu vực 5 — Pháo Đài Vòng Lặp'
    else p_lesson_id
  end;

  insert into public.certificates (
    user_id, lesson_id, certificate_code, xp_at_issue, stars_at_issue, metadata
  ) values (
    p_user_id,
    p_lesson_id,
    'CPP8-' || upper(regexp_replace(p_lesson_id, '[^a-z0-9]', '', 'gi')) || '-' ||
      upper(substr(replace(p_user_id::text, '-', ''), 1, 6)) || '-' ||
      extract(epoch from clock_timestamp())::bigint,
    coalesce(v_progress.xp, 0),
    coalesce(v_progress.stars, 0),
    jsonb_build_object(
      'studentName', v_profile.full_name,
      'className', v_profile.class_name,
      'lessonTitle', v_lesson_title,
      'certificateName', v_certificate_name,
      'teacherName', 'Nguyễn Đình Vương',
      'courseName', 'CodeQuest C++ 8'
    )
  )
  on conflict (user_id, lesson_id) do nothing
  returning * into v_certificate;

  if v_certificate.id is null then
    select * into v_certificate
    from public.certificates
    where user_id = p_user_id and lesson_id = p_lesson_id;
  end if;

  return v_certificate;
end;
$$;
revoke all on function public.ensure_area_certificate(uuid, text) from public;
grant execute on function public.ensure_area_certificate(uuid, text) to authenticated;

create or replace function public.issue_certificate_after_area_completion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    perform public.ensure_area_certificate(new.user_id, new.lesson_id);
  end if;
  return new;
end;
$$;

revoke all on function public.issue_certificate_after_area_completion() from public;

drop trigger if exists trg_issue_certificate_after_area_completion on public.lesson_progress;
create trigger trg_issue_certificate_after_area_completion
after insert or update of status on public.lesson_progress
for each row execute function public.issue_certificate_after_area_completion();

-- Chứng chỉ cũ có thể lưu tên test bị mất dấu. Đồng bộ lại danh tính hiện tại
-- nhưng giữ nguyên mã chứng chỉ, ngày cấp, XP và số sao.
update public.certificates c
set metadata = c.metadata || jsonb_build_object(
  'studentName', p.full_name,
  'className', p.class_name,
  'teacherName', 'Nguyễn Đình Vương',
  'courseName', 'CodeQuest C++ 8'
)
from public.profiles p
where p.id = c.user_id;

-- Cấp bù cho mọi khu vực đã hoàn thành trước khi trigger tồn tại.
do $$
declare
  completed_area record;
begin
  for completed_area in
    select user_id, lesson_id
    from public.lesson_progress
    where status = 'completed'
  loop
    perform public.ensure_area_certificate(completed_area.user_id, completed_area.lesson_id);
  end loop;
end;
$$;
