import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, Check, Gamepad2, Map, Sparkles } from 'lucide-react';
import { LESSONS_META } from '@/data/lessons.meta';
import { ZoneCard } from '@/components/game/ZoneCard';

/** Xem trước lộ trình khi chưa đăng nhập. */
export function MapPreviewPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-abyss-800">
        <div className="cq-hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:py-16">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-mage-500/15 text-mage-300">
            <Map className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-mage-300">
            Lộ trình CodeQuest C++ 8
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-100 sm:text-4xl">
            Bản đồ hành trình ByteLand
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Hành trình bắt đầu bằng chương trình C++ thật và thuật toán đường đi, sau đó mở dần
            tới hàm, tham chiếu, mảng, tìm kiếm và sắp xếp dành cho học sinh muốn đi xa hơn.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
            {['50 nhiệm vụ', '11 bài hướng dẫn', '11 checkpoint', '11 chứng chỉ'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-verdant-400" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <section aria-labelledby="journey-heading">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-quest-400">
                Mở khóa tuần tự
              </p>
              <h2 id="journey-heading" className="mt-1 text-2xl font-extrabold text-slate-100">
                11 chặng trưởng thành của một Code Guardian
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-slate-400 sm:text-right">
              Mỗi thẻ dưới đây là một khu vực có thể khám phá. Khi học thật, em hoàn thành khu vực
              trước để mở khu vực tiếp theo.
            </p>
          </div>

          <ol className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {LESSONS_META.map((lesson) => (
              <ZoneCard
                key={lesson.id}
                lesson={lesson}
                lockState="locked"
                progressPercent={0}
                stars={0}
                preview
              />
            ))}
          </ol>
        </section>

        {/* Kiến thức luôn mở: tạo một lối vào rõ ràng thay vì chỉ là ghi chú dưới bản đồ. */}
        <section className="mt-10 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]" aria-labelledby="guides-heading">
          <div className="cq-card border-mage-400/40 bg-mage-500/5 p-5 sm:p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-mage-500/20 text-mage-300">
              <Brain className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-mage-300">
              Nên đọc đầu tiên
            </p>
            <h2 id="guides-heading" className="mt-1 text-xl font-bold text-slate-100">
              Thuật toán là gì?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Bắt đầu từ cách chia một việc thành các bước máy hiểu được. Phần này chưa cần viết
              một dòng C++ nào và luôn mở cho mọi học sinh.
            </p>
            <Link
              to="/prologue"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-mage-300 hover:text-mage-400"
            >
              Đọc phần mở đầu
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="cq-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-quest-500/15 text-quest-400">
                <BookOpen className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Thư viện kiến thức mở</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Đọc thử cách CodeQuest giải thích “vì sao cần lệnh mới” trước khi dạy cú pháp.
                </p>
              </div>
            </div>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {LESSONS_META.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    to={`/guide/${lesson.id}`}
                    className="group flex h-full items-center gap-3 rounded-xl border border-abyss-700 bg-abyss-900 p-3 transition hover:border-quest-500/50"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-abyss-700 font-mono text-xs font-bold text-slate-300">
                      {lesson.order}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-200">
                        {lesson.title}
                      </span>
                      <span className="block text-xs text-slate-500">{lesson.zoneName}</span>
                    </span>
                    <ArrowRight className="size-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-quest-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative mt-10 overflow-hidden rounded-2xl border border-quest-500/35 bg-gradient-to-br from-quest-500/10 via-abyss-800 to-mage-500/10 p-6 text-center sm:p-8">
          <Sparkles className="mx-auto size-7 text-treasure-400" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-extrabold text-slate-100">Muốn bước vào bản đồ thật?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Chơi một nhiệm vụ mẫu trước, hoặc tạo hồ sơ để lưu tiến trình, XP, sao, huy hiệu và
            chứng chỉ của riêng em.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/demo"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-treasure-500 px-5 font-bold text-onaccent shadow-lg shadow-treasure-500/20 transition hover:brightness-110"
            >
              <Gamepad2 className="size-4" aria-hidden="true" />
              Chơi thử nhiệm vụ
            </Link>
            <Link
              to="/auth/register"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-quest-600 px-5 font-bold text-onaccent shadow-lg shadow-quest-600/20 transition hover:bg-quest-500"
            >
              Tạo hồ sơ Guardian
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
