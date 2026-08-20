# Kế hoạch rà soát curriculum C++ cho học sinh lớp 8

Ngày lập: 2026-08-13
Phạm vi: Area 0–6, 34 challenge, 7 hướng dẫn kiến thức, 7 checkpoint, sổ tay lệnh, gợi ý và phản hồi lỗi.

## 1. Mục tiêu chất lượng

Website phải giúp học sinh lớp 8 **tự đọc – tự dự đoán – tự gõ – tự chạy – tự quan sát – tự sửa code**. Game tạo động lực và bằng chứng trực quan; phần cốt lõi vẫn là luyện tư duy thuật toán và viết C++.

Sau mỗi challenge phải trả lời được:

- **Know — Biết:** Học sinh nhận biết được cú pháp, khái niệm hoặc quy trình nào?
- **Understand — Hiểu:** Học sinh giải thích được vì sao code tạo ra kết quả đó và khi nào nên dùng cấu trúc vừa học?
- **Do — Làm được:** Học sinh đã tự viết, sửa, kiểm thử hoặc tổ chức phần code cốt lõi nào?

Chuẩn đầu ra toàn hành trình:

- đọc được chương trình C++ theo thứ tự thực thi;
- dùng biến, kiểu dữ liệu và biểu thức để biểu diễn trạng thái;
- dùng `if` và `for` để tạo quyết định và sự lặp lại;
- tách chương trình thành hàm có tên, tham số và giá trị trả về;
- dự đoán trước khi chạy, đọc bằng chứng và debug có phương pháp.

## 2. Rubric rà soát từng challenge

Mỗi challenge được chấm theo 8 tiêu chí, mỗi tiêu chí 0–2 điểm:

| Tiêu chí | 0 điểm | 1 điểm | 2 điểm |
|---|---|---|---|
| Mục tiêu kiến thức | Nhiều ý mới không có bước đệm | Có ý chính nhưng còn tải phụ lớn | Một ý chính; kiến thức cũ dùng để hỗ trợ |
| Văn phong lớp 8 | Mơ hồ hoặc quá hàn lâm | Đúng nhưng câu dài/thuật ngữ chưa giải thích | Chính xác, gọn, thuật ngữ chuẩn được giải nghĩa |
| Lượng code tự viết | Chủ yếu Run code có sẵn | Chỉ thay số hoặc một từ khóa | Tự viết/sửa cấu trúc cốt lõi của màn |
| Bằng chứng quan sát | Map chỉ trang trí | Hiệu ứng có liên quan nhưng chưa rõ | Code, trace, Output và map đối chiếu được |
| Quy trình tư duy | Thử mò hoặc lộ đáp án | Có hướng dẫn nhưng thiếu một bước | Dự đoán → lập kế hoạch → gõ → chạy → đối chiếu → sửa |
| Độ khó liên tục | Dễ hơn màn trước hoặc tăng đột ngột | Tăng nhưng có tải phụ | Mỗi màn tăng có chủ đích một biến khó |
| Hệ thống hỗ trợ | Hint đưa đáp án hoặc quá chung | Có ba mức nhưng chưa phân tầng tốt | Câu hỏi → cấu trúc → khung code còn chỗ học sinh hoàn thiện |
| Đánh giá mục tiêu | Chỉ kiểm tra tới đích | Kiểm tra một loại kết quả | Kết hợp cấu trúc code, Output/world và khả năng tổng quát hóa |

Ngưỡng phát hành: không tiêu chí nào bằng 0 và tổng tối thiểu 13/16. Màn Boss nên đạt ít nhất 14/16.

## 3. Quy ước văn phong

- Nói trực tiếp với học sinh bằng “em”; Byte là bạn đồng hành, không làm hộ.
- Mỗi câu ưu tiên một ý; story tối đa 2–3 câu và không giấu điều kiện hoàn thành.
- Giữ thuật ngữ C++/khoa học máy tính cần thiết nhưng giải nghĩa ở lần xuất hiện đầu:
  - “kết quả đầu ra (`Output`)”;
  - “giá trị đúng–sai (`bool`)”;
  - “mỗi lượt lặp (`iteration`)”;
  - “lỗi lệch một lượt (`off-by-one`)”;
  - “giá trị truyền vào (đối số)” và “biến nhận dữ liệu (tham số)”.
