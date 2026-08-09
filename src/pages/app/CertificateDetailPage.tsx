import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Download, ScrollText, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getLessonMeta, CERTIFICATE_NAMES } from '@/data/lessons.meta';
import { fetchAllLessonProgress, indexProgressByLesson } from '@/services/supabase/progress.repo';
import { fetchAttemptsForLesson } from '@/services/supabase/attempts.repo';
import { fetchExitTicket } from '@/services/supabase/exitTickets.repo';
import {
  checkEligibility,
  fetchCertificate,
  issueCertificate,
  type CertificateEligibility,
} from '@/services/certificateService';
import { exportCertificateToPdf } from '@/services/pdfExport';
import { CertificateStage } from '@/components/certificates/CertificateStage';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ByteMascot } from '@/components/game/ByteMascot';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { cn } from '@/utils/cn';
import type { CertificateRow, LessonProgressRow } from '@/types/database';

/**
 * Xem và tải một chứng chỉ.
 *
 * Ba trạng thái có thể xảy ra:
 *   · Đã cấp        -> xem trước + tải PDF
 *   · Đủ điều kiện  -> nút "Nhận chứng chỉ"
 *   · Chưa đủ       -> bảng năm điều kiện, cái nào chưa đạt thì nói rõ còn thiếu gì
 */
export function CertificateDetailPage() {
  const { lessonId = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const [certificate, setCertificate] = useState<CertificateRow | null>(null);
  const [eligibility, setEligibility] = useState<CertificateEligibility | null>(null);
  const [progress, setProgress] = useState<LessonProgressRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const templateRef = useRef<HTMLDivElement>(null);
  const meta = getLessonMeta(lessonId);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const [existing, allProgress, exitTicket, attempts] = await Promise.all([
        fetchCertificate(user.id, lessonId),
        fetchAllLessonProgress(user.id),
        fetchExitTicket(user.id, lessonId).catch(() => null),
        fetchAttemptsForLesson(user.id, lessonId).catch(() => []),
      ]);

      const lessonProgress = indexProgressByLesson(allProgress)[lessonId] ?? null;

      setCertificate(existing);
      setProgress(lessonProgress);
      setEligibility(
        checkEligibility({ lessonId, progress: lessonProgress, exitTicket, attempts }),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được chứng chỉ.');
    } finally {
      setIsLoading(false);
    }
  }, [user, lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleIssue = async () => {
    if (!profile) return;
    setIsIssuing(true);
    setError(null);

    try {
      const issued = await issueCertificate(profile, lessonId, progress);
      setCertificate(issued);
    } catch (issueError) {
      setError(issueError instanceof Error ? issueError.message : 'Không cấp được chứng chỉ.');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleDownload = async () => {
    if (!templateRef.current || !certificate) return;
    setIsExporting(true);
    setExportError(null);

    const result = await exportCertificateToPdf(templateRef.current, certificate);
    if (!result.ok) setExportError(result.error ?? 'Không tạo được PDF.');
    setIsExporting(false);
  };

  if (!meta) return <NotFoundPage />;
  if (isLoading) return <LoadingState label="Đang kiểm tra điều kiện chứng chỉ…" />;

  return (
    <div className="space-y-4">
      <Link
        to="/app/certificates"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Bộ sưu tập chứng chỉ
      </Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Khu vực {meta.order} · {meta.zoneName}
        </p>
        <h1 className="text-2xl font-extrabold text-slate-100">
          {CERTIFICATE_NAMES[meta.certificateCode]}
        </h1>
      </header>

      {error && <ErrorState description={error} onRetry={() => void load()} />}

      {/* --- Đã có chứng chỉ --- */}
      {certificate && (
        <>
          <div className="cq-card p-4 border-verdant-500/50 bg-verdant-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <ByteMascot size={44} mood="cheer" animated={false} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-verdant-400">Chứng chỉ này là của em rồi!</p>
                <p className="text-sm text-slate-400">
                  Mã chứng chỉ{' '}
                  <code className="font-mono text-slate-300">{certificate.certificate_code}</code>
                </p>
              </div>
              <Button
                onClick={() => void handleDownload()}
                isLoading={isExporting}
                loadingLabel="Đang tạo PDF"
                leadingIcon={<Download className="size-4" aria-hidden="true" />}
              >
                Tải chứng chỉ PDF
              </Button>
            </div>
          </div>

          {exportError && <Alert tone="error">{exportError}</Alert>}

          <section aria-label="Xem trước chứng chỉ" className="cq-panel p-3">
            <p className="text-xs text-slate-500 mb-2">
              Bản xem trước — file PDF tải về sẽ giống hệt như thế này.
            </p>

            <CertificateStage ref={templateRef} certificate={certificate} />
          </section>
        </>
      )}

      {/* --- Chưa có chứng chỉ: hiện bảng điều kiện --- */}
      {!certificate && eligibility && (
        <>
          <section className="cq-card p-5" aria-labelledby="requirements-heading">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="grid place-items-center size-11 rounded-2xl bg-treasure-400/15 text-treasure-400"
                aria-hidden="true"
              >
                <ScrollText className="size-5" />
              </span>
              <div>
                <h2 id="requirements-heading" className="text-lg font-bold text-slate-100">
                  Năm điều kiện nhận chứng chỉ
                </h2>
                <p className="text-sm text-slate-400">
                  {eligibility.eligible
                    ? 'Em đã đạt đủ cả năm điều kiện!'
                    : `Đã đạt ${eligibility.requirements.filter((r) => r.met).length}/5 điều kiện`}
                </p>
              </div>
            </div>

            <ul className="space-y-2 list-none">
              {eligibility.requirements.map((requirement) => (
                <li
                  key={requirement.id}
                  className="flex items-center gap-3 cq-panel p-3"
                >
                  <span
                    className={cn(
                      'grid place-items-center size-7 rounded-lg shrink-0',
                      requirement.met
                        ? 'bg-verdant-500/20 text-verdant-400'
                        : 'bg-abyss-700 text-slate-500',
                    )}
                    aria-hidden="true"
                  >
                    {requirement.met ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>

                  <span className="text-sm text-slate-200 flex-1">
                    {requirement.label}
                    <span className="sr-only">
                      {requirement.met ? ' — đã đạt' : ' — chưa đạt'}
                    </span>
                  </span>

                  <span
                    className={cn(
                      'text-xs tabular-nums shrink-0',
                      requirement.met ? 'text-verdant-400' : 'text-slate-500',
                    )}
                  >
                    {requirement.detail}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-slate-500 mt-3">
              Lưu ý: điều kiện cuối chỉ cần em ĐÃ TỪNG làm Clean Code Check, không cần đạt điểm
              cao. Điểm clean code không bao giờ làm em mất chứng chỉ.
            </p>

            {eligibility.eligible ? (
              <Button
                className="mt-4"
                onClick={() => void handleIssue()}
                isLoading={isIssuing}
                loadingLabel="Đang cấp chứng chỉ"
                leadingIcon={<ScrollText className="size-4" aria-hidden="true" />}
              >
                Nhận chứng chỉ
              </Button>
            ) : (
              <Link to={`/app/lesson/${lessonId}`} className="inline-block mt-4">
                <Button variant="secondary">Quay lại {meta.zoneName}</Button>
              </Link>
            )}
          </section>
        </>
      )}
    </div>
  );
}
