# CODEQUEST C++ 8 — Giai đoạn 1: Phân tích & Kiến trúc

> Hành trình giải cứu ByteLand — website học lập trình C++ tương tác cho học sinh lớp 8
> Giáo viên: Nguyễn Đình Vương · Trạng thái: **Bản thiết kế, chờ xác nhận trước khi code**

---

## 0. Tóm tắt quyết định kiến trúc (TL;DR)

| # | Quyết định | Lựa chọn | Lý do |
|---|---|---|---|
| D1 | Kiểu ứng dụng | SPA tĩnh (Vite + React + TS) + Supabase BaaS | Deploy GitHub Pages, không cần server riêng |
| D2 | Chạy code C++ | **Trình thông dịch tự viết** cho tập con C++ (lexer → parser → AST → tree-walking interpreter), chạy trong **Web Worker** | An toàn tuyệt đối (không `eval`), cho output thật, dừng được vòng lặp vô hạn |
| D3 | Kiểm tra bài | Nhiều tầng: chẩn đoán lỗi → phân tích AST → chạy test case → Clean Code Coach | Phản hồi tiếng Việt cụ thể thay vì "Syntax error" |
| D4 | Trừu tượng hoá runner | `interface CodeRunner` với `LocalInterpreterRunner` (MVP) và `RemoteCompilerRunner` (sau) | Thay bằng compiler thật mà không sửa UI |
| D5 | Code editor | **CodeMirror 6** (không Monaco) | Nhẹ hơn ~10 lần, chạy tốt máy phòng ICT cấu hình yếu, dễ tuỳ biến highlight/lint |
| D6 | Router | `HashRouter` | Không cần trick 404.html trên GitHub Pages, refresh không lỗi |
| D7 | Auth flow | Supabase Auth PKCE, `redirectTo` = base URL | Tương thích HashRouter, không lộ token trên URL |
| D8 | PDF chứng chỉ | `html2canvas` → ảnh → `jsPDF` | Giữ nguyên tiếng Việt có dấu (không lỗi font) |
| D9 | Quyền giáo viên trong RLS | Hàm `SECURITY DEFINER` `public.is_teacher()` | Tránh lỗi đệ quy vô hạn của policy trên bảng `profiles` |
| D10 | Nội dung bài học | Dữ liệu TypeScript trong repo (không nằm trong DB) | Versioned bằng Git, không cần seed, dễ sửa, load nhanh |

---

## 1. Kiến trúc hệ thống

### 1.1. Sơ đồ tổng thể

```
┌──────────────────────── TRÌNH DUYỆT (GitHub Pages, static) ────────────────────────┐
│                                                                                     │
│  ┌─── UI Layer (React + Tailwind) ────────────────────────────────────────────┐    │
│  │  Pages: Landing · Auth · Map · Lesson · Challenge · Profile · Certs        │    │
│  │         · TeacherDashboard · Handbook                                      │    │
│  │  Components: editor/ game/ learning/ certificates/ dashboard/ auth/        │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│         │ hooks (useChallenge, useProgress, useAutoSave, useHints…)                 │
│  ┌──────▼──── State (Zustand stores) ─────────────────────────────────────────┐    │
│  │  authStore · progressStore · editorStore · gameStore · uiStore             │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│         │                              │                          │                 │
│  ┌──────▼────── CONTENT ──────┐ ┌──────▼─── ENGINE ────┐ ┌────────▼─── DATA ─────┐ │
│  │ src/lessons/lesson-1..5    │ │ services/runner/     │ │ services/supabase/    │ │
│  │  (dữ liệu tĩnh, TS module) │ │  ├ CodeRunner (IF)   │ │  ├ client.ts          │ │
│  │ src/data/badges,certs,     │ │  ├ LocalRunner       │ │  ├ progress.repo.ts   │ │
│  │  handbook, avatars         │ │  └ RemoteRunner(TODO)│ │  ├ attempts.repo.ts   │ │
│  └────────────────────────────┘ │ validators/          │ │  ├ certificates.repo  │ │
│                                 │  ├ lexer, parser     │ │  └ offlineQueue.ts    │ │
│                                 │  ├ interpreter       │ └───────────┬───────────┘ │
│                                 │  ├ diagnostics (VI)  │             │             │
│                                 │  ├ patternMatcher    │   localStorage / IndexedDB│
│                                 │  └ cleanCodeCoach    │   (autosave + offline Q)  │
│                                 └──────────┬───────────┘             │             │
│                                            │ postMessage             │             │
│                                 ┌──────────▼───────────┐             │             │
│                                 │  WEB WORKER (sandbox)│             │             │
│                                 │  interpreter.worker  │             │             │
│                                 │  · step budget       │             │             │
│                                 │  · timeout 2s        │             │             │
│                                 │  · không DOM/network │             │             │
│                                 └──────────────────────┘             │             │
└──────────────────────────────────────────────────────────────────────┼─────────────┘
                                                                       │ HTTPS + JWT
                                              ┌────────────────────────▼─────────────┐
                                              │            SUPABASE                  │
                                              │  Auth (email+password, PKCE)         │
                                              │  Postgres + RLS (8 bảng)             │
                                              │  ❌ không dùng Storage ở MVP         │
                                              │  ❌ không dùng Edge Function ở MVP   │
                                              └──────────────────────────────────────┘
```

### 1.2. Nguyên tắc phân tách

| Tầng | Không được biết về |
|---|---|
| `lessons/`, `data/` | React, Supabase (chỉ là dữ liệu thuần + type) |
| `validators/` | React, Supabase, DOM |
| `services/runner/` | React, Supabase |
| `services/supabase/` | React component (chỉ trả về Promise + type) |
| `components/`, `pages/` | SQL, chi tiết parser |

→ Nhờ vậy: `validators/` và `runner/` unit-test được bằng Vitest thuần, không cần jsdom; thay `LocalRunner` bằng `RemoteRunner` không đụng UI.

### 1.3. Vì sao KHÔNG dùng WebAssembly compiler thật ở MVP

| Phương án | Dung lượng | Đánh giá |
|---|---|---|
| Clang/LLVM → WASM (JSCPP, wasm-clang) | 20–80 MB tải về | Quá nặng cho phòng ICT dùng Wi-Fi chung; nhưng quan trọng hơn: **thông báo lỗi bằng tiếng Anh, khó hiểu với HS lớp 8** |
| API biên dịch công cộng (Judge0, Wandbox) | – | Phụ thuộc mạng, rate limit, đề bài yêu cầu không dùng mặc định |
| **Interpreter tự viết** | ~30 KB | Kiểm soát 100% thông báo lỗi tiếng Việt, offline được, an toàn |

Đây chính là điểm mạnh sư phạm: hệ thống *cố tình* hiểu tập con C++ hẹp để đưa ra gợi ý đúng trọng tâm bài học, thay vì đổ ra `error: expected ';' before '}' token`.

---

## 2. User flow

### 2.1. Flow chính — học sinh

