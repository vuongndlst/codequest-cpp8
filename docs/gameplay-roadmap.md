# Roadmap sau curriculum Area 0–6

## Nguyên tắc cố định

Mỗi Area dùng vòng học `Learn → Predict → Game → Observe/Debug → Explain → Checkpoint`, khoảng 4–6 màn chất lượng cao thay vì nhiều màn lặp nội dung. Mỗi màn chỉ thêm một ý mới; boss không được bất ngờ đưa khái niệm chưa học.

Trang bị chỉ thể hiện tiến trình và thay đổi hình ảnh/âm thanh, không tăng sức mạnh để bỏ qua tư duy. Multiplayer chỉ nghiên cứu sau khi chiến dịch chơi đơn được kiểm nghiệm với học sinh thật.

## Các Area đề xuất

| Area | C++ trọng tâm | Cơ chế game | Boss chơi đơn |
|---|---|---|---|
| 3 — Lò Toán Tử | số học, so sánh, logic | tính năng lượng, công tắc, cân tinh thể | cấp đúng năng lượng cho ba máy |
| 4 — Cổng Quyết Định | `if`, `if-else` | cảm biến, cửa hai trạng thái, bẫy | **Đã triển khai:** kiểm thử nhiều bộ dữ liệu, không hard-code |
| 5 — Thung Lũng Lặp | `for`, counter, off-by-one | đường dài, đèn/gem theo iteration | **Đã triển khai:** phá năm lớp giáp bằng số lần lặp đúng |
| 6 — Xưởng Hàm | function, parameter, return, decomposition | máy móc và combo hành động tái sử dụng | ✅ Đã phát hành: vận hành dây chuyền nhiều phase |
| 7 — Thành Trì Tích Hợp | phối hợp concept | key, portal, bot và inventory | Bug King chơi đơn có checkpoint phase |
| 8 — Dự Án Cuối | thiết kế, cài đặt, debug, giải thích | nhiệm vụ mở theo rubric | trình bày giải pháp thay vì chỉ vượt map |

## Chuẩn hoàn thành mỗi màn

- Nhiệm vụ đọc trong khoảng 20 giây, mục tiêu và bằng chứng thành công rõ.
- Map là vùng lớn nhất; Run/Step/Stop/Reset luôn gần map.
- Coach chỉ có lệnh liên quan và chỉ hiện sau khi học sinh tự gõ.
- Có ít nhất một common mistake với feedback tiếng Việt dựa trên bằng chứng.
- Solution, starter, objective và đường map đều được chạy tự động qua engine.
- Âm thanh ngắn, tắt được; animation tôn trọng reduced motion.
- XP/Gem chỉ thưởng lần đầu, không farm bằng replay.
- Không dùng asset độc quyền hoặc sao chép level của sản phẩm tham khảo.

## Thứ tự triển khai

1. Pilot Area 0–2 với nhóm nhỏ học sinh lớp 8; đo thời gian, điểm dừng và mức hint.
2. Điều chỉnh độ dài map, câu chữ, số thao tác và breakpoint 1366×768 theo quan sát thật.
3. Pilot Area 3–6, đo mức hiểu về vòng lặp → hàm và điều chỉnh trước khi mở khu vực tiếp theo; không sản xuất hàng loạt màn chưa pilot.
4. Sau Area 7 chơi đơn ổn định mới thử prototype cooperative boss không xếp hạng.
