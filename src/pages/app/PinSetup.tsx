import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LockKeyhole, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePinMutation } from '@/store/api/platformApi';
import { useMeQuery } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { logout, updateUser } from '@/store/slices/authSlice';
import { PIN_REGEX } from '@/lib/security';

const PinSetup = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [updatePin, { isLoading }] = useUpdatePinMutation();
  const { refetch: refreshUser } = useMeQuery();
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const normalizePin = (value: string) => value.replace(/\D/g, '').slice(0, 5);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!PIN_REGEX.test(pin)) {
      toast.error(t('settings.pinInvalid'));
      return;
    }
    if (pin !== confirmation) {
      toast.error(t('settings.pinMismatch'));
      return;
    }

    try {
      await updatePin({ pin }).unwrap();
      setIsRefreshingUser(true);
      const refreshedUser = await refreshUser().unwrap();
      if (refreshedUser.isPin !== true) {
        throw new Error('Le serveur n’a pas confirmé la configuration du code PIN.');
      }
      dispatch(updateUser(refreshedUser));
      toast.success(t('settings.pinSetupSuccess'));
      const destination = (location.state as { from?: unknown } | null)?.from;
      navigate(typeof destination === 'string' && destination.startsWith('/app/') ? destination : '/app', { replace: true });
    } catch (error) {
      const data = (error as { data?: { detail?: string; message?: string } })?.data;
      const status = (error as { status?: number | string })?.status;
      if (status === 403) {
        toast.error(t('settings.pinSetupReauth'));
        dispatch(logout());
        navigate('/login', { replace: true });
        return;
      }
      toast.error(data?.detail || data?.message || (error instanceof Error ? error.message : t('common.error')));
    } finally {
      setIsRefreshingUser(false);
    }
  };

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-8">
      <Card className="w-full max-w-lg overflow-hidden rounded-3xl border-primary/15 shadow-elegant">
        <CardHeader className="items-center bg-gradient-to-br from-primary/10 via-background to-background px-7 pb-6 pt-9 text-center">
          <span className="mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <CardTitle className="font-display text-2xl">{t('settings.pinSetupTitle')}</CardTitle>
          <CardDescription className="max-w-sm text-sm leading-relaxed">
            {t('settings.pinSetupDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-7 pb-8 pt-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-pin">{t('settings.newPin')}</Label>
              <Input id="new-pin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={5} value={pin} onChange={(event) => setPin(normalizePin(event.target.value))} placeholder="•••••" className="h-12 rounded-xl text-center text-xl tracking-[0.5em]" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pin">{t('settings.confirmPin')}</Label>
              <Input id="confirm-pin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={5} value={confirmation} onChange={(event) => setConfirmation(normalizePin(event.target.value))} placeholder="•••••" className="h-12 rounded-xl text-center text-xl tracking-[0.5em]" required />
            </div>
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm leading-relaxed text-muted-foreground">
              <LockKeyhole className="mr-2 inline h-4 w-4 text-primary" />{t('settings.pinRequired')}
            </div>
            <Button type="submit" disabled={isLoading || isRefreshingUser} className="h-12 w-full rounded-xl bg-gradient-brand shadow-brand">
              {isLoading || isRefreshingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {isLoading || isRefreshingUser ? t('common.loading') : t('settings.updatePin')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default PinSetup;
