import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/common/StateViews';
import {
  MIN_PASSWORD_LENGTH,
  getCurrentSession,
  updatePassword,
  validatePassword,
} from '@/services/supabase/auth.service';

/**
 * Đặt lại mật khẩu.
 *
 * Học sinh tới đây bằng đường dẫn trong email. Supabase JS (flow PKCE) tự đọc
 * mã trong URL và tạo phiên tạm trước khi trang này render, nên chỉ cần kiểm
 * tra xem đã có phiên hay chưa.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await getCurrentSession();
      if (cancelled) return;
      setHasSession(Boolean(session));
      setIsChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const passwordError = validatePassword(password);
    const confirmError =
      password === confirmPassword ? null : 'Hai ô mật khẩu chưa giống nhau. Em nhập lại nhé.';

    if (passwordError || confirmError) {
      setFieldErrors({ password: passwordError ?? undefined, confirm: confirmError ?? undefined });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }
    setIsDone(true);
  };

  if (isChecking) {
    return <LoadingState label="Đang kiểm tra đường dẫn…" />;
  }

  if (!hasSession) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-100">Đường dẫn không còn dùng được</h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Đường dẫn đặt lại mật khẩu có hạn sử dụng. Em bấm "Quên mật khẩu" để nhận đường dẫn mới
          nhé.
        </p>
        <Link to="/auth/forgot" className="inline-block mt-6">
          <Button>Nhận đường dẫn mới</Button>
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-100">Xong rồi!</h1>
        <p className="text-sm text-slate-400 mt-2">
          Mật khẩu mới đã được lưu. Em nhớ ghi lại chỗ nào an toàn nhé.
        </p>
        <Button className="mt-6" onClick={() => navigate('/app', { replace: true })}>
          Vào bản đồ ByteLand
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-extrabold text-slate-100 text-center">Đặt mật khẩu mới</h1>
      <p className="text-sm text-slate-400 text-center mt-1 mb-6">
        Em chọn một mật khẩu dễ nhớ với mình nhưng khó đoán với người khác nhé.
      </p>

      <form onSubmit={handleSubmit} noValidate className="cq-card p-6 space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          hint={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`}
          leadingIcon={<KeyRound className="size-4" />}
          trailingSlot={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="grid place-items-center size-8 rounded-lg text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
        />

        <Input
          label="Nhập lại mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldErrors.confirm}
          leadingIcon={<KeyRound className="size-4" />}
        />

        <Button type="submit" fullWidth isLoading={isSubmitting} loadingLabel="Đang lưu">
          Lưu mật khẩu mới
        </Button>
      </form>
    </div>
  );
}
