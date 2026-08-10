# CodeQuest C++ 8 — Báo cáo audit và vertical-slice refinement

Ngày thực hiện: **2026-08-10**  
Phạm vi: trải nghiệm học sinh, kiến trúc học tập và vertical slice đang vận hành; không triển khai multiplayer.

## A. Project Audit

Project là web app React 19 + TypeScript + Vite, dùng CodeMirror 6, Zustand và Supabase. Luồng học sinh hiện có Home → World Map → khu vực → hướng dẫn → nhiệm vụ → checkpoint. Nội dung gồm 5 khu vực, 45 challenge data-driven; các stage grid/path, signal tower và workshop dùng chung engine.

Điểm mạnh giữ lại:

- trình thông dịch tập con C++ chạy trong Web Worker, theo pipeline lexer → parser → semantics → interpreter, không dùng `eval`;
- world state tách khỏi renderer và phát lại bằng danh sách event nên hỗ trợ Run thường, nhanh và từng bước;
- map/editor, reset, autosave localStorage + Supabase, hàng đợi offline, gợi ý ba cấp và feedback tiếng Việt đã hoàn chỉnh;
- RLS, vai trò học sinh/giáo viên, tiến trình, XP/Gem, âm thanh, avatar và chứng chỉ đã có kiểm thử.

Khoảng trống được xử lý trong đợt này:

- chưa có kho khái niệm trung tâm và chưa phân biệt trực quan **C++ language** với **Game API**;
- trang học kiến thức chủ yếu để đọc, thiếu dự đoán và micro-practice có feedback;
- Exit Ticket chỉ có ba câu radio, chưa đủ độ phủ đọc code/debug/vận dụng;
- hoàn thành challenge cuối từng làm hoàn tất luôn cả khu vực, nên checkpoint chưa thật sự là cổng học tập;
- thông tin giấy phép asset nằm rải rác; README chưa hướng dẫn cách thêm dạng quiz mới.

## B. CodeCombat Research

Các pattern đáng học hỏi đã được đối chiếu với nguồn chính thức:

- CodeCombat cho học sinh viết code có cú pháp thật, chạy nhiều lần và quan sát code theo từng dòng. Quick Start Guide cũng hướng dẫn dùng API reference, hint và reload khi cần: https://files.codecombat.com/docs/resources/StudentQuickStartGuide.pdf
- Engineering Cycle của CodeCombat tổ chức giải quyết vấn đề theo decompose → plan → implement → test/debug: https://files.codecombat.com/docs/resources/WorksheetExample.pdf
- Repository ứng dụng là open source, nhưng nội dung level của dịch vụ trực tuyến không mặc nhiên là tài nguyên để sao chép. CodeQuest chỉ học pattern tương tác, không sao chép level, art hay nội dung: https://github.com/codecombat/codecombat
- Báo cáo accessibility mô tả navigation tuần tự và độ khó tăng dần — phù hợp với node progression hiện có: https://codecombat.com/acr/acr.html

Điểm CodeQuest giữ bản sắc riêng: C++ cho học sinh lớp 8 Việt Nam, feedback theo lỗi thường gặp, pixel-art ByteLand, không leaderboard công khai và không phạt khi debug.

## C. Curriculum Architecture

Tiến trình mục tiêu dài hạn:

| Area | Trọng tâm | Gameplay hóa |
|---|---|---|
| 0 — C++ Khởi động | program, `main`, `cout`, statement, `;`, comment | đánh thức Byte bằng output; nhìn cấu trúc chương trình |
| 1 — Robot Awakes | function call, sequence, Game API | đi/quay, vật cản, nhiều đường |
| 2 — Gem Valley | variable, `int`, assignment, counting | gem/key/energy làm dữ liệu thay đổi hữu hình |
| 3 — Operator Forge | arithmetic, comparison, logical expression | tính năng lượng và mở khóa máy |
| 4 — Decision Gate | `if`, `if-else` | cảm biến, cổng và bẫy |
| 5 — Loop Valley | `for`, counter, off-by-one | đường dài và chuỗi hành động lặp |
| 6 — Function Workshop | function, parameter, decomposition | chế tạo và tái sử dụng phép điều khiển |
| 7 — Integrated Castle | phối hợp concept | boss chơi đơn, nhiều phase |
| 8 — Final Project | thiết kế–cài đặt–debug–giải thích | nhiệm vụ mở có rubric |

