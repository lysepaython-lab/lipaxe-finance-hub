import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletsQuery } from '@/store/api/walletApi';
import { formatMoney } from '@/lib/format';
import { CurrencyMark } from '@/lib/moneyVisuals';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const currencyTone = ['bg-primary', 'bg-emerald-400', 'bg-sky-400', 'bg-amber-400', 'bg-rose-400'];

export const CurrencyBreakdown = () => {
  const { data, isLoading } = useWalletsQuery();
  const { t } = useTranslation();
  const wallets = [...(data || [])].sort((a, b) => b.available - a.available).slice(0, 5);
  const max = Math.max(...wallets.map((wallet) => wallet.available), 1);

  return (
    <Card className="border-border/60 shadow-elegant">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-display">{t('dashboard.currencyBreakdown')}</CardTitle>
        <span className="text-xs text-muted-foreground">{t('dashboard.topFive')}</span>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12" />)
          : wallets.map((wallet, index) => (
            <Link
              key={wallet.id || wallet.currency}
              to={`/app/wallets/${wallet.id}`}
              className="block rounded-xl p-2 transition-smooth hover:bg-muted"
            >
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 font-semibold">
                  <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', currencyTone[index] || 'bg-muted-foreground')} />
                  <CurrencyMark currency={wallet.currency} logo={wallet.logoUrl || wallet.logo} className="h-6 w-6 text-[8px]" />
                  <span className="truncate text-sm">{wallet.currency}</span>
                </span>
                <span className="truncate text-right text-xs font-medium tabular-nums sm:text-sm">
                  {formatMoney(wallet.available, wallet.currency)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', currencyTone[index] || 'bg-primary')}
                  style={{ width: `${Math.max(8, (wallet.available / max) * 100)}%` }}
                />
              </div>
            </Link>
          ))}
        {!isLoading && wallets.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('dashboard.noAccounts')}</p>
        )}
      </CardContent>
    </Card>
  );
};
