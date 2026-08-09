import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Play, RotateCcw } from 'lucide-react';
import { getChallenge } from '@/lessons';
import { useChallengeSession } from '@/hooks/useChallengeSession';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { ResultPanel } from '@/components/editor/ResultPanel';
import { HintPanel } from '@/components/learning/HintPanel';
import { HandbookModal } from '@/components/learning/Handbook';
import { ByteMascot } from '@/components/game/ByteMascot';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { SaveIndicator } from '@/components/common/StateViews';
import { NotFoundPage } from '@/pages/UpcomingPage';

const DEMO_LESSON_ID = 'l1';
const DEMO_CHALLENGE_ID = 'l1-c2-concept';

/**
 * Chế độ Demo (mục 21 của đề bài).
 *
 * Người chưa đăng nhập vẫn thử được một nhiệm vụ thật — cùng engine, cùng bộ
 * chẩn đoán lỗi, cùng hệ thống gợi ý. Chỉ khác một điều: tiến trình lưu trong
 * localStorage, KHÔNG ghi gì lên Supabase.
 *
 * Khi đăng nhập, hệ thống KHÔNG tự động đưa dữ liệu Demo vào tài khoản —
 * việc đó phải hỏi học sinh trước.
 */
export function DemoPage() {
  const [handbookOpen, setHandbookOpen] = useState(false);
  const challenge = getChallenge(DEMO_LESSON_ID, DEMO_CHALLENGE_ID);

  const session = useChallengeSession({
    challenge: challenge!,
    persist: false,
  });

  if (!challenge) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-100">Thử một nhiệm vụ thật</h1>
        <p className="text-sm text-slate-400 mt-1">
          Đây đúng là nhiệm vụ số 2 của Khu vực 1 — không phải bản rút gọn.
        </p>
      </div>

      <Alert tone="info">
        Em đang ở <strong>chế độ dùng thử</strong>. Code được lưu tạm trên máy này, nhưng XP, huy
        hiệu và chứng chỉ chỉ được ghi nhận khi em có tài khoản.{' '}
        <Link to="/auth/register" className="underline font-medium text-quest-400">
          Tạo tài khoản miễn phí
        </Link>
      </Alert>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="cq-panel p-4">
            <div className="flex gap-3">
              <ByteMascot size={44} animated={false} />
              <p className="text-sm text-slate-300 leading-relaxed">{challenge.story}</p>
            </div>
          </section>

          <section className="cq-panel p-4">
            <h2 className="text-sm font-bold text-slate-200 mb-2">Yêu cầu</h2>
            <ul className="space-y-1.5">
              {challenge.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-quest-400 shrink-0" aria-hidden="true">
                    ·
                  </span>
                  <span className="leading-relaxed">{instruction}</span>
                </li>
              ))}
            </ul>
          </section>

          <HintPanel
            hints={challenge.hints}
            unlockedLevel={session.hintLevel}
            onUnlock={session.unlockNextHint}
            canViewSolution={false}
            onViewSolution={() => undefined}
            solutionVisible={false}
            attemptCount={session.attemptCount}
          />
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">Code của em</h2>
            <SaveIndicator state={session.saveState} />
          </div>

          <CodeEditor
            value={session.code}
            onChange={session.setCode}
            highlightedLines={session.highlightedLines}
            ariaLabel="Vùng viết code cho nhiệm vụ dùng thử"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void session.run()}
              isLoading={session.isRunning}
              loadingLabel="Đang chạy"
              leadingIcon={<Play className="size-4" aria-hidden="true" />}
            >
              Chạy code
            </Button>
            <Button
              variant="secondary"
              onClick={session.reset}
              leadingIcon={<RotateCcw className="size-4" aria-hidden="true" />}
            >
              Đặt lại
            </Button>
            <Button
              variant="secondary"
              onClick={() => setHandbookOpen(true)}
              leadingIcon={<BookOpen className="size-4" aria-hidden="true" />}
            >
              Xem lệnh
            </Button>
          </div>

          <ResultPanel
            result={session.result}
            isRunning={session.isRunning}
            onRequestHint={session.unlockNextHint}
            hintsAvailable={session.hintLevel < challenge.hints.length}
          />

          {session.result?.isCorrect && (
            <div className="cq-card p-4 border-verdant-500/50 bg-verdant-500/5 text-center">
              <ByteMascot size={48} mood="cheer" className="mx-auto" />
              <p className="font-bold text-verdant-400 mt-2">Em làm được rồi!</p>
              <p className="text-sm text-slate-300 mt-1">
                Còn 8 nhiệm vụ nữa đang chờ ở Làng Khởi Động, và 4 khu vực khác của ByteLand.
              </p>
              <Link to="/auth/register" className="inline-block mt-3">
                <Button>Tạo tài khoản để đi tiếp</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <HandbookModal
        open={handbookOpen}
        onClose={() => setHandbookOpen(false)}
        upToLessonId={DEMO_LESSON_ID}
      />
    </div>
  );
}
