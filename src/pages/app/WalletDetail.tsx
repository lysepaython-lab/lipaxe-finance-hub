import { Link, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Send, WalletCards } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionListItem } from '@/components/transactions/TransactionListItem';
import { CurrencyMark } from '@/lib/moneyVisuals';
import { formatMoney } from '@/lib/format';
import { useTransactionsQuery, useWalletsQuery } from '@/store/api/walletApi';

const WalletDetail = () => {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { data: wallets = [], isLoading: walletsLoading } = useWalletsQuery();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactionsQuery();

  const wallet = wallets.find((item) => item.id === id);
  const walletTransactions = useMemo(() => {
    if (!wallet) return [];
    return transactions.filter((tx) => {
      if (tx.from_wallet_id || tx.to_wallet_id || tx.wallet_id) {
        return tx.from_wallet_id === wallet.id || tx.to_wallet_id === wallet.id || tx.wallet_id === wallet.id;
      }
      return tx.currency === wallet.currency;
    });
  }, [transactions, wallet]);

  if (walletsLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-muted-foreground">{t('dashboard.accounts')} introuvable.</p>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link to="/app">{t('nav.dashboard')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('dashboard.accounts')}
      </Link>

      <Card className="overflow-hidden border-border/60 shadow-elegant">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-emerald-800 px-5 py-7 text-primary-foreground sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <CurrencyMark currency={wallet.currency} logo={wallet.logoUrl || wallet.logo} className="h-16 w-16" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary-foreground/70">{t('dashboard.available')}</p>
                <h1 className="truncate font-display text-3xl font-bold">{wallet.currency} Wallet</h1>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium text-primary-foreground/70">Balance</p>
              <p className="font-display text-4xl font-bold tabular">{formatMoney(wallet.available, wallet.currency)}</p>
            </div>
          </div>
        </div>

        <CardContent className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7">
          <Button asChild className="h-12 rounded-2xl bg-primary text-primary-foreground">
            <Link to={`/app/deposit?wallet_id=${wallet.id}`}>
              <ArrowDownLeft className="mr-2 h-4 w-4" /> {t('dashboard.deposit')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl">
            <Link to={`/app/withdraw?wallet_id=${wallet.id}`}>
              <ArrowUpRight className="mr-2 h-4 w-4" /> {t('dashboard.withdraw')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl">
            <Link to={`/app/transfer?wallet_id=${wallet.id}`}>
              <Send className="mr-2 h-4 w-4" /> {t('dashboard.transfer')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6">
          <div>
            <CardTitle className="font-display text-xl">Transactions {wallet.currency}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {walletTransactions.length} operation{walletTransactions.length > 1 ? 's' : ''} sur ce wallet
            </p>
          </div>
          <WalletCards className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="p-0">
          {transactionsLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : walletTransactions.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Aucune transaction trouvee pour ce wallet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {walletTransactions.map((tx) => (
                <li key={tx.id}>
                  <TransactionListItem tx={tx} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletDetail;
