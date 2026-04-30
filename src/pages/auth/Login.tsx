import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { motion } from 'framer-motion';
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
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 space-y-3"
      >
        <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
          Web access
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">{t('auth.loginTitle')}</h1>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{t('auth.loginSubtitle')}</p>
      </motion.div>

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
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors"
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

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button type="submit" className="h-12 w-full rounded-2xl bg-gradient-brand text-[15px] shadow-brand" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('auth.signIn')}
          </Button>
        </motion.div>
      </form>

      <div className="mt-8 rounded-[1.5rem] border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">Connexion securisee</div>
        <p className="mt-1 leading-6">
          Cette session utilise l’API Lipaxe en mode web avec verification serveur et persistance protegee des jetons.
        </p>
      </div>

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
