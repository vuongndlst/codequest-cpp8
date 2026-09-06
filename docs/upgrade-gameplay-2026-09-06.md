# Báo cáo nâng cấp và kiểm thử gameplay — 06/09/2026

## Kết quả

- 785 kiểm thử tự động đạt (62 tệp); typecheck/build đạt; `npm audit --audit-level=high`: 0 lỗ hổng được báo cáo.
- 50/50 màn chạy lời giải mẫu qua bộ thông dịch; chương trình rỗng không được qua màn; không có va chạm quái trên tuyến lời giải.
- Browser local, viewport laptop 1366×768: 50/50 màn nhập code bằng bàn phím, chạy replay nhanh, xuất hiện popup hoàn thành; 49/49 nút Tiếp tục mở đúng màn sau, kể cả chuyển khu vực trong Demo. 13 màn đầu kiểm tra ngày 05/09, 37 màn còn lại ngày 06/09. Một số lệnh chờ browser hết hạn trước khi replay kết thúc; đã kiểm tra lại popup, không tính timeout công cụ là lỗi gameplay.
- Supabase thật: học sinh tạm lớp 8A11 hoàn thành 50 nhiệm vụ và 11 checkpoint theo thứ tự; nhận 11 chứng chỉ, tổng 2.220 XP và 249 Gem. Chơi lại màn đầu nhận 0 XP/0 Gem; khu vực 1 bị khóa khi chưa hoàn tất khu vực 0. Tài khoản tạm và dữ liệu liên quan đã được xóa.
- Không có lỗi console được ghi nhận trong phiên browser tiếp tục ngày 06/09. Đây không phải kiểm thử tải đồng thời hoặc chứng nhận không còn lỗi.

## Thay đổi

1. Lưu riêng từng bài chờ đồng bộ, tránh ghi đè toàn bộ hàng đợi; dùng Web Locks phối hợp các tab trên trình duyệt hỗ trợ. Di chuyển dữ liệu cũ chỉ xóa nguồn sau khi ghi thành công.
2. Không âm thầm bỏ bài khi đầy bộ nhớ/đủ 200 mục. Lỗi tạm thời HTTP 429/5xx giữ bài và gửi lại có khoảng nghỉ; lỗi quyền giữ bài để học sinh kiểm tra rồi chủ động đồng bộ. Chỉ xử lý bài của tài khoản hiện tại và giữ thứ tự các điều kiện tiên quyết.
3. Có thông báo bài chờ xác nhận và nút Đồng bộ lại; không báo bản nháp đã lưu khi bộ nhớ từ chối ghi.
4. Sửa bộ chạy để nhận `cin >> cells[i]`, kiểm tra chỉ số mảng và không cho nhập nguyên mảng một lần. Lỗi runtime ở bộ Input phụ cũng làm bài không đạt.
5. Bài a9-c1/a9-c2 nhận nhiều bộ Input (0, phần tử bằng nhau, cực trị đầu/cuối). Giá trị tổng/lớn nhất phải được dùng để nạp đúng máy trên map. In đáp án cố định hoặc nạp sai/không nạp máy không được qua.
6. Editor hiển thị Input được cung cấp. Phản hồi sai chỉ rõ Input, Output mong đợi và Output thực của chính lần kiểm tra đó, không lấy nhầm lần chạy đầu.
7. Demo cộng dồn thưởng trong phiên, không cộng lại cùng nhiệm vụ, không ghi vào tài khoản thật; tải lại bắt đầu phiên Demo mới. Popup hiển thị đúng số mục tiêu thay vì luôn 1/1.

Các thay đổi học tập theo nguyên tắc LSTS: học sinh tự viết và quan sát bằng chứng; tính toán phải tạo tác động trên map, không chỉ in đúng ví dụ.

## Ma trận từng màn

Bảng tổng hợp từ kết quả bộ chạy và nhật ký thao tác browser. Ảnh được chụp trước Run để quan sát map/code; popup và chuyển màn được xác nhận bằng trạng thái UI sau Run.