Project cũ đã có dữ liệu học sinh theo ID `l1`…`l5`. Đợt này không đổi ID hoặc xóa 45 challenge để tránh làm mất tương thích tiến trình/chứng chỉ. Vertical slice được nâng theo hướng tương thích: phần khởi động C++ và sequence nằm trong `l1`, function hiện tại ở `l2`; kho concept mới là đường nối để lần refactor nội dung kế tiếp có thể tách Area 0–2 đúng bảng trên mà không sửa engine.

## D. Learning Flow

Luồng đã được hoàn thiện thành:

1. **Learn:** thẻ một ý mới, cú pháp, ví dụ và lỗi thường gặp.
2. **Predict:** câu nhắc bắt buộc học sinh đọc code từ trên xuống trước khi Run.
3. **Practice:** chọn đáp án, sắp xếp code hoặc tự gõ phần code thiếu; feedback giải thích “vì sao”.
4. **Game:** nhiệm vụ → map lớn → editor, code là core mechanic.
5. **Observe/Debug:** highlight dòng, trace event, tốc độ thường/nhanh/từng bước, reset không xóa code.
6. **Checkpoint:** 8–12 câu đa dạng, đạt từ 70%; không đạt được ôn và thử lại, không trừ điểm.

Trong một tiết 80 phút, giáo viên có thể dành khoảng 10 phút khởi động/giới thiệu, 45–50 phút Learn + Practice + Game, 10 phút checkpoint và phần còn lại để phản hồi/chuyển hoạt động. Học sinh gõ code; command reference chỉ nhắc cú pháp cần thiết, không bấm để chèn đáp án.

## E. Game Architecture

Challenge và lesson là data thuần. Component không hard-code nội dung theo level. Trạng thái logic (tọa độ, hướng, inventory, biến, output, event) nằm ở runner/world; stage chỉ render và replay. Do đó cùng một engine có thể chạy nhiều map, resize map mà không đổi luật và dùng step debugger mà không chạy lại parser mỗi frame.

## F. C++ Execution

Website không tuyên bố là compiler C++ đầy đủ. Tập con đang hỗ trợ gồm cấu trúc chương trình, khai báo/gán biến cơ bản, `cout`, hàm/parameter, `for`, `if`/`else`, biểu thức và Game API có cú pháp gọi hàm C++ hợp lệ. Worker có ngân sách chỉ thị và timeout để chặn vòng lặp vô hạn; code học sinh không có quyền DOM/network.

## G. Mechanics

- Sequence → đường đi và hướng quay.
- Variables → tinh thể hiển thị tên/giá trị và animation khi gán lại.
- Conditions → cửa/cảm biến đổi trạng thái theo biểu thức.
- Loops → các bước lặp phát lại theo iteration.
- Functions → máy móc/chuỗi hành động theo lời gọi.
- Debug → lỗi có dòng, mã lỗi, lời giải thích và hint phù hợp; không dùng ngôn ngữ trừng phạt.

## H. Pixel Art

Renderer dùng sprite sheet Kenney 16×16, `image-rendering: pixelated`, tile index ổn định và asset nhân vật/vật phẩm đồng bộ. Animation và particle có đường giảm chuyển động. Không thêm texture lớn hoặc hiệu ứng che code/map; game vẫn chạy tốt ở laptop 1366×768 và co về tab ở viewport hẹp.

## I. Licensing

