import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletsQuery } from '@/store/api/walletApi';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import { useTranslation } from 'react-i18next';
import { CurrencyMark } from '@/lib/moneyVisuals';
import { Link } from 'react-router-dom';

export const AccountsList = () => {
  const { data, isLoading } = useWalletsQuery();
  const { t } = useTranslation();
  const wallets = [...(data || [])].sort((a, b) => b.available - a.available);

  return (
    <Card className="border-border/60 shadow-elegant">
      <CardHeader className="pb-3">
        <CardTitle className="font-display">{t('dashboard.accounts')}</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[420px] space-y-2 overflow-auto pr-1 scrollbar-thin">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14" />)
          : wallets.map((wallet) => {
              const equivalent = wallet.localValue?.currency !== wallet.currency
                ? wallet.localValue
                : wallet.usdValue?.currency !== wallet.currency
                  ? wallet.usdValue
                  : undefined;
              return (
                <Link
                  key={wallet.id || wallet.currency}
                  to={`/app/wallets/${wallet.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-3 transition-smooth hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CurrencyMark currency={wallet.currency} logo={wallet.logoUrl || wallet.logo} className="h-10 w-10" />
                    <div className="min-w-0">
                      <div className="font-semibold">{wallet.currency}</div>
                      <div className="text-xs text-muted-foreground">{t('dashboard.available')}</div>
                    </div>
                  </div>
                  <div className="min-w-0 text-right tabular">
                    <div className="truncate font-semibold">{formatMoney(wallet.available, wallet.currency)}</div>
                    {equivalent && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        ~ {formatMoney(equivalent.amount, equivalent.currency)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
      </CardContent>
    </Card>
  );
};
