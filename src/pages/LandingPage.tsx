import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Bug,
  CheckCircle2,
  Code2,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Map,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { ByteMascot } from '@/components/game/ByteMascot';
import { LESSONS_META } from '@/data/lessons.meta';
import { getIcon } from '@/utils/icons';

const HIGHLIGHTS = [
  {
    icon: Code2,
    title: 'Gõ C++ thật từ bài đầu tiên',
    body: 'Không kéo thả khối lệnh. Em viết code, bấm chạy và nhìn nhân vật thực hiện đúng từng câu lệnh của mình.',
  },
  {
    icon: Bug,
    title: 'Hiểu lỗi bằng tiếng Việt',
    body: 'Hệ thống chỉ đúng dòng và giải thích gần gũi, thay vì để em mắc kẹt với một dòng “Syntax error” khó hiểu.',
  },
  {
    icon: Lightbulb,
    title: 'Gợi ý nhưng không làm hộ',
    body: 'Ba mức gợi ý đi từ câu hỏi định hướng đến khung code. Đáp án chỉ mở khi em thật sự cần.',
  },
  {
    icon: ShieldCheck,
    title: 'Sai không mất điểm',
    body: 'Code luôn được giữ lại, không giới hạn số lần chạy và không có màn hình “Thất bại”. Mỗi lần sai là một lần tìm Bug.',
  },
];

const LEARNING_LOOP = [
  {
    step: '01',
    icon: Brain,
    title: 'Hiểu nhiệm vụ',
    body: 'Đọc tình huống, quan sát bản đồ và tự nói ra các bước trước khi gõ code.',
  },
  {
    step: '02',
    icon: Code2,
    title: 'Viết và chạy C++',
    body: 'Dùng trình soạn thảo thật, chạy an toàn ngay trên trình duyệt và xem Byte hành động.',
  },
  {
    step: '03',
    icon: Trophy,
    title: 'Sửa Bug, mở khóa',
    body: 'Nhận phản hồi, cải thiện code, thu thập sao và mở khu vực tiếp theo của ByteLand.',
  },
];

const COURSE_STATS = [
  { value: '45', label: 'nhiệm vụ C++' },
  { value: '5', label: 'khu vực phiêu lưu' },
  { value: '3', label: 'cấp gợi ý' },
  { value: '100%', label: 'phản hồi tiếng Việt' },
];

