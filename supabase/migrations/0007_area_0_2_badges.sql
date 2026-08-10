-- Đồng bộ huy hiệu cho vertical slice Area 0–2.
-- Giữ lại các huy hiệu curriculum cũ để không làm mất lịch sử nếu database
-- đã từng có dữ liệu thử; code mới chỉ trao hai huy hiệu dưới đây.

insert into public.badges (code, name, description, icon, tier, sort_order)
values
  (
    'function-builder',
    'Algorithm Navigator',
    'Đánh bại Boss Area 1 — Cổng Đồng Cỏ. Em đã biến bản đồ thành thuật toán đúng thứ tự!',
    'Map',
    'gold',
    4
  ),
  (
    'data-keeper',
    'Data Keeper',
    'Đánh bại Boss Area 2 — Kho Ngọc Ký Ức. Em đã biết lưu và cập nhật trạng thái!',
    'Gem',
    'gold',
    5
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  tier = excluded.tier,
  sort_order = excluded.sort_order;
