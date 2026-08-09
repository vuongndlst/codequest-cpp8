import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ByteMascot } from '@/components/game/ByteMascot';
import { signIn, validateEmail } from '@/services/supabase/auth.service';
import { isSupabaseConfigured } from '@/lib/env';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const emailError = validateEmail(email);
    const passwordError = password ? null : 'Em chưa nhập mật khẩu.';

    if (emailError || passwordError) {
      setFieldErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const { data, error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }
    if (data) navigate(redirectTo, { replace: true });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-6">
        <ByteMascot size={72} className="mx-auto" mood="happy" />
        <h1 className="text-2xl font-extrabold text-slate-100 mt-3">Chào mừng trở lại!</h1>
        <p className="text-sm text-slate-400 mt-1">
          ByteLand đang chờ Code Guardian quay lại tiếp tục hành trình.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Alert tone="warning" className="mb-4" title="Chưa kết nối máy chủ">
          Website đang chạy ở chế độ Demo nên chưa đăng nhập được. Em vẫn có thể{' '}
          <Link to="/demo" className="underline font-medium">
            thử một nhiệm vụ mẫu
          </Link>
          .
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="cq-card p-6 space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          leadingIcon={<Mail className="size-4" />}
          placeholder="tenem@gmail.com"
        />

        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
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

        <Button type="submit" fullWidth isLoading={isSubmitting} loadingLabel="Đang đăng nhập">
          Đăng nhập
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link to="/auth/forgot" className="text-quest-400 hover:underline">
            Quên mật khẩu?
          </Link>
          <Link to="/auth/register" className="text-slate-400 hover:text-slate-200">
            Chưa có tài khoản? <span className="text-quest-400">Đăng ký</span>
          </Link>
        </div>
      </form>

      <p className="text-center text-xs text-slate-500 mt-4">
        Dùng chung máy ở phòng máy? Nhớ bấm <strong>Đăng xuất</strong> khi học xong nhé.
      </p>
    </div>
  );
}
