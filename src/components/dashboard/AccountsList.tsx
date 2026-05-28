import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletsQuery } from '@/store/api/walletApi';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import { useTranslation } from 'react-i18next';

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
          : wallets.map((wallet) => (
              <div
                key={wallet.id || wallet.currency}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-3 transition-smooth hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {wallet.currency.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold">{wallet.currency}</div>
                    <div className="text-xs text-muted-foreground">{t('dashboard.available')}</div>
                  </div>
                </div>
                <div className="text-right font-semibold tabular">{formatMoney(wallet.available, wallet.currency)}</div>
              </div>
            ))}
      </CardContent>
    </Card>
  );
};
