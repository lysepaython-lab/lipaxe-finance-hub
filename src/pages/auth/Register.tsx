import { useEffect, useState } from 'react';
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
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { toast } from 'sonner';
import { isSafeRedirect } from '@/lib/security';
import { setPendingVerification } from '@/lib/pendingVerification';

const schema = z.object({
  firstName: z.string().trim().min(1, 'Requis').max(50),
  lastName: z.string().trim().min(1, 'Requis').max(50),
  email: z.string().trim().email('Email invalide').max(255),
  password: z.string().min(8, 'Au moins 8 caractères').max(100),
  reference: z.string().trim().max(64).optional().or(z.literal('')),
  terms: z.literal(true, { errorMap: () => ({ message: 'Requis' }) }),
});

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const [register, { isLoading }] = useRegisterMutation();
  const incomingRef = params.get('reference') || params.get('ref') || '';
  const redirect = params.get('redirect') || '';
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    reference: incomingRef, terms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Keep referral synced if user lands with a query param after typing nothing.
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
      dispatch(setCredentials({ user: res.user, accessToken: res.access, refreshToken: res.refresh }));
      const safeRedirect = redirect && isSafeRedirect(redirect) ? redirect : '';
      // Persist a durable "pending verification" record so the user can come
      // back later (closed tab / new device) and resume the OTP flow safely.
      setPendingVerification({
        email: form.email,
        redirect: safeRedirect || undefined,
        reference: form.reference || undefined,
      });
      toast.success(t('auth.registerSuccess'));
      const verifyUrl = `/verify-email?email=${encodeURIComponent(form.email)}${safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ''}`;
      navigate(verifyUrl);
    } catch (e: any) {
      toast.error(e?.data?.detail || t('common.error'));
    }
  };

  return (
    <AuthLayout side={{ title: t('brand.tagline'), subtitle: t('landing.heroSubtitle') }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2 mb-8"
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
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          icon={<FaUserFriends className="h-4 w-4" />}
          label={`${t('auth.referralCode') || 'Code de parrainage'} (optionnel)`}
          placeholder="LIPAXE-XXXX"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value.toUpperCase().slice(0, 64) })}
          error={errors.reference}
        />

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={form.terms}
            onCheckedChange={(v) => setForm({ ...form, terms: !!v })}
            className="mt-0.5"
          />
          <span className="text-muted-foreground">{t('auth.termsAccept')}</span>
        </label>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button type="submit" className="w-full bg-gradient-brand shadow-brand h-11 rounded-xl" disabled={isLoading}>
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
    </AuthLayout>
  );
};

export default Register;