- Giữ nguyên từ khóa học sinh phải gõ như `if`, `for`, `return`, `int`; không dịch từ khóa thành cú pháp giả.
- Yêu cầu bắt đầu bằng động từ đo được: “Dự đoán”, “Viết”, “Chạy từng bước”, “So sánh”, “Giải thích”, “Sửa”.
- Phân biệt nhất quán:
  - **C++ chuẩn:** `main`, `cout`, biến, toán tử, `if`, `for`, hàm;
  - **Game API CodeQuest:** `moveRight()`, `collectGem()`, `attackBug()`…
- Không mô tả vật trang trí như một cơ chế bắt buộc nếu engine không kiểm tra nó.
- Dùng giọng phiêu lưu vừa đủ; ưu tiên chỉ dẫn rõ hơn văn chương.

## 4. Quy ước thiết kế luyện code

- **Màn quan sát:** cho code mẫu để đọc, nhưng phải yêu cầu dự đoán có thể kiểm chứng trước Run.
- **Màn khám phá:** để trống đúng phần cú pháp mới; phần đường đi không phải mục tiêu có thể cho sẵn.
- **Màn luyện tập:** học sinh tự viết cấu trúc vừa học và kết hợp với một kiến thức cũ.
- **Màn debug:** một lỗi chính có chủ đích; học sinh tìm bước đầu tiên lệch khỏi dự đoán.
- **Màn Boss:** tổng hợp kiến thức đã luyện, không giới thiệu cú pháp mới.
- Không đánh đồng “gõ nhiều dòng” với luyện tập tốt. Ưu tiên quyết định code có ý nghĩa hơn lặp lại lệnh đường đi cơ học.
- Starter code không được hoàn thành sẵn mục tiêu, trừ màn quan sát có chủ đích.
- Hint cấp 3 là khung có chỗ trống, không phải toàn bộ solution.
- Test nên chống viết cứng khi mục tiêu là tham số, dữ liệu đầu vào hoặc nhiều nhánh.

## 5. Mạch kiến thức chuẩn toàn khóa

| Area | Câu hỏi lớn | Know | Understand | Do |
|---|---|---|---|---|
| 0 — Trạm Khởi Động | Máy tính thực hiện một chương trình C++ thế nào? | `main`, `cout`, statement, `;`, comment | Máy chỉ thực hiện chỉ dẫn đúng cú pháp và thứ tự | Đọc, dự đoán, viết output và sửa lỗi cú pháp |
| 1 — Đồng Cỏ Thuật Toán | Làm sao biến đường đi thành thuật toán? | function call, sequence, Game API | Thứ tự lệnh quyết định quỹ đạo | Lập tuyến, tự gõ lời gọi và debug thứ tự |
| 2 — Kho Dữ Liệu | Làm sao chương trình ghi nhớ trạng thái? | biến, kiểu, gán, cập nhật | Biến nối trạng thái trong code với thế giới đang đổi | Khai báo, cập nhật và báo cáo dữ liệu |
| 3 — Lò Toán Tử | Làm sao tạo giá trị mới từ dữ liệu? | số học, so sánh, logic | Biểu thức biến dữ liệu thành số hoặc câu trả lời đúng–sai | Tính, dự đoán và dùng kết quả điều khiển máy |
| 4 — Cổng Quyết Định | Làm sao cùng một chương trình phản ứng với nhiều trạng thái? | `cin`, `if`, `if-else`, cảm biến | Điều kiện chọn hành động dựa trên dữ liệu thật | Viết và kiểm thử cả nhánh đúng lẫn sai |
| 5 — Thung Lũng Lặp | Làm sao mô tả chính xác công việc lặp lại? | `for`, biến đếm, điều kiện dừng | Vòng lặp mô tả quy luật và số lượt | Viết vòng lặp, theo dõi từng lượt, sửa lỗi lệch một |
| 6 — Xưởng Hàm | Làm sao tái sử dụng và tổ chức thuật toán? | định nghĩa/gọi hàm, tham số, đối số, `return` | Hàm tạo mô-đun có trách nhiệm, dữ liệu vào và kết quả ra | Tách hàm, truyền dữ liệu, nhận kết quả, phối hợp nhiều hàm |

