import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useDepositMutation,
  useAfripayDepositMutation,
  useAfripayDepositConfirmMutation,
  useCardDepositMutation,
  useElectronicDepositMutation,
  useCryptoDepositMutation,
} from '@/store/api/walletApi';
import { usePaymentMethodsDepositQuery, type PaymentMethod, type WalletV2 } from '@/store/api/platformApi';
import { useCryptoNetworksQuery } from '@/store/api/businessApi';
import { Loader2, Check, ShieldCheck, Copy } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const submitThrottle = new Throttle(8, 60_000);

const paymentMethodLogo = (method: PaymentMethod) => {
  if (!method.icon) return null;
  return method.icon.startsWith('http') ? method.icon : `${import.meta.env.VITE_API_URL}${method.icon}`;
};

/**
 * Deposit page — grouped by payment_type.name (Mobile / Bank / Electronic / Cryptos).
 * Country picker removed: methods are filtered server-side based on the user's KYC country.
 */
const Deposit = () => {
  const { t } = useTranslation();
  const { data: methods } = usePaymentMethodsDepositQuery();
  const [deposit, { isLoading: l1 }] = useDepositMutation();
  const [afripayDeposit, { isLoading: lAfripay }] = useAfripayDepositMutation();
  const [afripayDepositConfirm, { isLoading: lAfripayConfirm }] = useAfripayDepositConfirmMutation();
  const [cardDeposit, { isLoading: l2 }] = useCardDepositMutation();
  const [elecDeposit, { isLoading: l3 }] = useElectronicDepositMutation();
  const [cryptoDeposit, { isLoading: l4 }] = useCryptoDepositMutation();
  const pin = usePinGate();

  const [walletId, setWalletId] = useState<string>();
  const [wallet, setWallet] = useState<WalletV2 | undefined>();
  const [methodId, setMethodId] = useState('');
  const [amount, setAmount] = useState('500');
  const [fields, setFields] = useState<DynamicFields>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [cryptoAddress, setCryptoAddress] = useState<{ address: string; network: string; symbol: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [pendingAfripayTxId, setPendingAfripayTxId] = useState<string | null>(null);
  const status = useTransactionPolling(txId);

  const allMethods = methods || [];
  const selectedMethod = allMethods.find((m) => m.id === methodId);
  const cryptoSym = selectedMethod?.payment_type?.name === 'Cryptos' ? 'USDT' : '';
  const { data: networks } = useCryptoNetworksQuery(cryptoSym, { skip: !cryptoSym });

  const grouped = useMemo(() => {
    const map: Record<string, PaymentMethod[]> = {};
    allMethods.forEach((m) => {
      const key = m.payment_type?.name || 'Other';
      (map[key] = map[key] || []).push(m);
    });
    return map;
  }, [allMethods]);

  const amt = parseFloat(amount) || 0;
  const fee = selectedMethod ? (selectedMethod.fees?.fixed || 0) + amt * ((selectedMethod.fees?.percent || 0) / 100) : 0;
  const isLoading = l1 || lAfripay || lAfripayConfirm || l2 || l3 || l4;

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
      if (!fields.network) return 'Sélectionnez un réseau';
    }
    return null;
  };

  const doDeposit = async () => {
    const parsed = amountSchema.safeParse(amt);
    if (!parsed.success) { setErrors({ amount: parsed.error.issues[0].message }); return; }
    const extra = validateExtra();
    if (extra) { toast.error(extra); return; }
    if (!submitThrottle.tryAcquire()) { toast.error('Trop de tentatives.'); return; }
    setErrors({});
    try {
      const typeName = selectedMethod?.payment_type?.name;
      if (typeName === 'Cryptos') {
        // Backend returns a deposit address that the user funds externally.
        const r = await cryptoDeposit({
          amount: amt, payment_method: methodId, wallet_id: walletId!, network: fields.network,
        }).unwrap() as unknown as { address?: string; network?: string; symbol?: string; id?: string };
        if (r?.address) {
          setCryptoAddress({ address: r.address, network: r.network || fields.network!, symbol: r.symbol || 'USDT' });
        } else if (r?.id) {
          setTxId(r.id);
        }
        toast.success('Adresse de dépôt générée');
        setDone(true);
        return;
      }
      if (typeName === 'Bank Transfer') {
        const tx = await cardDeposit({
          amount: amt, payment_method: methodId, wallet_id: walletId!,
          card_token: sanitizeText((fields.card_number || '').replace(/\s/g, '').slice(-4)),
        }).unwrap();
        setTxId(tx.id);
      } else if (typeName === 'Electronic') {
        const tx = await elecDeposit({
          amount: amt, payment_method: methodId, wallet_id: walletId!,
        }).unwrap();
        setTxId(tx.id);
      } else {
        const phone = fields.phone ? sanitizeText(fields.phone) : undefined;
        if (!phone) {
          toast.error('Numéro mobile invalide');
          return;
        }

        if (selectedMethod?.provider?.toLowerCase() === 'afripay') {
          const res = await afripayDeposit({
            amount: amt,
            payment_method: methodId,
            wallet_id: walletId!,
            phone,
          }).unwrap();

          if (res.otp_confirm && res.transaction_id) {
            setPendingAfripayTxId(res.transaction_id);
            toast.success(res.message || 'Code OTP demandé. Entrez-le pour finaliser le dépôt.');
            return;
          }

          if (res.transaction_id) setTxId(res.transaction_id);
        } else {
          const res = await deposit({
            amount: amt, payment_method: methodId, wallet_id: walletId!, phone,
          }).unwrap();
          if (res.transaction_id) setTxId(res.transaction_id);
        }
      }
      toast.success(t('deposit.success'));
      setDone(true);
    } catch (e) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail || t('common.error');
      toast.error(detail);
    }
  };

  const doConfirmAfripayOtp = async () => {
    if (!pendingAfripayTxId) return;
    if (!otpCode.trim()) {
      toast.error('Entrez le code OTP');
      return;
    }
    try {
      const res = await afripayDepositConfirm({
        transaction_id: pendingAfripayTxId,
        otp: sanitizeText(otpCode),
      }).unwrap();
      if (res.transaction_id) setTxId(res.transaction_id);
      setPendingAfripayTxId(null);
      setOtpCode('');
      toast.success(res.message || 'Dépôt Afripay initié avec succès');
      setDone(true);
    } catch (e) {
      const detail = (e as { data?: { erreur?: string; detail?: string } })?.data?.erreur
        || (e as { data?: { erreur?: string; detail?: string } })?.data?.detail
        || t('common.error');
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

  const copyAddr = () => {
    if (!cryptoAddress) return;
    navigator.clipboard.writeText(cryptoAddress.address);
    toast.success('Adresse copiée');
  };

  if (done) return (
    <div className="max-w-lg mx-auto">
      <Card className="text-center p-10 shadow-elegant">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">
          {cryptoAddress ? 'Adresse de dépôt' : t('deposit.success')}
        </h2>
        {cryptoAddress ? (
          <div className="mt-6 space-y-3 text-left">
            <p className="text-sm text-muted-foreground text-center">
              Envoyez <strong>{amt} {cryptoAddress.symbol}</strong> sur le réseau <strong>{cryptoAddress.network}</strong> à :
            </p>
            <div className="rounded-xl bg-muted/40 p-3 font-mono text-xs break-all">{cryptoAddress.address}</div>
            <Button variant="outline" className="w-full" onClick={copyAddr}>
              <Copy className="mr-2 h-4 w-4" /> Copier l'adresse
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mt-2">{formatMoney(amt, wallet?.currency || 'USD')} → {wallet?.currency}</p>
            <div className="my-4"><AsyncStatusPill status={status} /></div>
          </>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => { setDone(false); setTxId(null); setCryptoAddress(null); setFields({}); }}>
            Nouveau dépôt
          </Button>
          <Button asChild className="bg-gradient-brand"><a href="/app">Retour au tableau de bord</a></Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('deposit.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('deposit.subtitle')}</p>
      </div>

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <WalletSelector
              label={t('deposit.selectWallet')}
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
                              {m.fees.fixed > 0 && `${m.fees.fixed} + `}{m.fees.percent}%
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedMethod?.payment_type?.name === 'Cryptos' && networks && networks.length > 0 && (
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

            <PaymentMethodFields method={selectedMethod} values={fields} onChange={(p) => setFields((f) => ({ ...f, ...p }))} context="deposit" />

            {pendingAfripayTxId && (
              <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <Label>Code OTP Lumitel</Label>
                <Input
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Entrez le code reçu"
                  className="h-11 rounded-xl"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Afripay/Lumitel demande une confirmation OTP avant l’initiation finale du dépôt.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={doConfirmAfripayOtp}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Valider l’OTP
                </Button>
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
              disabled={isLoading || busy || Boolean(pendingAfripayTxId)}
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
