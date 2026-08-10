-- CODEQUEST C++ 8 — Migration 0005: chuẩn hóa danh tính học sinh LSTS
--
-- Không xóa mã cũ không đúng chuẩn. Trigger chỉ kiểm tra khi tạo hồ sơ mới hoặc
-- khi mã học sinh thực sự được thay đổi, nên hồ sơ lịch sử vẫn mở được bình thường.

create unique index if not exists uq_profiles_lsts_student_code
  on public.profiles (student_code)
  where student_code ~ '^[0-9]{7}$';

create or replace function public.validate_lsts_student_code_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.student_code is null then
    return new;
  end if;

  if tg_op = 'INSERT' or new.student_code is distinct from old.student_code then
    if new.student_code !~ '^[0-9]{7}$' then
      raise exception 'MA_HOC_SINH_LSTS_KHONG_HOP_LE';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_validate_lsts_student_code on public.profiles;
create trigger trg_profiles_validate_lsts_student_code
  before insert or update of student_code on public.profiles
  for each row execute function public.validate_lsts_student_code_change();

comment on function public.validate_lsts_student_code_change is
  'Mã học sinh LSTS mới phải gồm đúng 7 chữ số; dữ liệu lịch sử không bị xóa.';