## 6. Kết quả kiểm kê ban đầu

### Rủi ro toàn khóa

1. Một số màn dùng nhiều thuật ngữ Anh liên tiếp dù nội dung kỹ thuật là phù hợp lớp 8.
2. Một số màn cho sẵn gần toàn bộ code nên chưa tạo đủ thời gian luyện viết.
3. Có challenge kết hợp quá nhiều thao tác đường đi với kiến thức mới, làm học sinh khó xác định nguyên nhân khi sai.
4. Monster/Boss đôi lúc chỉ là trang trí nhưng câu chuyện khiến học sinh kỳ vọng có cơ chế chiến đấu.
5. Có màn tăng chiều dài code nhưng không tăng chất lượng quyết định thuật toán.
6. Các Area 5–6 cần cầu nối rõ giữa vòng lặp, nhóm lệnh lặp lại và việc tách thành hàm.

### Trọng tâm theo Area

| Area | Điểm cần giữ | Trọng tâm rà soát |
|---|---|---|
| 0 | Dự đoán trước Run, sửa `;` | Tăng cơ hội tự gõ mà không làm màn đầu gây sốc cú pháp |
| 1 | Map phản hồi rõ, debug thứ tự | Giảm gõ lặp cơ học; phân biệt vật cản thật/trang trí |
| 2 | Gem gắn với giá trị | Kiểm tra màn bốn kiểu dữ liệu có đủ scaffold; làm rõ biến game và biến C++ |
| 3 | Máy hiện kết quả biểu thức | Dẫn số học → so sánh → logic liên tục; giảm tải Boss ba lõi nếu cần |
| 4 | Hai bộ input kiểm thử hai nhánh | Đưa câu hỏi đúng–sai trước cú pháp; lược đường đi không phục vụ `if` |
| 5 | Hiệu ứng theo từng lượt | Chuẩn hóa thuật ngữ iteration/off-by-one; tăng bài đọc trace và giải thích số lượt |
| 6 | Hàm, tham số và `return` gắn gameplay | Tách rõ “định nghĩa” và “gọi”; không để vòng lặp che mất ý mới của màn đầu |

## 7. Kế hoạch triển khai theo đợt

### Đợt 1 — Chuẩn hóa toàn khóa và Area 0–1

- Lập từ điển thuật ngữ UI/C++ dùng nhất quán.
- Rà KUD, story, instructions, thinking prompt, hint và lỗi của 9 challenge.
- Đo lượng code học sinh tự viết; chỉnh starter nếu màn luyện tập đang làm sẵn quá nhiều.
- Kiểm tra map/vật cản phục vụ đúng mục tiêu sequence.
- Nghiệm thu: content test, engine, browser màn đầu/debug/Boss.

### Đợt 2 — Area 2–3: dữ liệu và biểu thức

- Rà bước chuyển biến → kiểu → cập nhật → biểu thức.
- Giữ bốn kiểu dữ liệu nhưng phân tầng: nhận biết trước, vận dụng từng nhóm sau.
- Bảo đảm mỗi phép tính/so sánh có bằng chứng trên Output hoặc thiết bị.
- Giảm thao tác đường đi không liên quan đến mục tiêu dữ liệu.

### Đợt 3 — Area 4: điều kiện và kiểm thử

- Dẫn từ giá trị `bool` ở Area 3 sang câu hỏi của `if`.
- Rà mọi challenge với ít nhất một dự đoán nhánh.
- Màn `if-else` và Boss phải được kiểm thử bằng cả dữ liệu đúng và sai.
- Chuẩn hóa `=`, `==`, `>=`, `&&` ở ví dụ, editor, hint và sổ tay.

### Đợt 4 — Area 5: vòng lặp

- Rà sự tăng tiến: nhận biết quy luật → viết `for` → dùng biến đếm → debug → Boss.
- Bổ sung cách đọc trace theo từng lượt và bảng giá trị biến đếm khi cần.
- Đảm bảo học sinh tự viết phần đầu và thân vòng lặp, không chỉ sửa con số.

### Đợt 5 — Area 6: hàm và phân rã

