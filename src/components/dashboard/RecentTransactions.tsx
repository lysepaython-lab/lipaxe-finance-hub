import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionsQuery } from '@/store/api/walletApi';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatMoney, relativeTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '../StatusPill';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const RecentTransactions = ({ limit = 6 }: { limit?: number }) => {
  const { data, isLoading } = useTransactionsQuery();
  const { t } = useTranslation();
  const items = (data || []).slice(0, limit);

  return (
    <Card className="shadow-elegant border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display">{t('dashboard.recentTransactions')}</CardTitle>
        <Link to="/app/transactions"><Button variant="ghost" size="sm">{t('dashboard.viewAll')} →</Button></Link>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">{t('dashboard.noTransactions')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((tx) => (
              <li key={tx.id} className="flex items-center gap-4 px-5 py-3 transition-smooth hover:bg-muted/40">
                <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${tx.direction === 'in' ? 'bg-success/10 text-success' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'}`}>
                  {tx.direction === 'in' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{tx.description}</div>
                  <div className="text-xs text-muted-foreground truncate">{tx.counterparty} · {relativeTime(tx.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold tabular ${tx.direction === 'in' ? 'text-success' : 'text-foreground'}`}>
                    {tx.direction === 'in' ? '+' : '-'} {formatMoney(tx.amount, tx.currency)}
                  </div>
                  <div className="mt-1 flex justify-end"><StatusPill status={tx.status} /></div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
