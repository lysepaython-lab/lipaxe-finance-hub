import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
} from '@/store/api/walletApi';
import { usePaymentMethodsDepositQuery, type PaymentMethod, type WalletV2 } from '@/store/api/platformApi';
import { useCryptoAssetsQuery, useCryptoDepositAddressMutation, useCryptoNetworksQuery } from '@/store/api/businessApi';
import { Loader2, Check, ShieldCheck, Copy, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
import { resolveMediaUrl } from '@/lib/moneyVisuals';

const submitThrottle = new Throttle(8, 60_000);

const paymentMethodLogo = (method: PaymentMethod) => {
  if (!method.icon) return null;
  return resolveMediaUrl(method.icon);
};

/**
 * Deposit page — grouped by payment_type.name (Mobile / Bank / Electronic / Cryptos).
 * Country picker removed: methods are filtered server-side based on the user's KYC country.
 */
const Deposit = () => {
  const { t } = useTranslation();
  const { data: methods, isLoading: methodsLoading } = usePaymentMethodsDepositQuery();
  const [deposit, { isLoading: l1 }] = useDepositMutation();
  const [afripayDeposit, { isLoading: lAfripay }] = useAfripayDepositMutation();
  const [afripayDepositConfirm, { isLoading: lAfripayConfirm }] = useAfripayDepositConfirmMutation();
  const [cardDeposit, { isLoading: l2 }] = useCardDepositMutation();
  const [elecDeposit, { isLoading: l3 }] = useElectronicDepositMutation();
  const [cryptoDepositAddress, { isLoading: l4 }] = useCryptoDepositAddressMutation();
  const { data: cryptoAssets = [], isLoading: cryptoAssetsLoading } = useCryptoAssetsQuery();
  const pin = usePinGate();

  const [walletId, setWalletId] = useState<string>();
  const [wallet, setWallet] = useState<WalletV2 | undefined>();
  const [methodId, setMethodId] = useState('');
  const [cryptoSymbol, setCryptoSymbol] = useState('');
  const [amount, setAmount] = useState('500');
  const [fields, setFields] = useState<DynamicFields>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [kycRequired, setKycRequired] = useState(false);
  const [done, setDone] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [cryptoAddress, setCryptoAddress] = useState<{ address: string; network: string; symbol: string; qrPayload?: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [pendingAfripayTxId, setPendingAfripayTxId] = useState<string | null>(null);
  const status = useTransactionPolling(txId);

  const allMethods = useMemo(() => methods || [], [methods]);
  const selectedMethod = allMethods.find((m) => m.id === methodId);
  const isCryptoDeposit = Boolean(cryptoSymbol);
  const cryptoSym = isCryptoDeposit ? cryptoSymbol : '';
  const { data: availableNetworks = [], isLoading: networksLoading, isError: networksError } = useCryptoNetworksQuery(
    { symbol: cryptoSym, purpose: 'deposit' },
    { skip: !cryptoSym },
  );

  const grouped = useMemo(() => {
    const map: Record<string, PaymentMethod[]> = {};
    allMethods.filter((m) => m.payment_type?.name !== 'Cryptos').forEach((m) => {
      const key = m.payment_type?.name || 'Other';
      (map[key] = map[key] || []).push(m);
    });
    return Object.fromEntries(
      Object.entries(map).sort(([a], [b]) => {
        const order = ['Mobile Payment', 'Bank Transfer', 'Electronic'];
        return (order.indexOf(a) === -1 ? order.length : order.indexOf(a)) -
          (order.indexOf(b) === -1 ? order.length : order.indexOf(b));
      }),
    );
  }, [allMethods]);

  const amt = parseFloat(amount) || 0;
  const fixedFee = selectedMethod?.fees?.fixed || 0;
  const lipaxeFee = amt * ((selectedMethod?.fees?.lipaxePercent || 0) / 100);
  const providerFee = amt * ((selectedMethod?.fees?.providerPercent || 0) / 100);
  const hasFeeBreakdown = lipaxeFee > 0 || providerFee > 0;
  const fallbackFee = hasFeeBreakdown ? 0 : amt * ((selectedMethod?.fees?.percent || 0) / 100);
  const totalFee = fixedFee + lipaxeFee + providerFee + fallbackFee;
  const totalToPay = amt + totalFee;
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
    if (isCryptoDeposit) {
      if (!fields.network) return 'Sélectionnez un réseau';
      if (wallet?.currency?.toUpperCase() !== cryptoSymbol.toUpperCase()) return `Sélectionnez un portefeuille ${cryptoSymbol}`;
    }
    return null;
  };

  const doDeposit = async () => {
    setKycRequired(false);
    const parsed = amountSchema.safeParse(amt);
    if (!parsed.success) { setErrors({ amount: parsed.error.issues[0].message }); return; }
    const extra = validateExtra();
    if (extra) { toast.error(extra); return; }
    if (!submitThrottle.tryAcquire()) { toast.error('Trop de tentatives.'); return; }
    setErrors({});
    try {
      const typeName = isCryptoDeposit ? 'Cryptos' : selectedMethod?.payment_type?.name;
      if (typeName === 'Cryptos') {
        // Backend returns a deposit address that the user funds externally.
        const r = await cryptoDepositAddress({
          expected_amount: amt,
          symbol: cryptoSymbol,
          wallet_id: walletId!,
          network: fields.network!,
        }).unwrap();
        setCryptoAddress({
          address: r.address,
          network: r.network || fields.network!,
          symbol: r.symbol || cryptoSymbol,
          qrPayload: r.qr_payload,
        });
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
      const data = (e as { data?: { detail?: string; message?: string; error?: string; code?: string } })?.data;
      const detail = data?.detail
        || data?.message
        || data?.error
        || t('common.error');
      if (/kyc|know your customer|identity verification|vérification.{0,20}identité|identité.{0,20}vérification/i.test(`${data?.code || ''} ${detail}`)) {
        setKycRequired(true);
      }
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
    if (!methodId && !isCryptoDeposit) { toast.error(t('deposit.selectMethod')); return; }
    pin.guard(submit);
  };

  const copyAddr = () => {
    if (!cryptoAddress) return;
    navigator.clipboard.writeText(cryptoAddress.address)
      .then(() => toast.success(t('deposit.addressCopied')))
      .catch(() => toast.error(t('common.error')));
  };

  if (done) return (
    <div className={cn('mx-auto', cryptoAddress ? 'max-w-2xl' : 'max-w-lg')}>
      <Card className={cn('shadow-elegant', cryptoAddress ? 'overflow-hidden' : 'p-10 text-center')}>
        {cryptoAddress ? (
          <CardContent className="p-5 sm:p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-7 w-7" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Lipaxe · {t('deposit.cryptoReceive')}</p>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{t('deposit.addressTitle')}</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{t('deposit.scanToSend')}</p>
            </div>

            <div className="mx-auto my-6 w-fit rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4">
              <QRCodeSVG
                value={cryptoAddress.qrPayload || cryptoAddress.address}
                size={208}
                level="H"
                includeMargin
                title={`${cryptoAddress.symbol} ${cryptoAddress.network} ${t('deposit.depositAddress')}`}
                className="h-44 w-44 sm:h-52 sm:w-52"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{t('deposit.network')}</p>
                <p className="mt-1 font-semibold">{cryptoAddress.network}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">{t('deposit.amount')}</p>
                <p className="mt-1 font-semibold tabular-nums">{amt.toLocaleString(undefined, { maximumFractionDigits: 8 })} {cryptoAddress.symbol}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">{t('deposit.depositAddress')}</p>
              <p className="mt-2 break-all font-mono text-sm leading-6">{cryptoAddress.address}</p>
              <Button variant="outline" className="mt-3 w-full" onClick={copyAddr}>
                <Copy className="mr-2 h-4 w-4" /> {t('deposit.copyAddress')}
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-left">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                {t('deposit.beforeSending')}
              </div>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>{t('deposit.reminderNetwork', { symbol: cryptoAddress.symbol, network: cryptoAddress.network })}</li>
                <li>{t('deposit.reminderAddress')}</li>
                <li>{t('deposit.reminderFinal')}</li>
              </ul>
            </div>
          </CardContent>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold">{t('deposit.success')}</h2>
            <p className="mt-2 text-muted-foreground">{formatMoney(amt, wallet?.currency || 'USD')} → {wallet?.currency}</p>
            <div className="my-4"><AsyncStatusPill status={status} /></div>
          </>
        )}
        <div className={cn('flex flex-col justify-center gap-3 sm:flex-row', cryptoAddress ? 'border-t border-border px-5 py-5 sm:px-8' : 'mt-6')}>
          <Button variant="outline" onClick={() => { setDone(false); setTxId(null); setCryptoAddress(null); setFields({}); }}>
            {t('deposit.newDeposit')}
          </Button>
          <Button asChild className="bg-gradient-brand"><a href="/app">{t('deposit.backToDashboard')}</a></Button>
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

      {kycRequired && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-4 sm:p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t('deposit.kycRequiredTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('deposit.kycRequiredBody')}</p>
            <Link to="/app/kyc" className="mt-3 inline-flex items-center rounded-lg font-semibold text-primary underline underline-offset-4">
              {t('deposit.kycRequiredCta')}
            </Link>
          </div>
        </div>
      )}

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
              {methodsLoading && <p className="text-sm text-muted-foreground py-2 text-center">Chargement des moyens de dépôt…</p>}
              {(cryptoAssetsLoading || cryptoAssets.length > 0) && (
                    <section className="space-y-3 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4" aria-label="Crypto deposits">
                      <div>
                        <h2 className="font-semibold">Dépôt en crypto</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Choisissez un actif, puis son réseau de dépôt.</p>
                      </div>
                      {cryptoAssetsLoading ? (
                        <p className="py-2 text-sm text-muted-foreground">Chargement des actifs…</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {cryptoAssets.map((asset) => {
                            const logo = resolveMediaUrl(asset.logo_url || asset.logo);
                            return (
                              <motion.button
                                key={asset.symbol}
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setCryptoSymbol(asset.symbol);
                                  setMethodId('');
                                  setFields({});
                                }}
                                aria-pressed={cryptoSymbol === asset.symbol}
                                className={cn(
                                  'flex min-h-14 items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                                  cryptoSymbol === asset.symbol ? 'border-primary bg-primary/10' : 'border-input bg-background hover:border-primary/40',
                                )}
                              >
                                {logo ? (
                                  <img src={logo} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {asset.symbol.slice(0, 3)}
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <span className="block text-sm font-semibold">{asset.symbol}</span>
                                  <span className="block truncate text-xs text-muted-foreground">{asset.name}</span>
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                      {isCryptoDeposit && (
                        <div className="space-y-2 border-t border-border/70 pt-3">
                          <Label>Réseau pour {cryptoSymbol}</Label>
                          {networksLoading ? (
                            <p className="rounded-lg bg-background/70 p-3 text-sm text-muted-foreground">Chargement des réseaux disponibles…</p>
                          ) : networksError ? (
                            <p className="rounded-lg bg-background/70 p-3 text-sm text-destructive">Impossible de charger les réseaux. Réessayez dans un instant.</p>
                          ) : availableNetworks.length === 0 ? (
                            <p className="rounded-lg bg-background/70 p-3 text-sm text-muted-foreground">
                              Aucun réseau de dépôt n’est actuellement disponible pour {cryptoSymbol}.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {availableNetworks.map((network) => (
                                <button
                                  key={network.id}
                                  type="button"
                                  onClick={() => setFields((current) => ({ ...current, network: network.id }))}
                                  aria-pressed={fields.network === network.id}
                                  className={cn(
                                    'flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors',
                                    fields.network === network.id ? 'border-primary bg-primary/10' : 'border-input bg-background hover:border-primary/40',
                                  )}
                                >
                                  <span className="font-medium">{network.name}</span>
                                  <span className="text-xs text-muted-foreground">{network.native_symbol || network.symbol || network.id.toUpperCase()}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </section>
              )}
              {Object.entries(grouped).map(([type, list]) => (
                  <div key={type} className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{type}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {list.map((m) => (
                        <motion.button
                          key={m.id}
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setCryptoSymbol(''); setMethodId(m.id); setFields({}); }}
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
                        </motion.button>
                      ))}
                    </div>
                  </div>
              ))}
              {!methodsLoading && !cryptoAssetsLoading && !cryptoAssets.length && !Object.keys(grouped).length && (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun moyen de dépôt n’est disponible pour le moment.</p>
              )}
            </div>

            {!isCryptoDeposit && <PaymentMethodFields method={selectedMethod} values={fields} onChange={(p) => setFields((f) => ({ ...f, ...p }))} context="deposit" />}

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

            {!isCryptoDeposit && <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deposit.amount')}</span>
                <span className="tabular">{formatMoney(amt, wallet?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deposit.totalFees')}</span>
                <span className="tabular">{formatMoney(totalFee, wallet?.currency || 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deposit.totalToPay')}</span>
                <span className="tabular font-semibold">{formatMoney(totalToPay, wallet?.currency || 'USD')}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>{t('deposit.youReceive')}</span>
                <span className="tabular text-primary">{formatMoney(amt, wallet?.currency || 'USD')}</span>
              </div>
            </div>}

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