```
Landing (/)
  ├─→ [Chơi thử] ──→ Demo Challenge (localStorage) ──→ "Đăng nhập để lưu tiến trình" ──┐
  ├─→ [Xem bản đồ] ─→ Map (chỉ đọc, node khoá)                                          │
  ├─→ [Sổ tay lệnh] → Handbook (bản mẫu)                                                │
  └─→ [Đăng nhập] ←──────────────────────────────────────────────────────────────────────┘
        │
        ├─ Chưa có TK → Đăng ký (email, mật khẩu, họ tên, lớp) → role='student' mặc định
        │                    → Chọn avatar nhân vật → Dashboard
        ├─ Quên mật khẩu → Email reset → /auth/reset → Đăng nhập
        └─ Đăng nhập OK
              │
              ├─ (nếu có dữ liệu Demo trong localStorage)
              │     → Hỏi: "Chuyển bài em vừa thử vào tài khoản?" [Có] / [Không, bỏ qua]
              │
              ▼
          Dashboard (/app)
              │  Lời chào · Avatar · Level · XP · Badge · Chứng chỉ
              │  Bản đồ 5 khu vực · Bài đang học · [Tiếp tục] · Thành tích gần đây
              ▼
          Bản đồ ByteLand (/app/map)
              │  Khu vực 1..5, node khoá/mở/hoàn thành (1–3 sao)
              ▼
          Trang bài học (/app/lesson/:lessonId)
              │  Danh sách node: Tình huống → Quan sát → Khám phá lệnh
              │                  → Thử ngay → Nhiệm vụ → Debug ×2
              │                  → Clean Code → Exit Ticket → BOSS
              ▼
          Challenge (/app/lesson/:lessonId/challenge/:challengeId)
              │
              │  ┌── Vòng lặp học tập ──────────────────────────────────┐
              │  │ Viết code → autosave (debounce 1.5s)                 │
              │  │   → [Chạy]                                           │
              │  │     ├─ ĐÚNG   → animation nhân vật + output + ✓ test │
              │  │     │           + XP + sao + mở node kế              │
              │  │     │           + (nếu chưa clean) gợi ý Clean Code  │
              │  │     └─ CHƯA   → giữ code + 1 thông báo VI ngắn       │
              │  │                 + highlight dòng + [Nhận gợi ý]      │
              │  │                 → Hint 1 → 2 → 3 → (đáp án nếu GV bật│
              │  │                    hoặc ≥6 lần thử)                  │
              │  │ [Đặt lại] [Sổ tay lệnh] [Phóng to]                   │
              │  └──────────────────────────────────────────────────────┘
              ▼
          Hoàn thành hết node bắt buộc + Boss + Exit Ticket + ≥1 Clean Code Check
              ▼
          Mở khoá chứng chỉ → /app/certificates/:lessonId
              → Xem trước → [Tải PDF] → mở khoá Khu vực kế tiếp
```

### 2.2. Flow giáo viên

```
Đăng nhập (cùng form) → hệ thống đọc profiles.role
  ├─ 'student' → /app
  └─ 'teacher' → /teacher
        ├─ Danh sách HS (lọc theo lớp) → chi tiết 1 HS
        │     · tiến trình 5 bài · số lần thử · lỗi phổ biến
        │     · mức gợi ý đã dùng · hoạt động gần nhất · chứng chỉ
        ├─ Biểu đồ tổng quan theo lớp
        ├─ Xuất CSV
        └─ Cài đặt lớp: mở/khoá bài · bật/tắt xem đáp án · reset 1 challenge
```

**Lưu ý bảo mật:** role đọc từ DB qua RLS, **không bao giờ tin `role` do client gửi**. Route `/teacher` được bọc bởi `<RoleGuard role="teacher">`, và mọi truy vấn dữ liệu HS vẫn bị RLS chặn ở tầng DB — UI guard chỉ là lớp trải nghiệm.

---

## 3. Sơ đồ trang (Site map & Routes)

| Route (HashRouter) | Trang | Bảo vệ | Ghi chú |
|---|---|---|---|
| `/` | Landing / giới thiệu | công khai | Có banner "công cụ hỗ trợ tiết học" |
| `/demo` | Demo challenge mẫu | công khai | localStorage, không ghi DB |
| `/map-preview` | Xem bản đồ (chỉ đọc) | công khai | Node đều khoá |
| `/handbook` | Sổ tay lệnh (bản mẫu) | công khai | |
| `/auth/login` | Đăng nhập | khách | |
| `/auth/register` | Đăng ký | khách | Chỉ tạo `student` |
| `/auth/forgot` | Quên mật khẩu | khách | |
| `/auth/reset` | Đặt lại mật khẩu | token | |
| `/app` | Dashboard học sinh | student | |
| `/app/map` | Bản đồ ByteLand | student | |
| `/app/lesson/:lessonId` | Trang bài học | student | |
| `/app/lesson/:lessonId/challenge/:challengeId` | Màn hình challenge | student | Trang phức tạp nhất |
| `/app/lesson/:lessonId/exit-ticket` | Exit Ticket | student | |
| `/app/profile` | Hồ sơ (avatar, lớp, badge) | student | |
| `/app/certificates` | Bộ sưu tập chứng chỉ | student | |
| `/app/certificates/:lessonId` | Xem & tải 1 chứng chỉ | student | |
| `/app/handbook` | Sổ tay lệnh (đầy đủ) | student | Cũng mở dạng modal trong challenge |
| `/teacher` | Dashboard GV | teacher | |
| `/teacher/students/:userId` | Chi tiết 1 HS | teacher | |
| `/teacher/settings` | Cài đặt lớp | teacher | |
| `*` | 404 | – | |

### 3.1. Bố cục màn hình Challenge (quan trọng nhất)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Khu vực 3 · Nhiệm vụ 4/9    [XP 340]  [⚡Lv3]  [📖 Sổ tay lệnh]        │
├──────────────────────────┬───────────────────────────────────────────────┤
│  CỘT TRÁI (40%)          │  CỘT PHẢI (60%)                               │
│                          │                                               │
│ ┌ Tình huống ──────────┐ │ ┌ Code editor (CodeMirror 6) ──────────────┐ │
│ │ 🧙 Byte: "Con đường  │ │ │ 1  #include <iostream>                    │ │
│ │ có 5 ô giống nhau…"  │ │ │ 2  using namespace std;                   │ │
│ └──────────────────────┘ │ │ 3                                         │ │
│ ┌ Yêu cầu ─────────────┐ │ │ 4  int main() {                           │ │
│ │ ☐ Dùng vòng lặp for  │ │ │ 5      // viết code ở đây                 │ │
│ │ ☐ Gọi buocToi() 5 lần│ │ │ 6  }                          ⬤ Đã lưu    │ │
│ └──────────────────────┘ │ └───────────────────────────────────────────┘ │
│ ┌ Sân khấu game ───────┐ │  [▶ Chạy code] [↺ Đặt lại] [💡 Gợi ý(0/3)] [⛶]│
│ │  🧝‍♀️ ▢ ▢ ▢ ▢ ▢ 🚩   │ │ ┌ Kết quả ─────────────────────────────────┐ │
│ │  (SVG animation)     │ │ │ ✓ Test 1: đi đủ 5 ô        ✓ Test 2: …    │ │
│ └──────────────────────┘ │ │ Output: Bước 1 / Bước 2 / …               │ │
│                          │ ├ Thông báo ────────────────────────────────┤ │
│                          │ │ ⚠ Dòng 5: Có vẻ em đang thiếu dấu `;`     │ │
│                          │ │   ở cuối dòng.        [💡 Nhận gợi ý]     │ │
│                          │ └───────────────────────────────────────────┘ │
└──────────────────────────┴───────────────────────────────────────────────┘
```

Dưới 1024px: chuyển thành tab (`Nhiệm vụ | Code | Kết quả`). Ưu tiên tối ưu 1366×768 — độ phân giải phổ biến nhất của máy phòng ICT.

---

## 4. Database schema

### 4.1. Sơ đồ quan hệ

```
auth.users (Supabase quản lý — KHÔNG bao giờ tự lưu mật khẩu)
    │ 1:1
    ▼
