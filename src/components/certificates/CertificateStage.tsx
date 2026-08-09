import { forwardRef } from 'react';
import type { CertificateRow } from '@/types/database';
import { CertificateTemplate } from './CertificateTemplate';

/**
 * Khung hiển thị chứng chỉ: một bản XEM TRƯỚC co lại cho vừa màn hình, và một
 * bản ẩn giữ nguyên kích thước gốc dùng để chụp ảnh.
 *
 * ⚠ VÌ SAO PHẢI RENDER HAI BẢN:
 *
 * html2canvas chụp theo kích thước ĐÃ RENDER, tính cả `transform: scale()`.
 * Nếu chụp thẳng bản xem trước đang bị co lại, ảnh thu được sẽ nhỏ hơn kích
 * thước thật — trên màn hình laptop là 809×572 thay vì 1123×794, còn trên điện
 * thoại chỉ còn 404×286. Nhét ảnh đó vào khổ A4 thì chữ mờ nhoè.
 *
 * Bản ẩn được đẩy ra ngoài vùng nhìn thấy bằng `position: fixed; left: -10000px`
 * chứ KHÔNG dùng `display: none` — phần tử bị `display: none` không có kích
 * thước nên html2canvas chụp ra ảnh rỗng.
 */

interface CertificateStageProps {
  certificate: CertificateRow;
}

export const CertificateStage = forwardRef<HTMLDivElement, CertificateStageProps>(
  function CertificateStage({ certificate }, captureRef) {
    return (
      <>
        {/* Bản xem trước — co lại cho vừa màn hình */}
        <div className="cq-cert-preview">
          <div className="cq-cert-preview__inner">
            <CertificateTemplate certificate={certificate} />
          </div>
        </div>

        {/*
          Bản dùng để chụp — luôn đúng 1123×794 px, không bị co.
          `aria-hidden` để screen reader không đọc lặp lại toàn bộ nội dung.
        */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: -10_000,
            width: 1123,
            height: 794,
            pointerEvents: 'none',
          }}
        >
          <CertificateTemplate ref={captureRef} certificate={certificate} />
        </div>
      </>
    );
  },
);
