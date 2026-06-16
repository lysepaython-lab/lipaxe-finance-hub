import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CountryFlag } from 'currency-code-to-country-flag';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFxQuoteMutation, useTransferMutation, useLookupRecipientMutation, type RecipientLookup } from '@/store/api/walletApi';
import { usePaymentMethodsDepositQuery, usePaymentMethodsInternationalQuery, type WalletV2 } from '@/store/api/platformApi';
import { Loader2, Check, ArrowDown, Search, ShieldCheck, Globe2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';
import { WalletSelector } from '@/components/security/WalletSelector';
import { CountryPicker } from '@/components/security/CountryPicker';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { AsyncStatusPill } from '@/components/security/AsyncStatus';
import { PaymentMethodMark } from '@/lib/moneyVisuals';
import { useSubmitOnce } from '@/hooks/useSubmitOnce';
import { useTransactionPolling } from '@/hooks/useTransactionPolling';
import { sanitizeText, Throttle } from '@/lib/security';
import { transferSchema } from '@/lib/validation';

const submitThrottle = new Throttle(8, 60_000);

const iso2ToIso3: Record<string, string> = {
  BI: 'BDI',
  CD: 'COD',
  CG: 'COG',
  RW: 'RWA',
  TZ: 'TZA',
  UG: 'UGA',
  KE: 'KEN',
  SN: 'SEN',
  CI: 'CIV',
  CM: 'CMR',
  GH: 'GHA',
  NG: 'NGA',
};

const cryptoCurrencyIcon: Record<string, string> = {
  BTC: '₿',
  USDT: '₮',
  USDC: '◎',
};

const currencyForCountry: Record<string, string> = {
  BI: 'BIF',
  CD: 'CDF',
  RW: 'RWF',
  TZ: 'TZS',
  UG: 'UGX',
  KE: 'KES',
  SN: 'XOF',
  CI: 'XOF',
  CM: 'XAF',
  GH: 'GHS',
  NG: 'NGN',
  GB: 'GBP',
  US: 'USD',
};

const countryPhoneRules: Record<string, { dial: string; min: number; max: number; example: string }> = {
  BI: { dial: '257', min: 11, max: 11, example: '+257 71 234 567' },
  CD: { dial: '243', min: 12, max: 12, example: '+243 978 384 983' },
  CG: { dial: '242', min: 12, max: 12, example: '+242 06 123 4567' },
  RW: { dial: '250', min: 12, max: 12, example: '+250 78 123 4567' },
  TZ: { dial: '255', min: 12, max: 12, example: '+255 712 345 678' },
  UG: { dial: '256', min: 12, max: 12, example: '+256 712 345 678' },
  KE: { dial: '254', min: 12, max: 12, example: '+254 712 345 678' },
  SN: { dial: '221', min: 12, max: 12, example: '+221 77 123 45 67' },
  CI: { dial: '225', min: 13, max: 13, example: '+225 07 12 34 56 78' },
  CM: { dial: '237', min: 12, max: 12, example: '+237 6 71 23 45 67' },
  GH: { dial: '233', min: 12, max: 12, example: '+233 24 123 4567' },
  NG: { dial: '234', min: 13, max: 13, example: '+234 801 234 5678' },
};

const codeValue = (value?: string | null) => String(value || '').trim().toUpperCase();

const methodSupportsCountry = (method: { countries?: { country?: { alpha_2?: string; isoCode?: string; name?: string } }[] }, countryCode: string) => {
  const selectedAlpha2 = codeValue(countryCode);
  const selectedAlpha3 = codeValue(iso2ToIso3[selectedAlpha2]);
  if (!selectedAlpha2 || !method.countries?.length) return false;

  return method.countries.some((entry) => {
    const country = entry.country || {};
    const alpha2 = codeValue(country.alpha_2);
    const isoCode = codeValue(country.isoCode);
    return alpha2 === selectedAlpha2 || isoCode === selectedAlpha2 || isoCode === selectedAlpha3;
  });
};

const CurrencyFlagMark = ({ currency }: { currency?: string }) => {
  const code = codeValue(currency);
  if (cryptoCurrencyIcon[code]) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {cryptoCurrencyIcon[code]}
      </span>
    );
  }
  if (!code) return <span className="inline-flex h-6 w-6 rounded-full bg-muted" />;
  return <CountryFlag currency={code} size="24" ratio="square" className="rounded-full shadow-sm" />;
};

const normalizeGlobalPhone = (countryCode: string, value: string) => {
  const selectedAlpha2 = codeValue(countryCode);
  const rule = countryPhoneRules[selectedAlpha2];
  let digits = String(value || '').replace(/\D/g, '');

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (rule && !digits.startsWith(rule.dial)) {
    digits = `${rule.dial}${digits.replace(/^0+/, '')}`;
  }

  if (rule && (!digits.startsWith(rule.dial) || digits.length < rule.min || digits.length > rule.max)) {
    return {
      ok: false,
      value: digits,
      message: `Numero invalide pour ${selectedAlpha2}. Exemple: ${rule.example}`,
    };
  }

  if (!rule && (digits.length < 10 || digits.length > 15)) {
    return {
      ok: false,
      value: digits,
      message: 'Numero de telephone invalide pour le pays selectionne.',
    };
  }

  return { ok: true, value: digits, message: '' };
};

