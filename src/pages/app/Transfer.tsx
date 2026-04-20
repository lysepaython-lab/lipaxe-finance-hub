import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFxQuoteMutation, useTransferMutation, useLookupRecipientMutation, type RecipientLookup } from '@/store/api/walletApi';
import { usePaymentMethodsInternationalQuery, type WalletV2 } from '@/store/api/platformApi';
import { Loader2, Check, ArrowDown, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';
import { WalletSelector } from '@/components/security/WalletSelector';
import { CountryPicker } from '@/components/security/CountryPicker';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { AsyncStatusPill } from '@/components/security/AsyncStatus';
import { useSubmitOnce } from '@/hooks/useSubmitOnce';
import { useTransactionPolling } from '@/hooks/useTransactionPolling';
import { sanitizeText, Throttle } from '@/lib/security';
import { transferSchema } from '@/lib/validation';

const submitThrottle = new Throttle(8, 60_000);

const Transfer = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { data: intlMethods } = usePaymentMethodsInternationalQuery();
  const pin = usePinGate();

  const [kind, setKind] = useState<'internal' | 'international'>(params.get('intl') ? 'international' : 'internal');
  const [walletId, setWalletId] = useState<string>();
  const [wallet, setWallet] = useState<WalletV2 | undefined>();
  const [recipient, setRecipient] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<RecipientLookup | null>(null);
  const [countryTo, setCountryTo] = useState('NG');
  const [methodId, setMethodId] = useState('');
  const [amount, setAmount] = useState('100');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const status = useTransactionPolling(txId);

  const [getQuote, { data: quote, isLoading: quoting }] = useFxQuoteMutation();
  const [transfer, { isLoading }] = useTransferMutation();
  const [lookup, { isLoading: looking }] = useLookupRecipientMutation();

  const intlMethodsForCountry = useMemo(
    () => (intlMethods || []).filter((m) => m.countries.some((c) => c.country.alpha_2 === countryTo)),
    [intlMethods, countryTo],
  );

  // Reset recipient info when input changes
  useEffect(() => { setRecipientInfo(null); }, [recipient, kind]);

  // Auto-quote international
  useEffect(() => {
    const amt = parseFloat(amount);
    if (kind === 'international' && amt > 0 && wallet) {
      const id = setTimeout(() => {
        getQuote({ from: wallet.currency, to: countryTo === 'NG' ? 'NGN' : countryTo === 'GH' ? 'GHS' : countryTo === 'SN' ? 'XOF' : countryTo === 'KE' ? 'KES' : countryTo === 'GB' ? 'GBP' : 'EUR', amount: amt });
      }, 300);
      return () => clearTimeout(id);
    }
  }, [amount, wallet, countryTo, kind, getQuote]);

  const fee = kind === 'international' ? (quote?.fee ?? 0) : 0;
  const receive = kind === 'international' ? (quote?.receive ?? 0) : (parseFloat(amount) || 0);
  const total = (parseFloat(amount) || 0) + fee;
  const insufficient = wallet ? total > wallet.available : false;

  const doLookup = async () => {
    if (!recipient.trim()) { toast.error(t('transfer.amountRequired')); return; }
    try {
      const info = await lookup({ account_no: sanitizeText(recipient) }).unwrap();
      setRecipientInfo(info);
      toast.success(t('transfer.recipientFound'));
    } catch {
      toast.error(t('transfer.recipientNotFound'));
    }
  };

  const doTransfer = async () => {
    const fromAccount = wallet?.id || '';
    const toAccount = kind === 'internal' ? sanitizeText(recipient) : sanitizeText(recipient || 'intl');
    const payload = {
      amount: parseFloat(amount) || 0,
      from_account: fromAccount,
      to_account: toAccount,
      payment_method: kind === 'international' ? methodId : 'internal',
      wallet_id: walletId || '',
    };
    const parsed = transferSchema.safeParse(payload);
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
      const tx = await transfer({
        kind,
        amount: payload.amount,
        from_account: payload.from_account,
        to_account: payload.to_account,
        payment_method: payload.payment_method,
        wallet_id: payload.wallet_id,
        toCurrency: kind === 'international' ? quote?.to : undefined,
        note: note ? sanitizeText(note) : undefined,
      }).unwrap();
      setTxId(tx.id);
      toast.success(t('transfer.success'));
      setDone(true);
    } catch (e) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail || t('common.error');
      toast.error(detail);
    }
  };

  const [submit, busy] = useSubmitOnce(doTransfer);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) { toast.error(t('transfer.selectWallet')); return; }
    if (kind === 'internal' && !recipientInfo) { toast.error('Vérifiez le destinataire d’abord.'); return; }
    if (kind === 'international' && !methodId) { toast.error(t('deposit.selectMethod')); return; }
    pin.guard(submit);
  };

  if (done) return (
    <div className="max-w-lg mx-auto">
      <Card className="text-center p-10 shadow-elegant">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">{t('transfer.success')}</h2>
        <p className="text-muted-foreground mt-2">
          {formatMoney(parseFloat(amount), wallet?.currency || 'USD')} → {recipientInfo?.name || recipient}
        </p>
        <div className="my-4"><AsyncStatusPill status={status} /></div>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => { setDone(false); setTxId(null); }}>Nouveau transfert</Button>
          <Button asChild className="bg-gradient-brand"><a href="/app">Retour</a></Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('transfer.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('transfer.subtitle')}</p>
        </div>
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as 'internal' | 'international')}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="internal">{t('transfer.internal')}</TabsTrigger>
          <TabsTrigger value="international">{t('transfer.international')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <WalletSelector
              label={t('transfer.selectWallet')}
              value={walletId}
              onChange={(id, w) => { setWalletId(id); setWallet(w); }}
            />

            <div className="space-y-2">
              <Label>{t('transfer.recipient')}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={kind === 'internal' ? '@username ou n° de compte' : t('transfer.recipientEmail')}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="h-11 rounded-xl"
                  maxLength={64}
                />
                {kind === 'internal' && (
                  <Button type="button" variant="outline" onClick={doLookup} disabled={looking || !recipient}>
                    {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {recipientInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-3 mt-2"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-brand text-primary-foreground text-sm font-semibold">
                        {recipientInfo.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{recipientInfo.name}</p>
                      <p className="text-xs text-muted-foreground">{recipientInfo.account_no}</p>
                    </div>
                    {recipientInfo.verified && <Check className="h-4 w-4 text-success" />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {kind === 'international' && (
              <>
                <CountryPicker
                  label={t('transfer.country')}
                  value={countryTo}
                  onChange={(c) => { setCountryTo(c); setMethodId(''); }}
                  paymentMethods={intlMethods}
                />

                <div className="space-y-2">
                  <Label>{t('deposit.selectMethod')}</Label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {intlMethodsForCountry.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethodId(m.id)}
                        className={`rounded-xl border-2 p-3 text-left text-sm transition-colors ${methodId === m.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40'}`}
                      >
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{m.type}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>{t('transfer.fromCurrency')}</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-2xl font-display font-bold h-14 tabular rounded-xl"
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>

            {kind === 'international' && (
              <>
                <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>
                <div className="space-y-2">
                  <Label>{t('transfer.toCurrency')}</Label>
                  <Input
                    readOnly
                    value={quoting ? '…' : receive.toFixed(2)}
                    className="text-2xl font-display font-bold h-14 tabular text-success rounded-xl"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>{t('transfer.note')}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={140}
                placeholder="What's it for?"
                className="rounded-xl"
              />
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              {kind === 'international' && quote && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('transfer.rate')}</span>
                  <span className="tabular">1 {quote.from} = {quote.rate} {quote.to}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('transfer.fee')}</span>
                <span className="tabular">{formatMoney(fee, wallet?.currency || 'USD')}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>{t('transfer.totalCost')}</span>
                <span className={`tabular ${insufficient ? 'text-destructive' : 'text-primary'}`}>
                  {formatMoney(total, wallet?.currency || 'USD')}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-brand shadow-brand text-base rounded-xl"
              disabled={isLoading || busy || quoting || insufficient}
            >
              {(isLoading || busy) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {t('transfer.confirm')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default Transfer;
