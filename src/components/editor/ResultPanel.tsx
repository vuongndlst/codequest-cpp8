import { Check, CircleDashed, Feather, Lightbulb, Terminal, X } from 'lucide-react';
import type { RunResult } from '@/types/runner';
import type { Diagnostic } from '@/validators/tokens';
import { Button } from '@/components/ui/Button';
import { RichText } from '@/components/common/RichText';
import { cn } from '@/utils/cn';

interface ResultPanelProps {
  result: RunResult | null;
  isRunning: boolean;
  onRequestHint: () => void;
  hintsAvailable: boolean;
  /** Cho phép ẩn phần clean code ở những node không chấm clean code */
  showCleanCode?: boolean;
}

/**
 * Khu vực kết quả: output · test case · thông báo lỗi · gợi ý clean code.
 *
 * Nguyên tắc (mục 24 của đề bài):
 *   · Chưa đúng thì CHỈ hiện MỘT thông báo chính, không đổ ra danh sách lỗi
 *   · Không bao giờ dùng từ "Thất bại" hay "Sai"
 *   · Luôn có nút "Nhận gợi ý" ngay cạnh thông báo
 */
export function ResultPanel({
  result,
  isRunning,
  onRequestHint,
  hintsAvailable,
  showCleanCode = true,
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
    <div className="space-y-3">
      {/* --- Kết luận --- */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-start gap-3 rounded-xl border p-4',
          result.isCorrect
            ? 'bg-verdant-500/10 border-verdant-500/50'
            : 'bg-treasure-400/10 border-treasure-400/40',
        )}
      >
        <span
          className={cn(
            'grid place-items-center size-8 rounded-lg shrink-0',
            result.isCorrect
              ? 'bg-verdant-500/20 text-verdant-400'
              : 'bg-treasure-400/20 text-treasure-300',
          )}
          aria-hidden="true"
        >
          {result.isCorrect ? <Check className="size-5" /> : <CircleDashed className="size-5" />}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-bold',
              result.isCorrect ? 'text-verdant-400' : 'text-treasure-300',
            )}
          >
            {result.isCorrect ? 'Hoàn thành nhiệm vụ!' : 'Chưa hoàn tất — Bug vẫn còn'}
          </p>

          {primaryDiagnostic ? (
            <DiagnosticMessage diagnostic={primaryDiagnostic} />
          ) : result.isCorrect ? (
            <p className="text-sm text-slate-300 mt-1">
              Chương trình của em chạy đúng rồi. Làm tốt lắm!
            </p>
          ) : null}

          {!result.isCorrect && hintsAvailable && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={onRequestHint}
              leadingIcon={<Lightbulb className="size-4" aria-hidden="true" />}
            >
              Nhận gợi ý
            </Button>
          )}
        </div>
      </div>

      {/* --- Test case --- */}
      {visibleTests.length > 0 && (
        <section className="cq-panel p-4" aria-labelledby="tests-heading">
          <h3 id="tests-heading" className="text-sm font-bold text-slate-200 mb-2">
            Kiểm tra nhiệm vụ ({result.passedRequired}/{result.totalRequired})
          </h3>
          <ul className="space-y-1.5">
            {visibleTests.map((test) => (
              <li key={test.id} className="flex items-start gap-2 text-sm">
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

      {/* --- Output --- */}
      <section className="cq-panel p-4" aria-labelledby="output-heading">
        <h3
          id="output-heading"
          className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-2"
        >
          <Terminal className="size-4 text-quest-400" aria-hidden="true" />
          Màn hình kết quả
        </h3>

        {result.stdout.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            Chương trình chưa in ra gì cả. Em thử dùng lệnh <code>cout</code> xem sao.
          </p>
        ) : (
          // Dùng textContent qua children của React -> code học sinh không thể chèn HTML (chống XSS)
          <pre className="font-mono text-sm text-verdant-400 bg-abyss-950 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {result.stdout.join('\n')}
          </pre>
        )}
      </section>

      {/* --- Ghi chú (cảnh báo nhẹ, không chặn) --- */}
      {notes.length > 0 && (
        <section className="cq-panel p-4" aria-label="Ghi chú thêm">
          <ul className="space-y-2">
            {notes.map((note, index) => (
              <li key={`${note.code}-${index}`}>
                <DiagnosticMessage diagnostic={note} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Clean Code Coach --- */}
      {showCleanCode && result.ok && (
        <section className="cq-panel p-4" aria-labelledby="cleancode-heading">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3
              id="cleancode-heading"
              className="flex items-center gap-2 text-sm font-bold text-slate-200"
            >
              <Feather className="size-4 text-mage-300" aria-hidden="true" />
              Clean Code Coach
            </h3>
            <span
              className={cn(
                'text-sm font-bold tabular-nums',
                result.cleanCode.isClean ? 'text-verdant-400' : 'text-treasure-300',
              )}
            >
              {result.cleanCode.score}/100
            </span>
          </div>

          {result.cleanCode.suggestions.length === 0 ? (
            <p className="text-sm text-verdant-400">
              Code của em vừa chạy đúng vừa dễ đọc. Tuyệt vời!
            </p>
          ) : (
            <ul className="space-y-1.5">
              {result.cleanCode.suggestions.slice(0, 2).map((suggestion, index) => (
                <li key={index} className="text-sm text-slate-300 leading-relaxed">
                  · {suggestion}
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-slate-500 mt-2">
            Điểm clean code chỉ để giúp em viết code đẹp hơn — không ảnh hưởng việc hoàn thành
            nhiệm vụ.
          </p>
        </section>
      )}
    </div>
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
