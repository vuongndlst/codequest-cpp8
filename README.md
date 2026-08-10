# CodeQuest C++ 8 — Hành trình giải cứu ByteLand

Website học lập trình C++ tương tác dành cho học sinh lớp 8, theo phong cách game phiêu lưu.

> **Trạng thái:** Hoàn thành cả 6 giai đoạn. Đủ nội dung 5 khu vực
> (45 nhiệm vụ + 5 Exit Ticket + 5 bài hướng dẫn tư duy + phần mở đầu về thuật toán),
> huy hiệu tự động, chứng chỉ PDF, dashboard giáo viên, hàng đợi offline.
> **866 test** · sẵn sàng deploy lên GitHub Pages.
> Kiến trúc đầy đủ: [docs/phase-1-architecture.md](docs/phase-1-architecture.md)

---

## 1. Giới thiệu

ByteLand là một thế giới số đang bị các Bug phá hoại. Học sinh vào vai **Code Guardian**, đi qua 5 khu vực và phục hồi từng vùng đất bằng chính những dòng code C++ mình viết ra.

Điểm khác biệt của dự án:

- **Báo lỗi bằng tiếng Việt cụ thể**, không phải "Syntax error". Ví dụ: *"Có vẻ em đang thiếu dấu `;` ở cuối dòng 4."*
- **Gợi ý tăng dần 3 cấp** — câu hỏi định hướng → nhắc cấu trúc → khung code. Không đưa đáp án ngay.
- **Sai không bị phạt.** Không có chữ "Thất bại", code của học sinh luôn được giữ nguyên, thử lại không giới hạn.
- **Chạy code an toàn** bằng trình thông dịch tự viết cho tập con C++ — không dùng `eval`, không gọi API biên dịch bên ngoài.

Khoá học: **CodeQuest C++ 8** · Giáo viên phụ trách: **Nguyễn Đình Vương**

---

## 2. Tính năng

### Đã có (Giai đoạn 6)

- Trang giới thiệu sản phẩm, bản đồ xem trước và luồng bắt đầu được thiết kế lại để cho thấy ngay
  vòng lặp cốt lõi: hiểu nhiệm vụ → viết C++ → xem thế giới phản hồi → sửa Bug và mở khoá
- Màn làm nhiệm vụ đi theo một trục rõ ràng **nhiệm vụ → bản đồ → code**; nút chạy nằm ngay trên bản đồ,
  bảng lệnh chỉ hiện cú pháp cần cho bài hiện tại và gợi ý được thu gọn thành popover
- Nhiệm vụ đầu tiên dùng game workspace một viewport: map và editor luôn nằm cạnh nhau; học sinh phải
  **dự đoán → chạy mẫu → xóa một lệnh → quan sát → khôi phục → hoàn thành**. Khung C++ được làm mờ,
  dòng đang chạy sáng đồng bộ với từng bước chân của Byte
- Sân khấu có ba chế độ phát **Thường / Nhanh / Từng bước**, cho phép dừng đúng trước bước sai
  để đối chiếu vị trí nhân vật với code; bản đồ tự co theo cả chiều rộng lẫn chiều cao khung nhìn
- Nút Run, lựa chọn tốc độ và hoạt động thử lệnh có âm thanh phản hồi; tiếng bước chân phát đúng
  theo từng sự kiện di chuyển, đồng bộ với tốc độ hoạt ảnh trên bản đồ
- **Hàng đợi offline**: hoàn thành nhiệm vụ khi mất mạng vẫn không mất tiến trình —
  thao tác được cất trong localStorage và tự ghi lại khi có mạng
- Thông báo chuyển trang cho trình đọc màn hình, đưa tiêu điểm bàn phím về đầu nội dung
- Trang xử lý lỗi định tuyến, phân biệt riêng trường hợp mất mạng giữa chừng
- Kiểm thử RLS chạy thật trên database, tự dọn sau khi chạy
- Đã kiểm tra không tràn ngang ở 1366×768 (phòng ICT), tablet và điện thoại