export function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero: cho thấy sản phẩm thật ngay trong màn hình đầu tiên. */}
      <section className="relative border-b border-abyss-800">
        <div className="cq-hero-grid absolute inset-0" aria-hidden="true" />
        <div
          className="absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-quest-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-[0.94fr_1.06fr] lg:py-24">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-mage-400/30 bg-mage-500/10 px-3 py-1.5 text-xs font-bold text-mage-300">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Khóa học C++ dạng game dành riêng cho lớp 8
            </p>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-100 sm:text-5xl lg:text-6xl">
              Viết code thật.
              <span className="mt-1 block text-quest-400">Thấy ByteLand đổi thay.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg lg:mx-0">
              Vào vai <strong className="text-slate-200">Code Guardian</strong>, điều khiển nhân
              vật bằng C++, sửa những Bug đang phá hoại thế giới và học cách tư duy như một lập
              trình viên — từng nhiệm vụ ngắn, rõ ràng, vừa sức.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Link
                to="/demo"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-quest-600 px-7 text-lg font-bold text-onaccent shadow-lg shadow-quest-600/25 transition hover:bg-quest-500"
              >
                <Play className="size-5" aria-hidden="true" />
                Chơi thử ngay
              </Link>
              <Link
                to="/auth/register"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-abyss-500 bg-abyss-800 px-7 text-base font-semibold text-slate-100 transition hover:border-quest-500/60 hover:bg-abyss-700"
              >
                Tạo hồ sơ Guardian
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Không cần đăng nhập để chơi thử · Code được chạy an toàn trong trình duyệt
            </p>
          </div>

          {/* Mô phỏng đúng trải nghiệm cốt lõi: đề bài, thế giới và code nằm cạnh nhau. */}
          <div className="relative mx-auto w-full max-w-2xl" aria-label="Xem trước một nhiệm vụ CodeQuest">
            <div
              className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-quest-500/15 via-mage-500/10 to-transparent blur-2xl"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-2xl border border-abyss-500 bg-abyss-900 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-abyss-700 bg-abyss-800/90 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-alert-400" />
                  <span className="size-2.5 rounded-full bg-treasure-400" />
                  <span className="size-2.5 rounded-full bg-verdant-400" />
                  <span className="ml-2 text-xs font-semibold text-slate-300">
                    Nhiệm vụ 1 · Viên ngọc thất lạc
                  </span>
                </div>
                <span className="rounded-md bg-treasure-400/15 px-2 py-1 text-[10px] font-bold text-treasure-300">
                  +30 XP
                </span>
              </div>

              <div className="grid sm:grid-cols-[0.92fr_1.08fr]">
                <div className="border-b border-abyss-700 bg-[radial-gradient(circle_at_50%_15%,rgba(34,211,238,0.13),transparent_55%)] p-4 sm:border-b-0 sm:border-r">
                  <div className="flex items-start gap-2.5">
                    <ByteMascot size={42} animated={false} />
                    <p className="text-xs leading-relaxed text-slate-300">
                      Viên ngọc năng lượng ở phía trước. Hãy ra lệnh để Byte bước tới và nhặt nó!
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl border border-abyss-600 bg-abyss-950/80 p-3">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <span>Bản đồ</span>
                      <span className="text-verdant-400">Đang chờ lệnh</span>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
                      <span className="grid size-11 place-items-center rounded-lg border border-quest-500/50 bg-quest-500/10 shadow-lg shadow-quest-500/10">
                        <ByteMascot size={34} animated={false} />
                      </span>
                      {[1, 2, 3].map((cell) => (
                        <span
                          key={cell}
                          className="size-11 rounded-lg border border-abyss-600 bg-abyss-800"
                        />
                      ))}
                      <span className="grid size-11 place-items-center rounded-lg border-2 border-treasure-400/70 bg-treasure-400/10">
                        <Sparkles className="size-5 text-treasure-300" />
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-abyss-800 px-3 py-2 text-xs text-slate-400">
                      <TargetDot />
                      Mục tiêu: đi 4 ô và thu thập viên ngọc
                    </div>
                  </div>
                </div>

                <div className="bg-[#07101f] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-200">Code của em</p>
                    <span className="text-[10px] text-slate-500">main.cpp</span>
                  </div>
                  <pre className="mt-3 overflow-hidden rounded-xl border border-abyss-700 bg-[#050a13] p-3 text-[11px] leading-6 text-slate-300 sm:text-xs">
                    <code>
                      <span className="text-mage-300">int</span> main() {'{'}{`\n`}
                      {'  '}<span className="text-quest-400">moveForward</span>();{`\n`}
                      {'  '}<span className="text-quest-400">moveForward</span>();{`\n`}
                      {'  '}<span className="text-quest-400">moveForward</span>();{`\n`}
                      {'  '}<span className="text-quest-400">moveForward</span>();{`\n`}
                      {'  '}<span className="text-treasure-300">collectGem</span>();{`\n`}
                      {'}'}
                    </code>
                  </pre>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
                      <CheckCircle2 className="size-3.5 text-verdant-400" aria-hidden="true" />
                      Tự động lưu
                    </span>
                    <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-quest-600 px-3 text-xs font-bold text-onaccent">
                      <Play className="size-3.5" aria-hidden="true" />
                      Chạy code
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-2 hidden items-center gap-2 rounded-xl border border-treasure-400/40 bg-abyss-800 px-3 py-2 shadow-xl sm:flex">
              <Star className="size-4 fill-treasure-400 text-treasure-400" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-200">Sao thứ nhất đang chờ em!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Các con số giúp học sinh và giáo viên hiểu quy mô khóa học ngay. */}
      <section aria-label="Quy mô khóa học" className="border-b border-abyss-800 bg-abyss-900/50">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 py-6 sm:grid-cols-4">
          {COURSE_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-3 py-2 text-center ${index > 0 ? 'sm:border-l sm:border-abyss-700' : ''}`}
            >
              <dt className="text-2xl font-extrabold text-slate-100">{stat.value}</dt>
              <dd className="text-xs text-slate-400">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Vòng lặp học tập cốt lõi. */}
      <section id="cach-hoc" aria-labelledby="learning-loop-heading" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-quest-400">
            Mỗi nhiệm vụ là một vòng học ngắn
          </p>
          <h2 id="learning-loop-heading" className="mt-2 text-3xl font-extrabold text-slate-100">
            Học bằng cách làm — và thấy kết quả ngay
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            Mọi thứ được thiết kế để học sinh lớp 8 dành nhiều thời gian cho tư duy và viết code,
            ít thời gian loay hoay với công cụ.
          </p>
        </div>

        <ol className="relative mt-10 grid gap-4 md:grid-cols-3">
          {LEARNING_LOOP.map((item, index) => (
            <li key={item.step} className="cq-card relative p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-quest-500/15 text-quest-400">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-2xl font-bold text-abyss-500">{item.step}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-100">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.body}</p>
              {index < LEARNING_LOOP.length - 1 && (
                <ArrowRight
                  className="absolute -right-3 top-1/2 z-10 hidden size-5 text-quest-500 md:block"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Bản đồ khóa học. */}
      <section id="ban-do" aria-labelledby="zones-heading" className="border-y border-abyss-800 bg-abyss-900/55">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-mage-300">
                Hành trình giải cứu ByteLand
              </p>
              <h2 id="zones-heading" className="mt-2 text-3xl font-extrabold text-slate-100">
                Năm khu vực, một lộ trình C++ vừa sức
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Kiến thức mở dần theo đúng thứ tự: thuật toán → hàm → vòng lặp → điều kiện → bài
                tổng hợp. Mỗi khu vực có 9 nhiệm vụ và một bài tự kiểm tra ngắn.
              </p>
            </div>
            <Link
              to="/map-preview"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-quest-400 hover:text-quest-500"
            >
              Xem toàn bộ bản đồ
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LESSONS_META.map((lesson) => {
              const Icon = getIcon(lesson.icon);
              return (
                <li key={lesson.id} className="group cq-card p-4 transition hover:-translate-y-1 hover:border-quest-500/50">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-quest-500/15 text-quest-400 transition group-hover:bg-quest-500/25">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">0{lesson.order}</span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-100">{lesson.zoneName}</h3>
                  <p className="mt-1 text-sm text-slate-400">{lesson.title}</p>
                  <p className="mt-3 text-xs text-slate-500">{lesson.challengeCount} nhiệm vụ</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Giá trị sư phạm. */}
      <section aria-labelledby="difference-heading" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-verdant-400">
              Tự tin thử, bình tĩnh sửa
            </p>
            <h2 id="difference-heading" className="mt-2 text-3xl font-extrabold text-slate-100">
              Một môi trường học không làm em sợ sai
            </h2>
            <p className="mt-3 leading-relaxed text-slate-400">
              CodeQuest giữ độ thử thách của lập trình thật, nhưng loại bỏ những rào cản không cần
              thiết đối với người mới học: lỗi khó hiểu, mất code và áp lực phải đúng ngay lần đầu.
            </p>
            <Link
              to="/prologue"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-mage-400/40 bg-mage-500/10 px-4 py-3 text-sm font-semibold text-mage-300 transition hover:border-mage-400/70"
            >
              <Brain className="size-4" aria-hidden="true" />
              Đọc thử “Thuật toán là gì?”
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => (
              <article key={item.title} className="cq-card p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-mage-500/15 text-mage-300">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-bold text-slate-100">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Khu vực dành cho giáo viên. */}
      <section aria-labelledby="teacher-heading" className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-quest-500/30 bg-gradient-to-br from-abyss-800 to-abyss-900 p-6 sm:p-10">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-mage-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-quest-400">
                <GraduationCap className="size-4" aria-hidden="true" />
                Đồng hành cùng giáo viên
              </span>
              <h2 id="teacher-heading" className="mt-3 text-2xl font-extrabold text-slate-100 sm:text-3xl">
                Nhìn thấy em nào đang mắc kẹt — trước khi em ấy bỏ cuộc
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Bảng theo dõi tổng hợp tiến trình, lỗi thường gặp, mức độ hoạt động và câu hỏi của
                học sinh. Giáo viên có thể mở bài theo lớp, xem code và hỗ trợ đúng chỗ cần thiết.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/auth/login"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-quest-600 px-5 font-semibold text-onaccent transition hover:bg-quest-500"
                >
                  Đăng nhập giáo viên
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/handbook"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-abyss-500 bg-abyss-700 px-5 font-semibold text-slate-100 transition hover:bg-abyss-600"
                >
                  <BookOpen className="size-4" aria-hidden="true" />
                  Xem sổ tay lệnh
                </Link>
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: Users, text: 'Quản lý lớp bằng mã tham gia riêng' },
                { icon: Map, text: 'Theo dõi tiến trình từng khu vực' },
                { icon: Gamepad2, text: 'Xem lỗi phổ biến và hỗ trợ đúng lúc' },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 rounded-xl border border-abyss-600 bg-abyss-950/45 p-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-verdant-500/15 text-verdant-400">
                    <item.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-slate-200">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA kết thúc. */}
      <section className="border-t border-abyss-800 bg-abyss-900/50">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-16">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-quest-600 text-onaccent shadow-lg shadow-quest-600/25">
            <Zap className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-100 sm:text-3xl">
            ByteLand đang chờ Code Guardian tiếp theo
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
            Thử nhiệm vụ đầu tiên trong vài phút. Không cần tài khoản, không sợ mất điểm.
          </p>
          <Link
            to="/demo"
            className="mt-6 inline-flex h-13 items-center gap-2 rounded-xl bg-treasure-500 px-7 text-lg font-bold text-onaccent shadow-lg shadow-treasure-500/20 transition hover:brightness-110"
          >
            <Gamepad2 className="size-5" aria-hidden="true" />
            Bắt đầu chơi thử
          </Link>
        </div>
      </section>
    </div>
  );
}

/** Chấm mục tiêu nhỏ dùng trong mô phỏng game, giữ hình vẽ bằng CSS. */
function TargetDot() {
  return (
    <span className="relative grid size-4 shrink-0 place-items-center" aria-hidden="true">
      <span className="absolute size-4 rounded-full border border-treasure-400/50" />
      <span className="size-1.5 rounded-full bg-treasure-400" />
    </span>
  );
}
