import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Copy, Download, Hash, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/StatusPill';
import { PaymentMethodMark, TransactionKindIcon } from '@/lib/moneyVisuals';
import { formatDate, formatMoney } from '@/lib/format';
import { useTransactionQuery } from '@/store/api/walletApi';
import { downloadReceipt } from '@/lib/receipt';
import { toast } from 'sonner';

const Row = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="min-w-0 truncate text-right text-sm font-semibold">{value || '-'}</span>
  </div>
);

const TransactionDetail = () => {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { data: tx, isLoading } = useTransactionQuery(id, { skip: !id });

  const copyReference = async () => {
    if (!tx?.reference) return;
    await navigator.clipboard.writeText(tx.reference);
    toast.success('Reference copiee');
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-muted-foreground">{t('dashboard.noTransactions')}</p>
      </div>
    );
  }

  const markName = [tx.paymentMethodName, tx.provider, tx.description, tx.counterparty].filter(Boolean).join(' ');

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/app/transactions" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('nav.transactions')}
      </Link>

      <Card className="overflow-hidden border-border/60 shadow-elegant">
        <div className="bg-gradient-to-br from-primary/12 via-background to-emerald-400/10 px-5 py-6 sm:px-7">
          <div className="flex items-start gap-4">
            <PaymentMethodMark
              logo={tx.paymentMethodLogo}
              name={markName}
              currency={tx.currency}
              direction={tx.direction}
              className="h-14 w-14"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-2xl font-bold">{tx.description}</h1>
                <StatusPill status={tx.status} />
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <TransactionKindIcon type={tx.rawType || tx.type} />
                <span className="truncate">{tx.paymentMethodName || tx.provider || tx.counterparty || tx.currency}</span>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('tx.amount')}</div>
            <div className={tx.direction === 'in' ? 'font-display text-4xl font-bold text-success' : 'font-display text-4xl font-bold'}>
              {tx.direction === 'in' ? '+' : '-'} {formatMoney(tx.amount, tx.currency)}
            </div>
          </div>
        </div>

        <CardContent className="space-y-5 p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <Calendar className="mb-2 h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">{t('tx.date')}</div>
              <div className="mt-1 text-sm font-semibold">{formatDate(tx.createdAt)}</div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <Hash className="mb-2 h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">{t('tx.reference')}</div>
              <div className="mt-1 truncate text-sm font-semibold">{tx.reference || '-'}</div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <WalletCards className="mb-2 h-4 w-4 text-primary" />
              <div className="text-xs text-muted-foreground">Fees</div>
              <div className="mt-1 text-sm font-semibold">{formatMoney(tx.fee || 0, tx.currency)}</div>
            </div>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">{t('tx.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Type" value={tx.rawType || tx.type} />
              <Row label="Direction" value={tx.direction === 'in' ? 'Credit' : 'Debit'} />
              <Row label="Counterparty" value={tx.counterparty} />
              <Row label="Payment method" value={tx.paymentMethodName || tx.provider} />
              <Row label="Wallet" value={tx.wallet_id} />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="rounded-2xl" onClick={copyReference}>
              <Copy className="mr-2 h-4 w-4" /> Copier reference
            </Button>
            <Button className="rounded-2xl bg-primary text-primary-foreground" onClick={() => downloadReceipt(tx)}>
              <Download className="mr-2 h-4 w-4" /> {t('tx.downloadReceipt')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionDetail;
