import { Link } from 'react-router-dom';
import { BookOpen, Brain, Bug, Map, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ByteMascot } from '@/components/game/ByteMascot';
import { LESSONS_META } from '@/data/lessons.meta';
import { getIcon } from '@/utils/icons';

const HIGHLIGHTS = [
  {
    icon: Bug,
    title: 'Báo lỗi bằng tiếng Việt',
    body: 'Không phải "Syntax error" khó hiểu. Hệ thống chỉ đúng dòng và gợi ý từng bước: "Có vẻ em đang thiếu dấu ; ở cuối dòng 4."',
  },
  {
    icon: Sparkles,
    title: 'Gợi ý tăng dần, không cho đáp án ngay',
    body: 'Ba mức gợi ý: câu hỏi định hướng, nhắc cấu trúc, rồi khung code. Em vẫn là người tự viết ra lời giải.',
  },
  {
    icon: ShieldCheck,
    title: 'Sai không bị phạt',
    body: 'Không có chữ "Thất bại". Chỉ có "Bug vẫn còn, thử lại nhé". Code của em luôn được giữ nguyên, thử lại bao nhiêu lần cũng được.',
  },
];

export function LandingPage() {
  return (
    <div>
      {/* --- Mở đầu --- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center">
        <ByteMascot size={96} className="mx-auto" mood="cheer" />

        <p className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mage-500/15 text-mage-300 text-xs font-semibold">
          Dành cho học sinh lớp 8
        </p>

        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight">
          CodeQuest <span className="text-quest-400">C++ 8</span>
        </h1>
        <p className="mt-2 text-xl sm:text-2xl font-semibold text-mage-300">
          Hành trình giải cứu ByteLand
        </p>

        <p className="mt-5 max-w-2xl mx-auto text-slate-400 leading-relaxed">
          ByteLand — một thế giới số — đang bị các Bug phá hoại. Em vào vai một{' '}
          <strong className="text-slate-200">Code Guardian</strong>, đi qua 5 khu vực và phục hồi
          từng vùng đất bằng chính những dòng code C++ mình viết ra.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/auth/register">
            <Button size="lg" leadingIcon={<Play className="size-5" aria-hidden="true" />}>
              Bắt đầu hành trình
            </Button>
          </Link>
          <Link to="/demo">
            <Button size="lg" variant="secondary">
              Thử một nhiệm vụ mẫu
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Thử nhiệm vụ mẫu không cần đăng nhập. Tiến trình chỉ được lưu khi em có tài khoản.
        </p>

        <Link
          to="/prologue"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-mage-400/40 bg-mage-500/5 hover:border-mage-400/70 transition-colors"
        >
          <Brain className="size-4 text-mage-300" aria-hidden="true" />
          <span className="text-sm text-slate-200">
            Chưa biết bắt đầu từ đâu?{' '}
            <strong className="text-mage-300">Đọc "Thuật toán là gì?" trước</strong>
          </span>
        </Link>
      </section>

      {/* --- 5 khu vực --- */}
      <section aria-labelledby="zones-heading" className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="zones-heading" className="text-2xl font-bold text-slate-100 text-center">
          Năm khu vực của ByteLand
        </h2>
        <p className="text-sm text-slate-400 text-center mt-1">
          Học đúng thứ tự: cú pháp cơ bản → hàm → vòng lặp → điều kiện → tổng hợp
        </p>

        <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 list-none">
          {LESSONS_META.map((lesson) => {
            const Icon = getIcon(lesson.icon);
            return (
              <li key={lesson.id} className="cq-card p-4">
                <span
                  className="grid place-items-center size-11 rounded-xl bg-quest-500/15 text-quest-400"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Khu vực {lesson.order}
                </p>
                <h3 className="font-bold text-slate-100">{lesson.zoneName}</h3>
                <p className="text-sm text-slate-400 mt-1">{lesson.title}</p>
              </li>
            );
          })}
        </ol>

        <div className="text-center mt-6">
          <Link to="/map-preview">
            <Button variant="ghost" leadingIcon={<Map className="size-4" aria-hidden="true" />}>
              Xem trước bản đồ
            </Button>
          </Link>
        </div>
      </section>

      {/* --- Điểm khác biệt --- */}
      <section aria-labelledby="highlights-heading" className="mx-auto max-w-5xl px-4 py-12">
        <h2 id="highlights-heading" className="text-2xl font-bold text-slate-100 text-center mb-8">
          Học lập trình mà không sợ sai
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="cq-card p-5">
              <span
                className="grid place-items-center size-11 rounded-xl bg-mage-500/15 text-mage-300"
                aria-hidden="true"
              >
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-bold text-slate-100">{item.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Dành cho giáo viên --- */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="cq-panel p-6 sm:p-8 text-center">
          <BookOpen className="size-8 text-quest-400 mx-auto" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold text-slate-100">Một lưu ý nhỏ</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
            CodeQuest C++ 8 là <strong className="text-slate-200">công cụ hỗ trợ</strong> trong một
            số thời điểm của tiết học — không thay thế bài giảng, hoạt động nhóm hay phần thực hành
            trên lớp. Website giúp học sinh luyện tập theo nhịp riêng và giúp giáo viên nhìn được
            lớp mình đang vướng ở đâu.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Khoá học: CodeQuest C++ 8 · Giáo viên phụ trách: Nguyễn Đình Vương
          </p>
        </div>
      </section>
    </div>
  );
}