### Đã có (Giai đoạn 5)

- **Chứng chỉ**: xét đủ 5 điều kiện, mã `CPP8-[LESSON]-[USER6]-[TIMESTAMP]`, chống cấp trùng
  bằng ba lớp (kiểm tra trước · ràng buộc UNIQUE · bắt lỗi 23505 rồi đọc lại)
- **Xuất PDF phía trình duyệt** — khổ A4 ngang, giữ nguyên tiếng Việt có dấu
- Bộ sưu tập 5 chứng chỉ, ô nào chưa mở thì hiện rõ còn thiếu điều kiện nào
- **Dashboard giáo viên**: danh sách học sinh, lọc theo lớp, tiến trình từng khu vực,
  thống kê lỗi phổ biến, chi tiết từng học sinh, đặt lại một nhiệm vụ
- **Cài đặt lớp**: mở thêm khu vực, bật/tắt quyền xem đáp án mẫu
- **Xuất CSV** có BOM để Excel đọc đúng tiếng Việt

### Đã có (Giai đoạn 4)

- **Phần mở đầu "Thuật toán là gì?"** — đặt trước Khu vực 1, không có một dòng C++ nào:
  định nghĩa bằng lời thường, ví dụ đời thường, 5 tính chất của thuật toán (kèm ví dụ đạt/chưa đạt),
  vì sao máy tính khắt khe hơn người, 3 khối xây dựng (tuần tự · lặp · rẽ nhánh) ánh xạ vào bản đồ,
  và **2 hoạt động tương tác**: sắp xếp các bước, tìm bước robot không hiểu nổi
- **Tầng dạy tư duy** — mỗi khu vực có một bài hướng dẫn giải thích *vì sao* cần lệnh mới:
  nêu vấn đề trước → lệnh mới gỡ ở đâu → mô hình hình dung → quy trình tư duy khi gặp bài mới
  → nên/chưa cần dùng khi nào → các hiểu lầm phổ biến kèm đính chính
- Bảng nhắc **"Trước khi gõ code, em tự trả lời đã nhé"** ngay trong màn hình nhiệm vụ
- Mỗi Boss có câu hỏi tư duy riêng và nói rõ nhiệm vụ đó rèn kỹ năng gì
- Phần kiến thức **mở công khai**, không cần đăng nhập
- Hệ thống huy hiệu tự động cấp (10 huy hiệu, chống cấp trùng ở tầng database)
- Thanh máu Boss, thông báo nhận huy hiệu, hiệu ứng hoàn thành

### Đã có (Giai đoạn 3)

- **Engine chạy code C++**: lexer → parser → interpreter chạy trong Web Worker, không dùng `eval`
- **16 mã lỗi tiếng Việt** phủ trọn 13 lỗi thường gặp trong đề bài
- Code editor CodeMirror 6: tô màu cú pháp, số dòng, tự thụt lề, highlight dòng lỗi, phóng to
- Hệ thống gợi ý 3 cấp + đáp án mẫu có điều kiện
- Clean Code Coach chấm 9 tiêu chí
- Auto-save hai tầng (localStorage + Supabase), có trạng thái và đồng bộ lại khi có mạng
- Sổ tay lệnh 12 thẻ, tìm kiếm không dấu, mở được dạng modal ngay trong bài
- Sân khấu game 2D phát lại chuỗi sự kiện thành animation
- Exit Ticket + trang khu vực + mở khoá node tuần tự
- Chế độ Demo dùng chung engine thật, không ghi database
- **Đủ 5 khu vực: 45 nhiệm vụ + 5 Exit Ticket**, có kiểm định nội dung tự động (450 test)

### Đã có (Giai đoạn 2)

