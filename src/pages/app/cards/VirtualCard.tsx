import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Eye, EyeOff, Lock, Snowflake, Plus, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store/hooks';
import { fmtMoney } from '@/lib/format';
import { toast } from 'sonner';

interface VCard {
  id: string;
  brand: 'Visa' | 'Mastercard';
  number: string;
  cvv: string;
  exp: string;
  holder: string;
  spent: number;
  limit: number;
  frozen: boolean;
}

const seed: VCard[] = [
  { id: 'vc1', brand: 'Visa', number: '4539 8821 2204 4242', cvv: '321', exp: '12/27', holder: 'ALEX MORGAN', spent: 482.5, limit: 2000, frozen: false },
  { id: 'vc2', brand: 'Mastercard', number: '5412 7503 1118 9908', cvv: '742', exp: '08/26', holder: 'ALEX MORGAN', spent: 1240, limit: 5000, frozen: false },
];

const VirtualCardVisual = ({ c, reveal }: { c: VCard; reveal: boolean }) => (
  <motion.div
    whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
    transition={{ type: 'spring', stiffness: 200 }}
    className="relative aspect-[1.6/1] rounded-2xl bg-gradient-hero text-primary-foreground p-5 shadow-brand overflow-hidden"
  >
    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
    <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-primary-foreground/10 blur-2xl" />
    <div className="relative flex justify-between items-start">
      <span className="font-display text-lg font-bold">Lipaxe</span>
      <span className="text-xs uppercase tracking-widest opacity-80">{c.brand}</span>
    </div>
    <div className="relative mt-8 font-mono text-lg tracking-[0.2em] tabular">
      {reveal ? c.number : '•••• •••• •••• ' + c.number.slice(-4)}
    </div>
    <div className="relative mt-5 flex items-end justify-between text-xs">
      <div>
        <div className="opacity-70">CARD HOLDER</div>
        <div className="font-semibold tracking-wide">{c.holder}</div>
      </div>
      <div className="text-right">
        <div className="opacity-70">EXP</div>
        <div className="font-semibold">{c.exp}</div>
      </div>
      <div className="text-right">
        <div className="opacity-70">CVV</div>
        <div className="font-semibold">{reveal ? c.cvv : '•••'}</div>
      </div>
    </div>
  </motion.div>
);

const VirtualCard = () => {
  const { t } = useTranslation();
  const wallets = useAppSelector(() => null) as any;
  const [cards, setCards] = useState<VCard[]>(seed);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const create = () => {
    const id = 'vc' + Date.now();
    const num = '4' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
    setCards((prev) => [
      {
        id, brand: 'Visa', number: num.replace(/(.{4})/g, '$1 ').trim(),
        cvv: Math.floor(Math.random() * 900 + 100).toString(),
        exp: '12/29', holder: 'ALEX MORGAN', spent: 0, limit: 1000, frozen: false,
      },
      ...prev,
    ]);
    toast.success(t('cards.virtualCreated'));
  };

  return (
    <div>
      <PageHeader
        title={t('nav.virtualCard')}
        subtitle={t('cards.virtualSubtitle')}
        icon={<CreditCard className="h-6 w-6" />}
        actions={<Button onClick={create} className="bg-gradient-brand shadow-brand"><Plus className="mr-2 h-4 w-4"/>{t('cards.create')}</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {cards.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="bg-gradient-card border-border/60">
              <CardContent className="p-6 space-y-5">
                <div className={c.frozen ? 'opacity-60 grayscale' : ''}>
                  <VirtualCardVisual c={c} reveal={reveal[c.id]} />
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setReveal((r) => ({ ...r, [c.id]: !r[c.id] }))}>
                    {reveal[c.id] ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {reveal[c.id] ? t('cards.hide') : t('cards.reveal')}
                  </Button>
                  <div className="flex items-center gap-2 text-sm">
                    <Snowflake className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('cards.freeze')}</span>
                    <Switch checked={c.frozen} onCheckedChange={(v) => setCards((cs) => cs.map((x) => x.id === c.id ? { ...x, frozen: v } : x))} />
                  </div>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t('cards.spent')}</span>
                    <span className="font-semibold tabular">{fmtMoney(c.spent, 'USD')} / {fmtMoney(c.limit, 'USD')}</span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.spent / c.limit) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-gradient-brand"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VirtualCard;
