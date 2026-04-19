import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDepositMutation } from '@/store/api/walletApi';
import { usePaymentMethodsDepositQuery, type PaymentMethod, type WalletV2 } from '@/store/api/platformApi';
import { Loader2, Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';
import { WalletSelector } from '@/components/security/WalletSelector';
import { CountryPicker, flagEmoji } from '@/components/security/CountryPicker';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { AsyncStatusPill } from '@/components/security/AsyncStatus';
import { useSubmitOnce } from '@/hooks/useSubmitOnce';
import { depositSchema } from '@/lib/validation';
import { sanitizeText, Throttle } from '@/lib/security';
import { cn } from '@/lib/utils';

const submitThrottle = new Throttle(8, 60_000);

const Deposit = () => {
  const { t } = useTranslation();
  const [deposit, { isLoading }] = useDepositMutation();
  const { data: methods } = usePaymentMethodsDepositQuery();
  const pin = usePinGate();

  const [walletId, setWalletId] = useState<string>();
  const [wallet, setWallet] = useState<WalletV2 | undefined>();
  const [country, setCountry] = useState<string>('FR');
  const [methodId, setMethodId] = useState<string>('');
  const [amount, setAmount] = useState('500');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');

  const filteredMethods = useMemo<PaymentMethod[]>(
    () => (methods || []).filter((m) => m.countries.some((c) => c.country.alpha_2 === country)),
    [methods, country],
  );
  const selectedMethod = filteredMethods.find((m) => m.id === methodId);
  const amt = parseFloat(amount) || 0;
  const fee = selectedMethod ? (selectedMethod.fees?.fixed || 0) + amt * ((selectedMethod.fees?.percent || 0) / 100) : 0;

  const doDeposit = async () => {
    const payload = {
      amount: amt,
      payment_method: methodId,
      wallet_id: walletId || '',
      phone: phone ? sanitizeText(phone) : undefined,
    };
    const parsed = depositSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    if (!submitThrottle.tryAcquire()) {
      toast.error('Trop de tentatives, patientez quelques secondes.');
      return;
    }
    setErrors({});
    setStatus('pending');
    try {
      await deposit({ amount: amt, currency: wallet?.currency || 'USD', method: 'card' }).unwrap();
      setStatus('completed');
      toast.success(t('deposit.success'));
      setDone(true);
    } catch (e) {
      setStatus('failed');
      const detail = (e as { data?: { detail?: string } })?.data?.detail || t('common.error');
      toast.error(detail);
    }
  };

  const [submit, busy] = useSubmitOnce(doDeposit);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) { toast.error(t('deposit.selectWallet')); return; }
    if (!methodId) { toast.error(t('deposit.selectMethod')); return; }
    pin.guard(submit);
  };

  if (done) return (
    <div className="max-w-lg mx-auto">
      <Card className="text-center p-10 shadow-elegant">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">{t('deposit.success')}</h2>
        <p className="text-muted-foreground mt-2">
          {formatMoney(amt, wallet?.currency || 'USD')} → {wallet?.currency}
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => { setDone(false); setStatus('idle'); }}>Nouveau dépôt</Button>
          <Button asChild className="bg-gradient-brand"><a href="/app">Retour au tableau de bord</a></Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('deposit.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('deposit.subtitle')}</p>
        </div>
        <AsyncStatusPill status={status} />
      </div>

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6 space-y-6">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <WalletSelector
              label={t('deposit.selectWallet')}
              value={walletId}
              onChange={(id, w) => { setWalletId(id); setWallet(w); }}
            />
            {errors.wallet_id && <p className="text-xs text-destructive -mt-3">{errors.wallet_id}</p>}

            <CountryPicker
              label={t('deposit.selectCountry')}
              value={country}
              onChange={(code) => { setCountry(code); setMethodId(''); }}
              paymentMethods={methods}
            />

            <div className="space-y-2">
              <Label>{t('deposit.selectMethod')}</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {filteredMethods.map((m) => (
                  <motion.button
                    key={m.id}
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMethodId(m.id)}
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-colors',
                      methodId === m.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40',
                    )}
                  >
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{m.type}</div>
                    {m.fees && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {m.fees.fixed > 0 && `${m.fees.fixed} + `}{m.fees.percent}%
                      </div>
                    )}
                  </motion.button>
                ))}
                {filteredMethods.length === 0 && (
                  <p className="col-span-2 text-sm text-muted-foreground py-4 text-center">
                    {flagEmoji(country)} Aucun mode disponible pour ce pays.
                  </p>
                )}
              </div>
            </div>

            {selectedMethod?.type === 'mobile' && (
              <div className="space-y-2">
                <Label>{t('deposit.phone')}</Label>
                <Input
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+257 ..."
                  className="h-11 rounded-xl"
                  maxLength={20}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('deposit.amount')}</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-display font-bold h-14 tabular rounded-xl"
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deposit.amount')}</span>
                <span className="tabular">{formatMoney(amt, wallet?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deposit.fee')}</span>
                <span className="tabular">{formatMoney(fee, wallet?.currency || 'USD')}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>{t('deposit.youReceive')}</span>
                <span className="tabular text-primary">{formatMoney(Math.max(0, amt - fee), wallet?.currency || 'USD')}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-brand shadow-brand text-base rounded-xl"
              disabled={isLoading || busy}
            >
              {(isLoading || busy) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {t('deposit.confirm')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default Deposit;
