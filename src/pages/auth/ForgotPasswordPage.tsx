import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { requestPasswordReset, validateEmail } from '@/services/supabase/auth.service';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);
    const { error } = await requestPasswordReset(email);
    setIsSubmitting(false);

    // Luôn báo thành công dù email có tồn tại hay không — tránh lộ danh sách tài khoản.
    if (error) {
      setFormError(error);
      return;
    }
    setIsSent(true);
  };

  if (isSent) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <MailCheck className="size-12 text-verdant-400 mx-auto" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold text-slate-100 mt-4">Đã gửi rồi nhé</h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Nếu <strong>{email}</strong> đúng là email tài khoản của em, thầy trò mình vừa gửi một
          đường dẫn đặt lại mật khẩu tới đó. Em kiểm tra hộp thư (kể cả thư mục Spam) nhé.
        </p>
        <Link to="/auth/login" className="inline-block mt-6">
          <Button variant="secondary">Về trang đăng nhập</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-extrabold text-slate-100 text-center">Quên mật khẩu</h1>
      <p className="text-sm text-slate-400 text-center mt-1 mb-6">
        Không sao cả — chuyện này ai cũng gặp. Em nhập email đã dùng để đăng ký nhé.
      </p>

      <form onSubmit={handleSubmit} noValidate className="cq-card p-6 space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Email đã đăng ký"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldError}
          leadingIcon={<Mail className="size-4" />}
          placeholder="tenem@gmail.com"
        />

        <Button type="submit" fullWidth isLoading={isSubmitting} loadingLabel="Đang gửi">
          Gửi đường dẫn đặt lại
        </Button>

        <p className="text-center text-sm">
          <Link to="/auth/login" className="text-slate-400 hover:text-slate-200">
            Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
