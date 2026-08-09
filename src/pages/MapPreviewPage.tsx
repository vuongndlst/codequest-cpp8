import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { LESSONS_META } from '@/data/lessons.meta';
import { ZoneCard } from '@/components/game/ZoneCard';
import { Button } from '@/components/ui/Button';

/** Xem trước bản đồ khi chưa đăng nhập (mục 21 — chế độ Demo). */
export function MapPreviewPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-100">Bản đồ ByteLand</h1>
        <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
          Năm khu vực, mỗi khu vực một chủ đề C++. Em phải giải cứu xong khu vực trước mới mở được
          khu vực sau — giống như leo từng bậc thang vậy.
        </p>
      </div>

      <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 list-none">
        {LESSONS_META.map((lesson) => (
          <ZoneCard
            key={lesson.id}
            lesson={lesson}
            lockState="locked"
            progressPercent={0}
            stars={0}
            preview
          />
        ))}
      </ul>

      {/* Nhiệm vụ thì khoá, nhưng KIẾN THỨC thì mở cho tất cả mọi người */}
      <section className="mt-8 cq-card p-5" aria-labelledby="guides-heading">
        <h2 id="guides-heading" className="flex items-center gap-2 text-lg font-bold text-slate-100">
          <Brain className="size-5 text-mage-300" aria-hidden="true" />
          Đọc thử phần kiến thức
        </h2>
        <p className="text-sm text-slate-400 mt-1 mb-3">
          Mỗi khu vực có một bài giải thích <strong className="text-slate-300">vì sao</strong> cần
          tới lệnh mới, kèm cách tư duy khi gặp bài toán. Phần này không cần đăng nhập.
        </p>

        <ul className="grid sm:grid-cols-2 gap-2 list-none">
          {/* Phần mở đầu nằm TRƯỚC Khu vực 1 — nghĩ ra các bước trước, viết code sau */}
          <li className="sm:col-span-2">
            <Link
              to="/prologue"
              className="flex items-center gap-2 cq-panel p-3 border-mage-400/40 bg-mage-500/5 hover:border-mage-400/70 transition-colors"
            >
              <span className="text-xs font-bold text-mage-300 shrink-0">MỞ ĐẦU</span>
              <span className="text-sm font-semibold text-slate-100">
                Thuật toán là gì? — nên đọc đầu tiên
              </span>
            </Link>
          </li>

          {LESSONS_META.map((lesson) => (
            <li key={lesson.id}>
              <Link
                to={`/guide/${lesson.id}`}
                className="flex items-center gap-2 cq-panel p-3 hover:border-mage-400/60 transition-colors"
              >
                <span className="text-xs font-bold text-slate-500 shrink-0">
                  KV{lesson.order}
                </span>
                <span className="text-sm text-slate-200 truncate">{lesson.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 cq-panel p-6 text-center">
        <h2 className="text-lg font-bold text-slate-100">Muốn bắt đầu thật?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Tạo tài khoản để lưu tiến trình, nhận XP, huy hiệu và chứng chỉ của riêng em.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Link to="/auth/register">
            <Button>Tạo tài khoản</Button>
          </Link>
          <Link to="/demo">
            <Button variant="secondary">Thử nhiệm vụ mẫu trước</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
