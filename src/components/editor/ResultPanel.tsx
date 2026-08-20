import { Check, CircleDashed, Feather, Target, Terminal, X } from 'lucide-react';
import type { RunResult } from '@/types/runner';
import type { Diagnostic } from '@/validators/tokens';
import { RichText } from '@/components/common/RichText';
import {
  CLEAN_CODE_RULE_LABELS,
  CLEAN_CODE_STAR_THRESHOLD,
} from '@/validators/cleanCodeCoach';
import { cn } from '@/utils/cn';

interface ResultPanelProps {
  result: RunResult | null;
  isRunning: boolean;
  /** Cho phép ẩn phần clean code ở những node không chấm clean code */
  showCleanCode?: boolean;
  /** Nhiệm vụ có yêu cầu quan sát Output hay chỉ điều khiển bản đồ. */
  expectsOutput?: boolean;
}

/**
 * Khu vực kết quả: output · test case · thông báo lỗi · gợi ý clean code.
 *
 * Nguyên tắc (mục 24 của đề bài):
 *   · Chưa đúng thì CHỈ hiện MỘT thông báo chính, không đổ ra danh sách lỗi
 *   · Không bao giờ dùng từ "Thất bại" hay "Sai"
 *   · Phản hồi nằm sát editor; nút Gợi ý dùng chung trên thanh công cụ, không lặp lại
 */
export function ResultPanel({
  result,
  isRunning,
  showCleanCode = true,
  expectsOutput = false,
}: ResultPanelProps) {
  if (isRunning) {
    return (
      <div className="cq-panel p-4" role="status" aria-live="polite">
        <p className="text-sm text-slate-400">Đang chạy chương trình của em…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="cq-panel p-4">
        <p className="text-sm text-slate-400">
          Viết code xong, em bấm <strong className="text-quest-400">Chạy code</strong> để xem kết
          quả nhé.
        </p>
      </div>
    );
  }

  const primaryDiagnostic = result.diagnostics.find((item) => item.severity === 'error');
  const notes = result.diagnostics.filter((item) => item.severity !== 'error');
  const visibleTests = result.testResults.filter((test) => test.visible || test.required);

  return (
    <div className="space-y-2">
      {/* Phản hồi chính nằm sát editor: một kết luận, một bằng chứng, một hành động. */}
      <section
        role="status"
        aria-live="polite"
        className={cn(
          'rounded-xl border px-3 py-3 shadow-sm',
          result.isCorrect
            ? 'bg-verdant-500/10 border-verdant-500/50'
            : 'bg-treasure-400/10 border-treasure-400/40',
        )}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg',
              result.isCorrect
                ? 'bg-verdant-500/20 text-verdant-400'
                : 'bg-treasure-400/20 text-treasure-300',
            )}
            aria-hidden="true"
          >
            {result.isCorrect ? <Check className="size-4" /> : <CircleDashed className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm font-bold',
              result.isCorrect ? 'text-verdant-400' : 'text-treasure-300',
            )}
          >
            {result.isCorrect ? 'Đã đạt tất cả mục tiêu' : 'Chưa đạt mục tiêu'}
          </p>

          {primaryDiagnostic ? (
            <DiagnosticMessage diagnostic={primaryDiagnostic} />
          ) : result.isCorrect ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Chương trình của em đã vượt đủ các kiểm tra của nhiệm vụ.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Xem mục tiêu chưa đạt bên dưới, sửa một chỗ rồi chạy lại.
            </p>
          )}
          </div>
        </div>
      </section>

      {/* --- Số dòng vàng --- */}
      {result.isCorrect && result.par?.par != null && <ParCard par={result.par} />}

      <details className="group rounded-xl border border-abyss-700 bg-abyss-950/55">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200">
          <span>Chi tiết kiểm tra · {result.passedRequired}/{result.totalRequired} mục tiêu đạt</span>
          <span className="text-quest-400 group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <div className="grid gap-3 border-t border-abyss-700 p-3 xl:grid-cols-2">
          {visibleTests.length > 0 && (
          <section aria-labelledby="tests-heading">
            <h3 id="tests-heading" className="mb-2 text-xs font-bold text-slate-300">Mục tiêu kiểm tra</h3>
            <ul className="space-y-1.5">
            {visibleTests.map((test) => (
              <li key={test.id} className="flex items-start gap-2 text-xs">
                <span
                  className={cn(
                    'grid place-items-center size-5 rounded-md shrink-0 mt-0.5',
                    test.passed
                      ? 'bg-verdant-500/20 text-verdant-400'
                      : 'bg-abyss-700 text-slate-500',
                  )}
                  aria-hidden="true"
                >
                  {test.passed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                </span>
                <div className="min-w-0">
                  <span className={test.passed ? 'text-slate-300' : 'text-slate-400'}>
                    {test.name}
                  </span>
                  <span className="sr-only">{test.passed ? ' — đã đạt' : ' — chưa đạt'}</span>
                  {!test.passed && test.message && (
                    <p className="text-xs text-slate-500">{test.message}</p>
                  )}
                </div>
              </li>
            ))}
            </ul>
          </section>
          )}

      <section aria-labelledby="output-heading">
        <h3
          id="output-heading"
          className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300"
        >
          <Terminal className="size-4 text-quest-400" aria-hidden="true" />
          Màn hình kết quả
        </h3>

        {result.stdout.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            {expectsOutput
              ? <>Chương trình chưa in ra dữ liệu. Em đối chiếu yêu cầu <code>cout</code> của nhiệm vụ.</>
              : 'Nhiệm vụ này không yêu cầu in dữ liệu; hãy quan sát thay đổi và vị trí cuối trên bản đồ.'}
          </p>
        ) : (
          // Dùng textContent qua children của React -> code học sinh không thể chèn HTML (chống XSS)
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-abyss-950 p-2 font-mono text-xs text-verdant-400">
            {result.stdout.join('\n')}
          </pre>
        )}
      </section>

      {/* --- Ghi chú (cảnh báo nhẹ, không chặn) --- */}
      {notes.length > 0 && (
        <section className="xl:col-span-2" aria-label="Ghi chú thêm">
          <ul className="space-y-2">
            {notes.map((note, index) => (
              <li key={`${note.code}-${index}`}>
                <DiagnosticMessage diagnostic={note} compact />
              </li>
            ))}
          </ul>
        </section>
      )}
        </div>
      </details>

      {/*
        --- Clean Code Coach ---

        CHỈ hiện khi nhiệm vụ ĐÃ HOÀN THÀNH, không phải mỗi lần code chạy được.

        Trước đây điều kiện là `result.ok` — nghĩa là chỉ cần code biên dịch
        được là bảng này hiện ra. Học sinh chạy thử code đang viết dở mười lần
        thì nhận mười lần góp ý "đổi tên biến", "thụt lề lại"… trên một chương
        trình còn chưa xong. Vừa gây nhiễu, vừa sai về mặt sư phạm: không ai đi
        gọt giũa một bài chưa chạy đúng.
      */}
      {showCleanCode && result.isCorrect && (
        <CleanCodeCard report={result.cleanCode} />
      )}
    </div>
  );
}

