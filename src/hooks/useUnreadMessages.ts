import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { countUnreadForStudent, countUnreadForTeacher } from '@/services/supabase/messages.repo';

/** Hỏi lại thưa hơn màn hình chat: đây chỉ là con số nhỏ trên thanh điều hướng. */
const POLL_INTERVAL_MS = 60_000;

/**
 * Số tin nhắn chưa đọc, để hiện chấm đỏ trên thanh điều hướng.
 *
 * Không có con số này thì tính năng hỏi đáp coi như không tồn tại: học sinh
 * hỏi xong không biết thầy cô đã trả lời chưa, mà thầy cô cũng không biết có
 * em nào đang chờ. Cả hai bên đều phải tự nhớ vào xem — và sẽ quên.
 */
export function useUnreadMessages(): number {
  const profile = useAuthStore((state) => state.profile);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!profile) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      const next =
        profile.role === 'teacher'
          ? await countUnreadForTeacher()
          : await countUnreadForStudent(profile.id);

      if (!cancelled) setCount(next);
    };

    // Giữ đúng một tham chiếu để gỡ bỏ được ở bước dọn dẹp — viết hàm mũi tên
    // thẳng vào addEventListener thì removeEventListener không gỡ được gì cả,
    // và mỗi lần hồ sơ đổi lại chồng thêm một người nghe nữa.
    const onVisibilityChange = () => void check();

    void check();
    const timer = window.setInterval(onVisibilityChange, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [profile]);

  return count;
}
