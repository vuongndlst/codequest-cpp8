import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Thông báo việc chuyển trang cho trình đọc màn hình (mục 18).
 *
 * VẤN ĐỀ: với website một trang (SPA), khi học sinh bấm chuyển trang thì URL
 * đổi nhưng trình duyệt KHÔNG tải lại trang. Trình đọc màn hình vì thế không
 * biết có gì thay đổi — người dùng khiếm thị bị bỏ lại ở nội dung cũ.
 *
 * CÁCH LÀM: sau mỗi lần đổi đường dẫn, đọc tiêu đề <h1> của trang mới rồi đưa
 * vào một vùng `aria-live`. Đồng thời đưa con trỏ bàn phím về đầu nội dung
 * chính, để lần nhấn Tab tiếp theo bắt đầu từ trang mới chứ không phải từ chỗ
 * cũ giữa trang.
 */
export function RouteAnnouncer() {
  const location = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Chờ một nhịp để trang mới kịp render xong <h1>
    const timer = setTimeout(() => {
      const heading = document.querySelector('main h1');
      const title = heading?.textContent?.trim();

      setMessage(title ? `Đã chuyển tới trang ${title}` : 'Đã chuyển trang');

      // Đưa tiêu điểm bàn phím về đầu nội dung chính
      const main = document.getElementById('main-content');
      if (main) main.focus({ preventScroll: true });

      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 120);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