- Rà lại màn đầu để kiến thức mới chính là định nghĩa/gọi hàm, không phải đồng thời học lại một vòng lặp phức tạp.
- Dẫn tuần tự: hàm không tham số → tái sử dụng → tham số/đối số → `return` → debug → Boss.
- Đánh giá tên hàm, trách nhiệm, dữ liệu vào/ra chứ không chỉ kết quả map.

### Đợt 6 — Hệ thống hỗ trợ học tập

- Rà toàn bộ câu checkpoint, thẻ sổ tay, command coach, hint và thông báo lỗi.
- Checkpoint phải có đọc code, dự đoán, debug và vận dụng; không thiên về nhớ định nghĩa.
- Hint không tự động chèn code và không lộ solution ở cấp 1–2.
- Chuẩn hóa giọng Byte: ngắn, tôn trọng, hướng về bằng chứng, không phán xét.

### Đợt 7 — Kiểm thử hành trình và pilot

- Chạy mọi solution bằng engine; starter không được vượt sẵn ngoài màn quan sát.
- Browser QA màn đầu, concept, debug và Boss từng Area ở laptop.
- Test hành trình tài khoản mới và quyền khóa/mở của giáo viên.
- Chuẩn bị checklist pilot 6–10 học sinh: thời gian, số lần Run, mức hint, điểm dừng, lỗi phổ biến và phản hồi ngôn ngữ.
- Chỉ chỉnh độ khó diện rộng sau khi có bằng chứng từ pilot.

## 8. Nghiệm thu mỗi đợt

1. Chốt KUD và ý mới chính của từng challenge.
2. Chấm rubric trước chỉnh sửa và ghi nguyên nhân điểm thấp.
3. Sửa nội dung; chỉ sửa map/code/test khi chúng không phục vụ KUD.
4. Chấm lại rubric, yêu cầu tối thiểu 13/16.
5. Chạy typecheck, content test và engine test.
6. Kiểm tra trực quan trên browser.
7. Ghi changelog sư phạm trước khi chuyển sang đợt tiếp theo.

## 9. Phạm vi không thay đổi

- Giữ tên sản phẩm **CodeQuest C++ 8**.
- Giữ đối tượng chính là **học sinh lớp 8**.
- Giữ C++ thật và thuật ngữ chuẩn; bổ sung giải thích thay vì thay bằng cú pháp giả.
- Giữ single-player trong giai đoạn này.
- Không thay đổi điểm, Gem, trang bị hoặc cơ chế mở khóa nếu không có lý do sư phạm trực tiếp.

## 10. Nhật ký triển khai

### 2026-08-13 — Hoàn thành Đợt 1: chuẩn hóa toàn khóa và Area 0–1

- Đưa chuẩn đầu ra **Know–Understand–Do** vào dữ liệu của cả 7 khu vực và hiển thị thành ba khối ngắn trên trang khu vực.
- Chốt Area 0 theo nhịp: quan sát và dự đoán → hoàn thiện `cout` → debug dấu `;` → tự viết hai tín hiệu.
- Chốt Area 1 theo nhịp: quan sát lời gọi hàm → tự viết hai hướng → phân rã đường chữ U → debug thứ tự → Boss bốn chặng.
- Viết lại gợi ý cấp 3 của các màn Area 0–1 thành **khung còn chỗ trống**, không đưa nguyên solution.
- Đổi quái vật trang trí ở Boss Area 1 thành tượng canh để hình ảnh không hứa hẹn cơ chế chiến đấu mà engine chưa đánh giá trong khu vực này.
- Giữ Gem làm mốc kiểm chứng đường đi; điều kiện hoàn thành vẫn kết hợp số Gem và vị trí đích.
- Thêm kiểm thử bắt buộc cho KUD của mọi khu vực và nguyên tắc gợi ý không chứa nguyên đáp án.

Kết quả nghiệm thu:

- `npm run typecheck`: đạt.
- 190 kiểm thử liên quan đến nội dung, cú pháp C++, engine map, TileMap và layout: đạt 190/190.
- Browser QA ở 1440×900: không tràn ngang; map và editor cùng hiển thị trong vùng thao tác chính.
- Browser QA gợi ý Area 1: đủ ba tầng câu hỏi → cấu trúc → khung code; đáp án mẫu vẫn khóa theo quyền giáo viên hoặc số lần thử.