profiles ──┬──< lesson_progress        (user × lesson, UNIQUE)
           ├──< challenge_attempts     (nhiều bản ghi/challenge)
           ├──< certificates           (UNIQUE user × lesson)
           ├──< exit_tickets           (UNIQUE user × lesson)
           ├──< user_badges >── badges (bảng công khai, seed sẵn)
           └──< activity_events        (log, append-only)

class_settings  (bảng BỔ SUNG — cần cho yêu cầu mục 16)
```

### 4.2. Bảng và cột

<details>
<summary><b>profiles</b> — hồ sơ học sinh/giáo viên</summary>

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `uuid PK` | = `auth.users.id`, ON DELETE CASCADE |
| `full_name` | `text NOT NULL` | ≤ 80 ký tự |
| `class_name` | `text` | vd. `8A1` |
| `student_code` | `text` | không bắt buộc |
| `avatar_id` | `text DEFAULT 'guardian-01'` | ID hình minh hoạ có sẵn, **không upload ảnh thật** |
| `role` | `text NOT NULL DEFAULT 'student'` | CHECK IN ('student','teacher') |
| `total_xp` | `int NOT NULL DEFAULT 0` | *bổ sung* — cache để Dashboard 1 truy vấn |
| `level` | `int NOT NULL DEFAULT 1` | *bổ sung* — tính từ `total_xp` bởi trigger |
| `streak_days` | `int NOT NULL DEFAULT 0` | *bổ sung* |
| `last_active_date` | `date` | *bổ sung* — tính streak |
| `created_at` / `updated_at` | `timestamptz` | |

Tạo tự động bằng trigger `on_auth_user_created` → **role luôn bị ép về `'student'`**, client không thể chọn.
</details>

<details>
<summary><b>lesson_progress</b> — tiến trình theo bài</summary>

`id uuid PK` · `user_id uuid FK` · `lesson_id text` · `status text CHECK IN ('locked','in_progress','completed')` · `progress_percent int 0..100` · `stars int 0..3` · `xp int` · `completed_challenges text[]` *(bổ sung)* · `started_at` · `completed_at` · `updated_at`
**UNIQUE (user_id, lesson_id)** → cho phép `upsert`.
</details>

<details>
<summary><b>challenge_attempts</b> — mỗi lần bấm Chạy</summary>

`id` · `user_id` · `challenge_id text` · `lesson_id text` *(bổ sung, để GV lọc nhanh)* · `submitted_code text CHECK length(submitted_code) <= 10000` · `is_correct bool` · `passed_tests int` · `total_tests int` · `error_types text[]` (mã lỗi: `MISSING_SEMICOLON`, `VAR_TYPO`, …) · `hint_level_used int 0..3` · `attempt_number int` · `clean_code_score int` *(bổ sung)* · `created_at`

**INSERT-only** với học sinh (không cho UPDATE/DELETE → dữ liệu học tập trung thực).
Chống spam: chỉ ghi khi bấm **Chạy**, không ghi khi autosave.
</details>

<details>
<summary><b>certificates</b></summary>

`id` · `user_id` · `lesson_id` · `certificate_code text UNIQUE` (`CPP8-L3-A1B2C3-1735689600`) · `issued_at` · `xp_at_issue` · `stars_at_issue` · `metadata jsonb` (họ tên, lớp, tên bài, tên chứng chỉ, tên GV tại thời điểm cấp)
**UNIQUE (user_id, lesson_id)** → chống cấp trùng ở tầng DB, không chỉ ở tầng UI.
**Không có UPDATE/DELETE policy** cho học sinh → chứng chỉ bất biến.
</details>

<details>
<summary><b>badges</b> / <b>user_badges</b></summary>

`badges`: `id` · `code text UNIQUE` · `name` · `description` · `icon text` · `tier text` *(bổ sung: bronze/silver/gold)* — bảng công khai, SELECT cho mọi authenticated user, không ai INSERT từ client (seed bằng migration).
`user_badges`: `id` · `user_id` · `badge_id` · `earned_at` — **UNIQUE (user_id, badge_id)**.
</details>

<details>
<summary><b>exit_tickets</b></summary>

`id` · `user_id` · `lesson_id` · `answers jsonb` · `score int` · `reflection text CHECK length <= 1000` · `submitted_at`
**UNIQUE (user_id, lesson_id)** + cho phép UPDATE (HS làm lại được).
</details>

<details>
<summary><b>activity_events</b></summary>

`id` · `user_id` · `event_type text` (`lesson_started`, `challenge_passed`, `hint_used`, `badge_earned`, `certificate_issued`, `boss_defeated`) · `lesson_id` · `challenge_id` · `metadata jsonb` · `created_at`
INSERT-only. Dùng cho "Thành tích gần đây" và "Hoạt động gần nhất" ở dashboard GV.
</details>

<details>
<summary><b>class_settings</b> — BỔ SUNG NGOÀI SCHEMA TỐI THIỂU</summary>

Bắt buộc phải có để đáp ứng mục 16 ("mở/khoá bài học", "bật/tắt quyền xem đáp án").

`id` · `class_name text UNIQUE` · `unlocked_lessons text[]` · `allow_solution_view bool DEFAULT false` · `updated_by uuid` · `updated_at`
SELECT: mọi authenticated (HS cần đọc để biết bài nào mở). INSERT/UPDATE: chỉ `teacher`.
</details>

### 4.3. RLS — nguyên tắc & cái bẫy phải tránh

Tất cả bảng đều `ENABLE ROW LEVEL SECURITY`. Mẫu chung cho học sinh:

```sql
CREATE POLICY "own_select" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**⚠ Cái bẫy lớn nhất:** policy cho giáo viên trên bảng `profiles` mà lại `SELECT ... FROM profiles WHERE role='teacher'` sẽ gây **đệ quy vô hạn** (Postgres báo `infinite recursion detected in policy`). Giải pháp:

```sql
CREATE FUNCTION public.is_teacher() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher');
$$;
-- SECURITY DEFINER → chạy với quyền owner → bỏ qua RLS → không đệ quy
CREATE POLICY "teacher_read_all" ON lesson_progress FOR SELECT USING (public.is_teacher());
```

Ngoài ra: một policy `UPDATE ... WITH CHECK (role = OLD.role)` (hoặc trigger) để **học sinh không tự nâng mình lên `teacher`** khi cập nhật hồ sơ.

### 4.4. Nội dung bài học nằm ở đâu?

**Trong repo (`src/lessons/`), KHÔNG trong DB.** Lý do: versioned bằng Git, sửa bài không cần migration, tải tức thì (không round-trip), test được bằng Vitest, và HS ở chế độ Demo/offline vẫn học được. DB chỉ lưu **tiến trình**, tham chiếu bằng `lesson_id`/`challenge_id` dạng chuỗi ổn định (`l3`, `l3-c4-boss`).

---

## 5. Cơ chế game (Gamification)

### 5.1. Bản đồ & mở khoá

```
ByteLand
 ├ Khu 1 · Làng Khởi Động   (l1) → C++ Starter
 ├ Khu 2 · Xưởng Phép Thuật (l2) → Function Builder
 ├ Khu 3 · Thung Lũng Lặp   (l3) → Loop Explorer
 ├ Khu 4 · Cổng Quyết Định  (l4) → Decision Maker
 └ Khu 5 · Lâu Đài Lựa Chọn (l5) → ByteLand Code Guardian
```