- Đăng ký / đăng nhập / đăng xuất / quên mật khẩu / khôi phục phiên bằng Supabase Auth
- Hồ sơ học sinh LSTS: mã 7 chữ số, email tự sinh `mã-học-sinh@lsts.edu.vn`, 8 nhân vật pixel đồng nhất với bản đồ
- Nhạc nền tùy chọn, portal năng lượng, callout nhắc nhiệm vụ và màn thưởng XP · Gem · pháo hoa
- Kinh tế chơi đơn: Gem thưởng một lần, kho trang bị, mua/nâng cấp an toàn qua RPC; Demo Sandbox mở toàn bộ để kiểm thử
- Hai vai trò `student` / `teacher`, học sinh **không thể** tự chọn vai trò giáo viên
- Dashboard học sinh: lời chào, cấp độ, XP, thanh tiến trình, sao, huy hiệu, chứng chỉ
- Bản đồ 5 khu vực với trạng thái khoá / đang học / đã hoàn thành
- Bộ sưu tập huy hiệu (10 huy hiệu)
- Migration SQL đầy đủ + Row Level Security cho toàn bộ 11 bảng
- Chế độ Demo: xem giới thiệu, bản đồ, sổ tay khi chưa đăng nhập
- Trạng thái giao diện: loading, empty, error, offline, chưa đăng nhập, không có quyền
- Chế độ giảm chuyển động, điều hướng bằng bàn phím, focus state rõ ràng
- GitHub Actions build + deploy tự động lên GitHub Pages

### Theo kế hoạch

| Giai đoạn | Nội dung |
|---|---|
| 3 | Lesson engine, challenge engine, code editor, hệ thống gợi ý, validator C++, auto-save |
| 4 | Bản đồ nâng cao, XP/level đầy đủ, huy hiệu tự động, animation, Boss challenge |
| 5 | Certificate engine + PDF, dashboard giáo viên, xuất CSV |
| 6 | Kiểm thử đầy đủ, accessibility, responsive, offline fallback, hoàn thiện README |

---

## 3. Công nghệ

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Framework | React 19 + TypeScript + Vite 7 | Build ra file tĩnh, deploy được lên GitHub Pages |
| Định tuyến | React Router 7 (**HashRouter**) | Hosting tĩnh không xử lý được đường dẫn sâu; HashRouter tránh lỗi 404 khi bấm F5 |
| Giao diện | Tailwind CSS 4 | Cấu hình theme ngay trong CSS, bundle nhỏ |
| Trạng thái | Zustand 5 | Nhẹ, không cần boilerplate |
| Backend | Supabase (Auth + Postgres + RLS) | Không cần tự dựng server |
| Icon | lucide-react (ISC) | Nhẹ, tree-shaking tốt |
| Kiểm thử | Vitest + React Testing Library | Chạy nhanh, dùng chung cấu hình với Vite |

**Chưa cài ở giai đoạn này** (sẽ thêm đúng lúc cần): CodeMirror 6 (Giai đoạn 3), html2canvas + jsPDF (Giai đoạn 5).

---

## 4. Cấu trúc thư mục

```text
src/
├── app/                    # App, router
├── components/
│   ├── auth/               # Guards (AuthGuard, GuestGuard, TeacherGuard)
│   ├── common/             # ErrorBoundary, các trạng thái giao diện dùng chung
│   ├── game/               # AvatarIcon, ByteMascot, ZoneCard, StarRating
│   ├── layout/             # AppShell, PublicShell, TopBar
│   └── ui/                 # Button, Input, Card, Alert, ProgressBar
├── data/                   # avatars, lessons.meta (dữ liệu tĩnh)
├── hooks/                  # useDashboardData
├── lib/                    # env
├── pages/                  # Các trang theo route
│   ├── auth/
│   └── app/
├── services/supabase/      # client, auth.service, các repository
├── stores/                 # authStore, uiStore (Zustand)
├── styles/                 # global.css (theme ByteLand)
├── test/                   # setup cho Vitest
├── types/                  # database.ts, content.ts
└── utils/                  # xp, progression, format, icons, cn

supabase/
├── migrations/
│   ├── 0001_init_schema.sql
│   └── 0002_rls_policies.sql
└── seed.sql

docs/
└── phase-1-architecture.md
```

