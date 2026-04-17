import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useResetPasswordMutation } from '@/store/api/authApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || 'demo';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reset, { isLoading }] = useResetPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password too short'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    try {
      await reset({ token, password }).unwrap();
      toast.success(t('auth.passwordUpdated'));
      navigate('/login');
    } catch (e: any) { toast.error(e?.data?.detail || t('common.error')); }
  };

  return (
    <AuthLayout side={{ title: t('auth.resetTitle'), subtitle: t('auth.forgotSubtitle') }}>
      <div className="space-y-2 mb-8">
        <h1 className="font-display text-3xl font-bold">{t('auth.resetTitle')}</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{t('auth.password')}</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t('auth.confirmPassword')}</Label>
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <Button className="w-full bg-gradient-brand shadow-brand h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {t('auth.updatePassword')}
        </Button>
        <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">{t('auth.backToLogin')}</Link>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