Mỗi khu vực ≈ **9 node** (tổng ~45 challenge):

| # | Node | Loại | Bắt buộc |
|---|---|---|---|
| 1 | Tình huống + Quan sát | `story` | ✔ |
| 2 | Khám phá lệnh | `concept` | ✔ |
| 3 | Thử ngay | `sandbox` | ✔ |
| 4–5 | Nhiệm vụ game ×2 | `mission` | ✔ |
| 6–7 | Debug Challenge ×2 | `debug` | ✔ |
| 8 | Clean Code Check | `cleancode` | ✔ |
| 9 | Exit Ticket | `quiz` | ✔ |
| 10 | **BOSS** | `boss` | ✔ |

*(Node "Khám phá thêm" — while, mảng… — gắn cờ `optional: true`, không tính vào tiến trình, không tính điểm.)*

### 5.2. Quy tắc mở khoá

```
unlockedNode(n) = n === 0
               || progress.completedChallenges.includes(node[n-1].id)
               || node[n].optional === true
               || teacherOverride

unlockedLesson(L) = L === 'l1'
                 || lessonProgress[L-1].status === 'completed'
                 || classSettings.unlocked_lessons.includes(L)
```

Node đã hoàn thành **luôn mở lại được** để ôn tập (nhưng không cộng XP lần 2).

### 5.3. XP & Cấp độ

| Loại node | XP |
|---|---|
| `story` / `concept` | 10 |
| `sandbox` | 15 |
| `mission` | 25 |
| `debug` | 30 |
| `cleancode` | 25 |
| `quiz` (Exit Ticket) | 20 |
| `boss` | 80 |
| Bonus 3 sao | +10 |

→ Mỗi bài ≈ **265–310 XP**, cả khoá ≈ **1400–1550 XP**.

**Công thức cấp độ:** XP tích luỹ để lên cấp `L` = `50 × (L-1) × L`
→ Lv2: 100 · Lv3: 300 · Lv4: 600 · Lv5: 1000 · Lv6: 1500 · Lv7: 2100
→ Học sinh hoàn thành khoá đạt khoảng **Lv 6**. Không có cấp trần cứng.

**XP chỉ cộng lần đầu hoàn thành** (kiểm bằng `completed_challenges[]`), làm lại không cộng thêm — nhưng cũng **không bao giờ bị trừ**.

### 5.4. Sao — nguyên tắc "không phạt việc dùng gợi ý"

| Sao | Điều kiện |
|---|---|
| ⭐ | Vượt ≥ 70% test case bắt buộc |
| ⭐⭐ | Vượt 100% test case bắt buộc |
| ⭐⭐⭐ | 100% test case **và** Clean Code ≥ 80/100 |

**Số lần thử và số gợi ý đã dùng KHÔNG ảnh hưởng số sao.** Đây là quyết định sư phạm có chủ đích: đề bài yêu cầu "không khiến học sinh sợ sai" và "không làm học sinh cảm thấy dùng gợi ý là kém". Dữ liệu gợi ý vẫn được ghi lại — nhưng chỉ để **giáo viên** biết chỗ nào lớp đang vướng, không để chấm điểm học sinh.

### 5.5. 10 huy hiệu

| Code | Tên | Điều kiện |
|---|---|---|
| `first-run` | First Run | Lần đầu bấm Chạy code |
| `bug-hunter` | Bug Hunter | Hoàn thành 5 Debug Challenge |
| `semicolon-saver` | Semicolon Saver | Tự sửa lỗi thiếu `;` 3 lần |
| `function-builder` | Function Builder | Hoàn thành Boss khu 2 |
| `loop-explorer` | Loop Explorer | Hoàn thành Boss khu 3 |
| `decision-maker` | Decision Maker | Hoàn thành Boss khu 4 |
| `clean-code-rookie` | Clean Code Rookie | Đạt Clean Code ≥ 80 lần đầu |
| `clean-code-guardian` | Clean Code Guardian | Đạt Clean Code ≥ 90 ở cả 5 bài |
| `no-hint-hero` | No Hint Hero | Hoàn thành 1 Boss không dùng gợi ý *(phần thưởng phụ, hiển thị nhỏ, không so sánh giữa HS)* |
| `persistent-coder` | Persistent Coder | Hoàn thành 1 challenge sau ≥ 5 lần thử — **thưởng cho sự kiên trì, không phải sự hoàn hảo** |

### 5.6. Các thành phần khác

- **Chuỗi ngày học:** hiển thị dạng "Em đã học 3 ngày trong tuần này 🌱", **không có đồng hồ đếm ngược, không mất gì khi đứt chuỗi** (tránh áp lực).
- **Rương phần thưởng:** mở sau mỗi Boss → avatar mới / khung hồ sơ / sticker. Thuần trang trí, không phải loot box ngẫu nhiên gây nghiện.
- **Nhân vật hướng dẫn:** "Byte" — sinh vật dữ liệu nhỏ, thiết kế gốc bằng SVG. Xuất hiện ở tình huống mở đầu, khi gợi ý, khi chúc mừng.
- **Sân khấu game:** lưới SVG 2D + `framer-motion`. Chương trình HS sinh ra một *chuỗi sự kiện* (`moveForward`, `openDoor`, `turnOnLight`) → phát lại thành animation. Không dùng Phaser ở MVP.
- **Boss:** thanh máu Bug giảm theo số test case vượt qua — trực quan hoá tiến độ, không phải chiến đấu thật.
- **Từ ngữ khi sai:** `Chưa hoàn tất` · `Bug vẫn còn` · `Gần đúng rồi` · `Hãy thử lại nhé`. **Cấm** các từ: Thất bại, Sai, Fail, ✗ đỏ toàn màn hình.

---

## 6. Cơ chế chạy & kiểm tra code

Đây là phần lõi kỹ thuật của dự án.

### 6.1. Pipeline 8 bước

```
Code của học sinh (string)
   │
 ① NORMALIZE      tách dòng, giữ bản đồ dòng gốc, tách comment, chuẩn hoá khoảng trắng
   │              (giữ nguyên bản gốc để Clean Code Coach chấm thụt lề)
 ② LEXER          → Token[] { type, value, line, col }
   │              lỗi ở đây: ký tự lạ, chuỗi chưa đóng nháy
 ③ NOVICE SCAN    ⭐ CHẨN ĐOÁN LỖI PHỔ THÔNG — chạy TRƯỚC parser
   │              quét token tìm 13 lỗi trong đề bài, cho thông báo tiếng Việt
   │              (thiếu `;`, lệch `{}`/`()`, `cout` sai, `=` trong if…)
 ④ PARSER         recursive descent → AST, có error recovery
   │              mọi ParseError mang một errorCode → tra bảng thông báo VI
 ⑤ SEMANTIC       biến chưa khai báo · biến gần giống (Levenshtein ≤2)
   │              hàm khai báo mà không gọi · gọi hàm không tồn tại
 ⑥ INTERPRET      tree-walking trong Web Worker
   │              → stdout[] + worldEvents[] + runtimeErrors[]
 ⑦ VALIDATE       expectedOutput · requiredPatterns · forbiddenPatterns · testCases
   │
 ⑧ CLEAN CODE     chấm 9 tiêu chí trên AST + source gốc → điểm 0..100 + gợi ý
   │
   ▼
RunResult
```