Tất cả asset ngoài đang dùng là CC0. Danh mục tập trung: [`ASSET_LICENSES.md`](../ASSET_LICENSES.md). Nguồn chính thức đã kiểm tra: Tiny Town https://kenney.nl/assets/tiny-town, Interface Sounds https://kenney.nl/assets/interface-sounds, RPG Audio https://kenney.nl/assets/rpg-audio và Arcanum https://opengameart.org/content/arcanum.

## J. Quiz Engine

`ExitTicketQuestion` hỗ trợ single choice, multiple answer, ordering, matching, code prediction, debugging, fill-code, scenario và self-assessment. Chấm điểm nằm trong utility thuần; UI là renderer data-driven; câu tự đánh giá không tính điểm. L1 và L2 có 10 câu, ít nhất 5 dạng có chấm điểm, kèm explanation/misconception.

## K. Level Progression

Node checkpoint chỉ mở sau khi toàn bộ challenge bắt buộc hoàn thành. Vượt challenge cuối không còn tự đánh dấu lesson hoàn tất; lesson chỉ hoàn tất khi checkpoint đạt ≥70%. Trang checkpoint cũng kiểm tra gate khi học sinh nhập URL trực tiếp. Giáo viên vẫn có quyền xem để hỗ trợ.

## L. Files Changed

- `src/data/curriculum.ts`: concept database + lesson learning paths.
- `src/components/learning/LearnPracticeFlow.tsx`: Learn/Predict/Micro-practice.
- `src/components/learning/CheckpointQuestionCard.tsx`: quiz renderer tổng quát.
- `src/utils/checkpoint.ts`: answer validation, scoring và checkpoint gate.
- `src/pages/app/LessonGuidePage.tsx`, `LessonPage.tsx`, `ExitTicketPage.tsx`: gắn flow và progression.
- `src/lessons/lesson-1/index.ts`, `lesson-2/index.ts`: checkpoint 10 câu.
- progress/certificate/Supabase types và repository: đồng bộ quy tắc hoàn thành mới.
- test nội dung, learning flow và scoring; root asset license; README và báo cáo này.

## M. Testing

Các tầng bắt buộc:

- unit: scoring mọi dạng answer, gate, micro-practice;
- content validation: schema, 3 hint, starter/solution, clean code, 8–12 checkpoint questions;
- integration: lesson guide, checkpoint và progression;
- full regression: toàn bộ Vitest + TypeScript build;
- browser QA: Home → Map → Learn → mission → Run/step/reset → checkpoint, viewport desktop/tablet/mobile, console và request lỗi.

Kết quả regression cuối:

- `npm test -- --reporter=dot`: **889/889 test**, 45/45 test files;
- `npm run typecheck`: thành công;
- `npm run build`: thành công, 2.140 module được transform;
- `git diff --check`: không có lỗi whitespace;
- browser QA bằng tài khoản học sinh: Learn/micro-practice, prediction gate, Run trên map, trace kết thúc, ba chế độ chạy và checkpoint route gate đều đúng;
- responsive: không tràn ngang tại 1366×768 và 390×844;
- console browser: không có warning/error trong flow được kiểm tra.

## N. Remaining Work

Các việc không nên làm vội trong cùng migration vì có thể phá dữ liệu học sinh:

1. tách `l1` thành Area 0 và Area 1 với migration ánh xạ progress;
2. chuyển Functions từ vị trí cũ sang Area 6 và xây Gem Valley/Operator Forge trước Conditions;
3. mở rộng checkpoint 10 câu cho Area 3–5 cũ sau khi thứ tự curriculum mới được chốt;
4. multiplayer boss để giai đoạn sau, sau khi gameplay chơi đơn và cơ chế chống phụ thuộc đồng đội được đánh giá trong lớp thật.

Đề nghị thử nghiệm với một nhóm 6–10 học sinh lớp 8, quan sát thời gian đọc, số lần dùng hint và điểm dừng do quá tải; sau đó mới migration curriculum ID trên dữ liệu thật.
