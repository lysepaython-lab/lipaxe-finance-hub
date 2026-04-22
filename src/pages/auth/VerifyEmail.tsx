import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';
import { Loader2, MailCheck, RefreshCw, PencilLine, Clock } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useResendOtpMutation, useVerifyEmailMutation } from '@/store/api/authApi';
import { useUpdatePendingEmailMutation } from '@/store/api/securityApi';
import { EditEmailModal } from '@/components/security/EditEmailModal';
import {
  setPendingVerification, getPendingVerification, clearPendingVerification, updatePendingEmail,
} from '@/lib/pendingVerification';
import { isSafeRedirect } from '@/lib/security';
import { toast } from 'sonner';

const RESEND_COOLDOWN = 30;

const VerifyEmail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Resolve email from (1) URL param, (2) durable pending state, (3) demo fallback.
  const pending = getPendingVerification();
  const initialEmail = params.get('email') || pending?.email || 'demo@lipaxe.app';
  const initialRedirect = params.get('redirect') || pending?.redirect || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [verifyEmail, { isLoading: verifying }] = useVerifyEmailMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();
  const [updatePending] = useUpdatePendingEmailMutation();
  const sentOnce = useRef(false);

  // Persist a "pending verification" record so the user can come back later.
  useEffect(() => {
    setPendingVerification({
      email, redirect: initialRedirect, reference: pending?.reference,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Auto-trigger an initial send so the user sees the demo code
  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    resendOtp({ email })
      .unwrap()
      .then((r) => { if (r.otp) toast.info(`${t('auth.demoCode')}: ${r.otp}`); })
      .catch(() => {});
    setCooldown(RESEND_COOLDOWN);
  }, [email, resendOtp, t]);

  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submit = async (code = otp) => {
    if (code.length !== 6) { setError(t('auth.otpIncomplete')); return; }
    setError(null);
    try {
      await verifyEmail({ email, otp: code }).unwrap();
      clearPendingVerification();
      toast.success(t('auth.emailVerified'));
      const target = initialRedirect && isSafeRedirect(initialRedirect) ? initialRedirect : '/app/kyc';
      navigate(target);
    } catch (e: any) {
      setError(e?.data?.detail || e?.message || t('auth.otpInvalid'));
    }
  };

  const onResend = async () => {
    if (cooldown) return;
    try {
      const r = await resendOtp({ email }).unwrap();
      toast.success(t('auth.codeResent'));
      if (r.otp) toast.info(`${t('auth.demoCode')}: ${r.otp}`);
      setCooldown(RESEND_COOLDOWN);
    } catch { toast.error(t('common.error')); }
  };

  const onChangeEmail = async (newEmail: string) => {
    try {
      // Backend updates the pending account's email + invalidates old OTPs.
      await updatePending({ email, new_email: newEmail }).unwrap().catch(() => {});
      setEmail(newEmail);
      updatePendingEmail(newEmail);
      setOtp('');
      setError(null);
      setEditOpen(false);
      toast.success('Email mis à jour — code renvoyé');
      // Trigger fresh OTP for the new address
      sentOnce.current = false;
      const r = await resendOtp({ email: newEmail }).unwrap().catch(() => null);
      if (r?.otp) toast.info(`${t('auth.demoCode')}: ${r.otp}`);
      setCooldown(RESEND_COOLDOWN);
    } catch (e: any) {
      throw e;
    }
  };

  return (
    <AuthLayout side={{ title: t('auth.verifyTitle'), subtitle: t('auth.verifySubtitle') }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-3 mb-8"
      >
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-brand shadow-brand flex items-center justify-center text-primary-foreground">
          <MailCheck className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">{t('auth.verifyTitle')}</h1>
        <p className="text-muted-foreground">
          {t('auth.verifySentTo')} <span className="font-medium text-foreground">{email}</span>
        </p>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <PencilLine className="h-3.5 w-3.5" /> Mauvaise adresse ? Modifier l'email
        </button>
      </motion.div>

      {pending && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2 text-xs">
          <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-foreground">Vérification en cours sauvegardée</div>
            <div className="text-muted-foreground">Vous pouvez fermer cet onglet et revenir terminer la vérification dans les 7 jours.</div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setError(null);
              if (v.length === 6) submit(v);
            }}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-12 w-11 text-lg font-semibold rounded-xl border-input data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-ring/30"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button type="submit" className="w-full bg-gradient-brand shadow-brand h-11 rounded-xl" disabled={verifying || otp.length !== 6}>
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <FaShieldAlt className="mr-2 h-4 w-4" /> {t('auth.verifyAction')}
          </Button>
        </motion.div>

        <div className="text-center text-sm space-y-2">
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || resending}
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
        onClose={() => setEditOpen(false)}
        onSubmit={onChangeEmail}
      />
    </AuthLayout>
  );
};

export default VerifyEmail;