const Transfer = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { data: internationalMethods } = usePaymentMethodsInternationalQuery();
  const { data: depositMethods } = usePaymentMethodsDepositQuery();
  const pin = usePinGate();

  const [kind, setKind] = useState<'internal' | 'international'>(params.get('intl') ? 'international' : 'internal');
  const [walletId, setWalletId] = useState<string>();
  const [wallet, setWallet] = useState<WalletV2 | undefined>();
  const [recipient, setRecipient] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<RecipientLookup | null>(null);
  const [countryTo, setCountryTo] = useState('NG');
  const [countryToName, setCountryToName] = useState('');
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

  const intlMethods = useMemo(() => {
    if (internationalMethods?.length) return internationalMethods;
    return (depositMethods || []).filter((method) => method.is_international !== false && method.type !== 'crypto');
  }, [internationalMethods, depositMethods]);

  const intlMethodsForCountry = useMemo(() => {
    return intlMethods.filter((method) => methodSupportsCountry(method, countryTo));
  }, [intlMethods, countryTo]);

  // Reset recipient info when input changes
  useEffect(() => { setRecipientInfo(null); }, [recipient, kind]);

  useEffect(() => {
    setRecipient('');
    setRecipientInfo(null);
    setErrors({});
  }, [kind, countryTo]);

  // Auto-quote international
  useEffect(() => {
    const amt = parseFloat(amount);
    if (kind === 'international' && amt > 0 && wallet) {
      const id = setTimeout(() => {
        getQuote({ from: wallet.currency, to: currencyForCountry[countryTo.toUpperCase()] || 'USD', amount: amt });
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
    const globalPhone = kind === 'international' ? normalizeGlobalPhone(countryTo, recipient) : null;
    if (globalPhone && !globalPhone.ok) {
      setErrors({ recipient: globalPhone.message });
      toast.error(globalPhone.message);
      return;
    }
    const toAccount = kind === 'internal' ? sanitizeText(recipient) : globalPhone?.value || '';
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
      const errorData = (e as { data?: { detail?: string; error?: string; erreur?: string; message?: string } })?.data;
      const detail = errorData?.detail || errorData?.error || errorData?.erreur || errorData?.message || t('common.error');
      toast.error(detail);
    }
  };

  const [submit, busy] = useSubmitOnce(doTransfer);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) { toast.error(t('transfer.selectWallet')); return; }
    if (kind === 'internal' && !recipientInfo) { toast.error('Vérifiez le destinataire d’abord.'); return; }
    if (kind === 'international' && !methodId) { toast.error(t('deposit.selectMethod')); return; }
    if (kind === 'international') {
      const phone = normalizeGlobalPhone(countryTo, recipient);
      if (!phone.ok) {
        setErrors({ recipient: phone.message });
        toast.error(phone.message);
        return;
      }
    }
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

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { to: '/app/transfer/international', label: t('nav.internationalTransfer'), icon: Globe2 },
          { to: '/app/transfer/qr', label: t('nav.transferQr'), icon: QrCode },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-semibold shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
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

            {kind === 'internal' && (
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
            )}

            {kind === 'international' && (
              <>
                <CountryPicker
                  label={t('transfer.country')}
                  value={countryTo}
                  onChange={(c, name) => { setCountryTo(c); setCountryToName(name); setMethodId(''); }}
                  paymentMethods={intlMethods}
                />

                <div className="space-y-2">
                  <Label>{t('transfer.globalRecipientPhone')}</Label>
                  <Input
                    inputMode="tel"
                    placeholder={countryPhoneRules[codeValue(countryTo)]?.example || t('transfer.globalRecipientPhonePlaceholder')}
                    value={recipient}
                    onChange={(e) => {
                      setRecipient(e.target.value);
                      setErrors((current) => ({ ...current, recipient: '' }));
                    }}
                    className="h-11 rounded-xl"
                    maxLength={24}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('transfer.globalPhoneHint', { country: countryToName || countryTo })}
                  </p>
                  {errors.recipient && <p className="text-xs text-destructive">{errors.recipient}</p>}
                </div>

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
                        <div className="flex items-center gap-3">
                          <PaymentMethodMark
                            logo={m.icon}
                            name={[m.name, m.provider, m.correspondent].filter(Boolean).join(' ')}
                            currency={wallet?.currency}
                            className="h-8 w-8"
                          />
                          <div>
                            <div className="font-semibold">{m.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{m.type}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {intlMethodsForCountry.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground sm:col-span-2">
                        Aucune methode disponible pour ce pays.
                      </div>
                    )}
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
                <span className="inline-flex items-center gap-2 tabular">
                  <CurrencyFlagMark currency={wallet?.currency || 'USD'} />
                  {formatMoney(fee, wallet?.currency || 'USD')}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>{t('transfer.totalCost')}</span>
                <span className={`inline-flex items-center gap-2 tabular ${insufficient ? 'text-destructive' : 'text-primary'}`}>
                  <CurrencyFlagMark currency={wallet?.currency || 'USD'} />
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
