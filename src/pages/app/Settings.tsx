import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useUpdatePinMutation } from '@/store/api/platformApi';
import { PIN_REGEX } from '@/lib/security';
import { toast } from 'sonner';

const Settings = () => {
  const { t } = useTranslation();
  const user = useAppSelector(s => s.auth.user);
  const [updatePin, { isLoading: updatingPin }] = useUpdatePinMutation();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const payUrl = `https://pay.lipaxe.app/${user?.username || 'demo'}`;

  const normalizePin = (value: string) => value.replace(/\D/g, '').slice(0, 5);

  const onUpdatePin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!PIN_REGEX.test(newPin)) {
      toast.error(t('settings.pinInvalid'));
      return;
    }
    if (newPin !== confirmPin) {
      toast.error(t('settings.pinMismatch'));
      return;
    }
    try {
      await updatePin({ pin: newPin, current_pin: currentPin || undefined }).unwrap();
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      toast.success(t('settings.pinUpdated'));
    } catch (error) {
      toast.error((error as { data?: { detail?: string } })?.data?.detail || t('common.error'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('settings.title')}</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant border-border/60">
          <CardHeader><CardTitle className="font-display">{t('settings.profile')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t('auth.firstName')}</Label><Input defaultValue={user?.firstName} /></div>
              <div className="space-y-2"><Label>{t('auth.lastName')}</Label><Input defaultValue={user?.lastName} /></div>
            </div>
            <div className="space-y-2"><Label>{t('auth.email')}</Label><Input defaultValue={user?.email} /></div>
            <Button className="bg-gradient-brand shadow-brand">{t('common.save')}</Button>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-border/60">
          <CardHeader><CardTitle className="font-display">{t('settings.qr')}</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="rounded-2xl bg-white p-4 shadow-elegant">
              <QRCodeSVG value={payUrl} size={180} fgColor="#0787b3" />
            </div>
            <p className="text-sm text-muted-foreground tabular text-center break-all">{payUrl}</p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-border/60 lg:col-span-2">
          <CardHeader><CardTitle className="font-display">{t('settings.preferences')}</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t('common.theme')}</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t('common.language')}</span>
              <LanguageSwitcher />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">{t('settings.pinTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onUpdatePin} className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('settings.currentPin')}</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={5}
                  value={currentPin}
                  onChange={(event) => setCurrentPin(normalizePin(event.target.value))}
                  placeholder="•••••"
                  className="h-12 rounded-xl tracking-[0.4em]"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.newPin')}</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={5}
                  value={newPin}
                  onChange={(event) => setNewPin(normalizePin(event.target.value))}
                  placeholder="•••••"
                  className="h-12 rounded-xl tracking-[0.4em]"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.confirmPin')}</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={5}
                  value={confirmPin}
                  onChange={(event) => setConfirmPin(normalizePin(event.target.value))}
                  placeholder="•••••"
                  className="h-12 rounded-xl tracking-[0.4em]"
                />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={updatingPin} className="h-11 rounded-xl bg-gradient-brand shadow-brand">
                  {t('settings.updatePin')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
