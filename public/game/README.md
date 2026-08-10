# Tài sản đồ hoạ của sân khấu game

Hai bộ tile pixel của Kenney, đều **CC0 1.0** — dùng được cho cả mục đích
thương mại, ghi nguồn không bắt buộc. Dự án vẫn ghi nguồn.

| Tệp | Nguồn | Dùng cho |
|---|---|---|
| `tiny-town.png` | https://kenney.nl/assets/tiny-town | Cảnh ngoài trời: cỏ, cây, hàng rào, nhà, cổng |
| `tiny-dungeon.png` | https://kenney.nl/assets/tiny-dungeon | Nhân vật (ô 84–107), tường đá, rương, ngọc, quái |

Cả hai đều là ảnh `tilemap_packed.png` gốc, giữ nguyên không chỉnh sửa:
192×176 px = lưới **12×11 ô**, mỗi ô **16×16 px**, không có khoảng cách.

Nguyên văn giấy phép: `tiny-town-LICENSE.txt`, `tiny-dungeon-LICENSE.txt`.

Đọc ô bằng `src/components/game/TileSprite.tsx`. Chỉ số đếm theo hàng từ trái
sang phải, bắt đầu từ 0. Trang `#/dev/stage-preview` (chỉ có khi chạy dev) có
bảng tra chỉ số của cả hai bộ.
