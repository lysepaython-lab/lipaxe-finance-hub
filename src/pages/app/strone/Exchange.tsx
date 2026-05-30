import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Bitcoin, Landmark, Loader2, Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { PageHeader } from '@/components/PageHeader';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import {
  useWalletExchangeExecuteMutation,
  useWalletExchangeQuoteMutation,
  useWalletsQuery,
  type WalletSwapQuote,
} from '@/store/api/walletApi';

const CRYPTO_CURRENCIES = new Set(['BTC', 'USDT', 'USDC']);

const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSwapAmount = (value: string | number | undefined, currency: string) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return `0 ${currency}`;
  if (CRYPTO_CURRENCIES.has(currency)) {
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: currency === 'BTC' ? 8 : 6,
    })} ${currency}`;
  }
  return formatMoney(amount, currency);
};

const extractApiError = (error: unknown, fallback: string) =>
  (error as { data?: { detail?: string; non_field_errors?: string[] } })?.data?.detail ||
  (error as { data?: { non_field_errors?: string[] } })?.data?.non_field_errors?.[0] ||
  fallback;

const Exchange = () => {
  const { t } = useTranslation();
  const { data: wallets = [], isLoading: walletsLoading } = useWalletsQuery();
  const [quoteExchange, { isLoading: quoteLoading }] = useWalletExchangeQuoteMutation();
  const [executeExchange, { isLoading: executeLoading }] = useWalletExchangeExecuteMutation();
  const pin = usePinGate();

  const [fromWalletId, setFromWalletId] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [amount, setAmount] = useState('100');
  const [quote, setQuote] = useState<WalletSwapQuote | null>(null);

  const fromWallet = wallets.find((wallet) => wallet.id === fromWalletId);
  const targetCurrencies = Array.from(
    new Set(wallets.map((wallet) => wallet.currency).filter((currency) => currency !== fromWallet?.currency)),
  );
  const amountNumber = parseAmount(amount);
  const canRequestQuote = Boolean(fromWalletId && toCurrency && amountNumber > 0);
  const insufficient = fromWallet ? amountNumber > fromWallet.available : false;

  useEffect(() => {
    if (!fromWalletId && wallets.length > 0) {
      setFromWalletId(wallets[0].id);
    }
  }, [fromWalletId, wallets]);

  useEffect(() => {
    if (fromWallet && (!toCurrency || toCurrency === fromWallet.currency)) {
      setToCurrency(targetCurrencies[0] || '');
    }
  }, [fromWallet, targetCurrencies, toCurrency]);

  useEffect(() => {
    setQuote(null);
  }, [fromWalletId, toCurrency, amount]);

  const handleSwapDirection = () => {
    if (!fromWallet || !toCurrency) return;
    const targetWallet = wallets.find((wallet) => wallet.currency === toCurrency);
    if (!targetWallet) return;
    setFromWalletId(targetWallet.id);
    setToCurrency(fromWallet.currency);
  };

  const handleQuote = async () => {
    if (!canRequestQuote) {
      toast.error(t('strone.exchangeMissingFields'));
      return null;
    }
    if (insufficient) {
      toast.error(t('transfer.insufficientBalance'));
      return null;
    }

    try {
      const response = await quoteExchange({
        from_wallet_id: fromWalletId,
        to_currency: toCurrency,
        amount: amountNumber,
      }).unwrap();
      setQuote(response);
      return response;
    } catch (error) {
      toast.error(extractApiError(error, t('common.error')));
      return null;
    }
  };

  const handleExecute = () => {
    if (!canRequestQuote) {
      toast.error(t('strone.exchangeMissingFields'));
      return;
    }
    if (insufficient) {
      toast.error(t('transfer.insufficientBalance'));
      return;
    }

    pin.guard(async () => {
      try {
        const response = await executeExchange({
          from_wallet_id: fromWalletId,
          to_currency: toCurrency,
          amount: amountNumber,
        }).unwrap();
        setQuote(response.quote);
        toast.success(t('strone.exchangeDone'));
      } catch (error) {
        toast.error(extractApiError(error, t('common.error')));
      }
    });
  };

  return (
    <div>
      <PageHeader title={t('nav.lipaxeExchange')} subtitle={t('strone.exchangeSubtitle')} icon={<Repeat className="h-6 w-6" />} />

      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        {[
          { to: '/app/strone/cryptos', label: t('nav.lipaxeCryptos'), icon: Bitcoin },
          { to: '/app/strone/vaults', label: t('nav.yieldVaults'), icon: Landmark },
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

      <Card className="max-w-2xl bg-gradient-card">
        <CardContent className="space-y-5 p-6">
          {walletsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : wallets.length < 2 ? (
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
              {t('strone.exchangeNeedsWallets')}
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('common.from')}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="h-14 font-display text-2xl font-bold tabular-nums"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('strone.sourceWallet')}</Label>
                  <Select value={fromWalletId} onValueChange={setFromWalletId}>
                    <SelectTrigger className="h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.currency} - {formatSwapAmount(wallet.available, wallet.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={handleSwapDirection} variant="outline" size="icon" className="rounded-full">
                  <motion.div whileTap={{ rotate: 180 }}>
                    <ArrowDown className="h-4 w-4" />
                  </motion.div>
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('common.to')}</Label>
                  <div className="flex h-14 items-center rounded-md border border-input bg-muted/30 px-3 font-display text-2xl font-bold tabular-nums">
                    {quote ? formatSwapAmount(quote.to_amount, quote.to_currency) : '--'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('common.currency')}</Label>
                  <Select value={toCurrency} onValueChange={setToCurrency}>
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder={t('strone.targetCurrency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {targetCurrencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {fromWallet && insufficient && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {t('transfer.insufficientBalance')} Disponible: {formatSwapAmount(fromWallet.available, fromWallet.currency)}.
                </div>
              )}

              <div className="rounded-2xl bg-muted/40 p-4 text-sm">
                {quote ? (
                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('transfer.rate')}</span>
                      <span className="font-medium tabular-nums">
                        1 {quote.from_currency} = {Number(quote.effective_rate).toLocaleString(undefined, { maximumFractionDigits: 8 })}{' '}
                        {quote.to_currency}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('transfer.fee')}</span>
                      <span className="font-medium tabular-nums">
                        {formatSwapAmount(quote.fee_amount, quote.from_currency)} ({Number(quote.fee_percent).toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{t('strone.convertedAmount')}</span>
                      <span className="font-medium tabular-nums">
                        {formatSwapAmount(quote.net_source_amount, quote.from_currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('strone.exchangePreviewHint')}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleQuote}
                  disabled={!canRequestQuote || quoteLoading || insufficient}
                  variant="outline"
                  className="h-11 rounded-xl"
                >
                  {quoteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('strone.getQuote')}
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={!canRequestQuote || quoteLoading || executeLoading || insufficient}
                  className="h-11 rounded-xl bg-gradient-brand shadow-brand"
                >
                  {executeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('strone.exchangeNow')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default Exchange;