**Điểm mấu chốt sư phạm là bước ③.** Một parser thông thường gặp code thiếu `;` sẽ báo lỗi ở vị trí *sau* chỗ sai và bằng thuật ngữ khó. Bước ③ quét token theo heuristic để đoán **lỗi có khả năng cao nhất** và chỉ hiển thị **một** thông báo — đúng yêu cầu mục 24.

### 6.2. Tập con C++ được hỗ trợ (grammar đóng băng)

| ✅ Hỗ trợ | ❌ Không hỗ trợ (báo lỗi thân thiện, không crash) |
|---|---|
| `#include <iostream>` | `while`, `do-while` |
| `using namespace std;` | mảng, con trỏ, tham chiếu |
| `int main() { ... return 0; }` | `class`, `struct`, đệ quy |
| `int` `float` `double` `bool` `char` `string` | `switch`, `try/catch` |
| `cout <<` chuỗi/biến/`endl`/`"\n"` | `std::vector`, STL |
| `cin >>` (giới hạn, cho test case có input) | overload, template |
| khai báo & gán biến, `++`/`--`/`+= `| toán tử bit, con trỏ hàm |
| toán tử `+ - * / %` `== != < > <= >=` `&& \|\| !` | |
| hàm `void` và hàm trả về, có/không tham số | |
| `for (init; cond; update)` | |
| `if`, `if–else`, `else if` | |
| hàm dựng sẵn của game: `buocToi()`, `moCua()`, `batDen()`, `kichHoatCau()`, `quay(...)` | |

Khi gặp `while`, hệ thống trả về: *"`while` là một loại vòng lặp em sẽ học sau. Trong khoá này mình dùng `for` nhé — vào Sổ tay lệnh xem cấu trúc `for`."* → nhất quán với mục 3 của đề bài.

### 6.3. An toàn khi thực thi

| Rủi ro | Biện pháp |
|---|---|
| Vòng lặp vô hạn | **Step budget** 200.000 bước · **max iterations** 100.000/vòng lặp · Worker `terminate()` sau 2s |
| In ra quá nhiều | Giới hạn 5.000 dòng output / 100 KB |
| Đệ quy sâu | Giới hạn độ sâu ngăn xếp 100 |
| XSS qua code HS | Output render bằng `textContent`, **không bao giờ `dangerouslySetInnerHTML`** |
| Truy cập DOM/mạng | Chạy trong Web Worker: không có `document`, không `fetch` |
| `eval` | **Không dùng ở bất kỳ đâu** — interpreter là tree-walking thuần |

Khi vượt ngân sách: *"Chương trình của em chạy quá lâu. Em kiểm tra lại điều kiện dừng của vòng lặp `for` nhé — biến đếm có tăng lên không?"*

### 6.4. Bảng mã lỗi → thông báo tiếng Việt (trích)

| Mã | Tình huống | Thông báo mẫu |
|---|---|---|
| `MISSING_SEMICOLON` | thiếu `;` | "Có vẻ em đang thiếu dấu `;` ở cuối dòng 4." |
| `UNBALANCED_BRACE` | lệch `{}` | "Em mở 3 dấu `{` nhưng mới đóng 2 dấu `}`. Kiểm tra lại từ dòng 7 nhé." |
| `UNBALANCED_PAREN` | lệch `()` | "Dòng 5 có 2 dấu `(` nhưng chỉ có 1 dấu `)`." |
| `VAR_TYPO` | tên biến sai chính tả | "Em đã khai báo biến `score` nhưng ở dòng 6 lại viết thành `scores`." |
| `VAR_UNDECLARED` | biến chưa khai báo | "Biến `diem` ở dòng 8 chưa được khai báo. Em cần viết `int diem = 0;` trước khi dùng." |
| `FUNC_NOT_CALLED` | khai báo mà không gọi | "Em đã viết hàm `moCua()` rất tốt, nhưng chưa gọi nó trong `main()`." |
| `FUNC_NAME_MISMATCH` | gọi sai tên hàm | "Hãy kiểm tra xem tên hàm khi gọi có giống hoàn toàn với tên hàm khi khai báo không: `moCua` ≠ `mocua`." |
| `ASSIGN_IN_CONDITION` | `=` thay `==` | "Trong phép so sánh, em cần dùng `==` thay vì `=`." |
| `COUT_SYNTAX` | `cout` sai | "Sau `cout` em cần dùng dấu `<<`, ví dụ: `cout << \"Xin chào\";`" |
| `COUT_MISSING_QUOTE` | thiếu nháy | "Chuỗi chữ cần đặt trong dấu nháy kép: `cout << \"Xin chào\";`" |
| `FOR_MISSING_UPDATE` | `for` không tăng | "Vòng `for` của em thiếu phần tăng biến đếm (`i++`) nên sẽ chạy mãi không dừng." |
| `FOR_WRONG_COUNT` | lặp sai số lần | "Vòng lặp chạy 4 lần nhưng con đường có 5 ô. Em thử kiểm tra lại điều kiện `i < ...`." |
| `MISSING_MAIN` | không có `main` | "Mọi chương trình C++ đều bắt đầu từ `int main()`. Em thêm hàm này nhé." |
| `MISSING_INCLUDE` | thiếu include | "Muốn dùng `cout`, em cần có dòng `#include <iostream>` ở đầu chương trình." |
| `TIMEOUT` | chạy quá lâu | (xem 6.3) |
| `UNSUPPORTED_FEATURE` | ngoài phạm vi | (xem 6.2) |

Mỗi mã lỗi có: `line`, `severity` (`error` | `warn` | `tip`), thông báo, và **con trỏ tới hint phù hợp**. Mã lỗi được ghi vào `challenge_attempts.error_types[]` → dashboard GV tổng hợp "lỗi phổ biến của lớp 8A1".

### 6.5. Mô hình dữ liệu Challenge

Giữ đúng interface đề bài, làm rõ các kiểu con:

```ts
type ChallengeKind = 'story' | 'concept' | 'sandbox' | 'mission'
                   | 'debug' | 'cleancode' | 'quiz' | 'boss';

interface Challenge {
  id: string;                       // 'l3-c4-mission'
  lessonId: string;                 // 'l3'
  kind: ChallengeKind;
  title: string;
  story: string;                    // 2–4 câu tình huống
  instructions: string[];           // checklist yêu cầu
  starterCode: string;
  expectedOutput?: string;
  requiredPatterns: string[];       // DSL, xem 6.6
  forbiddenPatterns?: string[];
  testCases: TestCase[];
  commonMistakes: CommonMistake[];
  hints: Hint[];                    // ≥ 3
  cleanCodeRules: CleanCodeRule[];
  xpReward: number;
  optional?: boolean;               // node "Khám phá thêm"
  world?: WorldSpec;                // cấu hình sân khấu game
  solution?: string;                // chỉ lộ khi GV bật allow_solution_view
}

interface TestCase {
  id: string;
  name: string;                     // "Nhân vật đi đủ 5 ô"
  kind: 'output' | 'world' | 'structure';
  input?: string;                   // cho cin
  expectedOutput?: string;
  expectedWorld?: Partial<WorldState>;
  required: boolean;                // false = test thưởng
  visible: boolean;                 // false = test ẩn, chống dò đáp án
}

interface Hint {
  level: 1 | 2 | 3;
  type: 'question' | 'structure' | 'skeleton';
  content: string;                  // level 3 có thể chứa code khung ```cpp
}

