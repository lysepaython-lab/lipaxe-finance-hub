import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FaEnvelope, FaKey, FaLock } from 'react-icons/fa';
import { ArrowLeft, Check, Eye, EyeOff, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { IconInput } from '@/components/IconInput';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/store/api/authApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ResetStep = 'email' | 'otp' | 'password';

const OTP_LENGTH = 5;
const RESEND_COOLDOWN = 30;

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgot, { isLoading: requesting }] = useForgotPasswordMutation();
  const [reset, { isLoading: resetting }] = useResetPasswordMutation();

  const normalizedEmail = email.trim().toLowerCase();
  const isLoading = requesting || resetting;

  const stepIndex = useMemo(() => ({ email: 0, otp: 1, password: 2 }[step]), [step]);
  const sideSubtitle = step === 'email'
    ? t('auth.forgotStepEmailDesc')
    : step === 'otp'
      ? t('auth.forgotStepOtpDesc')
      : t('auth.forgotStepPasswordDesc');

  useEffect(() => {
    if (!cooldown) return;
    const id = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const requestOtp = async (e?: FormEvent, resend = false) => {
    e?.preventDefault();
    if (!z.string().email().safeParse(normalizedEmail).success) {
      setErrors({ email: 'Email invalide' });
      setStep('email');
      return;
    }

    setErrors({});
    try {
      const res = await forgot({ email: normalizedEmail }).unwrap();
      setOtp('');
      setStep('otp');
      setCooldown(RESEND_COOLDOWN);
      toast.success(res.detail || (resend ? t('auth.codeResent') : t('auth.otpSent')));
    } catch (error: any) {
      toast.error(error?.data?.detail || t('common.error'));
    }
  };

  const verifyOtpStep = (e: FormEvent) => {
    e.preventDefault();
    const code = otp.trim();
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) {
      setErrors({ otp: t('auth.otpIncomplete') });
      return;
    }
    setErrors({});
    setStep('password');
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!z.string().email().safeParse(normalizedEmail).success) nextErrors.email = 'Email invalide';
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp.trim())) nextErrors.otp = t('auth.otpIncomplete');
    if (password.length < 8) nextErrors.password = 'Au moins 8 caracteres';
    if (password !== confirm) nextErrors.confirm = t('auth.passwordsDontMatch');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.email) setStep('email');
      else if (nextErrors.otp) setStep('otp');
      return;
    }

    try {
      await reset({
        email: normalizedEmail,
        otp: otp.trim(),
        password,
        re_password: confirm,
      }).unwrap();
      toast.success(t('auth.passwordUpdated'));
      navigate('/login');
    } catch (error: any) {
      const message = error?.data?.detail || t('common.error');
      toast.error(message);
      if (String(message).toLowerCase().includes('otp') || String(message).toLowerCase().includes('code')) {
        setErrors({ otp: message });
        setStep('otp');
      }
    }
  };

  const onSubmit = step === 'email' ? requestOtp : step === 'otp' ? verifyOtpStep : submitReset;

  return (
    <AuthLayout side={{ title: t('auth.forgotTitle'), subtitle: sideSubtitle }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-7 space-y-5"
      >
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold">
            {step === 'email' ? t('auth.forgotStepEmailTitle') : step === 'otp' ? t('auth.forgotStepOtpTitle') : t('auth.forgotStepPasswordTitle')}
          </h1>
          <p className="text-muted-foreground">{sideSubtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            t('auth.email'),
            t('auth.otp'),
            t('auth.password'),
          ].map((label, index) => (
            <div
              key={label}
              className={cn(
                'rounded-2xl border px-3 py-2 text-xs transition-colors',
                index <= stepIndex ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-muted/30 text-muted-foreground',
              )}
            >
              <div className="mb-1 flex items-center gap-1.5 font-medium">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-[11px]">
                  {index < stepIndex ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-4">
        {step === 'email' && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <IconInput
              icon={<FaEnvelope className="h-4 w-4" />}
              label={t('auth.email')}
              type="email"
              placeholder="vous@lipaxe.app"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
              error={errors.email}
            />
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <MailCheck className="h-4 w-4 text-primary" />
                {t('auth.otpSent')}
              </div>
              {t('auth.otpSentDesc', { email: normalizedEmail })}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">{t('auth.otp')}</label>
              <InputOTP
                maxLength={OTP_LENGTH}
                value={otp}
                onChange={(value) => {
                  setOtp(value.replace(/\D/g, ''));
                  setErrors({});
                }}
              >
                <InputOTPGroup className="w-full justify-between gap-2">
                  {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} className="h-12 w-12 rounded-xl text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('auth.changeEmail')}
              </button>
              <button
                type="button"
                onClick={() => void requestOtp(undefined, true)}
                disabled={requesting || cooldown > 0}
                className="inline-flex items-center gap-1 text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', requesting && 'animate-spin')} />
                {cooldown > 0 ? `${t('auth.resendIn')} ${cooldown}s` : t('auth.resendCode')}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'password' && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <FaKey className="h-4 w-4 text-primary" />
                {t('auth.otpAccepted')}
              </div>
              {t('auth.otpAcceptedDesc')}
            </div>

            <IconInput
              icon={<FaLock className="h-4 w-4" />}
              label={t('auth.password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPwd((value) => !value)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
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
              placeholder="********"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
            />
            <button
              type="button"
              onClick={() => setStep('otp')}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('auth.backToOtp')}
            </button>
          </motion.div>
        )}

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button className="h-11 w-full rounded-xl bg-gradient-brand shadow-brand" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {step === 'email' ? t('auth.sendOtp') : step === 'otp' ? t('auth.verifyAction') : t('auth.updatePassword')}
          </Button>
        </motion.div>

        <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          {t('auth.backToLogin')}
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
