# Roadmap gameplay chơi đơn — CodeQuest C++ 8

## Mục tiêu thiết kế

Mỗi khu vực gồm 9 màn và một Exit Ticket, hoàn thành trong khoảng 60 phút hoạt động thực tế của tiết 80 phút. Tiến trình dùng cùng một vòng học để học sinh không phải học lại giao diện:

`Nhận nhiệm vụ → dự đoán → chạy trên map → quan sát → sửa code → giải thích → nhận thưởng`

Ba nguyên tắc cố định:

1. Mỗi màn chỉ giới thiệu tối đa một ý mới; gợi ý giảm dần từ màn 1 đến Boss.
2. Trang bị biểu trưng cho năng lực đã học, không bán sức mạnh để vượt bài.
3. Nhân vật, vật phẩm, cửa, bot, Boss và hiệu ứng tương tác chính dùng pixel art đồng bộ.

## Nhịp 9 màn dùng chung cho mỗi khu vực

| Màn | Loại hoạt động | Thời lượng | Vai trò sư phạm |
|---|---|---:|---|
| 1 | Quan sát câu chuyện | 3 phút | Tạo tình huống có vấn đề, chưa bắt viết code ngay |
| 2 | Khám phá lệnh/cấu trúc | 5 phút | Đọc ví dụ nhỏ, dự đoán trước khi chạy |
| 3 | Sandbox có kiểm soát | 5 phút | Chỉ thay một giá trị hoặc một lệnh để thấy quan hệ nhân–quả |
| 4 | Nhiệm vụ áp dụng 1 | 7 phút | Dùng kiến thức trong bản đồ mới, gợi ý theo lệnh chứ không lộ lời giải |
| 5 | Nhiệm vụ áp dụng 2 | 7 phút | Kết hợp kiến thức cũ với ý mới |
| 6 | Debug logic | 6 phút | Chạy từng bước, xác định dòng đầu tiên gây sai |
| 7 | Debug cú pháp/biên | 6 phút | Sửa lỗi điển hình và giải thích nguyên nhân |
| 8 | Clean Code | 5 phút | So sánh hai cách đúng, chọn cách dễ đọc và dễ bảo trì hơn |
| 9 | Boss chơi đơn | 10 phút | Bài tổng hợp nhiều phase, có checkpoint để không phải làm lại từ đầu |
| — | Exit Ticket | 5 phút | Tự giải thích bằng lời, củng cố khái niệm cốt lõi |

Tổng thời lượng: khoảng 59 phút.

## Khu vực 1 — Làng Khởi Động

**Năng lực cốt lõi:** chương trình chạy theo thứ tự; máy chỉ làm đúng câu lệnh cụ thể.

- Màn 2–3: đường thẳng, xoay hướng và nhặt gem; callout hướng dẫn còn rõ.
- Màn 4–5: đường vòng, bụi gai, giao tiếp bằng `cout` và portal.
- Màn 6–7: dùng chế độ từng bước để tìm lỗi thiếu bước hoặc quay sai hướng.
- Màn 8: rút gọn và căn lề bản kế hoạch.
- Boss: mở cổng làng qua ba chặng `đi → lấy chìa → tới portal`.
- Thưởng khu vực: **Bộ điều hướng pixel**, mở hệ thống trang bị nhưng không cộng sức mạnh học tập.

## Khu vực 2 — Xưởng Phép Thuật

**Năng lực cốt lõi:** hàm đóng gói một hành động có tên để tái sử dụng và kiểm thử độc lập.

- Map chuyển sang xưởng pixel với băng chuyền, bánh răng, lò năng lượng và ba máy riêng.
- Khi gọi đúng hàm, máy tương ứng phát sáng/chạy animation ngay trên map.
- Hàm có tham số điều chỉnh mức năng lượng thay vì chỉ in output trừu tượng.
- Debug hiển thị máy nào chưa được gọi hoặc tên hàm nào không tồn tại.
- Boss dây chuyền gồm ba checkpoint: khởi động, hiệu chỉnh, vận hành toàn xưởng.
- Thưởng khu vực: **Găng tay kỹ sư pixel**; nâng cấp chỉ đổi hiệu ứng kích hoạt máy.

## Khu vực 3 — Thung Lũng Lặp

**Năng lực cốt lõi:** vòng lặp mô tả hành động lặp và phải có điều kiện dừng đúng.

