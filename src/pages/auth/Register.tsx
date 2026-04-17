import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useRegisterMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, 'At least 8 characters').max(100),
  terms: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
});

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', terms: false });
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
      const res = await register(form).unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: res.access, refreshToken: res.refresh }));
      toast.success(t('auth.registerSuccess'));
      navigate('/app/kyc');
    } catch (e: any) {
      toast.error(e?.data?.detail || t('common.error'));
    }
  };

  return (
    <AuthLayout side={{ title: t('brand.tagline'), subtitle: t('landing.heroSubtitle') }}>
      <div className="space-y-2 mb-8">
        <h1 className="font-display text-3xl font-bold">{t('auth.registerTitle')}</h1>
        <p className="text-muted-foreground">{t('auth.registerSubtitle')}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('auth.firstName')}</Label>
            <Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('auth.lastName')}</Label>
            <Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t('auth.email')}</Label>
          <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t('auth.password')}</Label>
          <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox checked={form.terms} onCheckedChange={(v) => setForm({...form, terms: !!v})} className="mt-0.5" />
          <span className="text-muted-foreground">{t('auth.termsAccept')}</span>
        </label>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
        <Button type="submit" className="w-full bg-gradient-brand shadow-brand h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('auth.signUp')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')} <Link to="/login" className="font-medium text-primary hover:underline">{t('auth.signIn')}</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
