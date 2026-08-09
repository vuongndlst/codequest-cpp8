import { forwardRef } from 'react';
import type { CertificateRow } from '@/types/database';
import { formatDate } from '@/utils/format';

/**
 * Mẫu chứng chỉ, khổ A4 nằm ngang (1123 × 794 px ở 96dpi).
 *
 * ⚠ HAI RÀNG BUỘC KỸ THUẬT QUAN TRỌNG, đừng "dọn dẹp" mà bỏ đi:
 *
 * 1. TOÀN BỘ component dùng INLINE STYLE với màu dạng HEX, không dùng một class
 *    Tailwind nào. Lý do: Tailwind v4 sinh màu ở không gian `oklch()`, mà
 *    html2canvas không phân tích được `oklch()` và sẽ render ra ảnh đen thui.
 *
 * 2. Nền sáng, chữ tối. Chứng chỉ là thứ học sinh có thể in ra — nền tối sẽ
 *    ngốn mực và in ra rất xấu.
 */

interface CertificateTemplateProps {
  certificate: CertificateRow;
}

const NAVY = '#0c1428';
const NAVY_SOFT = '#1c2b52';
const GOLD = '#b8860b';
const GOLD_LIGHT = '#d4a017';
const CYAN = '#0891b2';
const PURPLE = '#6d28d9';
const CREAM = '#fdfbf5';
const INK = '#334155';

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  function CertificateTemplate({ certificate }, ref) {
    const meta = certificate.metadata;
    const stars = Math.max(0, Math.min(3, certificate.stars_at_issue));

    return (
      <div
        ref={ref}
        // Lớp `cq-certificate` là lưới an toàn: nó ép mọi phần tử con về màu
        // dạng hex, phòng khi ai đó sau này thêm một thẻ mà quên đặt màu inline
        // và vô tình để lọt `oklch()` của Tailwind vào vùng bị chụp ảnh.
        className="cq-certificate"
        style={{
          width: 1123,
          height: 794,
          backgroundColor: CREAM,
          position: 'relative',
          fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
          color: INK,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Viền ngoài + viền trong */}
        <div
          style={{
            position: 'absolute',
            inset: 18,
            border: `3px solid ${GOLD}`,
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 28,
            border: `1px solid ${GOLD_LIGHT}`,
            boxSizing: 'border-box',
          }}
        />

        {/* Hoạ tiết góc — thiết kế gốc, dựng từ hình học cơ bản */}
        <CornerOrnament style={{ top: 34, left: 34 }} rotate={0} />
        <CornerOrnament style={{ top: 34, right: 34 }} rotate={90} />
        <CornerOrnament style={{ bottom: 34, right: 34 }} rotate={180} />
        <CornerOrnament style={{ bottom: 34, left: 34 }} rotate={270} />

        {/* Nội dung */}
        <div
          style={{
            position: 'absolute',
            inset: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* Đầu trang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ByteMark />
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: NAVY,
                  letterSpacing: 0.5,
                  lineHeight: 1.1,
                }}
              >
                {meta.courseName}
              </div>
              <div style={{ fontSize: 13, color: CYAN, fontWeight: 600 }}>
                Hành trình giải cứu ByteLand
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 22,
              fontSize: 15,
              letterSpacing: 5,
              fontWeight: 600,
              color: GOLD,
              textTransform: 'uppercase',
            }}
          >
            Chứng chỉ hoàn thành
          </div>

          {/* Tên chứng chỉ */}
          <div
            style={{
              marginTop: 6,
              fontSize: 50,
              fontWeight: 800,
              color: NAVY,
              lineHeight: 1.1,
            }}
          >
            {meta.certificateName}
          </div>

          <div
            style={{
              width: 180,
              height: 3,
              backgroundColor: GOLD,
              marginTop: 14,
              borderRadius: 2,
            }}
          />

          {/* Học sinh */}
          <div style={{ marginTop: 22, fontSize: 15, color: INK }}>Chứng nhận học sinh</div>

          <div
            style={{
              marginTop: 4,
              fontSize: 40,
              fontWeight: 700,
              color: PURPLE,
              lineHeight: 1.15,
            }}
          >
            {meta.studentName}
          </div>

          {meta.className && (
            <div style={{ marginTop: 2, fontSize: 16, color: INK }}>Lớp {meta.className}</div>
          )}

          <div
            style={{
              marginTop: 14,
              fontSize: 16,
              color: INK,
              maxWidth: 760,
              lineHeight: 1.5,
            }}
          >
            đã hoàn thành xuất sắc{' '}
            <strong style={{ color: NAVY }}>{meta.lessonTitle}</strong> trong khoá học lập trình
            C++ dành cho học sinh lớp 8.
          </div>

          {/* Chỉ số */}
          <div style={{ marginTop: 20, display: 'flex', gap: 40 }}>
            <StatBlock label="Điểm kinh nghiệm" value={`${certificate.xp_at_issue} XP`} />
            <StatBlock label="Số sao đạt được" value={<Stars count={stars} />} />
            <StatBlock label="Ngày hoàn thành" value={formatDate(certificate.issued_at)} />
          </div>

          {/* Chân trang */}
          <div
            style={{
              marginTop: 'auto',
              width: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 0.5 }}>
                MÃ CHỨNG CHỈ
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: NAVY_SOFT,
                  fontWeight: 500,
                }}
              >
                {certificate.certificate_code}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 220,
                  borderBottom: `1px solid ${NAVY_SOFT}`,
                  paddingBottom: 4,
                  fontSize: 19,
                  fontWeight: 700,
                  color: PURPLE,
                }}
              >
                {meta.teacherName}
              </div>
              <div style={{ marginTop: 5, fontSize: 12, color: INK }}>Giáo viên phụ trách</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

function StatBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 11,
          color: '#94a3b8',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 3, fontSize: 20, fontWeight: 700, color: NAVY }}>{value}</div>
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[0, 1, 2].map((index) => (
        <svg key={index} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"
            fill={index < count ? GOLD_LIGHT : '#e2e8f0'}
            stroke={index < count ? GOLD : '#cbd5e1'}
            strokeWidth="1"
          />
        </svg>
      ))}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
        }}
      >
        {count} trên 3 sao
      </span>
    </span>
  );
}

/** Dấu hiệu nhận diện — nhân vật Byte rút gọn, vẽ bằng SVG gốc. */
function ByteMark() {
  return (
    <svg width="52" height="52" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="6" width="52" height="52" rx="14" fill={NAVY} />
      <rect
        x="17"
        y="19"
        width="30"
        height="26"
        rx="9"
        fill="none"
        stroke={CYAN}
        strokeWidth="2.5"
      />
      <circle cx="26" cy="30" r="3" fill={CYAN} />
      <circle cx="38" cy="30" r="3" fill={CYAN} />
      <path
        d="M26 37q6 5 12 0"
        stroke="#a78bfa"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <line x1="32" y1="19" x2="32" y2="12" stroke="#a78bfa" strokeWidth="2.5" />
      <circle cx="32" cy="11" r="3" fill="#a78bfa" />
    </svg>
  );
}

function CornerOrnament({
  style,
  rotate,
}: {
  style: React.CSSProperties;
  rotate: number;
}) {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 46 46"
      aria-hidden="true"
      style={{ position: 'absolute', transform: `rotate(${rotate}deg)`, ...style }}
    >
      <path d="M2 20 L2 2 L20 2" stroke={GOLD} strokeWidth="2" fill="none" />
      <path d="M9 26 L9 9 L26 9" stroke={GOLD_LIGHT} strokeWidth="1" fill="none" />
      <circle cx="9" cy="9" r="2.5" fill={GOLD} />
    </svg>
  );
}