interface CommonMistake {
  errorCode: string;                // khớp bảng 6.4
  detect: string;                   // DSL phát hiện
  message: string;                  // thông báo riêng cho challenge này
  hintLevel?: 1 | 2 | 3;            // gợi ý mở kèm
}

interface CleanCodeRule {
  rule: 'indent' | 'one-statement-per-line' | 'meaningful-var'
      | 'action-verb-func' | 'unused-var' | 'no-duplication'
      | 'spacing' | 'main-length' | 'extract-function';
  weight: number;                   // tổng = 100
  params?: Record<string, unknown>; // vd. { maxMainLines: 15 }
}
```

### 6.6. `requiredPatterns` — DSL trên AST, không phải regex

Đề bài định nghĩa `requiredPatterns: string[]`. Giữ nguyên kiểu, nhưng **diễn giải bằng AST matcher**, vì regex trên code là nguồn gốc của phản hồi sai:

| Chuỗi DSL | Ý nghĩa |
|---|---|
| `stmt:for` | có ít nhất 1 vòng `for` |
| `stmt:for>call:buocToi` | có lời gọi `buocToi()` **bên trong** vòng `for` |
| `stmt:if` / `stmt:if-else` | có `if` / có `if` kèm `else` |
| `decl:func:moCua` | khai báo hàm tên `moCua` |
| `decl:func:*:params>=1` | khai báo hàm có ≥ 1 tham số |
| `call:moCua` | có lời gọi `moCua()` |
| `call:*:count=5` | tổng số lời gọi = 5 |
| `decl:var:int` | khai báo biến kiểu int |
| `op:==` | dùng toán tử `==` |
| `output:contains:Xin chào` | output có chứa chuỗi |

`forbiddenPatterns` dùng cùng DSL — ví dụ `call:buocToi:count>=5` bị cấm ở challenge vòng lặp, để HS **không thể gọi tay 5 lần** thay vì dùng `for`. Khi vi phạm: *"Cách này chạy đúng, nhưng nhiệm vụ này muốn em dùng vòng lặp `for` để code gọn hơn nhé."* — vẫn là giọng khuyến khích.

### 6.7. Trừu tượng hoá runner (để sau này thay bằng compiler thật)

```ts
export interface CodeRunner {
  readonly id: 'local-interpreter' | 'remote-compiler';
  run(req: RunRequest): Promise<RunResult>;
  dispose(): void;
}

export interface RunRequest {
  code: string;
  stdin?: string;
  challenge: Challenge;
  timeoutMs?: number;
}

export interface RunResult {
  ok: boolean;                    // biên dịch/chạy được (khác với "đúng đề")
  stdout: string[];
  worldEvents: WorldEvent[];
  diagnostics: Diagnostic[];      // luôn tiếng Việt
  testResults: TestResult[];
  cleanCode: CleanCodeReport;
  passedRequired: number;
  totalRequired: number;
  isCorrect: boolean;
  durationMs: number;
}
```

UI chỉ phụ thuộc `RunResult`. Khi có Edge Function biên dịch g++ thật, viết `RemoteCompilerRunner` implement cùng interface + một adapter dịch lỗi g++ sang `Diagnostic` tiếng Việt — **không sửa một dòng component nào**. Chọn runner qua `VITE_RUNNER=local|remote`.

### 6.8. Clean Code Coach (9 tiêu chí, thang 100)

| Tiêu chí | Điểm | Cách chấm |
|---|---|---|
| Thụt lề nhất quán | 15 | so độ sâu khối trong AST với số space thực tế |
| Một câu lệnh / dòng | 10 | đếm `;` ngoài `for(...)` trên mỗi dòng |
| Tên biến có nghĩa | 15 | chặn `a`,`b`,`x1`,`temp`,`aaa`; ưu tiên ≥3 ký tự, có nghĩa |
| Tên hàm là động từ | 10 | so với từ điển động từ VI/EN (`mo`,`bat`, `tinh`, `in`, `draw`, `move`…) |
| Không có biến thừa | 10 | biến khai báo mà không đọc |
| Không lặp code | 15 | phát hiện ≥2 khối AST giống nhau → gợi ý dùng `for`/hàm |
| Khoảng trắng dễ đọc | 10 | quanh `=`, `<<`, toán tử |
| `main()` không quá dài | 10 | mặc định ≤ 15 dòng lệnh |
| Tách nhiệm vụ thành hàm | 5 | có ≥1 hàm ngoài `main` (ở bài 2 trở đi) |

**Điểm Clean Code không bao giờ làm mất chứng chỉ** nếu chương trình đã đúng — đúng yêu cầu mục 11. Nó chỉ ảnh hưởng sao thứ 3 và huy hiệu. Phản hồi luôn theo mẫu: *khen trước → đề xuất cụ thể sau*, ví dụ: "Code của em chạy đúng rồi! Em có thể làm nó dễ đọc hơn bằng cách đổi `x` thành `diemSo`."

### 6.9. Hệ thống gợi ý

- Mỗi challenge ≥ **3 cấp**: ① câu hỏi định hướng → ② nhắc cấu trúc → ③ khung code có chỗ trống.
- Mở **tuần tự**, mỗi lần bấm mở 1 cấp, đã mở thì hiện lại miễn phí.
- **Không tự động mở** — HS phải chủ động bấm.
- Cấp 4 (đáp án đầy đủ) chỉ hiện khi: `class_settings.allow_solution_view = true` **hoặc** `attempt_number >= 6` **và** HS đã dùng hết 3 gợi ý.
- Nếu `commonMistakes` phát hiện đúng lỗi HS đang mắc → **ưu tiên hiện thông báo riêng của lỗi đó** thay vì hint chung.
- Ghi `hint_level_used` vào `challenge_attempts` (cho GV), UI của HS **không hiển thị đếm ngược hay cảnh báo "còn 1 gợi ý"**.

---

## 7. Quy tắc cấp chứng chỉ

### 7.1. Điều kiện (5 điều kiện, kiểm ở client rồi ghi DB)

```ts
function canIssueCertificate(lessonId, progress, attempts, exitTicket): boolean {
  return (
    allRequiredChallengesDone(lessonId, progress) &&   // ① hết node bắt buộc
    bossPassed(lessonId, progress)               &&   // ② vượt Boss
    exitTicket?.submitted === true               &&   // ③ nộp Exit Ticket
    requiredTestPassRate(lessonId, attempts) >= 0.7 && // ④ ≥70% test bắt buộc
    hasAnyCleanCodeCheck(lessonId, attempts)          // ⑤ ≥1 lần Clean Code Check
  );
}
```

### 7.2. 5 chứng chỉ

| Bài | Chứng chỉ | Mã mẫu |
|---|---|---|
| l1 | **C++ Starter** | `CPP8-L1-7F3A21-1735689600` |
| l2 | **Function Builder** | `CPP8-L2-…` |
| l3 | **Loop Explorer** | `CPP8-L3-…` |
| l4 | **Decision Maker** | `CPP8-L4-…` |
| l5 | **ByteLand Code Guardian** | `CPP8-L5-…` |

Định dạng: `CPP8-[LESSON]-[USER6]-[TIMESTAMP]`, trong đó `USER6` = 6 ký tự hex đầu của `user_id` (không lộ UUID đầy đủ), `TIMESTAMP` = epoch giây.

### 7.3. Chống cấp trùng

Ba lớp: ① kiểm tra ở client trước khi gọi · ② `UNIQUE (user_id, lesson_id)` ở DB · ③ dùng `INSERT ... ON CONFLICT DO NOTHING` rồi `SELECT` bản ghi hiện có. Nếu đã có chứng chỉ, **`issued_at` và `certificate_code` giữ nguyên vĩnh viễn**, chỉ cho tải lại. Không có policy UPDATE/DELETE cho học sinh.

### 7.4. Nội dung chứng chỉ & PDF

Hiển thị: Họ tên · Lớp · Tên chứng chỉ · Tên bài học · Ngày hoàn thành · Mã chứng chỉ · XP · Sao · **GV: Nguyễn Đình Vương** · **Khoá: CodeQuest C++ 8**.

Kỹ thuật: render một `<div>` khổ A4 ngang (1123×794 px @96dpi) → `html2canvas` (scale 2) → `jsPDF.addImage`. **Lý do không dùng jsPDF text API:** font mặc định của jsPDF không có tiếng Việt có dấu, "Nguyễn Đình Vương" sẽ ra ký tự lỗi. Chụp ảnh DOM giữ nguyên font web (Be Vietnam Pro).

MVP **không lưu file PDF lên Supabase Storage** — chỉ lưu metadata; PDF sinh lại phía trình duyệt mỗi lần tải.

---

## 8. Lưu code & chế độ offline

### 8.1. Máy trạng thái autosave

```
        gõ phím
