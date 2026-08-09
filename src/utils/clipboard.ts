/**
 * Chép văn bản vào clipboard.
 *
 * `navigator.clipboard` CHỈ tồn tại trong ngữ cảnh bảo mật (https hoặc
 * localhost). Máy ở phòng ICT nhiều khi mở website qua địa chỉ IP nội bộ chạy
 * http — lúc đó `navigator.clipboard` là `undefined` và nút "Chép mã" sẽ im
 * lặng không làm gì. Nên vẫn cần đường lui bằng `execCommand('copy')`: cũ, đã
 * bị đánh dấu lỗi thời, nhưng chạy được ở mọi nơi.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Có thể bị chặn quyền — rơi xuống cách dự phòng bên dưới
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    // Đặt ngoài màn hình để trang không bị giật khi trình duyệt cuộn tới ô này
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';

    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);

    return copied;
  } catch {
    return false;
  }
}
