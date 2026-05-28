import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTransactionsQuery, useWalletsQuery } from '@/store/api/walletApi';
import { formatMoney } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, Eye, EyeOff, Wallet as WalletIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { buildNetChangeStats } from '@/lib/dashboardStats';
import { cn } from '@/lib/utils';

const currencyTone = ['bg-primary', 'bg-emerald-400', 'bg-sky-400', 'bg-amber-400', 'bg-rose-400'];

export const BalanceCard = () => {
  const { data: wallets, isLoading } = useWalletsQuery();
  const { data: transactions } = useTransactionsQuery();
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('');

  const sortedWallets = useMemo(
    () => [...(wallets || [])].sort((a, b) => b.available - a.available),
    [wallets],
  );
  const selected = sortedWallets.find((w) => w.currency === selectedCurrency) || sortedWallets[0];
  const topWallets = sortedWallets.slice(0, 5);
  const netChange = buildNetChangeStats(transactions, { currency: selected?.currency });

  const mask = (value: string) => (hidden ? value.replace(/\d/g, '*') : value);

  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-card shadow-elegant">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
      <div className="absolute -bottom-28 -left-28 h-60 w-60 rounded-full bg-emerald-400/10 blur-3xl" />

      <CardHeader className="relative flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <WalletIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">{t('dashboard.totalBalance')}</span>
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <select
              value={selected.currency}
              onChange={(event) => setSelectedCurrency(event.target.value)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none ring-primary/20 focus:ring-2"
            >
              {sortedWallets.map((wallet) => (
                <option key={wallet.id || wallet.currency} value={wallet.currency}>
                  {wallet.currency}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setHidden((value) => !value)}
            aria-label={hidden ? 'Afficher solde' : 'Masquer solde'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background transition-smooth hover:bg-muted"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-5 pt-2">
        {isLoading || !selected ? (
          <Skeleton className="h-16 w-60" />
        ) : (
          <motion.div
            key={`${hidden}-${selected.currency}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-bold tracking-tight tabular lg:text-5xl"
          >
            {mask(formatMoney(selected.balance, selected.currency))}
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('dashboard.available')}
            </div>
            <div className="mt-1 font-semibold tabular">
              {selected ? mask(formatMoney(selected.available, selected.currency)) : '-'}
            </div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('dashboard.pending')}
            </div>
            <div className="mt-1 font-semibold tabular">
              {selected ? mask(formatMoney(selected.pending, selected.currency)) : '-'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Currency breakdown</span>
            <span className="text-xs text-muted-foreground">Top 5</span>
          </div>
          <div className="space-y-2.5">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-8" />)
              : topWallets.map((wallet, index) => {
                  const max = Math.max(...topWallets.map((item) => item.available), 1);
                  const width = Math.max(8, (wallet.available / max) * 100);
                  return (
                    <button
                      key={wallet.id || wallet.currency}
                      type="button"
                      onClick={() => setSelectedCurrency(wallet.currency)}
                      className={cn(
                        'w-full rounded-xl p-2 text-left transition-smooth hover:bg-muted',
                        selected?.currency === wallet.currency && 'bg-primary/8 ring-1 ring-primary/20',
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 font-semibold">
                          <span className={cn('h-2.5 w-2.5 rounded-full', currencyTone[index] || 'bg-muted-foreground')} />
                          {wallet.currency}
                        </span>
                        <span className="tabular">{mask(formatMoney(wallet.available, wallet.currency))}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', currencyTone[index] || 'bg-primary')}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                netChange.direction === 'down'
                  ? 'bg-destructive/12 text-destructive'
                  : 'bg-success/12 text-success',
              )}
            >
              <ArrowUpRight className={cn('h-3 w-3', netChange.direction === 'down' && 'rotate-180')} />
              {netChange.percent > 0 ? '+' : ''}
              {netChange.percent.toFixed(1)}%
            </div>
            <span className="text-xs">{t('dashboard.thisMonth').toLowerCase()}</span>
          </div>
          <span className="text-xs text-muted-foreground">{selected?.currency || ''}</span>
        </div>
      </CardContent>
    </Card>
  );
};