IDLE ──────────► EDITING ──debounce 1.5s──► SAVING ──ok──► SAVED ──gõ tiếp──► EDITING
                    │                          │
                    │                          └──lỗi──► SAVE_FAILED ──► LOCAL_ONLY
                    │                                        │ (retry ×3, backoff)
                    └── bấm Chạy / đổi challenge / rời trang ─┘ (flush ngay)
```

| Trạng thái | Hiển thị |
|---|---|
| `EDITING` | ⬤ Đang chỉnh sửa |
| `SAVING` | ⟳ Đang lưu… |
| `SAVED` | ✓ Đã lưu |
| `SAVE_FAILED` | ⚠ Lưu chưa được, đang thử lại |
| `LOCAL_ONLY` | 💾 Đã lưu trên máy này (sẽ đồng bộ khi có mạng) |

### 8.2. Kiến trúc lưu 2 tầng

- **Tầng 1 — localStorage (luôn ghi, đồng bộ, tức thì):** key `cq8:code:{userId|demo}:{challengeId}` → `{ code, updatedAt }`. Ghi ngay khi debounce hết. **Không bao giờ mất code.**
- **Tầng 2 — Supabase (ghi khi có mạng):** một bản ghi/challenge, dùng `upsert`. **Không tạo bản ghi cho từng phím gõ** — chỉ ghi khi debounce xong, khi bấm Chạy, khi chuyển challenge, hoặc `beforeunload`/`visibilitychange`.

*Ghi chú:* code đang làm dở lưu vào `challenge_attempts` chỉ khi bấm Chạy; code nháp giữa chừng lưu ở tầng 1 + một bảng nhẹ/`lesson_progress.metadata`. Sẽ chốt chi tiết ở Giai đoạn 3 (phương án đơn giản nhất: bản `attempt` gần nhất là nguồn khôi phục, localStorage là nguồn ưu tiên khi mới hơn).

### 8.3. Offline

`navigator.onLine` + bắt lỗi mạng của supabase-js → hiện banner *"Em đang offline. Code vẫn được lưu trên máy này, mình sẽ đồng bộ khi có mạng lại."* Hàng đợi ghi (`offlineQueue`) lưu trong localStorage, tự chạy lại khi có sự kiện `online`. Khi khôi phục: nếu bản localStorage **mới hơn** bản trên server → hỏi HS *"Máy này có bản code mới hơn. Em muốn dùng bản nào?"* thay vì tự ghi đè.

---

## 9. Rủi ro kỹ thuật & biện pháp

| # | Rủi ro | Mức | Biện pháp |
|---|---|---|---|
| **R1** | Interpreter phình to vô hạn (HS viết cú pháp ngoài dự kiến) | 🔴 Cao | **Đóng băng grammar ở 6.2** trước khi code. Mọi thứ ngoài phạm vi → `UNSUPPORTED_FEATURE` với thông báo thân thiện, **không bao giờ crash**. Bộ test "fuzz" bằng 200 mẫu code sai của HS thật. |
| **R2** | Vòng lặp vô hạn treo trình duyệt phòng ICT | 🔴 Cao | Web Worker + step budget + `terminate()` 2s. Đã thiết kế ở 6.3. |
| **R3** | Validator báo sai (HS làm đúng nhưng bị báo chưa đạt) → mất niềm tin | 🔴 Cao | Ưu tiên test theo **output/world state** hơn test cấu trúc. `requiredPatterns` chỉ dùng khi bài học *bắt buộc* dùng cấu trúc đó. Có nút **"Em nghĩ bài này bị lỗi"** ghi `activity_events` để GV xem lại. GV có quyền đánh dấu hoàn thành thủ công. |
| **R4** | RLS đệ quy vô hạn trên `profiles` | 🟠 Vừa | Hàm `SECURITY DEFINER is_teacher()` (mục 4.3). Có test SQL riêng. |
| **R5** | Học sinh lớp 8 không có email để đăng ký | 🔴 Cao | **Cần quyết định** — xem mục 12, câu hỏi Q1. |
| **R6** | GitHub Pages + SPA routing + Supabase redirect | 🟠 Vừa | `HashRouter` + PKCE + `redirectTo = origin + BASE_URL`. Redirect URL phải khai báo trong Supabase Dashboard → Auth → URL Configuration (cả `localhost:5173` lẫn domain Pages). |
| **R7** | Font tiếng Việt trong PDF bị lỗi dấu | 🟠 Vừa | `html2canvas` → ảnh (mục 7.4), không dùng text API của jsPDF. |
| **R8** | Máy phòng ICT dùng chung → HS quên đăng xuất | 🟠 Vừa | Nút Đăng xuất luôn hiển thị · cảnh báo "Máy dùng chung? Nhớ đăng xuất" · tuỳ chọn phiên ngắn. |
| **R9** | Supabase Free tier tự tạm dừng project sau 7 ngày không hoạt động | 🟠 Vừa | Cảnh báo trong README; GV mở project trước tiết dạy; hoặc dùng cron ping. Quan trọng với kỳ nghỉ hè. |
| **R10** | Khối lượng soạn nội dung (~45 challenge, mỗi cái cần 3 hint + test + lỗi phổ biến) | 🔴 Cao | Đây là công việc **nặng nhất**, không phải code. Có `contentSchema` + script `npm run validate:content` kiểm tra mọi challenge đủ 3 hint, có test, `starterCode` parse được. Soạn theo thứ tự l1 → l5 để dạy song song. |
| **R11** | Máy phòng ICT cấu hình yếu / trình duyệt cũ | 🟠 Vừa | CodeMirror 6 thay Monaco (~10× nhẹ hơn) · target build `es2019` · code-splitting theo route · kiểm thử thật trên máy phòng ICT trước khi dạy. |
| **R12** | 45 phút/tiết không đủ cho 1 khu vực | 🟡 Thấp | Mỗi node ≤ 5 phút, tiến trình lưu tự động → dừng và tiếp tục bất cứ lúc nào. Banner nhắc website là công cụ hỗ trợ *một phần* tiết học. |

---

## 10. Phạm vi MVP

### ✅ TRONG phạm vi (bắt buộc — theo mục 30)

1. Supabase Auth: đăng ký / đăng nhập / đăng xuất / quên mật khẩu / khôi phục phiên
2. Hồ sơ học sinh + avatar minh hoạ + vai trò `student`/`teacher`
3. Dashboard học sinh đầy đủ theo mục 15
4. **5 bài học hoàn chỉnh** (~45 challenge) đúng thứ tự: cú pháp → hàm → `for` → `if` → `if–else`
5. Code editor CodeMirror 6 với đủ 13 tính năng mục 7
6. Interpreter + validator + Clean Code Coach
7. Bộ chẩn đoán 16 mã lỗi tiếng Việt
8. Hệ thống gợi ý 3 cấp
9. Lưu tiến trình + autosave + offline fallback
10. Boss Challenge mỗi bài
11. 5 chứng chỉ + PDF phía trình duyệt
12. Bản đồ 5 khu vực, XP, cấp độ, sao, 10 huy hiệu
13. Sổ tay lệnh 12 thẻ + tìm kiếm
14. Chế độ Demo không đăng nhập
15. Dashboard giáo viên (danh sách, lọc lớp, chi tiết, lỗi phổ biến, CSV, mở/khoá bài, bật đáp án, reset challenge)
16. Migration SQL + RLS đầy đủ
17. Accessibility cơ bản + reduce-motion + responsive
18. Vitest cho toàn bộ mục 27
19. GitHub Actions deploy Pages + README tiếng Việt

### ❌ NGOÀI phạm vi MVP

Trình biên dịch C++ thật · leaderboard công khai · thi đấu nhóm · GV tự tạo bài qua giao diện · tích hợp LMS · Phaser · âm thanh nền · chat/diễn đàn · upload ảnh đại diện thật · thông báo email · ứng dụng di động · đa ngôn ngữ · Supabase Storage · Edge Functions.

### 📅 Ước lượng công việc

| Giai đoạn | Nội dung | Ước lượng |
|---|---|---|
| 2 | Khởi tạo, routing, theme, Supabase client, Auth, layout, dashboard cơ bản | ~15% |
| 3 | Lesson/Challenge engine, editor, **interpreter + validator**, hint, autosave | ~35% ⚠ nặng nhất |
| 4 | Bản đồ, XP, level, badge, animation, boss | ~15% |
| 5 | Chứng chỉ + PDF, dashboard HS/GV, CSV | ~15% |
| 6 | Test, a11y, responsive, error/offline, Pages, README | ~20% |
| — | **Soạn nội dung 5 bài** (song song từ GĐ3) | *khối lượng riêng, lớn nhất* |

---

## 11. Tài nguyên mở dự kiến (có ghi nguồn)

| Loại | Nguồn | Giấy phép |
|---|---|---|
| Font chữ | Be Vietnam Pro, Nunito (Google Fonts) | SIL OFL 1.1 |
| Font code | JetBrains Mono | SIL OFL 1.1 |
| Icon giao diện | Lucide Icons | ISC |
| Icon huy hiệu / trang trí | Game-icons.net | CC BY 3.0 |
| Hình nền / tile bản đồ (nếu cần) | Kenney.nl Game Assets | CC0 |
| Âm thanh phản hồi (tuỳ chọn) | Kenney UI Audio / Freesound CC0 | CC0 |
| Nhân vật Byte, 5 khu vực, chứng chỉ | **Tự thiết kế bằng SVG** | gốc |

Tạo `CREDITS.md` liệt kê đầy đủ nguồn + giấy phép. **Không sao chép giao diện, nhân vật hay tài sản của CodeCombat / Swift Playgrounds.**

---

## 12. Quyết định đã chốt (thầy Vương xác nhận)

| # | Nội dung | Quyết định | Ảnh hưởng tới thiết kế |
|---|---|---|---|
| **Q1** | Tài khoản học sinh | **HS tự đăng ký bằng email thật** | Form đăng ký công khai: email · mật khẩu · họ tên · lớp · mã HS (tuỳ chọn). `role` luôn bị trigger ép về `'student'`. **Không cần** script tạo hàng loạt ở MVP. → Xem ghi chú Q1b bên dưới. |
| **Q1b** | Xác nhận email | **Đề xuất TẮT** `Confirm email` trong Supabase | Vì HS đăng ký ngay trong tiết học, nếu bật thì các em phải mở Gmail, chờ mail, dễ mất 10 phút của tiết. Có thể bật lại sau. *Cần thầy xác nhận điểm này ở Giai đoạn 2.* |
| **Q3** | GitHub Pages | **Project repo** (`username.github.io/<ten-repo>`) | Vite `base` đọc từ biến `VITE_BASE_PATH` (mặc định suy ra từ tên repo trong GitHub Actions). Redirect URL Supabase = `https://<user>.github.io/<repo>/`. Vẫn hoạt động nếu sau này đổi sang repo `username.github.io`. |
| **Q4** | Ngôn ngữ đặt tên | **Toàn bộ tiếng Anh** | Hàm game: `moveForward()` · `openDoor()` · `turnOnLight()` · `activateBridge()` · `turn(...)`. Biến mẫu: `score`, `count`, `energy`, `hasKey`, `i`. Clean Code Coach dùng từ điển động từ tiếng Anh (`move`, `open`, `turn`, `draw`, `print`, `check`, `calc`…). Phần **giải thích, tình huống, thông báo lỗi, gợi ý vẫn 100% tiếng Việt**. |
| **Q5** | Supabase | **Chưa có project** | Giai đoạn 2 mở đầu bằng hướng dẫn từng bước: tạo project → lấy URL + publishable key → cấu hình Redirect URL (`localhost:5173` + domain Pages) → chạy migration trong SQL Editor. |

