import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: 'demo@lipaxe.app', password: 'demo1234' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string,string> = {};
      parsed.error.issues.forEach(i => errs[i.path[0] as string] = i.message);
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: res.access, refreshToken: res.refresh }));
      toast.success(t('auth.loginSuccess'));
      navigate('/app');
    } catch (e: any) {
      toast.error(e?.data?.detail || t('common.error'));
    }
  };

  return (
    <AuthLayout side={{ title: t('landing.heroTitle'), subtitle: t('landing.heroSubtitle') }}>
      <div className="space-y-2 mb-8">
        <h1 className="font-display text-3xl font-bold">{t('auth.loginTitle')}</h1>
        <p className="text-muted-foreground">{t('auth.loginSubtitle')}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Input id="password" type={showPwd ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox /> {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">{t('auth.forgotPassword')}</Link>
        </div>
        <Button type="submit" className="w-full bg-gradient-brand shadow-brand h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('auth.signIn')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.noAccount')} <Link to="/register" className="font-medium text-primary hover:underline">{t('auth.signUp')}</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