/**
 * "Số dòng vàng" — cơ chế sư phạm trung tâm của khoá học.
 *
 * Chỉ hiện SAU KHI đã giải được. Giải bằng tám dòng lặp đi lặp lại thì vẫn qua
 * bài, không trừng phạt — nhưng màn hình nói thẳng "có cách ba dòng đấy". Đó
 * là lúc học sinh TỰ MUỐN tìm vòng lặp, thay vì bị bắt học vòng lặp.
 *
 * Giọng văn cố ý là lời mời, không phải lời chê: "thử rút gọn xem", không phải
 * "code của em dài quá".
 */
function ParCard({ par }: { par: NonNullable<RunResult['par']> }) {
  const target = par.par!;
  const achieved = par.meetsPar === true;

  return (
    <section
      className={cn(
        'rounded-xl border p-4',
        achieved
          ? 'bg-treasure-400/10 border-treasure-400/50'
          : 'bg-abyss-800/60 border-abyss-600',
      )}
      aria-labelledby="par-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          id="par-heading"
          className="flex items-center gap-2 text-sm font-bold text-slate-200"
        >
          <Target
            className={cn('size-4', achieved ? 'text-treasure-400' : 'text-slate-400')}
            aria-hidden="true"
          />
          Số dòng vàng
        </h3>

        <span className="text-sm tabular-nums text-slate-300">
          Em dùng <strong className={achieved ? 'text-treasure-300' : 'text-slate-100'}>
            {par.count}
          </strong>{' '}
          / mục tiêu <strong className="text-treasure-300">{target}</strong> câu lệnh
        </span>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mt-2">
        {achieved ? (
          <>
            Gọn đúng mức rồi! Em không chỉ làm cho chạy được, em còn làm cho{' '}
            <strong className="text-treasure-300">ngắn gọn</strong> — đó mới là suy nghĩ của
            người viết thuật toán.
          </>
        ) : (
          <>
            Nhiệm vụ hoàn thành rồi nhé — phần này không bắt buộc. Nhưng có cách giải chỉ cần{' '}
            <strong className="text-treasure-300">{target} câu lệnh</strong>. Em thử nhìn lại
            xem có đoạn nào mình viết đi viết lại không?
          </>
        )}
      </p>
    </section>
  );
}

