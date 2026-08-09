import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Hash, KeyRound, Mail, Ticket, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { AVATARS, DEFAULT_AVATAR_ID } from '@/data/avatars';
import {
  MIN_PASSWORD_LENGTH,
  checkPassword,
  signUp,
  validateClassCode,
  validateEmail,
  validateFullName,
  validatePasswordConfirm,
} from '@/services/supabase/auth.service';
import { joinClassByCode } from '@/services/supabase/classes.repo';
import { isSupabaseConfigured } from '@/lib/env';
import { cn } from '@/utils/cn';

type FieldName = 'fullName' | 'classCode' | 'email' | 'password' | 'passwordConfirm';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Giáo viên gửi link kèm mã lớp -> điền sẵn để học sinh khỏi gõ nhầm
  const prefilledCode = searchParams.get('lop') ?? '';

  const [form, setForm] = useState({
    fullName: '',
    classCode: prefilledCode,
    studentCode: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const passwordCheck = useMemo(
    () => checkPassword(form.password, { email: form.email, fullName: form.fullName }),
    [form.password, form.email, form.fullName],
  );

  const setField = (name: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const errors: Partial<Record<FieldName, string>> = {};
    const fullNameError = validateFullName(form.fullName);
    const classCodeError = validateClassCode(form.classCode);
    const emailError = validateEmail(form.email);
    const confirmError = validatePasswordConfirm(form.password, form.passwordConfirm);

    if (fullNameError) errors.fullName = fullNameError;
    if (classCodeError) errors.classCode = classCodeError;
    if (emailError) errors.email = emailError;
    if (passwordCheck.error) errors.password = passwordCheck.error;
    if (confirmError) errors.passwordConfirm = confirmError;

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
      // Tên lớp thật sẽ được ghi đè sau khi vào lớp bằng mã
      className: '',
      studentCode: form.studentCode,
      avatarId,
    });

    if (error) {
      setIsSubmitting(false);
      setFormError(error);
      return;
    }

    // Tài khoản đã tạo. Giờ đưa em vào đúng lớp bằng mã.
    try {
      await joinClassByCode(form.classCode);
    } catch (joinError) {
      setIsSubmitting(false);
      setFieldErrors({
        classCode:
          joinError instanceof Error ? joinError.message : 'Không vào được lớp với mã này.',
      });
      setFormError(
        'Tài khoản của em đã được tạo. Em chỉ cần nhập đúng mã lớp là vào học được ngay — ' +
          'hoặc đăng nhập rồi nhập mã sau cũng được.',
      );
      return;
    }

    setIsSubmitting(false);

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

      {prefilledCode && (
        <Alert tone="success" className="mb-4">
          Em đang vào lớp có mã <strong>{prefilledCode}</strong> — mã đã điền sẵn giúp em rồi.
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
            label="Mã lớp"
            required
            value={form.classCode}
            onChange={(event) => setField('classCode')(event.target.value.toUpperCase())}
            error={fieldErrors.classCode}
            hint="Thầy cô cho em mã này"
            leadingIcon={<Ticket className="size-4" />}
            placeholder="8A1-K7MQ"
            autoCapitalize="characters"
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

        <div className="space-y-2">
          <Input
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setField('password')(event.target.value)}
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
          <PasswordStrengthMeter password={form.password} check={passwordCheck} />
        </div>

        <Input
          label="Nhập lại mật khẩu"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={form.passwordConfirm}
          onChange={(event) => setField('passwordConfirm')(event.target.value)}
          error={fieldErrors.passwordConfirm}
          leadingIcon={<KeyRound className="size-4" />}
          hint={
            form.passwordConfirm && form.password === form.passwordConfirm
              ? 'Hai ô khớp nhau rồi'
              : undefined
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
        ảnh thật, không cần số điện thoại. Mật khẩu cần ít nhất {MIN_PASSWORD_LENGTH} ký tự.
      </p>
    </div>
  );
}
