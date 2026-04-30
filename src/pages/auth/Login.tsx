import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { IconInput } from '@/components/IconInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { isSafeRedirect } from '@/lib/security';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
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
  const redirect = params.get('redirect') || '';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: res.access, refreshToken: res.refresh }));
      toast.success(t('auth.loginSuccess'));
      const target = redirect && isSafeRedirect(redirect) ? redirect : '/app';
      navigate(target);
    } catch (e: any) {
      toast.error(e?.data?.detail || t('common.error'));
    }
  };

  return (
    <AuthLayout side={{ title: t('landing.heroTitle'), subtitle: t('landing.heroSubtitle') }}>
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-bold leading-tight">{t('auth.loginTitle')}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t('auth.loginSubtitle')}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <IconInput
          icon={<FaEnvelope className="h-4 w-4" />}
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          placeholder="vous@lipaxe.app"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />

        <IconInput
          icon={<FaLock className="h-4 w-4" />}
          label={t('auth.password')}
          type={showPwd ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Toggle password visibility"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox /> {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl bg-gradient-brand shadow-brand" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auth.signIn')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          {t('auth.signUp')}
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
