import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { CertificateStage } from '@/components/certificates/CertificateStage';
import { captureCertificateCheck, exportCertificateToPdf } from '@/services/pdfExport';
import { buildCertificateCode, buildCertificateMetadata } from '@/services/certificateService';
import { LESSONS_META } from '@/data/lessons.meta';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { CertificateRow, ProfileRow } from '@/types/database';

/**
 * Trang xem trước mẫu chứng chỉ — CHỈ CÓ Ở CHẾ ĐỘ DEV.
 *
 * Route này được gắn có điều kiện trong `router.tsx` (`import.meta.env.DEV`),
 * nên nó không tồn tại trong bản build đưa lên GitHub Pages.
 *
 * Vì sao cần: mẫu chứng chỉ chỉ hiện ra sau khi một học sinh thật hoàn thành đủ
 * năm điều kiện. Không có trang này thì mỗi lần chỉnh mẫu lại phải đi qua trọn
 * một khu vực để xem kết quả — và quan trọng hơn, không kiểm chứng được rằng
 * html2canvas dựng ảnh đúng.
 */

const SAMPLE_PROFILE: ProfileRow = {
  id: '7f3a2199-abcd-4000-8000-000000000000',
  full_name: 'Nguyễn Thị Minh Anh',
  class_name: '8A1',
  student_code: 'HS0123',
  avatar_id: 'guardian-cyan',
  role: 'student',
  total_xp: 1250,
  level: 5,
  streak_days: 4,
  last_active_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function makeSampleCertificate(lessonId: string): CertificateRow {
  return {
    id: `sample-${lessonId}`,
    user_id: SAMPLE_PROFILE.id,
    lesson_id: lessonId,
    certificate_code: buildCertificateCode(lessonId, SAMPLE_PROFILE.id),
    issued_at: new Date().toISOString(),
    xp_at_issue: 285,
    stars_at_issue: 3,
    metadata: buildCertificateMetadata(SAMPLE_PROFILE, lessonId),
  };
}

export function CertificatePreviewDevPage() {
  const [lessonId, setLessonId] = useState('l3');
  const [isExporting, setIsExporting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  const certificate = makeSampleCertificate(lessonId);

  const handleExport = async () => {
    if (!templateRef.current) return;
    setIsExporting(true);
    setMessage(null);

    const result = await exportCertificateToPdf(templateRef.current, certificate);
    setMessage(result.ok ? 'Đã tạo PDF thành công.' : (result.error ?? 'Không tạo được PDF.'));
    setIsExporting(false);
  };

  /**
   * Chụp thử mà không tải file — dùng để kiểm tra nhanh sau khi sửa mẫu.
   * `hasContent = false` nghĩa là ảnh ra một khối đồng màu, thường do có màu
   * dạng `oklch()` lọt vào vùng bị chụp.
   */
  const handleCheck = async () => {
    if (!templateRef.current) return;
    setIsChecking(true);
    setMessage(null);

    const check = await captureCertificateCheck(templateRef.current);

    if (!check.ok) {
      setMessage(`Chụp ảnh thất bại: ${check.error ?? 'không rõ nguyên nhân'}`);
    } else if (!check.hasContent) {
      setMessage(
        `Ảnh chụp ${check.width}×${check.height} nhưng chỉ có một khối màu — nhiều khả năng có màu oklch() lọt vào mẫu chứng chỉ.`,
      );
    } else {
      setMessage(
        `Ảnh chụp thành công: ${check.width}×${check.height} px, nội dung hiển thị đầy đủ.`,
      );
    }

    setIsChecking(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-100">
          Xem trước mẫu chứng chỉ (chỉ có ở chế độ dev)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Dùng để chỉnh mẫu chứng chỉ mà không cần đi hết một khu vực.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {LESSONS_META.map((lesson) => (
          <button
            key={lesson.id}
            type="button"
            onClick={() => setLessonId(lesson.id)}
            aria-pressed={lessonId === lesson.id}
            className={
              lessonId === lesson.id
                ? 'px-3 h-9 rounded-lg text-sm font-medium bg-quest-500/15 text-quest-400 border border-quest-500/50'
                : 'px-3 h-9 rounded-lg text-sm font-medium bg-abyss-800 text-slate-400 border border-abyss-600'
            }
          >
            KV{lesson.order}
          </button>
        ))}

        <Button
          variant="secondary"
          onClick={() => void handleCheck()}
          isLoading={isChecking}
          loadingLabel="Đang chụp thử"
        >
          Kiểm tra ảnh chụp (không tải file)
        </Button>

        <Button
          onClick={() => void handleExport()}
          isLoading={isExporting}
          loadingLabel="Đang tạo PDF"
          leadingIcon={<Download className="size-4" aria-hidden="true" />}
        >
          Thử tải PDF
        </Button>
      </div>

      {message && <Alert tone={message.includes('thành công') ? 'success' : 'error'}>{message}</Alert>}

      <CertificateStage ref={templateRef} certificate={certificate} />
    </div>
  );
}
