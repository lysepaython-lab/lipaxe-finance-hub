import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaKey, FaUserFriends } from 'react-icons/fa';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { IconInput } from '@/components/IconInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useRegisterMutation } from '@/store/api/authApi';
import { toast } from 'sonner';
import { isSafeRedirect } from '@/lib/security';
import { getPendingVerification, setPendingVerification } from '@/lib/pendingVerification';

const buildSchema = (t: (key: string) => string) => z.object({
  firstName: z.string().trim().min(1, t('auth.requiredField')).max(50),
  lastName: z.string().trim().min(1, t('auth.requiredField')).max(50),
  email: z.string().trim().email(t('auth.invalidEmail')).max(255),
  password: z.string().min(8, t('auth.passwordTooShort')).max(100),
  reference: z.string().trim().max(64).optional().or(z.literal('')),
  terms: z.literal(true, { errorMap: () => ({ message: t('auth.termsRequired') }) }),
});

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [register, { isLoading }] = useRegisterMutation();
  const incomingRef = params.get('reference') || params.get('ref') || '';
  const redirect = params.get('redirect') || '';
  const pendingVerification = getPendingVerification();
  const schema = useMemo(() => buildSchema(t), [t]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    reference: incomingRef,
    terms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (incomingRef && !form.reference) setForm((f) => ({ ...f, reference: incomingRef }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingRef]);

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
      const res = await register(form).unwrap();
      const safeRedirect = redirect && isSafeRedirect(redirect) ? redirect : '';
      setPendingVerification({
        userId: res.userId,
        email: form.email,
        redirect: safeRedirect || undefined,
        reference: form.reference || undefined,
      });
      toast.success(t('auth.registerSuccess'));
      navigate('/verify-email');
    } catch (e: unknown) {
      const failure = e as { data?: Record<string, unknown> };
      const data = failure?.data;
      const challengeId = data?.challenge_id;
      if (challengeId) {
        setPendingVerification({ userId: String(challengeId), email: String(data?.email || form.email) });
        toast.error(String(data?.detail || t('common.error')));
        navigate('/verify-email');
        return;
      }
      const firstError = data ? Object.values(data).flat().find((v) => typeof v === 'string') : null;
      toast.error(String(firstError || data?.detail || t('common.error')));
    }
  };

  return (
    <AuthLayout side={{ title: t('auth.registerSideTitle'), subtitle: t('auth.registerSideSubtitle') }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 space-y-2"
      >
        <h1 className="font-display text-3xl font-bold">{t('auth.registerTitle')}</h1>
        <p className="text-muted-foreground">{t('auth.registerSubtitle')}</p>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <IconInput
            icon={<FaUser className="h-4 w-4" />}
            label={t('auth.firstName')}
            placeholder="Jean"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            error={errors.firstName}
          />
          <IconInput
            icon={<FaUser className="h-4 w-4" />}
            label={t('auth.lastName')}
            placeholder="Dupont"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            error={errors.lastName}
          />
        </div>

        <IconInput
          icon={<FaEnvelope className="h-4 w-4" />}
          label={t('auth.email')}
          type="email"
          placeholder="vous@lipaxe.app"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />

        <IconInput
          icon={<FaKey className="h-4 w-4" />}
          label={t('auth.password')}
          type={showPwd ? 'text' : 'password'}
          placeholder="********"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPwd ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <IconInput
          icon={<FaUserFriends className="h-4 w-4" />}
          label={t('auth.referralCode')}
          placeholder="LIPAXE-XXXX"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value.toUpperCase().slice(0, 64) })}
          error={errors.reference}
        />

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <Checkbox
            checked={form.terms}
            onCheckedChange={(v) => setForm({ ...form, terms: !!v })}
            className="mt-0.5"
          />
          <span className="text-muted-foreground">{t('auth.termsAccept')}</span>
        </label>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button type="submit" className="h-11 w-full rounded-xl bg-gradient-brand shadow-brand" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('auth.signUp')}
          </Button>
        </motion.div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
      {pendingVerification?.userId && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm">
          <p className="text-muted-foreground">{t('auth.pendingSignupNotice')}</p>
          <Link to="/verify-email" className="mt-1 inline-block font-semibold text-primary hover:underline">
            {t('auth.resumeVerification')}
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};

export default Register;