### 2026-08-13 — Hoàn thành Đợt 2: Area 2–3 — dữ liệu và biểu thức

- Làm rõ ranh giới kiến thức: Area 3 đổi từ “Biến dữ liệu thành quyết định” thành **“Biến dữ liệu thành kết quả”**; quyết định bằng `if` được giữ cho Area 4.
- Chuẩn hóa mạch Area 2: quan sát biến → chọn kiểu → nhặt Gem và cập nhật → debug giá trị cũ → Boss đồng bộ state game với biến.
- Sửa màn debug Area 2 để dùng `gems = gems + gemsCollected();` thay cho cộng cứng `2`; học sinh phải đọc dữ liệu thật từ bản đồ.
- Chuẩn hóa thuật ngữ Gem, cổng dịch chuyển, kết quả đầu ra (Output) và giải thích vai trò của `bool` ở lần xuất hiện liên quan.
- Viết lại gợi ý cấp 3 của các màn tự viết Area 2–3 thành khung code còn `___`, không đưa toàn bộ lời giải hoặc chỉ mô tả tuyến đường.
- Ưu tiên cue học tập theo KUD: Area 2 giải thích state game → `gemsCollected()` → biến; Area 3 giải thích biểu thức → số/`bool` → phản hồi của máy.
- Loại quái vật/Boss trang trí khỏi Area 2–3; thay bằng tượng, đá, phế tích hoặc thiết bị để không gợi sai cơ chế chiến đấu.
- Thêm test hồi quy cho cập nhật từ dữ liệu game, scaffold gợi ý, vật thể trang trí và thiết bị phản hồi.

Kết quả nghiệm thu:

- `npm run typecheck`: đạt.
- 247 kiểm thử nội dung, sổ tay lệnh, command coach, cú pháp C++, engine và map: đạt 247/247 ở vòng kiểm thử lõi.
- 192 kiểm thử nội dung, map, TileMap và layout sau lần tinh chỉnh cue cuối: đạt 192/192.
- Browser QA ở 1440×900 cho `a2-c4-debug-update` và `a3-c5-triple-core`: không tràn ngang.
- Browser QA gợi ý Boss Area 3: đủ ba tầng; cấp 3 giữ khung biểu thức và lộ trình có chỗ trống.

### 2026-08-13 — Hoàn thành Đợt 3: Area 4 — điều kiện và kiểm thử

- Chốt mạch nhận thức của khu vực: **trạng thái/dữ liệu → biểu thức bool → chọn nhánh → hành động nhìn thấy trên map**.
- Bổ sung cue học tập riêng cho ba trường hợp: `if` đầu tiên, `if ... else` với hai bộ dữ liệu, và cảm biến `hasKey()` sau hành động nhặt chìa.
- Thêm world test cho nhánh sai ở màn năng lượng, Debug Lab và Boss; output đúng chưa đủ, công tắc/cửa và vị trí Byte cũng phải đúng.
- Xác nhận lượt thiếu năng lượng ở Boss dừng trước cửa đóng, trong khi lượt đủ năng lượng mở cửa và đi tới đích.
- Chuyển gợi ý cấp 3 của các màn tự viết thành khung `___`; riêng màn debug vẫn cho phép chỉ chính xác ký hiệu cần sửa sau hai tầng suy luận.
- Đổi quái vật, bot và Boss trang trí thành tượng hoặc phế tích; Area 4 chưa hứa hẹn cơ chế chiến đấu mà chỉ tập trung vào quyết định.
- Chuẩn hóa văn phong “cổng dịch chuyển”, giải thích lỗi gán trong điều kiện bằng ngôn ngữ trung tính và nhấn mạnh kiểm thử nhiều dữ liệu.
- Thêm test hồi quy cho scaffold gợi ý, hai trạng thái thế giới và nguyên tắc không dùng quái vật trang trí.

Kết quả nghiệm thu:

- `npm run typecheck`: đạt.
- 239 kiểm thử nội dung, engine, world map và TileMap: đạt 239/239.
- Browser QA các màn `if` đầu tiên, hai nhánh và Boss: mục tiêu hiển thị đầy đủ, map/editor đúng hai cột, cue đúng KUD.
- Browser QA gợi ý màn hai nhánh: đủ ba tầng; cấp 3 chỉ hiển thị khung `if (___) ... else ...` và đáp án mẫu vẫn bị khóa.

