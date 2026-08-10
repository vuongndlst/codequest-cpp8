-- ============================================================================
-- CODEQUEST C++ 8 — Dữ liệu khởi tạo
--
-- Chạy SAU 0001_init_schema.sql và 0002_rls_policies.sql
-- File này chạy lại nhiều lần được (idempotent) — dùng `on conflict do update`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 10 huy hiệu (mục 26 của đề bài)
--
-- Nguyên tắc thiết kế: KHÔNG có huy hiệu nào phạt học sinh.
-- "No Hint Hero" chỉ là phần thưởng phụ; "Persistent Coder" thưởng cho sự
-- KIÊN TRÌ (hoàn thành sau nhiều lần thử), không phải sự hoàn hảo.
-- `icon` = tên icon trong thư viện lucide-react (giấy phép ISC).
-- ----------------------------------------------------------------------------

insert into public.badges (code, name, description, icon, tier, sort_order) values
  ('first-run',
   'First Run',
   'Em đã chạy chương trình C++ đầu tiên của mình. Hành trình bắt đầu!',
   'Play', 'bronze', 1),

  ('bug-hunter',
   'Bug Hunter',
   'Hoàn thành 5 Debug Challenge. Em đã có con mắt tinh tường với lỗi rồi!',
   'Bug', 'silver', 2),

  ('semicolon-saver',
   'Semicolon Saver',
   'Tự mình phát hiện và sửa lỗi thiếu dấu chấm phẩy 3 lần.',
   'Sparkles', 'bronze', 3),

  ('function-builder',
   'Algorithm Navigator',
   'Đánh bại Boss Area 1 — Cổng Đồng Cỏ. Em đã biến bản đồ thành thuật toán đúng thứ tự!',
   'Map', 'gold', 4),

  ('data-keeper',
   'Data Keeper',
   'Đánh bại Boss Area 2 — Kho Ngọc Ký Ức. Em đã biết lưu và cập nhật trạng thái!',
   'Gem', 'gold', 5),

  ('decision-maker',
   'Decision Maker',
   'Đánh bại Boss Khu vực 4 — Cổng Quyết Định. Em đã biết cách ra quyết định trong code.',
   'GitBranch', 'gold', 6),

  ('clean-code-rookie',
   'Clean Code Rookie',
   'Lần đầu đạt điểm Clean Code từ 80 trở lên. Code của em dễ đọc lắm!',
   'Feather', 'bronze', 7),

  ('clean-code-guardian',
   'Clean Code Guardian',
   'Đạt Clean Code từ 90 trở lên ở cả 5 bài học. Một lập trình viên thật sự!',
   'ShieldCheck', 'gold', 8),

  ('no-hint-hero',
   'No Hint Hero',
   'Hoàn thành một Boss Challenge mà chưa cần gợi ý. Đây chỉ là phần thưởng vui thôi — dùng gợi ý là chuyện hoàn toàn bình thường nhé!',
   'Lightbulb', 'silver', 9),

  ('persistent-coder',
   'Persistent Coder',
   'Hoàn thành một nhiệm vụ sau nhiều lần thử. Kiên trì mới là điều quan trọng nhất!',
   'Heart', 'silver', 10)

on conflict (code) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  tier        = excluded.tier,
  sort_order  = excluded.sort_order;


-- ----------------------------------------------------------------------------
-- Cài đặt lớp học mẫu
--
-- Mặc định: chỉ mở Khu vực 1, các khu sau mở dần theo tiến trình.
-- `allow_solution_view = false` -> học sinh không xem được đáp án đầy đủ.
-- Thầy đổi tên lớp ở dòng dưới cho khớp với lớp thầy đang dạy.
-- ----------------------------------------------------------------------------

insert into public.class_settings (class_name, unlocked_lessons, allow_solution_view) values
  ('8A1', '{"l1"}', false),
  ('8A2', '{"l1"}', false),
  ('8A3', '{"l1"}', false)
on conflict (class_name) do nothing;


-- ----------------------------------------------------------------------------
-- HƯỚNG DẪN TẠO TÀI KHOẢN GIÁO VIÊN
--
-- Website KHÔNG cho phép chọn vai trò 'teacher' khi đăng ký (mục 13).
-- Cách làm an toàn:
--   1. Thầy đăng ký bình thường trên website bằng email của thầy
--   2. Vào Supabase Dashboard -> SQL Editor -> chạy lệnh dưới (bỏ dấu --)
--   3. Đăng xuất và đăng nhập lại để nhận vai trò mới
--
-- update public.profiles
-- set role = 'teacher'
-- where id = (select id from auth.users where email = 'email-cua-thay@gmail.com');
--
-- Kiểm tra lại:
-- select p.full_name, p.role, u.email
-- from public.profiles p join auth.users u on u.id = p.id
-- where p.role = 'teacher';
-- ----------------------------------------------------------------------------