**Nguyên tắc phân tách:** `types/`, `data/`, `utils/` không được import React hay Supabase. Nhờ vậy toàn bộ logic tính XP, mở khoá và (sau này) kiểm tra code đều test được bằng Vitest thuần.

> Ghi chú về `supabase/policies.sql`: bản thiết kế ban đầu dự tính một file riêng cho RLS. Thực tế toàn bộ policy được đặt trong `migrations/0002_rls_policies.sql` để một project mới chỉ cần chạy các migration theo thứ tự. Giữ thêm một bản sao sẽ tạo nguy cơ hai file lệch nhau.

---

## 5. Chạy dự án ở máy cá nhân

```bash
npm install
```

Tạo file `.env` từ mẫu:

```bash
copy .env.example .env
```

Điền hai biến trong `.env` (lấy ở bước 6), rồi chạy:

```bash
npm run dev
```

Mở http://localhost:5173

Các lệnh khác:

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

> Chưa có `.env` thì website vẫn chạy được ở **chế độ Demo** — xem được giới thiệu và bản đồ, chỉ không đăng nhập được.

---

## 6. Tạo Supabase project

1. Vào https://supabase.com → **New project**
2. Đặt tên (vd. `codequest-cpp8`), chọn region **Southeast Asia (Singapore)** cho độ trễ thấp nhất ở Việt Nam
3. Đặt mật khẩu database và **lưu lại chỗ an toàn**
4. Đợi khoảng 2 phút cho project khởi tạo xong
5. Vào **Project Settings → Data API**, sao chép **Project URL**
6. Vào **Project Settings → API Keys**, sao chép **Publishable key** (project cũ hơn ghi là *anon public key*)

### ⚠ Tắt xác nhận email (quan trọng với lớp học)

**Authentication → Sign In / Providers → Email** → tắt **Confirm email** → **Save**.

Nếu để bật, học sinh đăng ký trong tiết sẽ phải mở Gmail chờ email xác nhận — dễ mất 10 phút của 45 phút. Chức năng "Quên mật khẩu" vẫn hoạt động bình thường khi tắt tuỳ chọn này, vì học sinh dùng email thật.

Nên bật thêm: **Authentication → Policies** → *Prevent use of leaked passwords*.

### Cấu hình Redirect URL

**Authentication → URL Configuration**, thêm vào **Redirect URLs**:

```
http://localhost:5173/**
https://<tên-tài-khoản-github>.github.io/<tên-repo>/**
```

Thiếu bước này thì đường dẫn đặt lại mật khẩu trong email sẽ không hoạt động.

---

## 7. Chạy migration

### Cài đặt mới

File [supabase/setup/chay-tat-ca.sql](supabase/setup/chay-tat-ca.sql) chỉ còn là bản baseline cũ. Với project mới, chạy các file migration theo đúng thứ tự bên dưới để có đủ lớp học, hỏi đáp, danh tính LSTS, Gem và trang bị.

### Hoặc chạy từng file

1. `supabase/migrations/0001_init_schema.sql` — tạo bảng, hàm, trigger, index
2. `supabase/migrations/0002_rls_policies.sql` — bật RLS và tạo policy
3. `supabase/migrations/0003_classes_and_xp_integrity.sql` — lớp học và toàn vẹn XP
4. `supabase/migrations/0004_messages.sql` — hỏi đáp học sinh–giáo viên
5. `supabase/migrations/0005_lsts_student_identity.sql` — mã học sinh LSTS 7 chữ số
6. `supabase/migrations/0006_single_player_economy.sql` — Gem và trang bị chơi đơn
7. `supabase/seed.sql` — nạp huy hiệu và cài đặt lớp mẫu