### 2026-08-13 — Hoàn thành Đợt 4: Area 5 — vòng lặp

- Chốt bằng chứng học tập trực quan: mỗi iteration tương ứng với một bước đi, một đèn được bật, một giá trị biến đếm được in hoặc một lớp giáp bị phá.
- Bổ sung cue riêng cho vòng lặp di chuyển, vòng lặp nhiều hành động, biến đếm tạo Output và Debug Lab lỗi lệch một lượt.
- Giữ progression 6–7–9–11–12 bước; màn debug dùng đồng thời vị trí, Output và dãy giá trị `i` để tránh kết luận từ hình ảnh “gần đúng”.
- Chuyển gợi ý cấp 3 của các màn tự viết thành khung `___`; màn debug vẫn chỉ rõ phép sửa `<` sau hai tầng truy vết biến đếm.
- Loại quái vật trang trí khỏi bốn màn trước Boss; chỉ Boss cuối có cơ chế HP thật, năm lần `attackBug()` và thanh giáp phản hồi trên map.
- Sửa validator Boss từ tối thiểu bốn thành tối thiểu **năm vòng `for`**, khớp bốn đoạn di chuyển và một vòng phá giáp.
- Chuẩn hóa “cổng dịch chuyển” trong nhiệm vụ, starter code và điều kiện hoàn thành.

Kết quả nghiệm thu:

- `npm run typecheck`: đạt.
- 256 kiểm thử nội dung, command coach, sổ tay, engine, world map và TileMap: đạt 256/256.
- Browser QA dãy đèn, Debug Lab và Boss: cue đúng theo bằng chứng, map/editor đúng hai cột; Boss hiển thị “Giáp Boss còn 5” ngay trên map.

### 2026-08-13 — Hoàn thành Đợt 5: Area 6 — hàm và phân rã

- Giữ độ khó phù hợp lớp 8 theo progression: định nghĩa/gọi hàm → tham số/đối số → `return` → debug giá trị viết cứng → phân rã Boss.
- Làm rõ bằng cue trên màn chơi: định nghĩa chỉ mô tả mô-đun, lời gọi trong `main` mới làm mô-đun chạy; tham số nhận giá trị mới ở mỗi lời gọi.
- Sửa chú thích `calculatePower` từ “tổng năng lượng” thành “tích số tinh thể và năng lượng mỗi tinh thể”, thống nhất với biểu thức và mục tiêu 12.
- Chuyển gợi ý cấp 3 của các màn tự viết thành khung `___`; Boss chỉ còn khung hai hàm, không cung cấp trọn lời giải.
- Loại quái vật trang trí khỏi các màn trước Boss; map dùng máy, tượng và phế tích để giữ trọng tâm mô-đun.
- Chuẩn hóa “cổng dịch chuyển” trong hướng dẫn và điều kiện hoàn thành.
- Thêm test progression 6–9–8–9–12 bước, sáu đòn Boss, trạng thái HP cuối và scaffold gợi ý.

Kết quả nghiệm thu:

- `npm run typecheck`: đạt.
- 258 kiểm thử nội dung, command coach, sổ tay, engine, world map và TileMap: đạt 258/258.
- Browser QA màn định nghĩa/gọi hàm, `return` và Boss phân rã: cue, starter code, thanh giáp và hai cột map/editor hiển thị đúng.

### 2026-08-13 — Hoàn thành Đợt 6: hệ thống hỗ trợ học tập

- Rà lại checkpoint 0–6: mỗi khu vực có chín câu, kết hợp kiến thức, dự đoán code, nhiều đáp án, sắp thứ tự, nối cặp, debug, điền code, tình huống và tự đánh giá.
- Xác nhận command coach chỉ lọc lệnh liên quan đến challenge và chỉ nhắc sau khi học sinh tự gõ; không có nút chèn code.
- Xác nhận sổ tay phân biệt C++ chuẩn với Game API, dùng ví dụ cú pháp ASCII chuẩn như `>=`, `<=`, `==`, `&&`.
- Đổi tiêu đề phản hồi chưa đạt từ “Bug vẫn còn” thành lời mời kiểm tra bằng chứng, dùng được cho mọi loại nhiệm vụ.
- Phân biệt bài có Output với bài chỉ điều khiển map: chỉ nhắc `cout` khi test Output thực sự bắt buộc.
- Đổi câu khen chung chung thành xác nhận cụ thể: chương trình đã vượt đủ các kiểm tra của nhiệm vụ.
- Chuẩn hóa thêm thuật ngữ “cổng dịch chuyển” ở các điều kiện hoàn thành và hướng dẫn cũ.
- Thêm test UI cho ba trạng thái phản hồi: nhiệm vụ thường, map không Output và nhiệm vụ có Output.

