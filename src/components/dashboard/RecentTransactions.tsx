import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionListItem } from '@/components/transactions/TransactionListItem';
import { useTransactionsQuery } from '@/store/api/walletApi';

export const RecentTransactions = ({ limit = 6 }: { limit?: number }) => {
  const { data, isLoading } = useTransactionsQuery();
  const { t } = useTranslation();
  const items = (data || []).slice(0, limit);

  return (
    <Card className="overflow-hidden border-border/60 shadow-elegant">
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6">
        <CardTitle className="font-display text-xl">{t('dashboard.recentTransactions')}</CardTitle>
        <Link to="/app/transactions">
          <Button variant="ghost" size="sm">{t('dashboard.viewAll')} -&gt;</Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">{t('dashboard.noTransactions')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((tx) => (
              <li key={tx.id}>
                <TransactionListItem tx={tx} compact />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