> Sửa schema về sau thì sửa vào **file gốc trong `migrations/`**, rồi tạo lại file gộp. File gộp chỉ là bản tiện dụng cho lần cài đặt đầu tiên.

Kiểm tra lại: **Table Editor** phải thấy 11 bảng, mỗi bảng có nhãn **RLS enabled**.

Kiểm tra nhanh bằng SQL:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
```

Tất cả dòng đều phải có `rowsecurity = true`.

### Kiểm thử RLS (nên chạy một lần sau khi cài xong)

Mở **SQL Editor**, dán toàn bộ `supabase/tests/rls_checks.sql` rồi Run.

Script tự dựng dữ liệu thử, kiểm tra 10 nhóm quy tắc, rồi `rollback` — **không để lại dữ liệu rác**, nên chạy trên project thật cũng an toàn. Xem tab **Messages**, thấy dòng cuối là `TAT CA KIEM TRA RLS DEU DAT` nghĩa là mọi thứ đúng.

Script này kiểm tra những điều quan trọng nhất:

- Học sinh không đọc/sửa được hồ sơ và tiến trình của bạn khác
- Học sinh không tự nâng mình lên giáo viên, không tự bơm XP
- Lịch sử làm bài không sửa được (INSERT-only)
- Chứng chỉ đã cấp là bất biến và không cấp trùng
- Giáo viên **không** đọc được code nháp giữa chừng của học sinh
- Mọi bảng đều đã bật RLS

---

## 8. Cấu hình biến môi trường

`.env` ở máy cá nhân:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
```

Trên GitHub: **Settings → Secrets and variables → Actions → New repository secret**, tạo hai secret cùng tên trên.

> Khoá publishable là khoá **công khai** — nó vốn được nhúng vào file JavaScript mà ai cũng tải được. Đây là thiết kế bình thường của Supabase: bảo vệ dữ liệu thật sự nằm ở Row Level Security. **Tuyệt đối không** đưa `service_role key` vào bất kỳ chỗ nào trong repo.

---

## 9. Tạo tài khoản giáo viên

Website **không cho phép** chọn vai trò giáo viên khi đăng ký. Vai trò này phải đặt trực tiếp trong database:

1. Thầy đăng ký một tài khoản bình thường trên website bằng email của mình
2. Vào **SQL Editor**, chạy:

```sql
update public.profiles
set role = 'teacher'
where id = (select id from auth.users where email = 'email-cua-thay@gmail.com');
```

3. Đăng xuất và đăng nhập lại

Kiểm tra:

```sql
select p.full_name, p.role, u.email
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'teacher';
```

---

## 10. Deploy lên GitHub Pages

1. Đẩy mã nguồn lên nhánh `main`
2. Vào **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**
3. Thêm hai secret ở mục 8
4. Push một commit bất kỳ — workflow `.github/workflows/deploy.yml` sẽ tự chạy: typecheck → test → build → deploy

Base path được tự động suy ra, hỗ trợ cả hai kiểu repo:

| Kiểu repo | URL | base |
|---|---|---|
| `username.github.io` | `https://username.github.io/` | `/` |
| Project repo | `https://username.github.io/codequest-cpp8/` | `/codequest-cpp8/` |

Muốn ghi đè thủ công thì đặt biến `VITE_BASE_PATH`.

Sau khi deploy, nhớ thêm URL thật vào **Redirect URLs** của Supabase (mục 6).

---

## 11. Cách thêm bài học

Toàn bộ nội dung nằm trong mã nguồn, không nằm trong database — sửa bài không cần migration, và mọi thay đổi đều được Git ghi lại.

**Bước 1.** Thêm metadata vào [src/data/lessons.meta.ts](src/data/lessons.meta.ts): `id`, `order`, `zoneName`, `objectives`, `certificateCode`, `challengeCount`…

**Bước 2.** Tạo thư mục `src/lessons/lesson-N/` với hai file:

| File | Nội dung |
|---|---|
| `guide.ts` | Hướng dẫn tư duy — xem mục 12 bên dưới |
| `index.ts` | Danh sách challenge + Exit Ticket, export `lessonN` |

**Bước 3.** Khai báo trong [src/lessons/index.ts](src/lessons/index.ts):

```ts
export const LESSONS: Lesson[] = [lesson1, lesson2, lesson3, lesson4, lesson5, lesson6];
```

**Bước 4.** Chạy kiểm định nội dung:

```bash
npx vitest run src/lessons/content.test.ts
```

Test sẽ tự kiểm tra bài mới có đủ số node đúng loại, đủ 3 cấp gợi ý cho mỗi challenge, và **đáp án mẫu thật sự chạy qua được engine**. Đây là lưới an toàn quan trọng nhất khi soạn bài — nó bắt lỗi của người soạn trước khi học sinh gặp phải trên lớp.

### Viết phần hướng dẫn tư duy

Đây là phần *dạy tư duy*, khác hẳn phần dạy cú pháp. Thứ tự bảy bước trong `ConceptGuide` là có chủ đích, **không nên đảo**:

1. `bigQuestion` — câu hỏi lớn mà khu vực trả lời
2. `problem` — nêu vấn đề **trước**: code khổ sở khi *chưa* có lệnh mới
3. `solution` — lệnh mới gỡ đúng chỗ khổ đó ra sao
4. `mentalModel` — cách hình dung để nhớ lâu
5. `thinkingSteps` — quy trình nghĩ khi gặp bài mới, mỗi câu kèm *vì sao phải hỏi*
6. `whenToUse` / `whenNotToUse`
7. `misconceptions` — hiểu lầm phổ biến kèm đính chính

> Học sinh phải **cảm thấy** cái khổ ở bước 2 thì bước 3 mới có ý nghĩa. Đưa cú pháp ra trước thì các em học vẹt và quên sau một tuần.

---

## 12. Cách thêm challenge

Mỗi challenge là một object `Challenge` — dữ liệu thuần, không hard-code vào component. Kiểu dữ liệu ở [src/types/content.ts](src/types/content.ts).

### Bắt buộc phải có

| Trường | Yêu cầu |
|---|---|
| `hints` | Đúng 3 cấp: `question` → `structure` → `skeleton`. Cấp 1 **không được** chứa khối code |
| `testCases` | Ít nhất một test `required: true` |
| `story` | 2–4 câu đặt học sinh vào tình huống |
| `starterCode` | **Không được** vượt sẵn challenge (test sẽ bắt lỗi này) |

### `requiredPatterns` — DSL trên AST, không phải regex

Regex trên code là nguồn gốc của việc báo sai cho học sinh làm đúng: `/for/` khớp cả chữ "for" nằm trong `cout << "Thong tin for ban"`. DSL này khớp trên cây cú pháp:

| Mẫu | Ý nghĩa |
|---|---|
| `stmt:for` | Có vòng lặp `for` |
| `stmt:if-else` | Có `if` kèm `else` |
| `stmt:for>call:moveForward` | Gọi `moveForward()` **bên trong** vòng lặp |
| `decl:func:openDoor` | Khai báo hàm tên `openDoor` |
| `decl:func:*:params>=1` | Có hàm nhận ít nhất 1 tham số |
| `call:moveForward:count=5` | Gọi đúng 5 lần |
| `op:==` | Dùng toán tử `==` |
| `output:contains:Xin chao` | Kết quả in ra có chứa chuỗi |

`forbiddenPatterns` dùng cùng cú pháp, để chặn cách làm tắt. Ví dụ ở bài dạy vòng lặp: `call:moveForward:count>=2` chặn việc gõ tay 5 lần thay vì dùng `for`.

> Thêm mẫu bị cấm thì **phải viết test cho nó**. Mẫu cấm viết sai sẽ hỏng âm thầm: hệ thống vẫn chạy, vẫn cho học sinh qua bài bằng cách làm tắt, không có dấu hiệu nào báo lỗi. Xem ví dụ ở cuối [src/lessons/content.test.ts](src/lessons/content.test.ts).