Kết quả nghiệm thu:

- `npm run typecheck`: đạt.
- 245 kiểm thử nội dung, editor, command coach, sổ tay và engine: đạt 245/245.

### 2026-08-13 — Hoàn thành Đợt 7: nghiệm thu kỹ thuật và chuẩn bị pilot

- Chạy toàn bộ solution, validator, progression, map, UI, quyền truy cập, chứng chỉ, thiết lập lớp và các service liên quan bằng toàn bộ test suite.
- Production build thành công; không có lỗi TypeScript hoặc lỗi đóng gói chặn triển khai.
- Chạy thật một nhiệm vụ vòng lặp trên browser để kiểm tra đường phản hồi chưa đạt: chẩn đoán cấu trúc và hướng dẫn quan sát map xuất hiện đúng ngữ cảnh.
- Tạo checklist pilot 6–10 học sinh gồm kịch bản 45–60 phút, chỉ báo định lượng, câu hỏi phỏng vấn, tiêu chí đạt và quy tắc quyết định sau pilot.

Kết quả nghiệm thu:

- 53 test files đạt 53/53; 626 tests đạt 626/626.
- `npm run build`: đạt.
- Checklist pilot: `docs/grade-8-student-pilot-checklist.md`.

### 2026-08-13 — Tinh chỉnh sâu Area 5: vòng lặp có bằng chứng quan sát được

- Giảm tải nhận thức ở nhiệm vụ đầu: cung cấp sẵn khung `for`, học sinh chỉ cần tự viết hành động trong thân vòng lặp; từ nhiệm vụ sau mới tăng dần mức tự lập.
- Việt hóa thuật ngữ trên giao diện thành “lượt lặp”; vẫn đặt “iteration” trong ngoặc ở lần giới thiệu đầu để kết nối với tài liệu lập trình.
- Siết cơ chế Boss theo đúng câu chuyện: `attackBug()` chỉ có hiệu lực khi Byte đứng ở ô kề Boss; đánh từ xa tạo sự kiện bị chặn và không làm giảm giáp.
- Bổ sung `bugHits` vào trạng thái thế giới để phân biệt “đã phá hết giáp” với “đánh đúng chính xác năm đòn”. Vì vậy lời giải sáu đòn không còn được chấp nhận dù HP cuối vẫn bằng 0.
- Hiển thị trực tiếp “Đòn 0/5” cạnh thanh giáp Boss và cập nhật theo từng sự kiện, giúp học sinh thấy một lượt lặp tương ứng với một hành động trong game.
- Đồng bộ mô tả nhiệm vụ, cue học tập, sổ tay và bảng nhắc lệnh: phải đứng cạnh Boss, mỗi lượt lặp tạo đúng một đòn.
- Thêm test hồi quy cho đánh từ xa, đánh thừa, scaffold nhiệm vụ đầu và bộ đếm đòn trên map.

Kết quả nghiệm thu:

- `npm run typecheck`: đạt.
- 261 kiểm thử trọng tâm về nội dung, engine, world map, command coach, sổ tay và TileMap: đạt 261/261.
- Browser QA nhiệm vụ 1, Debug Lab và Boss: đúng thứ tự 1/5 → 4/5 → 5/5; starter, lỗi `i <= 6`, cue đứng cạnh Boss, thanh giáp và bộ đếm đòn đều hiển thị đúng.

### 2026-08-13 — Tinh chỉnh sâu Area 6: hàm và phân rã có luồng thực thi nhìn thấy được

