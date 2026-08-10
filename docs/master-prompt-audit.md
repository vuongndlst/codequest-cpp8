# Audit master prompt — vertical slice Area 0–2

Ngày cập nhật: **2026-08-11**

## Kết quả tái cấu trúc

Do chưa có dữ liệu học sinh thật, curriculum `l1`–`l5` cũ đã được loại khỏi sản phẩm thay vì giữ lớp tương thích. CodeQuest hiện có 3 Area, 14 màn được soạn lại và 3 checkpoint 8 câu. Mỗi Area tương đương khoảng 60 phút hoạt động học tập thực tế.

| Area | Số màn | Trọng tâm | Gameplay tổng hợp |
|---|---:|---|---|
| 0 — Trạm Khởi Động | 4 | `main`, `cout`, statement, `;`, comment | đánh thức hệ thống bằng Output |
| 1 — Đồng Cỏ Thuật Toán | 5 | function call, sequence, Game API | bản đồ 2D, vật cản, portal, debug thứ tự |
| 2 — Kho Dữ Liệu Pha Lê | 5 | variable, type, assignment, update | nhặt Gem, đồng bộ trạng thái code–world, vault boss |

## Luồng sư phạm

Stage dùng một trục nhìn duy nhất: **nhiệm vụ trước → map lớn → editor**. Điều kiện hoàn thành hiển thị ngay trong nhiệm vụ. Run và bộ điều khiển replay nằm trên map; kết quả phát thành world event có trace hiện tại và chỉ số bước.

Học sinh có thể:

- chạy Thường, Nhanh hoặc Từng bước;
- Stop/Resume hoạt ảnh, Reset riêng map mà không mất code;
- khôi phục starter code bằng thao tác có xác nhận;
- nhận hint theo ba mức: câu hỏi → cấu trúc → skeleton;
- tra sổ tay hoặc nhận command coach theo token đang tự gõ, không chèn code hộ.

Mỗi màn chỉ thêm tối đa một ý mới. Story/observe yêu cầu dự đoán; mission tạo bằng chứng trực quan; debug yêu cầu tìm dòng/bước đầu tiên lệch; boss chỉ tổng hợp kiến thức đã học. Checkpoint đạt 70%, có feedback giải thích và không trừ điểm khi thử lại.

## C++ và Game API

Code dùng cú pháp C++ thật trong `main`. UI và học liệu luôn gắn nhãn riêng:

- **C++ language:** `main`, `cout`, khai báo biến, kiểu dữ liệu, phép gán.
- **Game API CodeQuest:** `moveRight()`, `moveLeft()`, `moveUp()`, `moveDown()`, `collectGem()`, `gemsCollected()`.

Game API sinh world event; renderer không tự suy luận từ text code. Gem có ID và chỉ nhặt được một lần. Engine chạy trong Web Worker với giới hạn bước/thời gian, không có DOM/network và không dùng `eval`.

## Kiến trúc dữ liệu

- `coreCurriculum.ts` là nguồn sự thật cho lesson/challenge/checkpoint.
- Component stage, guide, checkpoint và progression không hard-code level.
- World spec chứa terrain, start/goal, prop và initial state.
- Objective engine chấm output, world state và AST pattern; test ẩn không lộ expected value.
- Tất cả solution chạy qua engine trong content validation.

## Game feel và accessibility

Map là vùng lớn nhất; avatar, tile và item dùng pixel art đồng bộ. Portal, Gem, XP, pháo hoa, fanfare, bước chân và nhạc nền đã có; nhạc dừng khi rời route game. Sound/music tắt được trên map. Reduced motion bỏ qua animation trang trí nhưng vẫn giữ Step Debug chủ động. Controls có nhãn, trạng thái `aria-live` và thao tác bàn phím.

## Phạm vi hoãn có chủ đích

- Multiplayer boss chưa triển khai; single-player cần được thử lớp học trước.
- Area 3+ chỉ nằm trong roadmap.
- Trang bị là cosmetic/progression, không mua quyền vượt bài và không có tiền thật.

## Quality gates

Regression ngày 2026-08-11 đạt **471/471 test trong 44 file**, TypeScript sạch và production build thành công (2.130 module). Browser QA đã xác nhận Demo Area 0, Run/XP/Gem, điều hướng màn tiếp theo, Step Debug Area 1, nhiệm vụ Gem Area 2, coach không click-to-insert, không tràn ngang ở 1366×768 và 390×844, không có console warning/error.
