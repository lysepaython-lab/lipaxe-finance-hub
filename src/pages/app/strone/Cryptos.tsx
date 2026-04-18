import { motion } from 'framer-motion';
import { Bitcoin, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';

const coins = [
  { sym: 'BTC', name: 'Bitcoin', price: 67420, change: 2.4 },
  { sym: 'ETH', name: 'Ethereum', price: 3210, change: -0.8 },
  { sym: 'SOL', name: 'Solana', price: 184, change: 5.1 },
  { sym: 'USDC', name: 'USD Coin', price: 1, change: 0 },
];

const Cryptos = () => {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t('nav.lipaxeCryptos')} subtitle={t('strone.cryptoSubtitle')} icon={<Bitcoin className="h-6 w-6" />} />
      <div className="grid gap-4 md:grid-cols-2">
        {coins.map((c, i) => (
          <motion.div key={c.sym} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold">{c.sym.slice(0, 1)}</div>
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.sym}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold tabular">{formatMoney(c.price, 'USD')}</div>
                  <div className={`text-xs flex items-center justify-end gap-1 ${c.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {c.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {c.change >= 0 ? '+' : ''}{c.change}%
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" className="bg-gradient-brand shadow-brand" onClick={() => toast.success(`${t('strone.buying')} ${c.sym}`)}>{t('strone.buy')}</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success(`${t('strone.selling')} ${c.sym}`)}>{t('strone.sell')}</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Cryptos;
