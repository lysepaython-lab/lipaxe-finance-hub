import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWithdrawMutation } from '@/store/api/walletApi';
import { usePaymentMethodsWithdrawalQuery, type PaymentMethod, type WalletV2 } from '@/store/api/platformApi';
import { Loader2, Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';
import { WalletSelector } from '@/components/security/WalletSelector';
import { CountryPicker, flagEmoji } from '@/components/security/CountryPicker';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { AsyncStatusPill } from '@/components/security/AsyncStatus';
import { useSubmitOnce } from '@/hooks/useSubmitOnce';
import { useTransactionPolling } from '@/hooks/useTransactionPolling';
import { sanitizeText, Throttle } from '@/lib/security';
import { z } from 'zod';
import { amountSchema, accountNoSchema } from '@/lib/validation';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

const submitThrottle = new Throttle(8, 60_000);

const schema = z.object({
  amount: amountSchema,
  payment_method: z.string().min(1),
  wallet_id: z.string().min(1),
  destination: accountNoSchema,
});

const Withdraw = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const [withdraw, { isLoading }] = useWithdrawMutation();
  const { data: methods } = usePaymentMethodsWithdrawalQuery();
  const pin = usePinGate();

  const [walletId, setWalletId] = useState<string>();
  const [wallet, setWallet] = useState<WalletV2 | undefined>();
  const [country, setCountry] = useState('FR');
  const [methodId, setMethodId] = useState('');
  const [amount, setAmount] = useState('200');
  const [destination, setDestination] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const status = useTransactionPolling(txId);

  const filteredMethods = useMemo<PaymentMethod[]>(
    () => (methods || []).filter((m) => m.countries.some((c) => c.country.alpha_2 === country)),
    [methods, country],
  );
  const selectedMethod = filteredMethods.find((m) => m.id === methodId);

  const amt = parseFloat(amount) || 0;
  const fee = selectedMethod ? (selectedMethod.fees?.fixed || 0) + amt * ((selectedMethod.fees?.percent || 0) / 100) : 0;
  const total = amt + fee;
  const insufficient = wallet ? total > wallet.available : false;

  // KYC gate: required for withdrawals
  const kycOk = user?.kycStatus === 'verified';

  const doWithdraw = async () => {
    const payload = {
      amount: amt,
      payment_method: methodId,
      wallet_id: walletId || '',
      destination: sanitizeText(destination || phone),
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    if (insufficient) { toast.error(t('transfer.insufficientBalance')); return; }
    if (!submitThrottle.tryAcquire()) { toast.error('Trop de tentatives.'); return; }
    setErrors({});
    try {
      const tx = await withdraw({
        amount: payload.amount,
        payment_method: payload.payment_method,
        wallet_id: payload.wallet_id,
        destination: payload.destination,
        phone: phone || undefined,
      }).unwrap();
      setTxId(tx.id);
      toast.success(t('withdraw.success'));
      setDone(true);
    } catch (e) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail || t('common.error');
      toast.error(detail);
    }
  };

  const [submit, busy] = useSubmitOnce(doWithdraw);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycOk) {
      toast.error('Vérification KYC requise pour les retraits.');
      return;
    }
    if (!walletId) { toast.error(t('withdraw.selectWallet')); return; }
    if (!methodId) { toast.error(t('deposit.selectMethod')); return; }
    pin.guard(submit);
  };

  if (done) return (
    <div className="max-w-lg mx-auto">
      <Card className="text-center p-10 shadow-elegant">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">{t('withdraw.success')}</h2>
        <p className="text-muted-foreground mt-2">
          {formatMoney(amt, wallet?.currency || 'USD')} → {destination || phone}
        </p>
        <div className="my-4"><AsyncStatusPill status={status} /></div>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => { setDone(false); setTxId(null); }}>Nouveau retrait</Button>
          <Button asChild className="bg-gradient-brand"><a href="/app">Retour</a></Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('withdraw.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('withdraw.subtitle')}</p>
      </div>

      {!kycOk && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm">
              <strong>Vérification requise.</strong> Complétez votre KYC pour effectuer des retraits.
            </p>
            <Button asChild variant="outline" size="sm"><a href="/app/kyc">Vérifier</a></Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <WalletSelector
              label={t('withdraw.selectWallet')}
              value={walletId}
              onChange={(id, w) => { setWalletId(id); setWallet(w); }}
            />

            <CountryPicker
              label="Pays de destination"
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
                    {flagEmoji(country)} Aucun mode disponible.
                  </p>
                )}
              </div>
            </div>

            {selectedMethod?.type === 'mobile' ? (
              <div className="space-y-2">
                <Label>Numéro mobile money</Label>
                <Input
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+257 ..."
                  className="h-11 rounded-xl"
                  maxLength={20}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('withdraw.destination')}</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="IBAN, n° de compte ou wallet"
                  className="h-11 rounded-xl"
                  maxLength={64}
                />
                {errors.destination && <p className="text-xs text-destructive">{errors.destination}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('withdraw.amount')}</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-display font-bold h-14 tabular rounded-xl"
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
              {wallet && (
                <p className="text-xs text-muted-foreground">
                  {t('withdraw.available')}:{' '}
                  <span className="tabular font-medium text-foreground">{formatMoney(wallet.available, wallet.currency)}</span>
                </p>
              )}
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('withdraw.amount')}</span>
                <span className="tabular">{formatMoney(amt, wallet?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('withdraw.fee')}</span>
                <span className="tabular">{formatMoney(fee, wallet?.currency || 'USD')}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>{t('withdraw.totalDebit')}</span>
                <span className={cn('tabular', insufficient ? 'text-destructive' : 'text-primary')}>
                  {formatMoney(total, wallet?.currency || 'USD')}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-brand shadow-brand text-base rounded-xl"
              disabled={isLoading || busy || insufficient || !kycOk}
            >
              {(isLoading || busy) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {t('withdraw.confirm')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default Withdraw;
