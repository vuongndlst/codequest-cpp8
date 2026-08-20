# Checklist pilot CodeQuest C++ 8

## Mục tiêu

Kiểm tra học sinh lớp 8 có thể tự hiểu nhiệm vụ, dự đoán, viết code, quan sát map và sửa lỗi mà không cần giáo viên giải hộ. Pilot dùng để tìm điểm nghẽn; không dùng để xếp hạng học sinh.

## Nhóm thử nghiệm

- 6–10 học sinh lớp 8, có mức tự tin Tin học khác nhau.
- Mỗi em dùng một tài khoản mới, cùng một lớp test và cùng chính sách mở khóa.
- Giáo viên chỉ hỗ trợ khi học sinh đã nói rõ mình dự đoán gì và bằng chứng nào không khớp.
- Thử trên laptop/PC thực tế của trường, ưu tiên độ phân giải phổ biến và tai nghe cá nhân.

## Kịch bản 45–60 phút

1. 5 phút: đăng nhập, vào lớp và đọc bản đồ khóa học.
2. 10 phút: một màn quan sát và một màn tự viết Area 1.
3. 15 phút: một màn biến/biểu thức Area 2–3.
4. 15 phút: một màn điều kiện hoặc vòng lặp Area 4–5.
5. 5 phút: checkpoint ngắn và phỏng vấn cuối buổi.

Không hướng dẫn trước vị trí nút Gợi ý, Từng bước hay Sổ tay. Quan sát xem học sinh có tự tìm được khi cần hay không.

## Dữ liệu cần ghi cho từng màn

| Chỉ báo | Cách ghi | Dấu hiệu cần xem lại |
|---|---|---|
| Thời gian đọc trước lần Run đầu | giây | dưới 10 giây lặp lại nhiều lần: có thể học sinh bỏ qua nhiệm vụ |
| Số lần Run | số lần | trên 6 lần mà lỗi không thay đổi |
| Mức gợi ý cao nhất | 0–3 | đa số cần cấp 3 ở cùng một challenge |
| Chế độ chạy đã dùng | thường / nhanh / từng bước | không ai tìm thấy Từng bước ở màn debug |
| Lỗi đầu tiên | mã lỗi + mô tả ngắn | cùng một thông báo nhưng học sinh không biết sửa gì |
| Điểm dừng lâu nhất | vị trí UI hoặc dòng code | dừng trên 90 giây mà không có hành động có mục đích |
| Dự đoán trước Run | đúng / một phần / chưa có | học sinh chỉ bấm Run thử liên tục |
| Bằng chứng được dùng | map / Output / test / nhật ký | chỉ nhìn đích, bỏ qua Output hoặc trạng thái thiết bị |
| Tự giải thích sau khi sửa | một câu của học sinh | chỉ nói “em thử đại” hoặc “máy cho đúng” |

## Câu hỏi phỏng vấn ngắn

- Em nghĩ nhiệm vụ yêu cầu em học điều gì, ngoài việc đưa Byte tới đích?
- Khi code chưa đạt, em nhìn phần nào đầu tiên? Vì sao?
- Gợi ý nào giúp em nghĩ tiếp, và gợi ý nào nói quá nhiều?
- Có từ hoặc câu nào em phải đọc lại nhiều lần không?
- Map, code và nút Run có chỗ nào khiến em mất dấu việc đang làm không?
- Nếu quay lại làm lại, em sẽ dự đoán điều gì trước khi bấm Run?

## Tiêu chí đạt cho một challenge

- Ít nhất 70% học sinh hoàn thành trong thời gian dự kiến mà không cần giáo viên cho code.
- Ít nhất 70% nói được ý mới chính bằng lời của mình.
- Trung vị số lần Run không quá 4; Run sau phải cho thấy một thay đổi có chủ đích.
- Không quá 30% cần gợi ý cấp 3.
- Học sinh dùng đúng bằng chứng trọng tâm: Output ở bài output, map/state ở bài game, cả hai ở bài tổng hợp.
- Không có lỗi layout chặn editor, map, mục tiêu hoặc nút Run trên thiết bị thử.

## Quy tắc quyết định sau pilot

- Nhiều em không hiểu cùng một từ: sửa văn phong hoặc thêm giải thích ngắn, không thêm lời giải.
- Nhiều em chọn sai lệnh ngay từ đầu: xem lại nhiệm vụ, cue và sổ tay lệnh liên quan.
- Nhiều em hiểu ý nhưng gõ sai cú pháp: cải thiện thông báo lỗi hoặc command coach.
- Nhiều em qua nhờ thử ngẫu nhiên: thêm yêu cầu dự đoán hoặc test một trường hợp đối lập.
- Nhiều em mắc cùng một điểm trên map: xem lại đường sáng, vật cản và vị trí tương tác.
- Chỉ tăng hoặc giảm độ khó diện rộng khi ít nhất hai nhóm học sinh độc lập cho cùng một bằng chứng.

## Báo cáo sau pilot

Ghi một trang gồm: challenge được thử, số học sinh hoàn thành, thời gian trung vị, Run trung vị, phân bố mức hint, ba điểm nghẽn lớn nhất, trích dẫn ngắn của học sinh và danh sách thay đổi ưu tiên. Không ghi tên thật trong báo cáo phân tích.
