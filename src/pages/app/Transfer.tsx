import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLookupRecipientMutation, useTransactionsQuery, useTransferMutation, type RecipientLookup } from '@/store/api/walletApi';
import type { WalletV2 } from '@/store/api/platformApi';
import { Loader2, Check, Search, ShieldCheck, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { AsyncStatusPill } from '@/components/security/AsyncStatus';
import { useSubmitOnce } from '@/hooks/useSubmitOnce';
import { useTransactionPolling } from '@/hooks/useTransactionPolling';
import { sanitizeText, Throttle } from '@/lib/security';
import { transferSchema } from '@/lib/validation';
import { useAppSelector } from '@/store/hooks';

const submitThrottle = new Throttle(8, 60_000);

type RecentRecipientSuggestion = {
  id: string;
  account_no: string;
  name: string;
  avatar?: string;
  verified?: boolean;
};

const Transfer = () => {
  const { t } = useTranslation();
  const { data: transactions = [] } = useTransactionsQuery();
  const currentAccountNo = useAppSelector((state) => state.auth.user?.username?.trim().toLowerCase() || '');
  const pin = usePinGate();

  const [walletId, setWalletId] = useState<string>();
  const [wallet, setWallet] = useState<WalletV2 | undefined>();
  const [recipient, setRecipient] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<RecipientLookup | null>(null);
  const [amount, setAmount] = useState('100');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [recipientSuggestions, setRecipientSuggestions] = useState<RecentRecipientSuggestion[]>([]);
  const status = useTransactionPolling(txId);

  const [transfer, { isLoading }] = useTransferMutation();
  const [lookup, { isLoading: looking }] = useLookupRecipientMutation();

  const recentInternalRecipients = useMemo(() => {
    const seen = new Set<string>();
    return transactions
      .filter((tx) => tx.type === 'transfer' && tx.direction === 'out' && tx.counterpartyAccount?.trim())
      .filter((tx) => {
        const key = tx.counterpartyAccount!.trim().toLowerCase();
        if (key === currentAccountNo) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [currentAccountNo, transactions]);

  // Reset recipient info when input changes
  useEffect(() => { setRecipientInfo(null); }, [recipient]);

  useEffect(() => {
    let cancelled = false;

    const hydrateSuggestions = async () => {
      if (!recentInternalRecipients.length) {
        setRecipientSuggestions([]);
        return;
      }

      const suggestions = await Promise.all(
        recentInternalRecipients.map(async (tx) => {
          const accountNo = sanitizeText(tx.counterpartyAccount || '');
          try {
            const info = await lookup({ account_no: accountNo }).unwrap();
            return {
              id: tx.id,
              account_no: info.account_no || accountNo,
              name: info.name || tx.counterparty,
              avatar: info.avatar,
              verified: info.verified,
            } satisfies RecentRecipientSuggestion;
          } catch {
            return {
              id: tx.id,
              account_no: accountNo,
              name: tx.counterparty || accountNo,
              avatar: undefined,
              verified: false,
            } satisfies RecentRecipientSuggestion;
          }
        }),
      );

      if (!cancelled) {
        setRecipientSuggestions(suggestions);
      }
    };

    void hydrateSuggestions();

    return () => {
      cancelled = true;
    };
  }, [lookup, recentInternalRecipients]);

  const total = parseFloat(amount) || 0;
  const insufficient = wallet ? total > wallet.available : false;

  const doLookup = async (recipientValue = recipient) => {
    const normalizedRecipient = recipientValue.trim();
    if (!normalizedRecipient) { toast.error(t('transfer.amountRequired')); return null; }
    try {
      const info = await lookup({ account_no: sanitizeText(normalizedRecipient) }).unwrap();
      setRecipientInfo(info);
      toast.success(t('transfer.recipientFound'));
      return info;
    } catch {
      toast.error(t('transfer.recipientNotFound'));
      return null;
    }
  };

  const applyRecentRecipient = async (value: string) => {
    setRecipient(value);
    setRecipientInfo(null);
    await doLookup(value);
  };

  const doTransfer = async () => {
    const fromAccount = wallet?.id || '';
    const payload = {
      amount: parseFloat(amount) || 0,
      from_account: fromAccount,
      to_account: sanitizeText(recipient),
      payment_method: 'internal',
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
        kind: 'internal',
        amount: payload.amount,
        from_account: payload.from_account,
        to_account: payload.to_account,
        payment_method: payload.payment_method,
        wallet_id: payload.wallet_id,
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) { toast.error(t('transfer.selectWallet')); return; }
    if (!recipientInfo && !(await doLookup())) return;
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

      <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-semibold text-primary">
        {t('transfer.internal')}
      </div>

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
                  placeholder="@username ou n° de compte"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="h-11 rounded-xl"
                  maxLength={64}
                />
                <Button type="button" variant="outline" onClick={doLookup} disabled={looking || !recipient}>
                  {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {recipientSuggestions.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t('transfer.recentRecipients')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recipientSuggestions.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => applyRecentRecipient(entry.account_no)}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-2 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Avatar className="h-8 w-8 ring-1 ring-border">
                          <AvatarImage src={entry.avatar} alt={entry.name} />
                          <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                            {entry.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="max-w-[140px] truncate">{entry.name}</span>
                          <span className="max-w-[140px] truncate text-[11px] text-muted-foreground">{entry.account_no}</span>
                        </span>
                        {entry.verified ? <Check className="h-3.5 w-3.5 shrink-0 text-success" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

            <div className="space-y-2">
              <Label>{t('transfer.note')}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={140}
                placeholder={t('transfer.notePlaceholder')}
                className="rounded-xl"
              />
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('transfer.totalFees')}</span>
                <span className="tabular">{formatMoney(0, wallet?.currency || 'USD')}</span>
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
              disabled={isLoading || busy || insufficient}
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