/**
 * Bảng chấm Clean Code.
 *
 * Hiện TỪNG TIÊU CHÍ đạt hay chưa, kèm trọng số điểm. Con số tổng một mình
 * không dạy được gì: học sinh nhìn "65/100" thì chỉ biết mình chưa giỏi, không
 * biết phải sửa cái gì. Nhìn bảng thì thấy ngay "Thụt lề đúng cấp — chưa đạt,
 * 20 điểm" và biết chính xác việc cần làm.
 */
function CleanCodeCard({ report }: { report: RunResult['cleanCode'] }) {
  return (
    <section className="cq-panel p-4" aria-labelledby="cleancode-heading">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3
          id="cleancode-heading"
          className="flex items-center gap-2 text-sm font-bold text-slate-200"
        >
          <Feather className="size-4 text-mage-300" aria-hidden="true" />
          Chấm code sạch
        </h3>
        <span
          className={cn(
            'text-sm font-bold tabular-nums',
            report.isClean ? 'text-verdant-400' : 'text-treasure-300',
          )}
        >
          {report.score}/100
        </span>
      </div>

      <ul className="space-y-1.5 mb-3">
        {report.checks.map((check) => (
          <li key={check.rule} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                'grid place-items-center size-5 rounded-md shrink-0 mt-0.5',
                check.passed
                  ? 'bg-verdant-500/20 text-verdant-400'
                  : 'bg-treasure-400/20 text-treasure-300',
              )}
              aria-hidden="true"
            >
              {check.passed ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}
            </span>

            <span className="min-w-0 flex-1">
              <span className={check.passed ? 'text-slate-400' : 'text-slate-200'}>
                {CLEAN_CODE_RULE_LABELS[check.rule]}
              </span>
              <span className="sr-only">{check.passed ? ' — đạt' : ' — chưa đạt'}</span>
              {!check.passed && check.message && (
                <span className="block text-xs text-slate-400 leading-relaxed mt-0.5">
                  {check.message}
                </span>
              )}
            </span>

            <span
              className={cn(
                'text-xs tabular-nums shrink-0 mt-0.5',
                check.passed ? 'text-verdant-400' : 'text-slate-500',
              )}
            >
              {check.earned}/{check.weight}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500 leading-relaxed">
        {report.isClean
          ? 'Code của em vừa chạy đúng vừa dễ đọc — đủ điều kiện lấy ngôi sao thứ ba.'
          : `Từ ${CLEAN_CODE_STAR_THRESHOLD} điểm là em được ngôi sao thứ ba. Nhiệm vụ thì em đã hoàn thành rồi, phần này chỉ để code đẹp hơn thôi.`}
      </p>
    </section>
  );
}

function DiagnosticMessage({
  diagnostic,
  compact = false,
}: {
  diagnostic: Diagnostic;
  compact?: boolean;
}) {
  const tone =
    diagnostic.severity === 'error'
      ? 'text-slate-200'
      : diagnostic.severity === 'warn'
        ? 'text-treasure-300'
        : 'text-mage-300';

  return (
    <p className={cn('text-sm leading-relaxed', tone, compact ? '' : 'mt-1')}>
      {diagnostic.line > 0 && (
        <span className="inline-block px-1.5 py-0.5 mr-1.5 rounded bg-abyss-700 text-xs font-mono text-slate-400">
          dòng {diagnostic.line}
        </span>
      )}
      <RichText text={diagnostic.message} />
    </p>
  );
}
