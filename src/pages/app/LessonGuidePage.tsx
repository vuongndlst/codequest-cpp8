import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { markGuideRead } from '@/utils/guideProgress';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { getLesson } from '@/lessons';
import { ConceptGuidePanel } from '@/components/learning/ConceptGuidePanel';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { NotFoundPage } from '@/pages/UpcomingPage';
import { useAuthStore } from '@/stores/authStore';

/**
 * Trang "Học kiến thức" của một khu vực.
 *
 * Tách thành trang riêng thay vì nhét vào trang khu vực, vì hai lý do:
 *   · Nội dung dài, đọc trên một trang riêng dễ tập trung hơn
 *   · Học sinh quay lại tra cứu giữa chừng mà không mất chỗ đang làm dở
 *
 * Trang này KHÔNG khoá và KHÔNG tính điểm — đọc bao nhiêu lần cũng được.
 */
export function LessonGuidePage() {
  const { lessonId = '' } = useParams();
  const isSignedIn = useAuthStore((state) => state.status === 'authenticated');
  const lesson = getLesson(lessonId);

  // Ghi nhớ là em đã mở phần lý thuyết, để trang khu vực thôi mời đọc nữa
  useEffect(() => {
    if (lesson) markGuideRead(lessonId);
  }, [lesson, lessonId]);

  if (!lesson) return <NotFoundPage />;

  const firstChallenge = lesson.challenges[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link
        to={isSignedIn ? `/app/lesson/${lessonId}` : '/map-preview'}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {isSignedIn ? lesson.zoneName : 'Bản đồ ByteLand'}
      </Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Khu vực {lesson.order} · Học kiến thức
        </p>
        <h1 className="text-2xl font-extrabold text-slate-100">{lesson.title}</h1>
        <p className="text-sm text-slate-400 mt-1">
          Đọc phần này trước khi làm nhiệm vụ. Không tính điểm, không giới hạn số lần đọc.
        </p>
      </header>

      {!isSignedIn && (
        <Alert tone="info">
          Phần kiến thức mở cho tất cả mọi người, không cần đăng nhập. Muốn làm nhiệm vụ và lưu
          tiến trình thì em{' '}
          <Link to="/auth/register" className="underline font-medium text-quest-400">
            tạo tài khoản
          </Link>{' '}
          nhé.
        </Alert>
      )}

      <ConceptGuidePanel guide={lesson.conceptGuide} />

      <div className="cq-card p-5 text-center">
        <p className="text-sm text-slate-300">
          Đọc xong rồi thì bắt tay vào làm thôi. Nếu giữa chừng quên, em quay lại đây bất cứ lúc
          nào.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          {isSignedIn ? (
            <>
              <Link to={`/app/lesson/${lessonId}/challenge/${firstChallenge.id}`}>
                <Button
                  leadingIcon={<Play className="size-4" aria-hidden="true" />}
                  trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                >
                  Bắt đầu nhiệm vụ đầu tiên
                </Button>
              </Link>
              <Link to={`/app/lesson/${lessonId}`}>
                <Button variant="secondary">Xem danh sách nhiệm vụ</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth/register">
                <Button leadingIcon={<Play className="size-4" aria-hidden="true" />}>
                  Tạo tài khoản để bắt đầu
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="secondary">Thử một nhiệm vụ mẫu</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
