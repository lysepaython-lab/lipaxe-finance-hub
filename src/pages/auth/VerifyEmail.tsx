import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';
import { Loader2, MailCheck, RefreshCw, PencilLine, Clock, ShieldCheck, Smartphone } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useResendOtpMutation, useVerifyEmailMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { useUpdatePendingEmailMutation } from '@/store/api/securityApi';
import { EditEmailModal } from '@/components/security/EditEmailModal';
import {
  setPendingVerification,
  getPendingVerification,
  clearPendingVerification,
  updatePendingEmail,
} from '@/lib/pendingVerification';
import { isSafeRedirect } from '@/lib/security';
import { toast } from 'sonner';

const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 6;

const VerifyEmail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const pending = getPendingVerification();
  const initialEmail = pending?.email || '';
  const initialUserId = pending?.userId || '';
  const initialRedirect = pending?.redirect || '';

  const [userId] = useState(initialUserId);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(() => (initialUserId ? RESEND_COOLDOWN : 0));
  const [editOpen, setEditOpen] = useState(false);
  const submittingRef = useRef(false);
  const [verifyEmail, { isLoading: verifying }] = useVerifyEmailMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();
  const [updatePending] = useUpdatePendingEmailMutation();

  useEffect(() => {
    if (!userId || !email) return;
    setPendingVerification({
      userId,
      email,
      redirect: initialRedirect,
      reference: pending?.reference,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, userId]);

  useEffect(() => {
    if (pending || !initialUserId) return;
    toast.error(t('auth.pendingVerificationMissing'));
    navigate('/register', { replace: true });
  }, [initialUserId, navigate, pending, t]);

  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submit = async (code = otp) => {
    if (submittingRef.current) return;
    if (code.length !== OTP_LENGTH) {
      setError(t('auth.otpIncomplete'));
      return;
    }
    if (!userId) {
      setError(t('auth.pendingAccountMissing'));
      return;
    }
    setError(null);
    submittingRef.current = true;
    try {
      const session = await verifyEmail({ userId, otp: code }).unwrap();
      dispatch(setCredentials({ user: session.user, accessToken: session.access, refreshToken: session.refresh }));
      clearPendingVerification();
      toast.success(t('auth.emailVerified'));
      const continuation = initialRedirect && isSafeRedirect(initialRedirect) ? initialRedirect : '/app/kyc';
      navigate(continuation, { replace: true });
    } catch (e: unknown) {
      const failure = e as { data?: { detail?: string }; message?: string };
      setError(failure?.data?.detail || failure?.message || t('auth.otpInvalid'));
    } finally {
      submittingRef.current = false;
    }
  };

  const onResend = async () => {
    if (cooldown || !userId) return;
    try {
      const r = await resendOtp({ userId, email }).unwrap();
      toast.success(t('auth.codeResent'));
      if (r.otp) toast.info(`${t('auth.demoCode')}: ${r.otp}`);
      setCooldown(RESEND_COOLDOWN);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const onChangeEmail = async (newEmail: string, currentOtp: string) => {
    if (!userId) throw new Error('Inscription en attente introuvable.');
    await updatePending({ challenge_id: userId, email, new_email: newEmail, otp: currentOtp }).unwrap();
    setEmail(newEmail);
    updatePendingEmail(newEmail);
    setOtp('');
    setError(null);
    setEditOpen(false);
    toast.success(t('auth.emailUpdatedCodeResent'));
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <AuthLayout side={{ title: t('auth.verifyTitle'), subtitle: t('auth.verifySubtitle') }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-primary/5"
      >
        <div className="relative border-b border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-brand">
              <MailCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <ShieldCheck className="h-3 w-3" />
                {t('auth.secureLogin')}
              </p>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{t('auth.verifyTitle')}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t('auth.verifySentTo')} <span className="font-semibold text-foreground">{email}</span>
              </p>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <PencilLine className="h-3.5 w-3.5" /> {t('auth.editEmail')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <div className="rounded-3xl border border-border bg-background/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{t('auth.enterOtpCode')}</p>
                <p className="text-xs text-muted-foreground">{t('auth.enterOtpCodeDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* {pending && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="font-medium text-foreground">{t('auth.verificationSavedTitle')}</div>
            <div className="text-muted-foreground">{t('auth.verificationSavedBody')}</div>
          </div>
        </div>
      )} */}

      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          <InputOTP
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setError(null);
              if (v.length === OTP_LENGTH) void submit(v);
            }}
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-10 rounded-xl border-2 bg-card text-lg shadow-sm sm:h-14 sm:w-12 sm:rounded-2xl sm:text-xl" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-brand shadow-brand" disabled={verifying || otp.length !== OTP_LENGTH}>
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <FaShieldAlt className="mr-2 h-4 w-4" /> {t('auth.verifyAction')}
          </Button>
        </motion.div>

        <div className="space-y-2 text-center text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || resending || !userId}
            className="inline-flex items-center gap-1.5 text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `${t('auth.resendIn')} ${cooldown}s` : t('auth.resendCode')}
          </button>
          <div>
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </form>

      <EditEmailModal
        open={editOpen}
        currentEmail={email}
        currentOtp={otp}
        onClose={() => setEditOpen(false)}
        onSubmit={onChangeEmail}
      />
    </AuthLayout>
  );
};

export default VerifyEmail;