- Đường map dài để lợi ích của `for` nhìn thấy được ngay.
- Mỗi vòng lặp làm sáng một đèn hoặc thu một tinh thể; biến đếm xuất hiện cạnh nhân vật khi debug.
- Lỗi vòng lặp vô hạn bị sandbox chặn an toàn và hiển thị “đã dừng để bảo vệ trò chơi”.
- Lỗi lệch một đơn vị được minh họa bằng một ô/đèn còn thiếu hoặc thừa.
- Boss có nhiều đợt quái pixel nhưng chỉ cần lặp đúng số lần để vượt qua.
- Thưởng khu vực: **Kiếm thuật toán pixel**, mở hành động `attack()` ở các màn chiến đấu sau.

## Khu vực 4 — Cổng Quyết Định

**Năng lực cốt lõi:** chương trình kiểm tra dữ liệu trước khi chọn hành động.

- Cửa, chìa khóa, cảm biến năng lượng và bẫy đều là vật thể pixel có hai trạng thái rõ ràng.
- Khi chạy từng bước, biểu thức điều kiện hiện giá trị `true/false` cạnh cổng.
- `=` và `==` dùng hai phản hồi khác nhau: thay đổi dữ liệu so với kiểm tra dữ liệu.
- Nhiệm vụ không chỉ hỏi “code chạy chưa” mà hỏi “với dữ liệu khác thì còn đúng không”.
- Boss cổng cuối có ba bộ dữ liệu thử để tránh hard-code một trường hợp.
- Thưởng khu vực: **Khiên điều kiện pixel**, mở hiệu ứng chặn đòn khi điều kiện đúng.

## Khu vực 5 — Lâu Đài Lựa Chọn

**Năng lực cốt lõi:** `if–else` đảm bảo chỉ một trong hai hướng xử lý được chọn; bài toán lớn kết hợp hàm, vòng lặp và điều kiện.

- Hai cánh cửa pixel thay đổi theo dữ liệu đầu vào; học sinh phải kiểm thử cả hai nhánh.
- Màn giữa khu vực kết hợp biến đếm, điều kiện và hàm tấn công nhưng vẫn giữ một mục tiêu/màn.
- Debug tập trung vào hai nhánh cùng chạy và số lần tấn công lệch biên.
- Boss Bug King chơi đơn gồm ba phase có checkpoint:
  1. Dùng điều kiện chọn vũ khí phù hợp.
  2. Dùng vòng lặp phá ba lớp giáp.
  3. Gọi hàm kết thúc và mở portal giải phóng ByteLand.
- Thưởng cuối: huy hiệu **Code Guardian**, trang phục pixel và chứng chỉ; chưa có multiplayer.

## Chuẩn trang bị pixel art

- Mọi vật phẩm có một sprite 16×16 hoặc 32×32, phóng bằng `image-rendering: pixelated`.
- Cùng một sprite phải xuất hiện nhất quán trong cửa hàng, hồ sơ, popup map và lúc nhân vật sử dụng.
- Ba cấp nâng cấp chỉ thay đổi viền, ánh sáng và animation; không làm bài dễ hơn.
- Trang bị mở theo bài học: điều hướng ở L1, công cụ kỹ sư ở L2, kiếm ở L3, khiên ở L4 và trang phục Code Guardian ở L5.
- Gem là phần thưởng tiến trình, không có thanh toán tiền thật và không dùng cơ chế may rủi.

## Thứ tự triển khai

1. Hoàn thiện 8 màn còn lại của Làng Khởi Động và kiểm thử với nhóm học sinh nhỏ.
2. Chuẩn hóa component map, sprite vật phẩm, checkpoint Boss và telemetry học tập.
3. Triển khai lần lượt L2 → L3 → L4 → L5; kết thúc mỗi khu vực mới cân bằng XP/Gem.
4. Chạy kiểm thử accessibility, bàn phím, reduced motion, máy cấu hình thấp và màn hình 1366×768.
5. Chỉ nghiên cứu multiplayer sau khi toàn bộ chiến dịch chơi đơn ổn định.

## Tiêu chí hoàn thành cho mỗi màn

- Nhiệm vụ đọc được trong dưới 20 giây và chỉ có một hành động chính.
- Map là vùng lớn nhất; nút Chạy và chế độ Thường/Nhanh/Từng bước luôn gần map.
- Bảng lệnh chỉ hiện lệnh cần cho màn hiện tại.
- Gợi ý theo ba tầng: nhắc khái niệm → chỉ vị trí lỗi → pseudocode; không lộ code hoàn chỉnh trước khi đủ số lần thử.
- Hoạt ảnh có âm thanh ngắn, tắt được và tôn trọng reduced motion.
- Qua màn có XP/Gem/fanfare; chơi lại không farm phần thưởng.
- Rời route game phải dừng nhạc ngay và không tự phát lại ở trang ngoài game.
