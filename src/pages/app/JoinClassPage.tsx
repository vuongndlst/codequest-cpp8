import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Ticket } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingState } from '@/components/common/StateViews';
import { validateClassCode } from '@/services/supabase/auth.service';
import { fetchMyClass, joinClassByCode, type ClassRow } from '@/services/supabase/classes.repo';

/**
 * Học sinh nhập mã lớp.
 *
 * Cần trang này vì hai nhóm em:
 *   · Em đăng ký TRƯỚC khi có tính năng lớp — chưa thuộc lớp nào
 *   · Em bị xếp nhầm lớp, hoặc chuyển lớp giữa năm
 *
 * Ở form đăng ký thì mã lớp là bắt buộc, còn ở đây là tự nguyện — nên giọng
 * thông báo cũng nhẹ nhàng hơn.
 */
export function JoinClassPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const [currentClass, setCurrentClass] = useState<ClassRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [code, setCode] = useState((searchParams.get('lop') ?? '').toUpperCase());
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joined, setJoined] = useState<ClassRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const row = await fetchMyClass();
      if (!cancelled) {
        setCurrentClass(row);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const error = validateClassCode(code);
    if (error) {
      setCodeError(error);
      return;
    }

    setCodeError(null);
    setIsSubmitting(true);

    try {
      const classRow = await joinClassByCode(code);
      setJoined(classRow);

      // RPC vừa cập nhật `class_name` trong hồ sơ — nạp lại để thanh trên cùng
      // và trang hồ sơ hiện đúng lớp mới ngay, không phải tải lại trang.
      await refreshProfile();
    } catch (joinError) {
      setCodeError(
        joinError instanceof Error ? joinError.message : 'Không vào được lớp với mã này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState label="Đang kiểm tra lớp của em…" />;

  if (joined) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <CheckCircle2 className="size-14 text-verdant-400 mx-auto" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold text-slate-100 mt-4">Em đã vào lớp!</h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Em đang ở lớp <strong className="text-slate-200">{joined.name}</strong>. Từ giờ thầy cô
          sẽ thấy tiến trình của em trong đúng lớp này.
        </p>
        <Button className="mt-6" onClick={() => navigate('/app', { replace: true })}>
          Về bản đồ ByteLand
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        to="/app"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Về bản đồ
      </Link>

      <Card>
        <CardHeader
          title="Nhập mã lớp"
          description="Mã này thầy cô cho em, ví dụ 8A1-K7MQ"
          icon={<Ticket className="size-5 text-quest-400" aria-hidden="true" />}
        />

        {currentClass && (
          <Alert tone="info" className="mb-4">
            Em đang ở lớp <strong>{currentClass.name}</strong>. Nếu em nhập mã lớp khác, em sẽ
            chuyển sang lớp đó — điểm XP, huy hiệu và chứng chỉ của em vẫn giữ nguyên hết.
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Mã lớp"
            required
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            error={codeError}
            placeholder="8A1-K7MQ"
            autoCapitalize="characters"
            autoComplete="off"
            className="font-mono tracking-widest"
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            loadingLabel="Đang kiểm tra mã"
          >
            {currentClass ? 'Chuyển sang lớp này' : 'Vào lớp'}
          </Button>
        </form>

        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          Mã lớp không có chữ O, chữ I và chữ L để em khỏi nhầm với số 0 và số 1. Nếu nhập mãi
          không được, em hỏi lại thầy cô xem mã có đúng không nhé.
        </p>
      </Card>
    </div>
  );
}
