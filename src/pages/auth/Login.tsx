import { useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { IconInput } from '@/components/IconInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { isSafeRedirect } from '@/lib/security';
import { setPendingVerification } from '@/lib/pendingVerification';
import { toast } from 'sonner';

const buildSchema = (t: (key: string) => string) => z.object({
  email: z.string().trim().email(t('auth.invalidEmail')),
  password: z.string().min(6, t('auth.passwordTooShort')),
});

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [rememberMe, setRememberMe] = useState(false);
  const schema = useMemo(() => buildSchema(t), [t]);

  const redirect = params.get('redirect') || '';

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validateField = useCallback((field: string, value: string) => {
    const fieldSchema = schema.shape[field as keyof typeof schema.shape];
    if (!fieldSchema) return;

    const result = fieldSchema.safeParse(value);
    if (!result.success) {
      setErrors((prev) => ({
        ...prev,
        [field]: result.error.issues[0].message,
      }));
    }
  }, [schema]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(nextErrors);
      setTouched({ email: true, password: true });
      return;
    }

    setErrors({});
    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials({
        user: res.user,
        accessToken: res.access,
        refreshToken: res.refresh,
      }));
      toast.success(t('auth.loginSuccess'));
      const target = redirect && isSafeRedirect(redirect) ? redirect : '/app';
      navigate(target);
    } catch (e: any) {
      const data = e?.data as {
        error?: string;
        message?: string;
        detail?: string;
        verification?: { user_id?: string | number; email?: string };
      } | undefined;

      // A verification recovery is exposed only after the backend has checked
      // the password. No session is issued until the email OTP is validated.
      if (
        data?.error === 'account_not_verified'
        && data.verification?.user_id
        && data.verification.email
      ) {
        setPendingVerification({
          userId: String(data.verification.user_id),
          email: data.verification.email,
          redirect: redirect && isSafeRedirect(redirect) ? redirect : undefined,
        });
        toast.info(data.message || t('auth.emailVerificationRequired'));
        navigate('/verify-email', { replace: true });
        return;
      }

      toast.error(data?.detail || data?.message || t('common.error'));
    }
  };

  const isFormValid = form.email.length > 0 && form.password.length >= 6;

  return (
    <AuthLayout side={{ title: t('auth.loginSideTitle'), subtitle: t('auth.loginSideSubtitle') }}>
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t('auth.secureLogin')}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">
          {t('auth.loginTitle')}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <IconInput
            icon={<FaEnvelope className="h-4 w-4 text-muted-foreground" />}
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            placeholder="vous@lipaxe.app"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, email: true }));
              validateField('email', form.email);
            }}
            error={touched.email ? errors.email : undefined}
            className={errors.email && touched.email ? 'border-destructive focus-visible:ring-destructive/20' : ''}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <IconInput
            icon={<FaLock className="h-4 w-4 text-muted-foreground" />}
            label={t('auth.password')}
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, password: true }));
              validateField('password', form.password);
            }}
            error={touched.password ? errors.password : undefined}
            className={errors.password && touched.password ? 'border-destructive focus-visible:ring-destructive/20' : ''}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                aria-label={showPwd ? t('auth.hidePassword') : t('auth.showPassword')}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </div>

        {/* Options */}
        <div className="flex items-center justify-between">
          <label className="group flex cursor-pointer items-center gap-2.5 text-sm transition-colors">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              className="transition-colors data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {t('auth.rememberMe')}
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-4"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="group h-12 w-full rounded-xl bg-gradient-brand shadow-brand transition-all hover:shadow-brand-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading || !isFormValid}
        >
          <span className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('auth.signIn')}
            {!isLoading && (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </span>
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center">
          
        </div>
      </div>

      {/* Social Login (placeholder) */}
      {/* <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-all hover:bg-muted hover:border-border/80"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-all hover:bg-muted hover:border-border/80"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          GitHub
        </button>
      </div> */}

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <Link
          to="/register"
          className="inline-flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-4"
        >
          {t('auth.signUp')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
