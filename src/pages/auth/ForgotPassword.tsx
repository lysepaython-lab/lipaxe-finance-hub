import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FaEnvelope } from 'react-icons/fa';
import { Loader2, MailCheck } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { IconInput } from '@/components/IconInput';
import { Button } from '@/components/ui/button';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [forgot, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!z.string().email().safeParse(email).success) {
      setError('Email invalide');
      return;
    }
    setError(null);
    try {
      await forgot({ email }).unwrap();
      setSent(true);
      toast.success(t('auth.resetSent'));
    } catch (e: any) {
      toast.error(e?.data?.detail || t('common.error'));
    }
  };

  return (
    <AuthLayout side={{ title: t('auth.forgotTitle'), subtitle: t('auth.forgotSubtitle') }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2 mb-8"
      >
        <h1 className="font-display text-3xl font-bold">{t('auth.forgotTitle')}</h1>
        <p className="text-muted-foreground">{t('auth.forgotSubtitle')}</p>
      </motion.div>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-border bg-muted/30 p-8 text-center space-y-3"
        >
          <div className="mx-auto h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center">
            <MailCheck className="h-6 w-6" />
          </div>
          <p className="font-medium">{t('auth.resetSent')}</p>
          <Link to="/login" className="text-sm text-primary hover:underline inline-block">
            {t('auth.backToLogin')}
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <IconInput
            icon={<FaEnvelope className="h-4 w-4" />}
            label={t('auth.email')}
            type="email"
            placeholder="vous@lipaxe.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button className="w-full bg-gradient-brand shadow-brand h-11 rounded-xl" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('auth.sendLink')}
            </Button>
          </motion.div>
          <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            {t('auth.backToLogin')}
          </Link>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
