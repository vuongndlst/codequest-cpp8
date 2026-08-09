import type { CertificateRow } from '@/types/database';

/**
 * Xuất chứng chỉ ra PDF NGAY TRONG TRÌNH DUYỆT.
 *
 * Vì sao chụp DOM thành ảnh rồi mới nhét vào PDF, thay vì dùng API vẽ chữ của
 * jsPDF: font mặc định của jsPDF không có tiếng Việt có dấu, nên "Nguyễn Đình
 * Vương" sẽ ra một dãy ký tự lỗi. Nhúng font tiếng Việt vào jsPDF thì tốn thêm
 * vài trăm KB tải về. Chụp DOM giữ nguyên font web đã tải sẵn, và bảo đảm bản
 * PDF giống hệt bản xem trước trên màn hình.
 *
 * Hai thư viện được nạp ĐỘNG (dynamic import) để học sinh không phải tải chúng
 * cho tới khi thật sự bấm nút tải chứng chỉ.
 */

/** Kích thước A4 nằm ngang tính bằng milimét. */
const A4_LANDSCAPE_MM = { width: 297, height: 210 };

export interface ExportResult {
  ok: boolean;
  /** Thông báo tiếng Việt khi có lỗi */
  error?: string;
}

export function buildCertificateFileName(certificate: CertificateRow): string {
  const name = certificate.metadata.certificateName.replace(/[^A-Za-z0-9]+/g, '-');
  return `ChungChi-${name}-${certificate.certificate_code}.pdf`;
}

export interface CaptureCheck {
  ok: boolean;
  width: number;
  height: number;
  /** Ảnh có nội dung thật hay chỉ là một khối màu đồng nhất */
  hasContent: boolean;
  error?: string;
}

/**
 * Chụp thử chứng chỉ thành ảnh và kiểm tra ảnh có nội dung, KHÔNG tải file nào.
 *
 * Dùng để kiểm chứng nhanh sau khi sửa mẫu chứng chỉ: nếu html2canvas gặp một
 * màu nó không hiểu (vd. `oklch()` của Tailwind), ảnh sẽ ra một khối đồng màu —
 * và `hasContent` sẽ bằng false.
 */
export async function captureCertificateCheck(element: HTMLElement): Promise<CaptureCheck> {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      scale: 1,
      backgroundColor: '#fdfbf5',
      logging: false,
    });

    const context = canvas.getContext('2d');
    if (!context) {
      return { ok: false, width: canvas.width, height: canvas.height, hasContent: false };
    }

    // Lấy mẫu vài điểm rải rác; nếu tất cả cùng một màu thì ảnh coi như trống
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const seen = new Set<string>();
    const step = Math.max(4, Math.floor((data.length / 4 / 2000)) * 4);

    for (let index = 0; index < data.length; index += step) {
      seen.add(`${data[index]},${data[index + 1]},${data[index + 2]}`);
      if (seen.size > 5) break;
    }

    return {
      ok: true,
      width: canvas.width,
      height: canvas.height,
      hasContent: seen.size > 5,
    };
  } catch (error) {
    return {
      ok: false,
      width: 0,
      height: 0,
      hasContent: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function exportCertificateToPdf(
  element: HTMLElement,
  certificate: CertificateRow,
): Promise<ExportResult> {
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(element, {
      // scale 2 cho ảnh nét khi in, nhưng vẫn giữ dung lượng file hợp lý
      scale: 2,
      backgroundColor: '#fdfbf5',
      logging: false,
      useCORS: true,
    });

    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    pdf.addImage(
      imageData,
      'JPEG',
      0,
      0,
      A4_LANDSCAPE_MM.width,
      A4_LANDSCAPE_MM.height,
      undefined,
      'FAST',
    );

    pdf.save(buildCertificateFileName(certificate));
    return { ok: true };
  } catch (error) {
    console.error('[CodeQuest] Không tạo được PDF:', error);
    return {
      ok: false,
      error:
        'Chưa tạo được file PDF. Em thử lại một lần nữa nhé — nếu vẫn không được thì báo thầy giúp mình.',
    };
  }
}
