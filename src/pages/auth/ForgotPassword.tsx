import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FaEnvelope, FaKey, FaLock } from 'react-icons/fa';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { IconInput } from '@/components/IconInput';
import { Button } from '@/components/ui/button';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/store/api/authApi';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgot, { isLoading: requesting }] = useForgotPasswordMutation();
  const [reset, { isLoading: resetting }] = useResetPasswordMutation();
  const isLoading = requesting || resetting;

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!z.string().email().safeParse(email).success) {
      setErrors({ email: 'Email invalide' });
      return;
    }
    setErrors({});
    try {
      const res = await forgot({ email: email.trim().toLowerCase() }).unwrap();
      setCodeSent(true);
      toast.success(res.detail || 'Code OTP envoye.');
    } catch (error: any) {
      toast.error(error?.data?.detail || t('common.error'));
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!z.string().email().safeParse(email).success) nextErrors.email = 'Email invalide';
    if (!otp.trim() || otp.trim().length < 4) nextErrors.otp = 'Code OTP requis';
    if (password.length < 8) nextErrors.password = 'Au moins 8 caracteres';
    if (password !== confirm) nextErrors.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await reset({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
        re_password: confirm,
      }).unwrap();
      toast.success(t('auth.passwordUpdated'));
      navigate('/login');
    } catch (error: any) {
      toast.error(error?.data?.detail || t('common.error'));
    }
  };

  return (
    <AuthLayout side={{ title: t('auth.forgotTitle'), subtitle: 'Recevez un OTP par email puis choisissez un nouveau mot de passe.' }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2 mb-8"
      >
        <h1 className="font-display text-3xl font-bold">{t('auth.forgotTitle')}</h1>
        <p className="text-muted-foreground">Nous envoyons un code OTP, pas un lien. Le meme flux marche pour le web et le mobile.</p>
      </motion.div>

      <form onSubmit={codeSent ? submitReset : requestOtp} className="space-y-4">
        <IconInput
          icon={<FaEnvelope className="h-4 w-4" />}
          label={t('auth.email')}
          type="email"
          placeholder="vous@lipaxe.app"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        {codeSent ? (
          <>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <MailCheck className="h-4 w-4 text-primary" />
                Code envoye
              </div>
              Entrez le code recu sur {email}, puis votre nouveau mot de passe.
            </div>
            <IconInput
              icon={<FaKey className="h-4 w-4" />}
              label="Code OTP"
              inputMode="numeric"
              placeholder="12345"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              error={errors.otp}
            />
            <IconInput
              icon={<FaLock className="h-4 w-4" />}
              label={t('auth.password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPwd((value) => !value)}
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
          </>
        ) : null}

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button className="w-full bg-gradient-brand shadow-brand h-11 rounded-xl" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {codeSent ? t('auth.updatePassword') : 'Envoyer le code OTP'}
          </Button>
        </motion.div>

        {codeSent ? (
          <button
            type="button"
            onClick={() => void requestOtp()}
            disabled={requesting}
            className="block w-full text-center text-sm text-primary hover:underline disabled:text-muted-foreground"
          >
            Renvoyer le code
          </button>
        ) : null}

        <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          {t('auth.backToLogin')}
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
