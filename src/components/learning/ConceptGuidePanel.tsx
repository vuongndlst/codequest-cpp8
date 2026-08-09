import type { ConceptGuide } from '@/types/content';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CircleHelp,
  Lightbulb,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { ByteMascot } from '@/components/game/ByteMascot';
import { RichText } from '@/components/common/RichText';
import { cn } from '@/utils/cn';

/**
 * Phần DẠY TƯ DUY của một khu vực.
 *
 * Thứ tự trình bày là có chủ đích và không nên đảo:
 *   ① câu hỏi lớn → ② nêu vấn đề → ③ lệnh mới cứu ta → ④ mô hình tư duy
 *   → ⑤ quy trình nghĩ → ⑥ dùng/không dùng → ⑦ hiểu lầm
 *
 * Học sinh phải CẢM THẤY cái khổ ở bước ② thì bước ③ mới có ý nghĩa. Nếu đưa
 * cú pháp ra trước, các em sẽ học vẹt và quên sau một tuần.
 */
export function ConceptGuidePanel({ guide }: { guide: ConceptGuide }) {
  return (
    <article className="space-y-4">
      {/* ① Câu hỏi lớn */}
      <section className="cq-card p-5 border-mage-400/40 bg-mage-500/5">
        <div className="flex gap-3">
          <ByteMascot size={48} mood="thinking" animated={false} />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-mage-300">
              Câu hỏi của khu vực này
            </p>
            <h2 className="text-lg font-bold text-slate-100 mt-1 leading-snug">
              {guide.bigQuestion}
            </h2>
          </div>
        </div>
      </section>

      {/* ② Vấn đề trước đã */}
      <GuideSection
        step="1"
        icon={<AlertTriangle className="size-5" />}
        tone="treasure"
        title={guide.problem.title}
      >
        <p className="text-sm text-slate-300 leading-relaxed"><RichText text={guide.problem.body} /></p>
        <CodeBlock code={guide.problem.painfulExample} tone="warning" />
        <p className="text-sm font-medium text-treasure-300 leading-relaxed">
          <RichText text={guide.problem.punchline} />
        </p>
      </GuideSection>

      {/* ③ Lệnh mới giải quyết thế nào */}
      <GuideSection
        step="2"
        icon={<Sparkles className="size-5" />}
        tone="verdant"
        title={guide.solution.title}
      >
        <p className="text-sm text-slate-300 leading-relaxed"><RichText text={guide.solution.body} /></p>
        <CodeBlock code={guide.solution.cleanExample} tone="good" />
        <div className="flex gap-2 items-start rounded-lg bg-verdant-500/10 border border-verdant-500/30 p-3">
          <ArrowRight className="size-4 text-verdant-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-verdant-400 leading-relaxed"><RichText text={guide.solution.whatChanged} /></p>
        </div>
      </GuideSection>

      {/* ④ Mô hình tư duy */}
      <GuideSection
        step="3"
        icon={<Brain className="size-5" />}
        tone="mage"
        title="Cách hình dung cho dễ nhớ"
      >
        <p className="text-base font-semibold text-mage-300 leading-relaxed">
          <RichText text={guide.mentalModel.analogy} />
        </p>
        <p className="text-sm text-slate-300 leading-relaxed"><RichText text={guide.mentalModel.explanation} /></p>
      </GuideSection>

      {/* ⑤ Quy trình tư duy */}
      <GuideSection
        step="4"
        icon={<CircleHelp className="size-5" />}
        tone="quest"
        title="Gặp bài mới thì nghĩ theo thứ tự này"
      >
        <p className="text-sm text-slate-400 leading-relaxed">
          Đây không phải đáp án — đây là các câu hỏi em tự đặt ra cho mình trước khi gõ dòng code
          đầu tiên.
        </p>
        <ol className="space-y-3 list-none">
          {guide.thinkingSteps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span
                className="grid place-items-center size-7 rounded-lg bg-quest-500/15 text-quest-400 text-sm font-bold shrink-0"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                  <RichText text={step.question} />
                </p>
                <p className="text-sm text-slate-400 leading-relaxed mt-0.5">
                  <span className="text-slate-500">Vì sao hỏi câu này: </span>
                  <RichText text={step.why} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </GuideSection>

      {/* ⑥ Dùng khi nào / không dùng khi nào */}
      <div className="grid md:grid-cols-2 gap-3">
        <section className="cq-panel p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-verdant-400 mb-2">
            <ThumbsUp className="size-4" aria-hidden="true" />
            Nên dùng khi
          </h3>
          <ul className="space-y-1.5">
            {guide.whenToUse.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                <span className="text-verdant-400 shrink-0" aria-hidden="true">
                  ·
                </span>
                <span><RichText text={item} /></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="cq-panel p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-treasure-300 mb-2">
            <ThumbsDown className="size-4" aria-hidden="true" />
            Chưa cần dùng khi
          </h3>
          <ul className="space-y-1.5">
            {guide.whenNotToUse.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                <span className="text-treasure-300 shrink-0" aria-hidden="true">
                  ·
                </span>
                <span><RichText text={item} /></span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ⑦ Hiểu lầm thường gặp */}
      <GuideSection
        step="5"
        icon={<Lightbulb className="size-5" />}
        tone="alert"
        title="Những chỗ rất nhiều bạn hiểu nhầm"
      >
        <ul className="space-y-3 list-none">
          {guide.misconceptions.map((item, index) => (
            <li key={index} className="cq-panel p-3 space-y-2">
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="font-bold text-alert-400">Nhiều bạn nghĩ: </span>
                <RichText text={item.wrong} />
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">
                <span className="font-bold text-verdant-400">Thật ra: </span>
                <RichText text={item.right} />
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-slate-500">Vì sao điều này quan trọng: </span>
                <RichText text={item.why} />
              </p>
            </li>
          ))}
        </ul>
      </GuideSection>
    </article>
  );
}

const TONES = {
  quest: 'bg-quest-500/15 text-quest-400',
  mage: 'bg-mage-500/15 text-mage-300',
  verdant: 'bg-verdant-500/15 text-verdant-400',
  treasure: 'bg-treasure-400/15 text-treasure-300',
  alert: 'bg-alert-500/15 text-alert-400',
} as const;

function GuideSection({
  step,
  icon,
  tone,
  title,
  children,
}: {
  step: string;
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cq-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className={cn('grid place-items-center size-9 rounded-xl', TONES[tone])} aria-hidden="true">
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bước {step}
          </p>
          <h3 className="text-base font-bold text-slate-100">{title}</h3>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function CodeBlock({ code, tone }: { code: string; tone: 'warning' | 'good' }) {
  return (
    <pre
      className={cn(
        'font-mono text-xs rounded-lg p-3 overflow-x-auto whitespace-pre bg-abyss-950 border',
        tone === 'warning' ? 'border-treasure-400/30 text-slate-300' : 'border-verdant-500/30 text-slate-300',
      )}
    >
      {code}
    </pre>
  );
}

/**
 * Bảng nhắc tư duy gọn, hiển thị ngay trong màn hình nhiệm vụ.
 *
 * Mục đích: tách bước "nghĩ" khỏi bước "gõ". Học sinh lớp 8 rất hay lao vào gõ
 * ngay rồi sửa mò — nhìn thấy câu hỏi này trước khi gõ giúp các em dừng một nhịp.
 */
export function ThinkingPrompt({
  challengePrompt,
  guide,
}: {
  challengePrompt?: string;
  guide?: ConceptGuide;
}) {
  const questions = challengePrompt
    ? [challengePrompt]
    : (guide?.thinkingSteps.slice(0, 3).map((step) => step.question) ?? []);

  if (questions.length === 0) return null;

  return (
    <section className="cq-panel p-4 border-mage-400/30" aria-labelledby="thinking-heading">
      <h3
        id="thinking-heading"
        className="flex items-center gap-2 text-sm font-bold text-mage-300 mb-2"
      >
        <Brain className="size-4" aria-hidden="true" />
        Trước khi gõ code, em tự trả lời đã nhé
      </h3>
      <ul className="space-y-1.5">
        {questions.map((question, index) => (
          <li key={index} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
            <span className="text-mage-300 shrink-0" aria-hidden="true">
              ?
            </span>
            <span><RichText text={question} /></span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-2">
        Trả lời được ba câu này thì code gần như tự viết ra. Chưa trả lời được thì mở phần
        <strong className="text-slate-400"> Học kiến thức </strong>
        của khu vực nhé.
      </p>
    </section>
  );
}