### Điều chỉnh kéo theo từ Q1 (HS tự đăng ký email thật)

- Thêm **rate limit phía UI** cho form đăng ký + kiểm tra định dạng email trước khi gọi Supabase.
- Thêm màn hình **"Kiểm tra hộp thư"** để dự phòng trường hợp thầy quyết định bật xác nhận email.
- Trang **Quên mật khẩu hoạt động thật** (vì có email thật) → giảm rủi ro R8 (HS quên mật khẩu giữa tiết).
- Chỉ thu thập: email, họ tên, lớp, mã HS (tuỳ chọn). **Không** thu số điện thoại, ngày sinh, địa chỉ, ảnh thật — đúng mục 22.
- Trong Supabase Auth bật **"Prevent use of leaked passwords"** và đặt độ dài tối thiểu 8 ký tự.

### Điều chỉnh kéo theo từ Q4 (toàn bộ tiếng Anh)

Ví dụ một challenge ở Khu vực 3 sau khi chốt quy ước:

```cpp
#include <iostream>
using namespace std;

void moveForward() {
    cout << "Guardian tien len 1 o" << endl;
}

int main() {
    for (int step = 0; step < 5; step++) {
        moveForward();
    }
    return 0;
}
```

Thông báo lỗi tương ứng vẫn tiếng Việt: *"Vòng lặp chạy 4 lần nhưng con đường có 5 ô. Em thử kiểm tra lại điều kiện `step < ...` nhé."*

---

*Hết Giai đoạn 1. Chờ thầy duyệt kiến trúc trước khi bắt đầu Giai đoạn 2 — Khởi tạo dự án.*
