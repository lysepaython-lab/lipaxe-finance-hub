import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTransactionsQuery, useWalletsQuery } from '@/store/api/walletApi';
import { buildMonthlyFlowFromTransactions } from '@/lib/dashboardStats';
import { WalletCards } from 'lucide-react';

export const SpendingChart = () => {
  const { t, i18n } = useTranslation();
  const { data: transactions } = useTransactionsQuery();
  const { data: wallets } = useWalletsQuery();
  const currency = wallets?.[0]?.currency || transactions?.[0]?.currency;
  const currencyData = buildMonthlyFlowFromTransactions(transactions, { currency, locale: i18n.language });
  const allData = buildMonthlyFlowFromTransactions(transactions, { locale: i18n.language });
  const data = currencyData.some((point) => point.inflow > 0 || point.outflow > 0) ? currencyData : allData;
  const hasRealData = data.some((point) => point.inflow > 0 || point.outflow > 0);

  return (
    <Card className="shadow-elegant border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display">{t('dashboard.spending')}</CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" />{t('dashboard.inflow')}</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-200" />{t('dashboard.outflow')}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {!hasRealData ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <WalletCards className="h-5 w-5" />
              </div>
              <div className="font-semibold">{t('dashboard.noTransactions')}</div>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">Les flux reels s'afficheront apres vos premieres transactions.</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--brand-500))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--brand-500))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--brand-300))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--brand-300))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: 'var(--shadow-lg)',
                }}
              />
              <Area type="monotone" dataKey="inflow" stroke="hsl(var(--brand-500))" strokeWidth={2.5} fill="url(#gIn)" />
              <Area type="monotone" dataKey="outflow" stroke="hsl(var(--brand-300))" strokeWidth={2.5} fill="url(#gOut)" />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
