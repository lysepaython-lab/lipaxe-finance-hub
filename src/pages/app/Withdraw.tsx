import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWithdrawMutation } from '@/store/api/walletApi';
import { useCryptoNetworksQuery, useCryptoWithdrawMutation } from '@/store/api/businessApi';
import { usePaymentMethodsWithdrawalQuery, type PaymentMethod, type WalletV2 } from '@/store/api/platformApi';
import { Loader2, Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { AsyncStatusPill } from '@/components/security/AsyncStatus';
import { PaymentMethodFields, type DynamicFields } from '@/components/security/PaymentMethodFields';
import { useSubmitOnce } from '@/hooks/useSubmitOnce';
import { useTransactionPolling } from '@/hooks/useTransactionPolling';
import { sanitizeText, Throttle } from '@/lib/security';
import { amountSchema } from '@/lib/validation';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/moneyVisuals';

const submitThrottle = new Throttle(8, 60_000);

const paymentMethodLogo = (method: PaymentMethod) => {
  if (!method.icon) return null;
  return resolveMediaUrl(method.icon);
};

const Withdraw = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const [withdraw, { isLoading }] = useWithdrawMutation();
  const [cryptoWithdraw, { isLoading: cryptoLoading }] = useCryptoWithdrawMutation();
  const { data: methods } = usePaymentMethodsWithdrawalQuery();
  const pin = usePinGate();

  const [walletId, setWalletId] = useState<string>();
  const [wallet, setWallet] = useState<WalletV2 | undefined>();
  const [methodId, setMethodId] = useState('');
  const [amount, setAmount] = useState('200');
  const [fields, setFields] = useState<DynamicFields>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const status = useTransactionPolling(txId);

  const allMethods = methods || [];
  const selectedMethod = allMethods.find((m) => m.id === methodId);
  const cryptoSym = selectedMethod?.payment_type?.name === 'Cryptos' ? 'USDT' : '';
  const { data: networks } = useCryptoNetworksQuery(cryptoSym, { skip: !cryptoSym });

  // Group methods by payment_type.name
  const grouped = useMemo(() => {
    const map: Record<string, PaymentMethod[]> = {};
    allMethods.forEach((m) => {
      const key = m.payment_type?.name || 'Other';
      (map[key] = map[key] || []).push(m);
    });
    return map;
  }, [allMethods]);

  const amt = parseFloat(amount) || 0;
  const fixedFee = selectedMethod?.fees?.fixed || 0;
  const lipaxeFee = amt * ((selectedMethod?.fees?.withdrawalPercent || 0) / 100);
  const providerFee = amt * ((selectedMethod?.fees?.providerWithdrawalPercent || 0) / 100);
  const hasFeeBreakdown = lipaxeFee > 0 || providerFee > 0;
  const fallbackFee = hasFeeBreakdown ? 0 : amt * ((selectedMethod?.fees?.percent || 0) / 100);
  const fee = fixedFee + lipaxeFee + providerFee + fallbackFee;
  const total = amt + fee;
  const insufficient = wallet ? total > wallet.available : false;
  const kycOk = user?.kycStatus === 'verified';

  const validateExtra = (): string | null => {
    const typeName = selectedMethod?.payment_type?.name;
    if (typeName === 'Mobile Payment') {
      if (!fields.phone || !/^\+?[0-9 ]{6,20}$/.test(fields.phone)) return 'Numéro mobile invalide';
    }
    if (typeName === 'Bank Transfer') {
      const num = (fields.card_number || '').replace(/\s/g, '');
      if (!/^\d{13,16}$/.test(num)) return 'Numéro de carte invalide';
      if (!/^\d{2}\/\d{2}$/.test(fields.card_validity || '')) return 'Validité invalide (MM/AA)';
    }
    if (typeName === 'Cryptos') {
      if (!fields.destination_address || fields.destination_address.length < 10) return 'Adresse crypto invalide';
      if (!fields.network) return 'Sélectionnez un réseau';
    }
    return null;
  };

  const doWithdraw = async () => {
    const parsed = amountSchema.safeParse(amt);
    if (!parsed.success) {
      setErrors({ amount: parsed.error.issues[0].message });
      return;
    }
    const extra = validateExtra();
    if (extra) { toast.error(extra); return; }
    if (insufficient) { toast.error(t('transfer.insufficientBalance')); return; }
    if (!submitThrottle.tryAcquire()) { toast.error('Trop de tentatives.'); return; }
    setErrors({});
    try {
      const typeName = selectedMethod?.payment_type?.name;
      let tx;
      if (typeName === 'Cryptos') {
        const r = await cryptoWithdraw({
          symbol: 'USDT',
          network: fields.network!,
          address: sanitizeText(fields.destination_address!),
          amount: amt,
          wallet_id: walletId!,
        }).unwrap();
        toast.success(`Retrait crypto ${r.id}`);
        setDone(true);
        return;
      }
      const resolvedPaymentMethod =
        selectedMethod?.provider?.toLowerCase() === 'afripay'
          ? (selectedMethod.correspondent || selectedMethod.name || methodId)
          : methodId;
      const destination =
        typeName === 'Mobile Payment' ? sanitizeText(fields.phone || '') :
        typeName === 'Bank Transfer' ? `${(fields.card_number || '').slice(-4)}` :
        selectedMethod?.name || '';
      tx = await withdraw({
        amount: amt,
        payment_method: resolvedPaymentMethod,
        wallet_id: walletId!,
        destination,
        phone: fields.phone,
      }).unwrap();
      setTxId(tx.id);
      toast.success(t('withdraw.success'));
      setDone(true);
    } catch (e) {
      const detail = (e as { data?: { detail?: string; message?: string; error?: string } })?.data?.detail
        || (e as { data?: { detail?: string; message?: string; error?: string } })?.data?.message
        || (e as { data?: { detail?: string; message?: string; error?: string } })?.data?.error
        || t('common.error');
      toast.error(detail);
    }
  };

  const [submit, busy] = useSubmitOnce(doWithdraw);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycOk) { toast.error('Vérification KYC requise pour les retraits.'); return; }
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
          {formatMoney(amt, wallet?.currency || 'USD')}
        </p>
        <div className="my-4"><AsyncStatusPill status={status} /></div>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => { setDone(false); setTxId(null); setFields({}); }}>Nouveau retrait</Button>
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

            <div className="space-y-3">
              <Label>{t('deposit.selectMethod')}</Label>
              {Object.keys(grouped).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Chargement…</p>
              ) : (
                Object.entries(grouped).map(([type, list]) => (
                  <div key={type} className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{type}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {list.map((m) => (
                        <motion.button
                          key={m.id}
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setMethodId(m.id); setFields({}); }}
                          className={cn(
                            'rounded-xl border-2 p-3 text-left transition-colors',
                            methodId === m.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {paymentMethodLogo(m) ? (
                              <img src={paymentMethodLogo(m)!} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-border" />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                                {m.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <div className="font-semibold text-sm">{m.name}</div>
                          </div>
                          {m.fees && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {(m.fees.withdrawalPercent || m.fees.providerWithdrawalPercent)
                                ? `${t('deposit.totalFees')} ${(m.fees.withdrawalPercent || 0) + (m.fees.providerWithdrawalPercent || 0)}% (${t('deposit.lipaxeFee')} ${m.fees.withdrawalPercent || 0}% + ${t('deposit.providerFee')} ${m.fees.providerWithdrawalPercent || 0}%)`
                                : `${m.fees.fixed > 0 ? `${m.fees.fixed} + ` : ''}${m.fees.percent}%`}
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedMethod?.payment_type?.name === 'Cryptos' && networks && (
              <div className="space-y-2">
                <Label>Réseau</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {networks.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setFields((f) => ({ ...f, network: n.id }))}
                      className={cn(
                        'rounded-lg border-2 p-2 text-xs font-semibold transition-colors',
                        fields.network === n.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40',
                      )}
                    >
                      {n.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <PaymentMethodFields method={selectedMethod} values={fields} onChange={(p) => setFields((f) => ({ ...f, ...p }))} context="withdraw" />

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
              {lipaxeFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('deposit.lipaxeFee')} ({selectedMethod?.fees?.withdrawalPercent || 0}%)
                  </span>
                  <span className="tabular">{formatMoney(lipaxeFee, wallet?.currency || 'USD')}</span>
                </div>
              )}
              {providerFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('deposit.providerFee')} ({selectedMethod?.fees?.providerWithdrawalPercent || 0}%)
                  </span>
                  <span className="tabular">{formatMoney(providerFee, wallet?.currency || 'USD')}</span>
                </div>
              )}
              {fixedFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deposit.fixedFee')}</span>
                  <span className="tabular">{formatMoney(fixedFee, wallet?.currency || 'USD')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deposit.totalFees')}</span>
                <span className="tabular">{formatMoney(fee, wallet?.currency || 'USD')}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>{t('withdraw.totalDebit')}</span>
                <span className={cn('tabular', insufficient ? 'text-destructive' : 'text-primary')}>
                  {formatMoney(total, wallet?.currency || 'USD')}
                </span>
              </div>
              {insufficient && (
                <p className="text-xs text-destructive">{t('transfer.insufficientBalance')}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-brand shadow-brand text-base rounded-xl"
              disabled={isLoading || cryptoLoading || busy || insufficient || !kycOk}
            >
              {(isLoading || cryptoLoading || busy) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
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
