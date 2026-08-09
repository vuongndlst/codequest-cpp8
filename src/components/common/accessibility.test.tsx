import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StarRating } from '@/components/game/StarRating';
import { RichText } from './RichText';
import { OfflineBanner, SaveIndicator } from './StateViews';

/**
 * Kiểm thử khả năng tiếp cận (mục 18 của đề bài).
 *
 * Trọng tâm là hai yêu cầu dễ vi phạm nhất mà mắt thường không thấy:
 *   · KHÔNG chỉ dùng màu để biểu thị đúng/sai
 *   · Mọi thông báo xuất hiện động đều phải được trình đọc màn hình đọc lên
 */

describe('Nút bấm', () => {
  it('luôn có nhãn đọc được, kể cả khi chỉ hiện icon', () => {
    render(
      <Button aria-label="Đóng sổ tay lệnh">
        <span aria-hidden="true">×</span>
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Đóng sổ tay lệnh' })).toBeInTheDocument();
  });

  it('trạng thái đang xử lý được báo bằng aria-busy chứ không chỉ bằng hiệu ứng quay', () => {
    render(<Button isLoading loadingLabel="Đang chạy" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Đang chạy');
  });
});

describe('Ô nhập liệu', () => {
  it('nhãn gắn đúng với ô nhập, bấm vào nhãn là con trỏ nhảy vào ô', async () => {
    const user = userEvent.setup();
    render(<Input label="Họ và tên" />);

    const input = screen.getByLabelText(/Họ và tên/);
    await user.click(screen.getByText(/Họ và tên/));

    expect(input).toHaveFocus();
  });

  it('ô bắt buộc được đánh dấu bằng chữ, không chỉ bằng dấu sao màu', () => {
    render(<Input label="Email" required />);

    // Dấu * bị ẩn khỏi trình đọc màn hình, thay bằng chữ "(bắt buộc)"
    expect(screen.getByText('(bắt buộc)')).toBeInTheDocument();
  });

  /** Đây là điểm mấu chốt: học sinh khiếm thị phải biết ô nào đang sai và sai gì. */
  it('thông báo lỗi được nối với ô nhập và có vai trò alert', () => {
    render(<Input label="Email" error="Email chưa đúng định dạng." />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Email chưa đúng định dạng.');
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('gợi ý phụ cũng được nối vào ô nhập', () => {
    render(<Input label="Mật khẩu" hint="Ít nhất 8 ký tự." />);

    const input = screen.getByLabelText('Mật khẩu');
    const hintId = input.getAttribute('aria-describedby');

    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toHaveTextContent('Ít nhất 8 ký tự.');
  });
});

describe('Hộp thông báo', () => {
  /**
   * Yêu cầu rõ ràng của mục 18: "không chỉ dùng màu để biểu thị đúng hoặc sai".
   * Mỗi tone đều có một nhãn chữ dành riêng cho trình đọc màn hình.
   */
  it('mỗi loại thông báo có nhãn chữ riêng, không chỉ phân biệt bằng màu', () => {
    const { unmount } = render(<Alert tone="error">Có lỗi</Alert>);
    expect(screen.getByText('Lỗi:')).toBeInTheDocument();
    unmount();

    const { unmount: unmount2 } = render(<Alert tone="success">Xong rồi</Alert>);
    expect(screen.getByText('Thành công:')).toBeInTheDocument();
    unmount2();

    render(<Alert tone="warning">Chú ý</Alert>);
    expect(screen.getByText('Lưu ý:')).toBeInTheDocument();
  });

  it('thông báo lỗi có vai trò alert để được đọc ngay', () => {
    render(<Alert tone="error">Chưa kết nối được máy chủ</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Chưa kết nối được máy chủ');
  });

  it('thông báo xuất hiện động dùng aria-live để không cắt ngang người dùng', () => {
    render(
      <Alert tone="success" live>
        Đã lưu hồ sơ
      </Alert>,
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});

describe('Thanh tiến trình', () => {
  it('có nhãn và giá trị đọc được, không phải thanh màu câm', () => {
    render(<ProgressBar value={40} max={100} label="Tiến trình Làng Khởi Động" />);

    const bar = screen.getByRole('progressbar', { name: 'Tiến trình Làng Khởi Động' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('giá trị vượt ngoài khoảng thì được kẹp lại thay vì báo số vô lý', () => {
    render(<ProgressBar value={250} max={100} label="Tiến trình" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Số sao', () => {
  it('đọc được thành lời, không chỉ là mấy hình ngôi sao', () => {
    render(<StarRating stars={2} />);
    expect(screen.getByRole('img', { name: '2 trên 3 sao' })).toBeInTheDocument();
  });
});

describe('Trạng thái lưu code', () => {
  it('được đọc lên khi đổi trạng thái', () => {
    render(<SaveIndicator state="saving" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Đang lưu');
  });

  it('trạng thái nghỉ thì không tạo ra vùng thông báo rỗng gây nhiễu', () => {
    const { container } = render(<SaveIndicator state="idle" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Banner mất mạng', () => {
  it('được đọc lên ngay khi xuất hiện', () => {
    render(<OfflineBanner />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/Em đang offline/);
    expect(status).toHaveTextContent(/vẫn được lưu trên máy này/);
  });
});

describe('Hiển thị đoạn chữ có code', () => {
  /**
   * Guard bảo mật (mục 22): tên biến của học sinh lọt vào thông báo lỗi có thể
   * chứa ký tự HTML. Component này KHÔNG dùng dangerouslySetInnerHTML nên nội
   * dung luôn được hiển thị dưới dạng chữ.
   */
  it('không cho phép HTML trong nội dung chạy như HTML', () => {
    const { container } = render(<RichText text={'Biến `<img src=x onerror=alert(1)>` chưa khai báo'} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('chuyển phần trong dấu backtick thành thẻ code', () => {
    const { container } = render(<RichText text="Em thiếu dấu `;` ở cuối dòng" />);

    const code = container.querySelector('code');
    expect(code).toHaveTextContent(';');
  });
});

describe('Điều hướng bằng bàn phím', () => {
  it('đi được qua các nút theo thứ tự bằng phím Tab', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Button>Chạy code</Button>
        <Button variant="secondary">Đặt lại</Button>
        <Button variant="secondary">Xem lệnh</Button>
      </MemoryRouter>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Chạy code' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Đặt lại' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Xem lệnh' })).toHaveFocus();
  });

  it('nút đang tải bị bỏ qua khi nhấn Tab, tránh bấm nhầm hai lần', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button isLoading>Chạy code</Button>
        <Button>Đặt lại</Button>
      </>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Đặt lại' })).toHaveFocus();
  });
});
