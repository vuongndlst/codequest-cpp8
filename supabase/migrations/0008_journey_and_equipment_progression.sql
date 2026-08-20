-- CodeQuest C++ 8 — Economy gắn với curriculum Area 0–5.
-- Trang bị chỉ mở hiệu ứng học tập; không thay đổi kết quả validator.

update public.equipment_catalog
set name = 'La bàn Thuật toán',
    description = 'Làm nổi đường đi và các mốc chuyển hướng khi Byte thực thi chuỗi lệnh.',
    base_cost = 8,
    max_level = 3,
    unlock_lesson = 'a0',
    sort_order = 1
where id = 'navigator';

update public.equipment_catalog
set name = 'Kiếm Vòng Lặp',
    description = 'Tạo phản hồi theo từng iteration và hiệu ứng phá giáp Boss bằng vòng lặp.',
    base_cost = 21,
    max_level = 3,
    unlock_lesson = 'a5',
    sort_order = 5
where id = 'algorithm-sword';

update public.equipment_catalog
set name = 'Khiên Điều Kiện',
    description = 'Làm nổi trạng thái đúng–sai và hai nhánh hành động của if / else.',
    base_cost = 18,
    max_level = 3,
    unlock_lesson = 'a4',
    sort_order = 4
where id = 'condition-shield';

insert into public.equipment_catalog
  (id, name, description, base_cost, max_level, unlock_lesson, sort_order)
values
  ('data-satchel', 'Túi Dữ Liệu Pha Lê', 'Làm nổi số Gem được ghi nhớ và thay đổi trong biến.', 12, 3, 'a2', 2),
  ('operator-gauntlet', 'Găng Toán Tử', 'Hiển thị luồng năng lượng do biểu thức và toán tử tạo ra.', 15, 3, 'a3', 3)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  base_cost = excluded.base_cost,
  max_level = excluded.max_level,
  unlock_lesson = excluded.unlock_lesson,
  sort_order = excluded.sort_order;

-- Boss hiện dùng id aN-cN-..., không có hậu tố "-boss".
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

  v_reward := case when p_challenge_id ~ '^a[0-9]+-c(4|5)-' and p_challenge_id in (
    'a0-c4-system-start', 'a1-c5-portal', 'a2-c5-vault',
    'a3-c5-triple-core', 'a4-c5-decision-gate', 'a5-c5-armor-loop'
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

comment on table public.equipment_catalog is
  'Trang bị pixel art gắn với curriculum. Cấp độ chỉ đổi phản hồi thị giác, không sửa kết quả học tập.';
