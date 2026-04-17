import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactionsQuery } from '@/store/api/walletApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/format';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { downloadReceipt } from '@/lib/receipt';

const Transactions = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useTransactionsQuery();
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'transfer'>('all');
  const [q, setQ] = useState('');

  const items = (data || [])
    .filter(tx => filter === 'all' || tx.type === filter)
    .filter(tx => !q || (tx.description + tx.reference + tx.counterparty).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('nav.transactions')}</h1>
        <p className="text-muted-foreground mt-1">All your money movements in one place.</p>
      </div>

      <Card className="shadow-elegant border-border/60">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
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
            <div className="overflow-x-auto">
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
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${tx.direction==='in' ? 'bg-success/10 text-success' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'}`}>
                            {tx.direction === 'in' ? <ArrowDownLeft className="h-4 w-4"/> : <ArrowUpRight className="h-4 w-4"/>}
                          </div>
                          <div>
                            <div className="font-medium">{tx.description}</div>
                            <div className="text-xs text-muted-foreground">{tx.counterparty}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground tabular">{tx.reference}</td>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
