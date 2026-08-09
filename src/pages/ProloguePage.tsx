import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Lightbulb, ListChecks, Play, Sparkles } from 'lucide-react';
import { PROLOGUE } from '@/data/prologue';
import { ByteMascot } from '@/components/game/ByteMascot';
import { Button } from '@/components/ui/Button';
import { RichText } from '@/components/common/RichText';
import {
  AmbiguitySpotActivity,
  StepOrderingActivity,
} from '@/components/learning/AlgorithmActivities';
import { useAuthStore } from '@/stores/authStore';
import { getIcon } from '@/utils/icons';
import { cn } from '@/utils/cn';

/**
 * Trang mở đầu — "Thuật toán là gì?".
 *
 * Đặt TRƯỚC Khu vực 1 và mở cho tất cả mọi người: đây là nội dung nền, không
 * gắn tiến trình, không cấp chứng chỉ. Cả trang KHÔNG có một dòng C++ nào —
 * chủ ý là tách hẳn việc "nghĩ ra các bước" khỏi việc "viết bằng ngôn ngữ nào".
 */
export function ProloguePage() {
  const isSignedIn = useAuthStore((state) => state.status === 'authenticated');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-5">
      {/* --- Mở đầu --- */}
      <header className="text-center">
        <ByteMascot size={80} className="mx-auto" mood="thinking" />
        <p className="mt-3 inline-block px-3 py-1 rounded-full bg-mage-500/15 text-mage-300 text-xs font-semibold">
          Phần mở đầu · Chưa cần viết code
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-100">{PROLOGUE.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{PROLOGUE.subtitle}</p>
      </header>

      <section className="cq-card p-5 border-mage-400/40 bg-mage-500/5">
        <p className="text-base text-slate-200 leading-relaxed">{PROLOGUE.intro}</p>
      </section>

      {/* --- Định nghĩa --- */}
      <section className="cq-card p-5" aria-labelledby="definition-heading">
        <h2 id="definition-heading" className="text-lg font-bold text-slate-100 mb-3">
          Nói cho gọn thì thuật toán là gì?
        </h2>

        <blockquote className="border-l-4 border-quest-500 pl-4 py-1">
          <p className="text-base font-semibold text-quest-400 leading-relaxed">
            {PROLOGUE.definition.plain}
          </p>
        </blockquote>

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-4 mb-1">
          Cách nói chặt chẽ hơn, kiểu sách giáo khoa
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">{PROLOGUE.definition.formal}</p>

        <p className="text-sm text-slate-400 leading-relaxed mt-3">
          {PROLOGUE.definition.bridge}
        </p>
      </section>

      {/* --- Ví dụ đời thường --- */}
      <section className="cq-card p-5" aria-labelledby="everyday-heading">
        <h2
          id="everyday-heading"
          className="flex items-center gap-2 text-lg font-bold text-slate-100 mb-1"
        >
          <ListChecks className="size-5 text-verdant-400" aria-hidden="true" />
          Em đã dùng thuật toán mỗi ngày rồi
        </h2>

        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {PROLOGUE.everydayExamples.map((example) => (
            <div key={example.title} className="cq-panel p-4">
              <p className="font-semibold text-slate-100 mb-2">{example.title}</p>
              <ol className="space-y-1 list-none">
                {example.steps.map((step, index) => (
                  <li key={index} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-slate-500 tabular-nums shrink-0" aria-hidden="true">
                      {index + 1}.
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <p className="text-sm font-medium text-verdant-400 leading-relaxed mt-3">
          {PROLOGUE.everydayPunchline}
        </p>
      </section>

      {/* --- Năm tính chất --- */}
      <section aria-labelledby="properties-heading">
        <h2 id="properties-heading" className="text-lg font-bold text-slate-100 mb-1">
          Một dãy bước phải đạt năm điều này mới gọi là thuật toán
        </h2>
        <p className="text-sm text-slate-400 mb-3">
          Với mỗi điều, em so hai ví dụ để thấy rõ ranh giới.
        </p>

        <ul className="space-y-3 list-none">
          {PROLOGUE.properties.map((property, index) => (
            <li key={property.id} className="cq-card p-4">
              <div className="flex items-start gap-3">
                <span
                  className="grid place-items-center size-8 rounded-xl bg-quest-500/15 text-quest-400 text-sm font-bold shrink-0"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-100">{property.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mt-1">{property.body}</p>

                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    <div className="rounded-lg border border-verdant-500/30 bg-verdant-500/5 p-2.5">
                      <p className="text-xs font-bold text-verdant-400 mb-0.5">Đạt yêu cầu</p>
                      <p className="text-sm text-slate-300">{property.good}</p>
                    </div>
                    <div className="rounded-lg border border-treasure-400/30 bg-treasure-400/5 p-2.5">
                      <p className="text-xs font-bold text-treasure-300 mb-0.5">Chưa đạt</p>
                      <p className="text-sm text-slate-300">{property.bad}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* --- Hoạt động 1 --- */}
      <StepOrderingActivity activity={PROLOGUE.orderingActivity} />

      {/* --- Vì sao máy tính khó tính --- */}
      <section className="cq-card p-5" aria-labelledby="strict-heading">
        <h2
          id="strict-heading"
          className="flex items-center gap-2 text-lg font-bold text-slate-100 mb-2"
        >
          <Bot className="size-5 text-quest-400" aria-hidden="true" />
          {PROLOGUE.whyComputersAreStrict.title}
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {PROLOGUE.whyComputersAreStrict.body}
        </p>
        <div className="mt-3 flex gap-2 items-start rounded-lg bg-quest-500/10 border border-quest-500/30 p-3">
          <ArrowRight className="size-4 text-quest-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-quest-400 leading-relaxed">
            <RichText text={PROLOGUE.whyComputersAreStrict.bridge} />
          </p>
        </div>
      </section>

      {/* --- Hoạt động 2 --- */}
      <AmbiguitySpotActivity activity={PROLOGUE.ambiguityActivity} />

      {/* --- Ba khối xây dựng --- */}
      <section aria-labelledby="blocks-heading">
        <h2
          id="blocks-heading"
          className="flex items-center gap-2 text-lg font-bold text-slate-100 mb-1"
        >
          <Sparkles className="size-5 text-treasure-400" aria-hidden="true" />
          Mọi thuật toán chỉ ghép từ ba kiểu bước
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          {PROLOGUE.buildingBlocksIntro}
        </p>

        <ul className="space-y-3 list-none">
          {PROLOGUE.buildingBlocks.map((block) => {
            const Icon = getIcon(block.icon);

            return (
              <li key={block.id} className="cq-card p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="grid place-items-center size-10 rounded-xl bg-treasure-400/15 text-treasure-400 shrink-0"
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-100">{block.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-abyss-700 text-slate-400">
                        {block.zoneLabel}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed mt-1">{block.body}</p>
                    <p className="text-sm text-slate-400 mt-1.5">
                      <span className="text-slate-500">Ngoài đời: </span>
                      {block.everydayExample}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-sm font-medium text-treasure-300 leading-relaxed mt-3">
          {PROLOGUE.buildingBlocksPunchline}
        </p>
      </section>

      {/* --- Hiểu lầm thường gặp --- */}
      <section className="cq-card p-5" aria-labelledby="misconceptions-heading">
        <h2
          id="misconceptions-heading"
          className="flex items-center gap-2 text-lg font-bold text-slate-100 mb-3"
        >
          <Lightbulb className="size-5 text-alert-400" aria-hidden="true" />
          Bốn điều rất nhiều bạn hiểu nhầm
        </h2>

        <ul className="space-y-3 list-none">
          {PROLOGUE.misconceptions.map((item, index) => (
            <li key={index} className="cq-panel p-3 space-y-2">
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="font-bold text-alert-400">Nhiều bạn nghĩ: </span>
                {item.wrong}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">
                <span className="font-bold text-verdant-400">Thật ra: </span>
                {item.right}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-slate-500">Vì sao điều này quan trọng: </span>
                {item.why}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* --- Chốt lại --- */}
      <section className={cn('cq-card p-5 text-center border-quest-500/40 bg-quest-500/5')}>
        <ByteMascot size={56} className="mx-auto" mood="cheer" />
        <p className="text-base text-slate-200 leading-relaxed mt-3">{PROLOGUE.closing}</p>

        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {isSignedIn ? (
            <Link to="/app/lesson/l1">
              <Button
                leadingIcon={<Play className="size-4" aria-hidden="true" />}
                trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
              >
                Vào Làng Khởi Động
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/register">
                <Button leadingIcon={<Play className="size-4" aria-hidden="true" />}>
                  Tạo tài khoản để bắt đầu
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="secondary">Thử một nhiệm vụ mẫu</Button>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
