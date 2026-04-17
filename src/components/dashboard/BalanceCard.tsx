import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletsQuery } from '@/store/api/walletApi';
import { formatMoney } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Wallet as WalletIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BalanceCard = () => {
  const { data: wallets, isLoading } = useWalletsQuery();
  const { t } = useTranslation();

  // Total in USD equivalent (very rough — pretend 1:1 for now since mock has its own currency totals)
  const primary = wallets?.[0];

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-hero text-primary-foreground shadow-elegant">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-glow/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-brand-300/20 blur-2xl" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <WalletIcon className="h-4 w-4" />
          <span className="text-sm">{t('dashboard.totalBalance')}</span>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {isLoading || !primary ? (
          <Skeleton className="h-12 w-48 bg-primary-foreground/20" />
        ) : (
          <div className="font-display text-4xl lg:text-5xl font-bold tabular">
            {formatMoney(primary.balance, primary.currency)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur border border-primary-foreground/15">
            <div className="text-xs text-primary-foreground/70">{t('dashboard.available')}</div>
            <div className="font-semibold tabular">{primary && formatMoney(primary.available, primary.currency)}</div>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur border border-primary-foreground/15">
            <div className="text-xs text-primary-foreground/70">{t('dashboard.pending')}</div>
            <div className="font-semibold tabular">{primary && formatMoney(primary.pending, primary.currency)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
          <TrendingUp className="h-4 w-4" /> +4.2% {t('dashboard.thisMonth').toLowerCase()}
        </div>
      </CardContent>
    </Card>
  );
};
