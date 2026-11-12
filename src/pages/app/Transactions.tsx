import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useTransactionsQuery } from '@/store/api/walletApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Download } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/format';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { downloadReceipt } from '@/lib/receipt';
import { TransactionListItem } from '@/components/transactions/TransactionListItem';
import { PaymentMethodMark } from '@/lib/moneyVisuals';
import { getTransactionSubtitle, getTransactionTitle } from '@/lib/transactionPresentation';

const shortRef = (value?: string) => {
  const text = String(value || '').trim();
  if (text.length <= 18) return text;
  return `${text.slice(0, 14)}...`;
};

const isTransactionFilter = (value: string): value is 'all' | 'deposit' | 'withdrawal' | 'transfer' =>
  value === 'all' || value === 'deposit' || value === 'withdrawal' || value === 'transfer';

const Transactions = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useTransactionsQuery();
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'transfer'>('all');
  const [q, setQ] = useState('');

  const items = (data || [])
    .filter(tx => filter === 'all' || tx.type === filter)
    .filter(tx => {
      if (!q) return true;
      const query = q.toLowerCase();
      const searchable = [
        getTransactionTitle(tx, t),
        getTransactionSubtitle(tx, t),
        tx.description,
        tx.reference,
        tx.counterparty,
        tx.paymentMethodName,
        tx.provider,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('nav.transactions')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.recentTransactions')}</p>
      </div>

      <Card className="shadow-elegant border-border/60">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Tabs value={filter} onValueChange={(value) => { if (isTransactionFilter(value)) setFilter(value); }}>
            <TabsList>
              <TabsTrigger value="all">{t('tx.all')}</TabsTrigger>
              <TabsTrigger value="deposit">{t('tx.deposit')}</TabsTrigger>
              <TabsTrigger value="withdrawal">{t('tx.withdrawal')}</TabsTrigger>
              <TabsTrigger value="transfer">{t('tx.transfer')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t('common.search')} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-14"/>)}</div>
          ) : (
            <>
            <div className="divide-y divide-border md:hidden">
              {items.map((tx) => (
                <div key={tx.id} className="flex items-center gap-1">
                  <TransactionListItem tx={tx} className="flex-1 px-4" />
                  <Button variant="ghost" size="icon" onClick={() => downloadReceipt(tx)} title={t('tx.downloadReceipt')} className="mr-2 shrink-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">{t('dashboard.noTransactions')}</div>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-5 py-3">{t('tx.description')}</th>
                    <th className="text-left font-medium px-5 py-3">{t('tx.reference')}</th>
                    <th className="text-left font-medium px-5 py-3">{t('tx.date')}</th>
                    <th className="text-left font-medium px-5 py-3">{t('tx.status')}</th>
                    <th className="text-right font-medium px-5 py-3">{t('tx.amount')}</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map(tx => (
                    <tr key={tx.id} className="transition-smooth hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <Link to={`/app/transactions/${tx.id}`} className="flex items-center gap-3">
                          <PaymentMethodMark
                            logo={tx.paymentMethodLogo}
                            name={[tx.paymentMethodName, tx.provider, tx.description].filter(Boolean).join(' ')}
                            currency={tx.currency}
                            direction={tx.direction}
                            className="h-9 w-9"
                          />
                          <div>
                            <div className="font-medium">{getTransactionTitle(tx, t)}</div>
                            <div className="text-xs text-muted-foreground">{getTransactionSubtitle(tx, t)}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="max-w-[160px] truncate px-5 py-3 text-muted-foreground tabular" title={tx.reference}>
                        {shortRef(tx.reference)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(tx.createdAt)}</td>
                      <td className="px-5 py-3"><StatusPill status={tx.status} /></td>
                      <td className={`px-5 py-3 text-right font-semibold tabular ${tx.direction==='in' ? 'text-success' : ''}`}>
                        {tx.direction === 'in' ? '+' : '-'} {formatMoney(tx.amount, tx.currency)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => downloadReceipt(tx)} title={t('tx.downloadReceipt')}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">{t('dashboard.noTransactions')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
