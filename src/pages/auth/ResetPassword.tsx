import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaLock, FaKey } from 'react-icons/fa';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { IconInput } from '@/components/IconInput';
import { Button } from '@/components/ui/button';
import { useResetPasswordMutation } from '@/store/api/authApi';
import { toast } from 'sonner';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || 'demo';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [reset, { isLoading }] = useResetPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (password.length < 8) errs.password = 'Au moins 8 caractères';
    if (password !== confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await reset({ token, password }).unwrap();
      toast.success(t('auth.passwordUpdated'));
      navigate('/login');
    } catch (e: any) {
      toast.error(e?.data?.detail || t('common.error'));
    }
  };

  return (
    <AuthLayout side={{ title: t('auth.resetTitle'), subtitle: t('auth.forgotSubtitle') }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2 mb-8"
      >
        <h1 className="font-display text-3xl font-bold">{t('auth.resetTitle')}</h1>
        <p className="text-muted-foreground">{t('auth.forgotSubtitle')}</p>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-4">
        <IconInput
          icon={<FaKey className="h-4 w-4" />}
          label={t('auth.password')}
          type={showPwd ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        <IconInput
          icon={<FaLock className="h-4 w-4" />}
          label={t('auth.confirmPassword')}
          type={showPwd ? 'text' : 'password'}
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button className="w-full bg-gradient-brand shadow-brand h-11 rounded-xl" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('auth.updatePassword')}
          </Button>
        </motion.div>
        <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          {t('auth.backToLogin')}
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
