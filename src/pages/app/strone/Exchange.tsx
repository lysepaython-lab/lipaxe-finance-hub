import { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const RATES: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, XOF: 605, NGN: 1580, GHS: 14.2, KES: 129, JPY: 156 };
const cur = Object.keys(RATES);

const Exchange = () => {
  const { t } = useTranslation();
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState(100);
  const rate = RATES[to] / RATES[from];
  const fee = Math.max(0.5, amount * 0.0085);
  const receive = (amount - fee) * rate;
  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div>
      <PageHeader title={t('nav.lipaxeExchange')} subtitle={t('strone.exchangeSubtitle')} icon={<Repeat className="h-6 w-6" />} />
      <Card className="max-w-2xl bg-gradient-card">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>{t('common.from')}</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="text-2xl font-display font-bold h-14 tabular" />
            </div>
            <div className="space-y-2">
              <Label>{t('common.currency')}</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
                <SelectContent>{cur.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={swap} variant="outline" size="icon" className="rounded-full">
              <motion.div whileTap={{ rotate: 180 }}><ArrowDown className="h-4 w-4" /></motion.div>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>{t('common.to')}</Label>
              <div className="h-14 px-3 rounded-md border border-input bg-muted/30 flex items-center text-2xl font-display font-bold tabular">
                {receive.toFixed(2)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('common.currency')}</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
                <SelectContent>{cur.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 p-4 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">{t('transfer.rate')}</span><span className="font-medium tabular">1 {from} = {rate.toFixed(4)} {to}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('transfer.fee')}</span><span className="font-medium tabular">{fee.toFixed(2)} {from}</span></div>
          </div>
          <Button onClick={() => toast.success(t('strone.exchangeDone'))} className="w-full bg-gradient-brand shadow-brand h-11">{t('strone.exchangeNow')}</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Exchange;
