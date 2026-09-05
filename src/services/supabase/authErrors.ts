import { isNetworkError } from './client';

/**
 * Dịch thông báo lỗi của Supabase Auth sang tiếng Việt thân thiện.
 *
 * Nguyên tắc giống với phản hồi lỗi code (mục 1 của đề bài): không bao giờ
 * hiển thị thông báo kỹ thuật bằng tiếng Anh cho học sinh lớp 8.
 */

const MESSAGE_MAP: Array<{ match: RegExp; message: string }> = [
  {
    match: /invalid login credentials/i,
    message: 'Email hoặc mật khẩu chưa đúng. Em kiểm tra lại giúp thầy nhé.',
  },
  {
    match: /email not confirmed/i,
    message:
      'Tài khoản của em chưa được xác nhận. Em kiểm tra hộp thư, hoặc báo thầy để được hỗ trợ nhé.',
  },
  {
    match: /user already registered|already been registered/i,
    message: 'Email này đã có tài khoản rồi. Em thử đăng nhập, hoặc dùng "Quên mật khẩu" nhé.',
  },
  {
    match: /password should be at least/i,
    message: 'Mật khẩu cần ít nhất 8 ký tự.',
  },
  {
    match: /password.*(weak|compromised|leaked|pwned)/i,
    message: 'Mật khẩu này dễ đoán quá. Em thử thêm số hoặc chữ hoa để an toàn hơn nhé.',
  },
  {
    match: /unable to validate email|invalid email/i,
    message: 'Email trường chưa đúng. Em dùng mã học sinh 7 số, ví dụ 2406105@lsts.edu.vn.',
  },
  {
    match: /mã học sinh lsts|7 chữ số/i,
    message: 'Em dùng đúng mã học sinh gồm 7 chữ số và email @lsts.edu.vn nhé.',
  },
  {
    match: /mã lớp chưa đúng|lớp đang tạm khóa/i,
    message: 'Mã lớp chưa đúng hoặc giáo viên đang tạm khóa đăng ký. Em hỏi lại thầy cô nhé.',
  },
  {
    match: /for security purposes|rate limit|too many requests|over_email_send_rate/i,
    message: 'Em vừa thử hơi nhanh. Đợi khoảng 30 giây rồi thử lại nhé.',
  },
  {
    match: /token has expired|invalid token|expired/i,
    message: 'Đường dẫn này đã hết hạn. Em bấm "Quên mật khẩu" để nhận đường dẫn mới nhé.',
  },
  {
    match: /same as the old password/i,
    message: 'Mật khẩu mới trùng với mật khẩu cũ. Em chọn mật khẩu khác nhé.',
  },
  {
    match: /signups not allowed|signup is disabled/i,
    message: 'Hiện tại chưa mở đăng ký. Em liên hệ thầy Vương để được tạo tài khoản nhé.',
  },
];

export function translateAuthError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không kết nối được mạng. Em kiểm tra Wi-Fi rồi thử lại nhé.';
  }

  const raw = error instanceof Error ? error.message : String(error ?? '');
  if (!raw) return 'Có lỗi xảy ra. Em thử lại sau một chút nhé.';

  const found = MESSAGE_MAP.find((entry) => entry.match.test(raw));
  if (found) return found.message;

  return `Có lỗi xảy ra: ${raw}`;
}