### Node Clean Code Check

Chỉ node `kind: 'cleancode'` được đặt `minCleanCodeScore`. Các node khác **tuyệt đối không** — mục 11 của đề bài quy định điểm clean code không được làm học sinh trượt khi chương trình đã đúng. Có test canh điều này.

---

## 13. Cách thay đổi điều kiện chứng chỉ

Năm điều kiện nằm trong hàm thuần `checkEligibility` tại [src/services/certificateService.ts](src/services/certificateService.ts):

| # | Điều kiện | Đổi ở đâu |
|---|---|---|
| ① | Hoàn thành hết nhiệm vụ bắt buộc | `getRequiredChallengeIds` |
| ② | Vượt Boss Challenge | tìm node `kind: 'boss'` |
| ③ | Nộp Exit Ticket | `exitTicket !== null` |
| ④ | Đạt ≥ 70% test case bắt buộc | hằng số `REQUIRED_TEST_PASS_RATE` |
| ⑤ | Đã làm Clean Code Check ít nhất một lần | node `kind: 'cleancode'` |

Sửa xong nhớ cập nhật [src/services/certificateService.test.ts](src/services/certificateService.test.ts).

> **Đừng biến điều kiện ⑤ thành ngưỡng điểm.** Nó cố ý chỉ yêu cầu học sinh *đã từng làm*, không yêu cầu đạt điểm cao. Có một test riêng khẳng định điểm clean code 12/100 vẫn được cấp chứng chỉ — nếu ai đó siết lại, test sẽ đỏ ngay.

### Đổi nội dung in trên chứng chỉ

Mẫu chứng chỉ ở [src/components/certificates/CertificateTemplate.tsx](src/components/certificates/CertificateTemplate.tsx). Chạy `npm run dev` rồi mở `#/dev/certificate-preview` để xem trước và thử tải PDF mà không cần đi hết một khu vực.

> ⚠ Mẫu chứng chỉ dùng **inline style với màu hex**, không dùng class Tailwind. Đây không phải sự cẩu thả: Tailwind v4 sinh màu ở không gian `oklch()`, mà `html2canvas` không đọc được và sẽ cho ra ảnh đen. Giữ nguyên cách viết này khi chỉnh sửa.

---

## 14. Lưu ý bảo mật

- Mật khẩu **chỉ** do Supabase Auth quản lý, không có bảng tự tạo nào lưu mật khẩu
- RLS bật cho toàn bộ 11 bảng; học sinh chỉ đọc/ghi được dữ liệu của chính mình
- Vai trò `role` **không bao giờ** tin từ client: trigger `handle_new_user` ép mọi tài khoản mới thành `student`, trigger `profiles_guard_update` chặn học sinh tự nâng quyền hoặc tự bơm XP
- Hàm `is_teacher()` dùng `SECURITY DEFINER` để tránh lỗi *infinite recursion* của policy trên bảng `profiles`
- `challenge_attempts` chỉ cho INSERT với học sinh — lịch sử học tập không sửa được
- `certificates` không có policy UPDATE/DELETE — chứng chỉ đã cấp là bất biến
- Độ dài code gửi lên giới hạn 10.000 ký tự ở tầng database
- Không dùng `eval()`, không `dangerouslySetInnerHTML` cho code học sinh
- Code học sinh chạy trong **Web Worker** — không có `document`, không có `fetch`
- Chỉ thu thập: email, họ tên, lớp, mã học sinh (tuỳ chọn). Avatar là hình minh hoạ, không yêu cầu ảnh thật
- Giáo viên **không** đọc được bảng `code_drafts` — code nháp giữa chừng là chuyện riêng của học sinh

Chạy `supabase/tests/rls_checks.sql` để tự kiểm chứng những điều trên (mục 7).

---

## 15. Kiểm thử

