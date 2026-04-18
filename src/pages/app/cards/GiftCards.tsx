import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, ShoppingBag, Tag, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';

type Brand = { id: string; name: string; bg: string; from: number; to: number };

const brands: Brand[] = [
  { id: 'amz', name: 'Amazon', bg: 'from-amber-500 to-orange-600', from: 10, to: 500 },
  { id: 'nfx', name: 'Netflix', bg: 'from-red-600 to-red-800', from: 10, to: 200 },
  { id: 'spt', name: 'Spotify', bg: 'from-emerald-500 to-emerald-700', from: 10, to: 100 },
  { id: 'apl', name: 'Apple', bg: 'from-zinc-700 to-zinc-900', from: 25, to: 500 },
  { id: 'ggp', name: 'Google Play', bg: 'from-blue-500 to-violet-700', from: 10, to: 200 },
  { id: 'stm', name: 'Steam', bg: 'from-sky-700 to-slate-900', from: 20, to: 250 },
];

const myCards = [
  { id: 'g1', brand: 'Amazon', amount: 50, code: 'AMZ-9XK2-LL3P-V8YT', used: false },
  { id: 'g2', brand: 'Netflix', amount: 25, code: 'NFX-22BQ-XX1A-PP90', used: true },
];

const GiftCards = () => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<Record<string, number>>({});

  const buy = (b: Brand) => {
    const amt = amount[b.id] || b.from;
    toast.success(`${t('cards.giftPurchased')} ${b.name} ${formatMoney(amt, 'USD')}`);
  };

  return (
    <div>
      <PageHeader title={t('nav.giftCards')} subtitle={t('cards.giftSubtitle')} icon={<Gift className="h-6 w-6" />} />

      <Tabs defaultValue="buy" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="buy" className="rounded-lg"><ShoppingBag className="mr-2 h-4 w-4"/>{t('cards.buy')}</TabsTrigger>
          <TabsTrigger value="my" className="rounded-lg"><Tag className="mr-2 h-4 w-4"/>{t('cards.myCards')}</TabsTrigger>
          <TabsTrigger value="sell" className="rounded-lg"><Send className="mr-2 h-4 w-4"/>{t('cards.sell')}</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="overflow-hidden border-border/60 bg-card">
                <div className={`aspect-[1.6/1] bg-gradient-to-br ${b.bg} flex items-end p-5 text-white`}>
                  <div>
                    <div className="font-display text-2xl font-bold">{b.name}</div>
                    <div className="text-xs opacity-80">Gift Card</div>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {[b.from, Math.round((b.from + b.to) / 4), Math.round(b.to / 2), b.to].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount((a) => ({ ...a, [b.id]: v }))}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          (amount[b.id] || b.from) === v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {formatMoney(v, 'USD')}
                      </button>
                    ))}
                  </div>
                  <Button onClick={() => buy(b)} className="w-full bg-gradient-brand shadow-brand">{t('cards.buyNow')}</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="my" className="space-y-3">
          {myCards.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{c.brand}</div>
                  <div className="text-xs text-muted-foreground font-mono">{c.code}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-display font-bold tabular">{formatMoney(c.amount, 'USD')}</div>
                  <Badge variant={c.used ? 'secondary' : 'default'}>{c.used ? t('cards.used') : t('cards.active')}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sell">
          <Card><CardContent className="p-8 text-center text-muted-foreground">{t('cards.sellSoon')}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GiftCards;