| Khu vực | Nhiệm vụ | Bộ chạy | Browser | Kiểm tra bắt buộc |
|---|---|---|---|---|
| a0 | a0-c1-first-program — Tín hiệu đầu tiên | PASS | PASS | 1/1 |
| a0 | a0-c2-cout — Mật khẩu của người gác trạm | PASS | PASS | 1/1 |
| a0 | a0-c3-debug-semicolon — Debug Lab: Dấu chấm phẩy thất lạc | PASS | PASS | 1/1 |
| a0 | a0-c4-system-start — BOSS: Mở cổng ByteLand | PASS | PASS | 2/2 |
| a1 | a1-c1-move-right — Ba bước sang phải | PASS | PASS | 2/2 |
| a1 | a1-c2-change-direction — Rẽ xuống thung lũng | PASS | PASS | 2/2 |
| a1 | a1-c3-obstacle-route — Vòng qua hồ độc | PASS | PASS | 2/2 |
| a1 | a1-c4-debug-order — Debug Lab: Đúng lệnh, sai thứ tự | PASS | PASS | 2/2 |
| a1 | a1-c5-portal — BOSS: Cổng dịch chuyển | PASS | PASS | 2/2 |
| a2 | a2-c1-variable — Chiếc hộp có tên | PASS | PASS | 2/2 |
| a2 | a2-c2-data-types — Bốn loại dữ liệu | PASS | PASS | 2/2 |
| a2 | a2-c3-collect-count — Nhặt Gem và cập nhật | PASS | PASS | 2/2 |
| a2 | a2-c4-debug-update — Debug Lab: Giá trị cũ | PASS | PASS | 2/2 |
| a2 | a2-c5-vault — BOSS: Kho Gem ký ức | PASS | PASS | 2/2 |
| a3 | a3-c1-forge-energy — Mẻ năng lượng đầu tiên | PASS | PASS | 2/2 |
| a3 | a3-c2-crystal-balance — Cân tinh thể | PASS | PASS | 2/2 |
| a3 | a3-c3-compare-switch — Công tắc ngưỡng an toàn | PASS | PASS | 2/2 |
| a3 | a3-c4-debug-logic — Debug Lab: Tinh thể bị đảo dấu | PASS | PASS | 2/2 |
| a3 | a3-c5-triple-core — BOSS: Ba lõi năng lượng | PASS | PASS | 2/2 |
| a4 | a4-c1-first-if — Công tắc biết nghe điều kiện | PASS | PASS | 2/2 |
| a4 | a4-c2-two-branches — Hai nhánh năng lượng | PASS | PASS | 5/5 |
| a4 | a4-c3-key-sensor — Chìa khóa biết trả lời | PASS | PASS | 2/2 |
| a4 | a4-c4-debug-equality — Debug Lab: Một dấu hay hai dấu | PASS | PASS | 5/5 |
| a4 | a4-c5-decision-gate — BOSS: Cổng kiểm định kép | PASS | PASS | 5/5 |
| a5 | a5-c1-first-loop — Sáu nhịp trên đường vọng âm | PASS | PASS | 2/2 |
| a5 | a5-c2-lantern-line — Dãy đèn theo từng lượt | PASS | PASS | 2/2 |
| a5 | a5-c3-counter-trail — Biến đếm để lại dấu vết | PASS | PASS | 3/3 |
| a5 | a5-c4-debug-off-by-one — Debug Lab: Bước thứ bảy vô hình | PASS | PASS | 3/3 |
| a5 | a5-c5-armor-loop — BOSS: Năm lớp giáp vọng âm | PASS | PASS | 3/3 |
| a6 | a6-c1-first-function — Mô-đun ánh sáng đầu tiên | PASS | PASS | 3/3 |
| a6 | a6-c2-parameters — Một mô-đun, hai độ dài | PASS | PASS | 3/3 |
| a6 | a6-c3-return-energy — Giá trị trở về từ lõi tính toán | PASS | PASS | 3/3 |
| a6 | a6-c4-debug-parameter — Debug Lab: Tham số bị phớt lờ | PASS | PASS | 2/2 |
| a6 | a6-c5-factory-core — BOSS: Lõi Xưởng sáu lớp | PASS | PASS | 3/3 |
| a7 | a7-c1-value-copy — Bản sao năng lượng | PASS | PASS | 2/2 |
| a7 | a7-c2-reference-charge — Kênh truyền chung | PASS | PASS | 2/2 |
| a7 | a7-c3-debug-swap — Debug Lab: Hai lõi chưa đổi chỗ | PASS | PASS | 2/2 |
| a7 | a7-c4-mirror-boss — BOSS: Người Gác Phòng Gương | PASS | PASS | 2/2 |
| a8 | a8-c1-indexed-vault — Kho ô đánh số | PASS | PASS | 2/2 |
| a8 | a8-c2-repair-slot — Sửa ô rune hỏng | PASS | PASS | 2/2 |
| a8 | a8-c3-debug-bound — Debug Lab: Bước khỏi mép kho | PASS | PASS | 2/2 |
| a8 | a8-c4-route-array-boss — BOSS: Mê cung Mã Hướng | PASS | PASS | 2/2 |
| a9 | a9-c1-aggregate — Tổng năng lượng đoàn tàu | PASS | PASS | 8/8 |
| a9 | a9-c2-maximum — Tìm lõi mạnh nhất | PASS | PASS | 10/10 |
| a9 | a9-c3-debug-search — Debug Lab: Máy quét quá giới hạn | PASS | PASS | 4/4 |
| a9 | a9-c4-scout-boss — BOSS: Mắt Quét Hư Không | PASS | PASS | 5/5 |
| a10 | a10-c1-bubble-pass — Một lượt đẩy nổi | PASS | PASS | 2/2 |
| a10 | a10-c2-select-min — Chọn rune nhỏ nhất | PASS | PASS | 2/2 |
| a10 | a10-c3-debug-inner-bound — Debug Lab: Cặp cuối không tồn tại | PASS | PASS | 2/2 |
| a10 | a10-c4-algorithm-core — BOSS: Lõi Thuật Toán | PASS | PASS | 2/2 |