```bash
npm test
```

**866 test** chia theo tầng:

| Nhóm | Số test | Nội dung |
|---|---|---|
| Nội dung bài học | 450 | Mọi đáp án mẫu chạy thật qua engine, đủ 3 cấp gợi ý, mẫu cấm chặn được cách làm tắt |
| Engine chạy code | 48 | 13 lỗi thường gặp, ngữ nghĩa C++ (chia số nguyên, `cout << true` in ra `1`), chống vòng lặp vô hạn |
| Accessibility | 19 | Nhãn, `aria-live`, không chỉ dùng màu để báo đúng/sai, điều hướng Tab |
| Hàng đợi offline | 16 | Xếp hàng khi mất mạng, chạy lại đúng thứ tự, bỏ mục hỏng vĩnh viễn |
| Migration + bảo mật | 19 | RLS, danh tính LSTS, Gem không thể tự bơm, `.env.example` không chứa giá trị thật |
| Chứng chỉ | 14 | 5 điều kiện, mã không trùng, clean code thấp vẫn được cấp |
| Thống kê giáo viên | 14 | Lỗi phổ biến xếp theo số học sinh, CSV có BOM |
| Auto-save | 12 | Debounce, không ghi mỗi phím gõ, mất mạng không mất code |
| Huy hiệu | 13 | Dùng gợi ý không bị phạt |
| Còn lại | 259 | XP, Gem, âm thanh, avatar pixel, route guard, game workspace nhập môn, menu cài đặt trên bản đồ, sân khấu game, lớp học, hỏi đáp và lưu tiến trình |

Kiểm thử RLS chạy riêng trên database — xem mục 7.

Kiểm tra kiểu dữ liệu:

```bash
npm run typecheck
```

---

## 16. Giới hạn của phiên bản MVP

- **Không có trình biên dịch C++ thật.** Hệ thống dùng trình thông dịch tự viết cho một tập con C++ hẹp (đủ cho nội dung khoá học). Cú pháp ngoài phạm vi sẽ nhận thông báo thân thiện thay vì chạy.
- **Không hỗ trợ** `while`, mảng, con trỏ, class, đệ quy, STL trong phần đánh giá.
- **Không có leaderboard công khai** — cố ý, để tránh tạo áp lực so sánh giữa học sinh.
- **Không lưu file PDF trên server**, chứng chỉ được tạo lại phía trình duyệt mỗi lần tải.
- **Không có giao diện cho giáo viên tự tạo bài** — nội dung nằm trong mã nguồn, sửa qua Git.
- Supabase gói Free **tự tạm dừng project sau 7 ngày không hoạt động** — nhớ mở Dashboard trước tiết dạy sau kỳ nghỉ dài.
- **Hàng đợi offline giữ tối đa 200 thao tác** và mỗi thao tác thử lại nhiều nhất 5 lần. Đủ cho một tiết học mất mạng hoàn toàn, nhưng không thay thế được kết nối ổn định.
- **Chưa hỗ trợ nhiều giáo viên phân quyền theo lớp** — mọi tài khoản `teacher` đều xem được toàn bộ học sinh.

---

## 17. Nguồn tài nguyên mở

| Loại | Nguồn | Giấy phép |
|---|---|---|
| Font giao diện | Be Vietnam Pro (Google Fonts) | SIL OFL 1.1 |
| Font code | JetBrains Mono (Google Fonts) | SIL OFL 1.1 |
| Icon | Lucide Icons | ISC |
| Nhân vật Byte, favicon, 5 khu vực | Thiết kế nguyên bản trong dự án | gốc |
| Avatar và tile bản đồ pixel | Kenney Tiny Dungeon / Tiny Town | CC0 1.0 |

Toàn bộ giao diện, nhân vật và hình ảnh đều là thiết kế nguyên bản, **không sao chép** tài sản của CodeCombat, Swift Playgrounds hay bất kỳ sản phẩm nào khác.
