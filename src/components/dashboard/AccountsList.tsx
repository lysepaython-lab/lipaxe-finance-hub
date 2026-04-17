import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletsQuery } from '@/store/api/walletApi';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import { useTranslation } from 'react-i18next';

const flag: Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', XOF: '🌍', NGN: '🇳🇬', GHS: '🇬🇭' };

export const AccountsList = () => {
  const { data, isLoading } = useWalletsQuery();
  const { t } = useTranslation();

  return (
    <Card className="shadow-elegant border-border/60">
      <CardHeader><CardTitle className="font-display">{t('dashboard.accounts')}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-14"/>) :
          (data || []).map(w => (
            <div key={w.currency} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 transition-smooth hover:border-primary/40 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">{flag[w.currency] || '💱'}</div>
                <div>
                  <div className="font-semibold">{w.currency}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </div>
              <div className="font-semibold tabular">{formatMoney(w.available, w.currency)}</div>
            </div>
          ))
        }
      </CardContent>
    </Card>
  );
};