## Bằng chứng và chạy lại

- [Chi tiết bộ chạy](gameplay-audit-2026-09-05.json).
- Ảnh từng màn: thư mục `tmp/gameplay/` (không đưa ảnh QA và lời giải fixture lên Git).
- `node scripts/verify-gameplay.mjs`: chạy mọi lời giải và đối chứng chương trình rỗng, không dùng mạng.
- `node scripts/verify-live-progression.mjs --all`: tạo học sinh tạm, kiểm tra máy chủ với tốc độ tuần tự có giới hạn và xóa tài khoản trong finally. Cần cấu hình `.env`; không chạy kiểm thử tải trên dữ liệu học sinh.

## Giới hạn và việc tiếp theo

- Chưa phải ứng dụng offline hoàn toàn: cần mạng để xác nhận điểm, chứng chỉ, quyền giáo viên và tải dữ liệu chưa có sẵn. Không tự gỡ khóa của giáo viên khi mất mạng.
- Hàng đợi vẫn dùng localStorage, tối đa 200 bài. Trình duyệt không hỗ trợ Web Locks chỉ có khóa trong một tab. Chưa có idempotency key đầu-cuối cho mọi lần gửi; thưởng chống cộng trùng đã được kiểm chứng, nhưng cần nâng cấp tiếp để tránh tăng số lần thử khi server đã lưu mà phản hồi bị mất.
- Nâng nhiều bộ dữ liệu mới áp dụng cho a9-c1/c2 trong đợt này; a9-c3/c4 đã có trước. Một số bài nâng cao khác vẫn dùng dữ liệu cố định. Không tuyên bố bộ chấm chống mọi cách hard-code đáp án.
- Đây là bộ thông dịch tập con C++ cho học tập, không phải g++ đầy đủ; không dùng độc lập cho kỳ thi chống gian lận.
- Chưa kiểm thử toàn bộ bằng trình đọc màn hình, thiết bị di động hoặc nhiều học sinh đồng thời. Bản build còn cảnh báo bundle chính >500 kB, cần tiếp tục tách nội dung tải theo khu vực.

## Triển khai và quay lui

- Hai Edge Functions submit-challenge/submit-checkpoint đã cập nhật; xác thực học sinh vẫn được thực hiện trong hàm. Không có migration schema trong đợt này.
- Trước phát hành: kiểm thử/build/audit và kiểm tra không có `.env` trong commit. GitHub Actions phải xanh trước khi báo website cập nhật.
- Nếu phát sinh mất lưu bài hoặc chặn sai quyền: dừng phát hành, giữ nguyên dữ liệu hàng đợi; quay lui commit frontend và triển khai lại Edge Functions từ bản tương ứng. Không xóa queue của học sinh.

