import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Hash, KeyRound, Mail, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/data/avatars';
import {
  MIN_PASSWORD_LENGTH,
  signUp,
  validateClassName,
  validateEmail,
  validateFullName,
  validatePassword,
} from '@/services/supabase/auth.service';
import { isSupabaseConfigured } from '@/lib/env';
import { cn } from '@/utils/cn';

type FieldName = 'fullName' | 'className' | 'email' | 'password';

export function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    className: '',
    studentCode: '',
    email: '',
    password: '',
  });
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Hiện khi Supabase bật xác nhận email — dự phòng nếu thầy đổi cài đặt */
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const setField = (name: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const errors: Partial<Record<FieldName, string>> = {};
    const fullNameError = validateFullName(form.fullName);
    const classNameError = validateClassName(form.className);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (fullNameError) errors.fullName = fullNameError;
    if (classNameError) errors.className = classNameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const { data, error } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      className: form.className,
      studentCode: form.studentCode,
      avatarId,
    });

    setIsSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    // Khi tắt xác nhận email, Supabase trả về phiên đăng nhập ngay -> vào thẳng bản đồ.
    // Nếu thầy bật lại xác nhận email, `data.identities` rỗng hoặc chưa có phiên -> hiện màn hình chờ.
    if (data && !data.confirmed_at && !data.email_confirmed_at) {
      setNeedsEmailConfirm(true);
      return;
    }

    navigate('/app', { replace: true });
  };

  if (needsEmailConfirm) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Mail className="size-12 text-quest-400 mx-auto" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold text-slate-100 mt-4">Em kiểm tra hộp thư nhé</h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Thầy trò mình vừa gửi một email xác nhận tới <strong>{form.email}</strong>. Em mở email
          đó rồi bấm vào đường dẫn để kích hoạt tài khoản. Nếu không thấy, em kiểm tra cả thư mục
          Spam nhé.
        </p>
        <Link to="/auth/login" className="inline-block mt-6">
          <Button variant="secondary">Về trang đăng nhập</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-100">Tạo tài khoản Code Guardian</h1>
        <p className="text-sm text-slate-400 mt-1">
          Điền vài thông tin để ByteLand biết em là ai nhé.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Alert tone="warning" className="mb-4" title="Chưa kết nối máy chủ">
          Website đang chạy ở chế độ Demo nên chưa tạo tài khoản được. Em báo thầy giúp nhé.
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="cq-card p-6 space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Input
          label="Họ và tên"
          required
          autoComplete="name"
          value={form.fullName}
          onChange={(event) => setField('fullName')(event.target.value)}
          error={fieldErrors.fullName}
          leadingIcon={<UserRound className="size-4" />}
          placeholder="Nguyễn Văn An"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Lớp"
            required
            value={form.className}
            onChange={(event) => setField('className')(event.target.value)}
            error={fieldErrors.className}
            leadingIcon={<GraduationCap className="size-4" />}
            placeholder="8A1"
          />
          <Input
            label="Mã học sinh"
            value={form.studentCode}
            onChange={(event) => setField('studentCode')(event.target.value)}
            leadingIcon={<Hash className="size-4" />}
            hint="Không bắt buộc"
            placeholder="HS0123"
          />
        </div>

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(event) => setField('email')(event.target.value)}
          error={fieldErrors.email}
          leadingIcon={<Mail className="size-4" />}
          placeholder="tenem@gmail.com"
        />

        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setField('password')(event.target.value)}
          error={fieldErrors.password}
          hint={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự. Em nên thêm cả số cho an toàn.`}
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

        <fieldset>
          <legend className="block text-sm font-medium text-slate-200 mb-2">
            Chọn nhân vật của em
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((avatar) => {
              const isSelected = avatar.id === avatarId;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarId(avatar.id)}
                  aria-pressed={isSelected}
                  title={avatar.name}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors',
                    isSelected
                      ? 'border-quest-500 bg-quest-500/10'
                      : 'border-abyss-600 hover:border-abyss-500',
                  )}
                >
                  <AvatarIcon avatarId={avatar.id} size={40} />
                  <span className="text-[10px] text-slate-400 text-center leading-tight">
                    {avatar.name}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Button type="submit" fullWidth isLoading={isSubmitting} loadingLabel="Đang tạo tài khoản">
          Bắt đầu hành trình
        </Button>

        <p className="text-center text-sm text-slate-400">
          Đã có tài khoản?{' '}
          <Link to="/auth/login" className="text-quest-400 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>

      <p className="text-xs text-slate-500 mt-4 text-center leading-relaxed">
        Website chỉ lưu họ tên, lớp, mã học sinh và email của em để phục vụ việc học. Không cần
        ảnh thật, không cần số điện thoại.
      </p>
    </div>
  );
}