- Giảm tải nhận thức ở nhiệm vụ đầu: cung cấp sẵn khung vòng lặp sáu lượt; học sinh chỉ hoàn thiện hai hành động trong thân `activateLine()` và tự gọi hàm từ `main`.
- Sửa mô hình sự kiện của interpreter: hàm `void` giờ cũng phát sự kiện hoàn tất, nên học sinh quan sát được đầy đủ luồng `main → gọi hàm → chạy thân hàm → trở về main`.
- Thêm nhãn nhỏ trực tiếp trên map Khu vực 6: hiển thị mô-đun đang chạy, đối số nhận được, giá trị trả về hoặc trạng thái đã hoàn tất; không thêm panel riêng làm rối layout.
- Đồng bộ cue, nhiệm vụ và phản hồi: định nghĩa chỉ “lắp mô-đun”, lời gọi mới làm mô-đun hoạt động; tham số mang dữ liệu vào và `return` mang kết quả về.
- Siết Boss Xưởng Hàm: Byte phải đứng cạnh Boss và `breakArmor(6)` phải tạo chính xác sáu đòn. Đánh bảy đòn không còn được tính đạt dù HP cuối bằng 0.
- Bổ sung test hồi quy cho sự kiện trở về của hàm `void`, thứ tự gọi–thắp sáu đèn–trở về, nhãn mô-đun trên map và trường hợp Boss bị đánh thừa.

### 2026-08-13 — Tái thiết Trạm 0 theo vòng lặp học–chơi

Phân tích sản phẩm tham chiếu tập trung vào nguyên tắc có thể áp dụng, không sao chép giao diện, cốt truyện hay tài sản của CodeCombat:

- học sinh gõ code thật và thấy thế giới phản hồi trực tiếp;
- mỗi màn có mục tiêu ngắn, kiểm chứng được và tăng một biến khó;
- gợi ý theo ngữ cảnh, mở dần, không đưa toàn bộ lời giải ngay từ đầu;
- hoàn thành xong đi thẳng sang nhiệm vụ kế tiếp, hạn chế quay về dashboard;
- starter code giúp giảm tải ở màn đầu, sau đó rút dần giàn giáo để học sinh tự viết;
- lỗi, Output và trạng thái map là ba nguồn bằng chứng để debug.

Các thay đổi đã thực hiện:

- Sửa lỗi container làm map Trạm 0 co còn khoảng 3 px; bổ sung hợp đồng kích thước chung `h-full/min-h-0/w-full` cho mọi sân khấu.
- Dựng lại Trạm 0 thành map pixel-art 14×7 có nhân vật, bàn phát, đường năng lượng, đuốc, cổng và đạo cụ; map tự co giãn theo khung thật.
- Mỗi `cout` phát một tín hiệu theo thứ tự. Chỉ tín hiệu khớp nội dung mới thắp trạm; tín hiệu sai hiện trực tiếp trên map, phát âm báo lỗi và không mở cổng.
- Viết lại bốn nhiệm vụ thành một truyện liên tục: khôi phục tín hiệu → xác minh mật khẩu → sửa đường truyền → tự viết chương trình mở cổng.
- Luôn hiển thị đầy đủ truyện và câu hỏi dự đoán; không còn trường hợp nội dung bị cắt mà thiếu nút mở rộng.
- Chuẩn hóa checkpoint Trạm 0 thành chín câu, có đọc code, nhiều đáp án, sắp thứ tự, ghép cấu trúc, debug, điền code, tình huống và tự đánh giá.
- Thêm kiểm thử hồi quy cho kích thước map, phản hồi tín hiệu đúng/sai, cổng, dữ liệu đích và cấu trúc checkpoint.
- Chuyển nhắc lệnh từ một card riêng thành tooltip neo trực tiếp tại con trỏ trong editor. Tooltip chỉ xuất hiện sau khi học sinh tự gõ hai ký tự, chỉ chứa lệnh liên quan đến nhiệm vụ, không tự hoàn thành hoặc chèn code và có thể đóng bằng `Esc`.
- Tinh giản stage: bỏ nhãn Bước 1/Bước 2, tiêu đề Quan sát bản đồ, các hộp Học trong game và Dự đoán trước khi chạy. Kiến thức mở bằng modal tại chỗ; phản hồi chưa đạt đặt sát editor, chi tiết kiểm tra/Output thu gọn và thanh Run không còn đè lên phản hồi khi cuộn.
