# CodeQuest C++ 8

Website học C++ dạng pixel-art coding adventure dành cho học sinh lớp 8. Phiên bản hiện tại là vertical slice hoàn chỉnh gồm **Area 0–2, 14 màn chơi và 3 checkpoint**.

## Trải nghiệm học sinh

Mỗi Area dùng cùng một vòng học để giảm tải nhận thức:

`Học một ý → dự đoán → nhận nhiệm vụ → quan sát map → tự gõ C++ → Run/Step → đọc bằng chứng → debug → checkpoint`

- **Area 0 — Trạm Khởi Động:** `main`, `cout`, statement, dấu `;`, comment.
- **Area 1 — Đồng Cỏ Thuật Toán:** function call, sequence và Game API di chuyển tuyệt đối.
- **Area 2 — Kho Dữ Liệu Pha Lê:** variable, `int`/`double`/`bool`/`string`, assignment và cập nhật số ngọc.

Stage thống nhất theo đúng thứ tự **nhiệm vụ → map lớn → code**. Nút Run, tốc độ Thường/Nhanh/Từng bước, Stop/Resume và Reset map nằm cạnh bản đồ. Command coach chỉ hiện cú pháp liên quan sau khi học sinh tự gõ ít nhất hai ký tự; không có click-to-insert.

## Kỹ thuật chính

- React 19, TypeScript, Vite 7, Tailwind CSS 4, Zustand, CodeMirror 6.
- Supabase Auth/Postgres/RLS cho tài khoản, lớp học, tiến trình, Gem và trang bị.
- Lexer → parser → interpreter cho tập con C++, chạy trong Web Worker, không dùng `eval`.
- World state tách khỏi renderer; code sinh event để map phát lại và debug từng bước.
- Feedback tiếng Việt, gợi ý tăng dần ba cấp, không trừ điểm khi sai hay dùng gợi ý.
- Pixel art và âm thanh có giấy phép mở; xem [ASSET_LICENSES.md](ASSET_LICENSES.md).

## Chạy tại máy

```bash
npm install
copy .env.example .env
npm run dev
```

Mở `http://localhost:5173/#/demo`. Không có Supabase, Demo vẫn chạy engine thật nhưng không lưu dữ liệu.

Kiểm tra trước khi phát hành:

```bash
npm run typecheck
npm test -- --run
npm run build
```

## Nội dung và kiến trúc

- Curriculum data-driven: [src/lessons/coreCurriculum.ts](src/lessons/coreCurriculum.ts)
- Kho concept/micro-practice: [src/data/curriculum.ts](src/data/curriculum.ts)
- Stage học sinh: [src/pages/app/ChallengePage.tsx](src/pages/app/ChallengePage.tsx)
- C++ interpreter: [src/validators/interpreter.ts](src/validators/interpreter.ts)
- Báo cáo đáp ứng master prompt: [docs/master-prompt-audit.md](docs/master-prompt-audit.md)
- Roadmap sau Area 2: [docs/gameplay-roadmap.md](docs/gameplay-roadmap.md)

Mỗi challenge là dữ liệu thuần gồm story, instructions, starter code, AST patterns, test cases, lỗi thường gặp, ba hint, world spec và solution. Khi thêm màn, phải chạy `src/lessons/content.test.ts`; test này thực thi mọi solution qua chính engine của sản phẩm.

## Supabase

Chạy migration theo thứ tự trong `supabase/migrations/`, hiện tới:

1. `0001_init_schema.sql`
2. `0002_rls_policies.sql`
3. `0003_classes_and_xp_integrity.sql`
4. `0004_messages.sql`
5. `0005_lsts_student_identity.sql`
6. `0006_single_player_economy.sql`
7. `0007_area_0_2_badges.sql`
8. `supabase/seed.sql`

Hồ sơ học sinh dùng mã đúng 7 chữ số; email trường được tạo theo mẫu `<mã-học-sinh>@lsts.edu.vn`. Không đưa secret/service-role key vào bundle hoặc Git.

## Giới hạn có chủ đích

- Đây là tập con C++ phục vụ curriculum, không phải compiler C++ đầy đủ.
- Chưa triển khai multiplayer; boss hiện là chơi đơn.
- Không có leaderboard công khai, loot box hay trả tiền thật.
- Area 3+ chỉ ở roadmap; giao diện không giả vờ rằng học sinh đã có thể học các màn chưa được soạn và kiểm định.

CodeQuest học pattern tương tác của coding adventure nhưng không sao chép level, art, nhạc hay nội dung độc quyền của CodeCombat/Swift Playgrounds.
